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

test.describe('Chat - Offline Messaging', () => {
  test('should deliver message when recipient comes back online', async ({ browser }) => {
    // We create two separate incognito browser contexts
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    
    pageA.on('console', msg => console.log('A_CONSOLE:', msg.text()));
    pageB.on('console', msg => console.log('B_CONSOLE:', msg.text()));

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

    const userAId = (await pageA.request.get('http://localhost:8000/api/v1/user/profile', { 
      headers: { Authorization: `Bearer ${userAToken}` } 
    }).then(r => r.json())).data.id;

    // 3. User B goes offline by disabling network in the context
    await contextB.setOffline(true);

    // 4. User A navigates to chat and sends message to offline User B
    await pageA.goto(`/chats/${conversationId}?recipientId=${userBId}`);
    
    // Wait for the textarea to be ready for User A
    await pageA.waitForSelector('input[placeholder*="message"], textarea:not([disabled])');
    
    // Type and send message
    const testMessage = `Hello User B! This is an offline test message: ${Date.now()}`;
    await pageA.fill('input[placeholder*="message"], textarea', testMessage);
    await pageA.waitForTimeout(500);
    // Wait for E2EE keys to resolve and button to become enabled
    await expect(pageA.locator('button[type="submit"]')).toBeEnabled({ timeout: 15000 });
    
    // Press Enter inside the textarea to send the message
    await pageA.locator('input[placeholder*="message"], textarea').press('Enter');

    // Wait for message to appear in User A's chat (optimistic/confirmed)
    await expect(pageA.locator('span.whitespace-pre-wrap', { hasText: testMessage }).last()).toBeVisible({ timeout: 15000 });

    // 5. User B comes back online
    await contextB.setOffline(false);
    
    // User B navigates to the chat and verifies the message is there
    await pageB.goto(`http://localhost:3000/chats/${conversationId}?recipientId=${userAId}`);
    
    // The message should be fetched from the API and rendered
    await expect(pageB.locator('span.whitespace-pre-wrap', { hasText: testMessage }).last()).toBeVisible({ timeout: 15000 });

    // Clean up
    await contextA.close();
    await contextB.close();
  });
});
