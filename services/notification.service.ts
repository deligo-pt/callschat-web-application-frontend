import apiClient from './api.client';

export interface IssuerProfile {
  id: string;
  profile: {
    displayName: string;
    username: string;
    avatarUrl: string | null;
  } | null;
}

export interface AppNotification {
  id: string;
  userId: string;
  issuerId: string | null;
  type: 'MESSAGE' | 'CALL_MISSED' | 'CONTACT_REQUEST' | 'SYSTEM' | 'GROUP_INVITE';
  content: string;
  routeId: string | null;
  isRead: boolean;
  createdAt: string;
  issuer: IssuerProfile | null;
}

export interface GetNotificationsResponse {
  success: boolean;
  data: {
    notifications: AppNotification[];
    total: number;
    unreadCount: number;
    page: number;
    limit: number;
  };
}

export interface MarkAsReadResponse {
  success: boolean;
  data: AppNotification;
}

export interface MarkAllAsReadResponse {
  success: boolean;
  data: {
    count: number;
  };
}

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

  public async getNotifications(page: number, limit: number, filter: 'all' | 'unread'): Promise<GetNotificationsResponse> {
    const response = await apiClient.get<GetNotificationsResponse>(`/notifications?page=${page}&limit=${limit}&filter=${filter}`);
    return response.data;
  }

  public async markAsRead(id: string): Promise<MarkAsReadResponse> {
    const response = await apiClient.patch<MarkAsReadResponse>(`/notifications/${id}/read`);
    return response.data;
  }

  public async markAllAsRead(): Promise<MarkAllAsReadResponse> {
    const response = await apiClient.patch<MarkAllAsReadResponse>('/notifications/read-all');
    return response.data;
  }
}

export default new NotificationService();
