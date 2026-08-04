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

test.describe('Encryption - Direct Messaging E2EE', () => {
  test('should securely encrypt direct messages and store only ciphertext', async ({ browser }) => {
    // We create two separate incognito browser contexts
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    const userAPhone = '+351999000001';
    const userBPhone = '+351999000002';

    // 1. Both users login to establish sessions
    const userAToken = await loginTestUser(pageA, userAPhone);
    const userBToken = await loginTestUser(pageB, userBPhone);

    const userBName = 'Dummy User 2';

    // 2. User A searches for User B
    const usersRes = await pageA.request.get(`http://localhost:8000/api/v1/user/all`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    const usersData = await usersRes.json();
    const userBId = usersData.data?.find((u: any) => u.profile?.displayName === userBName)?.id;
    
    if (!userBId) {
      throw new Error(`Could not find User B. Users returned: ${usersData.data?.length}`);
    }

    // User A initiates conversation
    const convRes = await pageA.request.post('http://localhost:8000/api/v1/conversations/initiate', {
      headers: { Authorization: `Bearer ${userAToken}` },
      data: { targetUserId: userBId }
    });
    const convData = await convRes.json();
    const conversationId = convData.data.conversationId;

    // 3. Navigate both users to the chat page
    await pageA.goto(`/chats/${conversationId}?recipientId=${userBId}`);
    
    // User B navigates to chat page (needs User A's ID)
    const userAId = (await pageA.request.get('http://localhost:8000/api/v1/user/profile', { 
      headers: { Authorization: `Bearer ${userAToken}` } 
    }).then(r => r.json())).data.id;
    await pageB.goto(`/chats/${conversationId}?recipientId=${userAId}`);
    
    // 4. Type and send a highly sensitive message
    const plaintextSecret = `TOP SECRET E2EE DIRECT MESSAGE: ${Date.now()}`;
    await pageA.fill('input[placeholder*="message"], textarea', plaintextSecret);
    await pageA.waitForTimeout(500);
    // Wait for E2EE keys to resolve and button to become enabled
    await expect(pageA.locator('button[type="submit"]')).toBeEnabled({ timeout: 15000 });
    
    // Press Enter inside the textarea to send the message
    await pageA.locator('input[placeholder*="message"], textarea').press('Enter');

    // 5. Verify UI Decryption - Both users should see the plaintext
    await expect(pageA.locator('span.whitespace-pre-wrap', { hasText: plaintextSecret }).last()).toBeVisible({ timeout: 15000 });
    await expect(pageB.locator('span.whitespace-pre-wrap', { hasText: plaintextSecret }).last()).toBeVisible({ timeout: 15000 });

    // Wait for the backend RabbitMQ worker to save the message to the database
    await pageA.waitForTimeout(2000);

    // 6. Security Assertion: Fetch messages directly from Backend API (Simulating a database dump / server-side read)
    // The backend should NOT have the plaintext message anywhere. It should only return ciphertext.
    const messagesRes = await pageA.request.get(`http://localhost:8000/api/v1/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    const messagesData = await messagesRes.json();
    
    // Find the latest message we just sent
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
    
    // 3. The ciphertext MUST NOT contain our secret string (it shouldn't be blindly saved)
    expect(latestMessage.ciphertext).not.toContain("TOP SECRET");
    
    // 4. The raw object dumped from the database should not have any plaintext field leaking the string
    const stringifiedRow = JSON.stringify(latestMessage);
    expect(stringifiedRow).not.toContain("TOP SECRET");
    
    console.log(`✅ Security Verified: Database stored only encrypted ciphertext (${latestMessage.ciphertext.substring(0, 30)}...)`);
  });
});
