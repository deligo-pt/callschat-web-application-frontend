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

test.describe.serial('Disappearing Messages', () => {
  let contextA: any;
  let contextB: any;
  let pageA: Page;
  let pageB: Page;
  let userAToken: string;
  let userBToken: string;
  let userAId: string;
  let userBId: string;
  let conversationId: string;

  const userAPhone = '+351999000003';
  const userBPhone = '+351999000004';

  test.beforeAll(async ({ browser }) => {
    contextA = await browser.newContext();
    contextB = await browser.newContext();
    pageA = await contextA.newPage();
    pageB = await contextB.newPage();

    userAToken = await loginTestUser(pageA, userAPhone);
    userBToken = await loginTestUser(pageB, userBPhone);

    // Get User IDs
    const meARes = await pageA.request.get('http://localhost:8000/api/v1/user/profile', { 
      headers: { Authorization: `Bearer ${userAToken}` } 
    });
    userAId = (await meARes.json()).data.id;

    const meBRes = await pageB.request.get('http://localhost:8000/api/v1/user/profile', { 
      headers: { Authorization: `Bearer ${userBToken}` } 
    });
    userBId = (await meBRes.json()).data.id;

    // Initiate conversation from User A to User B
    const convRes = await pageA.request.post('http://localhost:8000/api/v1/conversations/initiate', {
      headers: { Authorization: `Bearer ${userAToken}` },
      data: { targetUserId: userBId }
    });
    conversationId = (await convRes.json()).data.conversationId;
  });

  test.afterAll(async () => {
    await contextA.close();
    await contextB.close();
  });

  test.beforeEach(async () => {
    // Reset disappearing messages to null globally and per conversation
    await pageA.request.patch(`http://localhost:8000/api/v1/user/profile/privacy`, {
      headers: { Authorization: `Bearer ${userAToken}` },
      data: { defaultDisappearingTimer: null }
    });
    
    await pageA.request.patch(`http://localhost:8000/api/v1/conversations/${conversationId}/disappear`, {
      headers: { Authorization: `Bearer ${userAToken}` },
      data: { disappearAfterSeconds: null }
    });
  });

  test('should apply per-conversation disappearing messages', async () => {
    // Navigate to chat
    await pageA.goto(`/chats/${conversationId}?recipientId=${userBId}`);
    await pageB.goto(`/chats/${conversationId}?recipientId=${userAId}`);

    // Wait for the UI to be ready
    await pageA.waitForSelector('[data-testid="chat-options-btn"]', { timeout: 10000 });

    // User A enables 24 hours timer via UI
    await pageA.locator('[data-testid="chat-options-btn"]').click();
    await pageA.getByRole('menuitem', { name: 'Disappearing Messages' }).click();
    
    // Select 24 hours
    await pageA.getByText('24 hours', { exact: true }).click();
    
    // Save via the "Start Ephemeral Chat" button
    await pageA.getByRole('button', { name: 'Start Ephemeral Chat' }).click();

    // Wait for the banner to appear indicating disappearing messages are on
    await expect(pageA.getByText('New messages auto-delete')).toBeVisible();

    // Send a message
    const uniqueMessage = `Per-conversation ephemeral ${Date.now()}`;
    await pageA.getByPlaceholder('Type a message').fill(uniqueMessage);
    await pageA.getByPlaceholder('Type a message').press('Enter');

    // Check message sent
    const msgA = pageA.getByText(uniqueMessage);
    await expect(msgA).toBeVisible();
    
    // Check countdown badge on User A side
    const badgeA = pageA.locator('span', { hasText: /23h 59m|24h/ }).first();
    await expect(badgeA).toBeVisible();

    // Check message on User B side
    const msgB = pageB.getByText(uniqueMessage);
    await expect(msgB).toBeVisible();

    // Check countdown badge on User B side
    const badgeB = pageB.locator('span', { hasText: /23h 59m|24h/ }).first();
    await expect(badgeB).toBeVisible();
  });

  test('should apply global disappearing messages', async () => {
    // User A navigates to Profile -> Disappearing Messages
    await pageA.goto('/profile/disappearing');
    
    // Select 7 days
    await pageA.getByText('7 days', { exact: true }).click();
    
    // Wait for the success toast
    await expect(pageA.getByText('Disappearing messages set to 7 days for all your chats.')).toBeVisible();

    // Navigate to chat
    await pageA.goto(`/chats/${conversationId}?recipientId=${userBId}`);
    await pageB.goto(`/chats/${conversationId}?recipientId=${userAId}`);

    // Wait for both inputs to be ready
    await pageA.waitForSelector('textarea[placeholder="Type a message"]');
    await pageB.waitForSelector('textarea[placeholder="Type a message"]');

    // Wait for the banner to appear
    await expect(pageA.getByText('New messages auto-delete')).toBeVisible();

    // Send a message
    const uniqueMessage = `Global ephemeral ${Date.now()}`;
    await pageA.getByPlaceholder('Type a message').fill(uniqueMessage);
    await pageA.getByPlaceholder('Type a message').press('Enter');

    // Check message sent
    const msgA = pageA.getByText(uniqueMessage);
    await expect(msgA).toBeVisible();
    
    // Check countdown badge on User A side (6d 23h)
    const badgeA = pageA.locator('span', { hasText: /6d 23h|7d/ }).first();
    await expect(badgeA).toBeVisible();

    // Check message on User B side
    const msgB = pageB.getByText(uniqueMessage);
    await expect(msgB).toBeVisible();

    // Check countdown badge on User B side
    const badgeB = pageB.locator('span', { hasText: /6d 23h|7d/ }).first();
    await expect(badgeB).toBeVisible();
  });
});
