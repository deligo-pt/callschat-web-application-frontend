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
  
  return accessToken;
}

test.describe.serial('Mute Notifications', () => {
  let contextA: any;
  let pageA: Page;
  let userAToken: string;
  let userAId: string;
  let userBId: string;
  let conversationId: string;

  const userAPhone = '+351999000005';
  const userBPhone = '+351999000006';

  test.beforeAll(async ({ browser }) => {
    contextA = await browser.newContext();
    pageA = await contextA.newPage();

    userAToken = await loginTestUser(pageA, userAPhone);

    // Ensure User B exists by logging them in temporarily
    const tempContext = await browser.newContext();
    const tempPage = await tempContext.newPage();
    const userBToken = await loginTestUser(tempPage, userBPhone);
    const meBRes = await tempPage.request.get('http://localhost:8000/api/v1/user/profile', { 
      headers: { Authorization: `Bearer ${userBToken}` } 
    });
    userBId = (await meBRes.json()).data.id;
    await tempContext.close();

    // Get User A ID
    const meARes = await pageA.request.get('http://localhost:8000/api/v1/user/profile', { 
      headers: { Authorization: `Bearer ${userAToken}` } 
    });
    userAId = (await meARes.json()).data.id;

    // Initiate conversation from User A to User B
    const convRes = await pageA.request.post('http://localhost:8000/api/v1/conversations/initiate', {
      headers: { Authorization: `Bearer ${userAToken}` },
      data: { targetUserId: userBId }
    });
    conversationId = (await convRes.json()).data.conversationId;
  });

  test.afterAll(async () => {
    await contextA.close();
  });

  test.beforeEach(async () => {
    // Capture browser console logs
    pageA.on('console', msg => console.log(`[Browser A] ${msg.type()}: ${msg.text()}`));

    // Reset mute state
    await pageA.request.patch(`http://localhost:8000/api/v1/conversations/${conversationId}/mute`, {
      headers: { Authorization: `Bearer ${userAToken}` },
      data: { isMuted: false, mutedUntil: null }
    });
  });

  test('should toggle mute notifications successfully', async () => {
    // Send a message via API first so the conversation appears in the conversation list
    await pageA.request.post(`http://localhost:8000/api/v1/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${userAToken}` },
      data: { ciphertext: 'test', nonce: 'test' }
    });

    // Navigate to chat (after message exists)
    await pageA.goto(`/chats/${conversationId}?recipientId=${userBId}`);

    // Wait for the UI to be ready
    await pageA.waitForSelector('[data-testid="chat-options-btn"]', { timeout: 10000 });

    // Open Chat Options
    await pageA.locator('[data-testid="chat-options-btn"]').click();
    
    // Find the Mute notifications option by text (since it's now static)
    const muteLabel = pageA.getByText('Mute Notifications', { exact: true });
    await expect(muteLabel).toBeVisible();

    // Click the div to toggle
    const muteToggleContainer = pageA.locator('[data-testid="mute-toggle-btn"]');
    await muteToggleContainer.click();

    // Wait for the success toast indicating it was muted
    await expect(pageA.getByText('Notifications muted')).toBeVisible();

    // Reload the page to ensure persistence
    await pageA.reload();
    await pageA.waitForSelector('[data-testid="chat-options-btn"]', { timeout: 10000 });

    // Re-open Chat Options
    await pageA.locator('[data-testid="chat-options-btn"]').click();
    await expect(muteLabel).toBeVisible();

    // The switch should be checked. 
    // We can verify this by checking if the switch has aria-checked="true"
    const muteSwitch = muteToggleContainer.locator('button[role="switch"]');
    await expect(muteSwitch).toHaveAttribute('aria-checked', 'true');

    // Click again to unmute
    await muteToggleContainer.click();

    // Wait for the success toast indicating it was unmuted
    await expect(pageA.getByText('Notifications unmuted')).toBeVisible();
    
    // Verify switch is unchecked
    const muteSwitchAfter = muteToggleContainer.locator('button[role="switch"]');
    await expect(muteSwitchAfter).toHaveAttribute('aria-checked', 'false');
  });
});
