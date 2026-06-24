import apiClient from './api.client';

export class NotificationService {
  /**
   * Syncs the device's FCM push notification token with the backend.
   * @param token The FCM registration token obtained from the Firebase client SDK
   */
  public async syncFCMToken(token: string): Promise<void> {
    try {
      await apiClient.post('/notifications/tokens', {
        token,
        deviceType: 'WEB',
      });
    } catch (error) {
      console.error('Failed to sync FCM token with backend:', error);
      throw error;
    }
  }
}

export default new NotificationService();
