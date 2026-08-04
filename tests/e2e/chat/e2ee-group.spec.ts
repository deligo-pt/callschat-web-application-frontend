import { test, expect, Page } from '@playwright/test';

// Helper function to login via API and set localStorage state
async function loginTestUser(page: Page, phoneNumber: string) {
  // 1. Request OTP
  const requestRes = await page.request.post('http://localhost:8000/api/v1/auth/otp/request', {
    data: { phoneNumber },
  });
  const responseText = await requestRes.text();
  expect(requestRes.ok(), `OTP Request Failed: ${requestRes.status()} - ${responseText}`).toBeTruthy();
  const requestData = JSON.parse(responseText);
  const devOtp = requestData.data.devOtp;
  expect(devOtp).toBeDefined();

  // 2. Verify OTP
  const verifyRes = await page.request.post('http://localhost:8000/api/v1/auth/otp/verify', {
    data: { phoneNumber, otp: devOtp },
  });
  const verifyText = await verifyRes.text();
  expect(verifyRes.ok(), `OTP Verify Failed: ${verifyRes.status()} - ${verifyText}`).toBeTruthy();
  const verifyData = JSON.parse(verifyText);
  const registrationToken = verifyData.data.registrationToken;

  // 3. Login
  const loginRes = await page.request.post('http://localhost:8000/api/v1/auth/login', {
    headers: { Authorization: `Bearer ${registrationToken}` },
    data: {},
  });
  const loginText = await loginRes.text();
  expect(loginRes.ok(), `Login Failed: ${loginRes.status()} - ${loginText}`).toBeTruthy();
  const loginData = JSON.parse(loginText);
  const accessToken = loginData.data.tokens.accessToken;
  const refreshToken = loginData.data.tokens.refreshToken;
  const user = loginData.data.user;

  // 4. Inject into localStorage and navigate
  await page.goto('/');
  await page.evaluate(
    ({ accessToken, refreshToken }) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('currentMode', 'PERSONAL');
    },
    { accessToken, refreshToken }
  );
  await page.goto('/chats');
  await page.waitForURL('**/chats**', { timeout: 10000 }).catch(() => {});
  
  // Force E2EE key generation by opening a dummy chat
  await page.goto('/chats/dummy_init?recipientId=dummy');
  await page.waitForTimeout(2000);
  
  return accessToken;
}

test.describe('Encryption - Group Messaging E2EE', () => {
  test('should securely encrypt group messages and store only ciphertext', async ({ browser }) => {
    // We create two separate incognito browser contexts
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    test.setTimeout(60000);

    const userAPhone = '+351999000001';
    const userBPhone = '+351999000002';

    // 1. Both users login to establish sessions
    const userAToken = await loginTestUser(pageA, userAPhone);
    const userBToken = await loginTestUser(pageB, userBPhone);

    const userBName = 'Dummy User 2';

    // 1.5 Add User B to User A's contacts so they appear in the UI list!
    const addContactRes = await pageA.request.post('http://localhost:8000/api/v1/contacts', {
      headers: { Authorization: `Bearer ${userAToken}` },
      data: { phoneNumber: userBPhone, customName: userBName }
    });
    console.log("Add Contact API Res:", await addContactRes.text());

    const groupName = `E2EE Secure Group ${Date.now()}`;

    // 2. User A creates a group and adds User B via the UI
    await pageA.goto('/groups/create');
    
    // Step 1: Name
    await pageA.fill('input[placeholder*="Team Design"]', groupName);
    await pageA.click('button:has-text("Next >")');
    
    // Step 2: Add Members (Wait for contacts to load)
    // Wait for contacts API to finish, but don't block if cached
    await pageA.waitForResponse(response => response.url().includes('/contacts') && response.status() === 200, { timeout: 3000 }).catch(() => {});
    await pageA.waitForTimeout(3000); // Wait 3s for React to render

    try {
      await pageA.fill('input[placeholder*="Search contacts"]', userBName);
      await pageA.waitForTimeout(1000);
      await expect(pageA.locator(`text=${userBName}`)).toBeVisible({ timeout: 5000 });
      await pageA.click(`text=${userBName}`);
    } catch (e) {
      console.log("FAILED TO FIND CONTACT. DOM DUMP:");
      const dom = await pageA.evaluate(() => document.querySelector('.overflow-y-auto')?.innerHTML || "NO LIST FOUND");
      console.log(dom);
      throw e;
    }

    await pageA.click('button:has-text("Next >")');
    
    // Step 3: Privacy and Create
    await pageA.click('button:has-text("Create Group")');

    // Wait for redirect to /groups
    await pageA.waitForURL('**/groups', { timeout: 10000 });
    
    // 3. User A navigates into the newly created group chat
    await pageA.click(`text="${groupName}"`);
    await pageA.waitForURL('**/groups/**', { timeout: 10000 });
    const groupUrl = pageA.url();
    const groupId = groupUrl.split('/').pop();

    // 4. User B navigates to the group chat
    // User B goes to /groups, clicks the group, and enters
    await pageB.goto('/groups');
    await expect(pageB.locator(`text="${groupName}"`)).toBeVisible({ timeout: 10000 });
    await pageB.click(`text="${groupName}"`);
    await pageB.waitForURL('**/groups/**', { timeout: 10000 });

    // Wait a moment for E2EE keys to sync (Group uses symmetric keys encrypted by public keys)
    await pageA.waitForTimeout(1000);
    await pageB.waitForTimeout(1000);
    
    // 5. User A types and sends a highly sensitive group message
    const plaintextSecret = `TOP SECRET E2EE GROUP MESSAGE: ${Date.now()}`;
    await pageA.fill('input[placeholder*="message"], textarea', plaintextSecret);
    await expect(pageA.locator('button[type="submit"]')).toBeEnabled({ timeout: 15000 });
    
    // Press Enter to send
    await pageA.locator('input[placeholder*="message"], textarea').press('Enter');

    // 6. Verify UI Decryption - Both users should see the plaintext
    await expect(pageA.locator('span.whitespace-pre-wrap', { hasText: plaintextSecret }).last()).toBeVisible({ timeout: 15000 });
    await expect(pageB.locator('span.whitespace-pre-wrap', { hasText: plaintextSecret }).last()).toBeVisible({ timeout: 15000 });

    // Wait for the backend RabbitMQ worker to save the message to the database
    await pageA.waitForTimeout(2000);

    // 7. Security Assertion: Fetch group messages directly from Backend API
    const messagesRes = await pageA.request.get(`http://localhost:8000/api/v1/groups/${groupId}/messages`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    const messagesData = await messagesRes.json();
    
    const storedMessages = messagesData.data.messages || messagesData.data;
    const latestMessage = storedMessages[storedMessages.length - 1];
    
    // CRITICAL SECURITY CHECKS:
    expect(latestMessage).toBeDefined();
    
    // 1. The ciphertext must exist
    expect(latestMessage.ciphertext).toBeDefined();
    expect(latestMessage.ciphertext.length).toBeGreaterThan(10);
    
    // 2. The nonce must exist
    expect(latestMessage.nonce).toBeDefined();
    expect(latestMessage.nonce.length).toBeGreaterThan(10);
    
    // 3. The ciphertext MUST NOT contain our secret string
    expect(latestMessage.ciphertext).not.toContain("TOP SECRET");
    
    // 4. The raw object from DB should not have any plaintext field leaking the string
    const stringifiedRow = JSON.stringify(latestMessage);
    expect(stringifiedRow).not.toContain("TOP SECRET");
    
    console.log(`✅ Security Verified: Group DB stored only encrypted ciphertext (${latestMessage.ciphertext.substring(0, 30)}...)`);
  });
});
