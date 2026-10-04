import apiClient from './api.client';
import type {
  AnnouncementItem,
  AnnouncementPriority,
  AnnouncementTargetAudience,
} from './admin-announcement.service';

export interface UserAnnouncementsResponse {
  success: boolean;
  data: (AnnouncementItem & { isRead: boolean })[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class AnnouncementService {
  /**
   * End-User: Fetches official broadcast announcements visible to this user.
   * GET /api/v1/announcements
   */
  async getAnnouncements(page = 1, limit = 20, search?: string): Promise<UserAnnouncementsResponse> {
    const params: Record<string, string | number> = { page, limit };
    if (search && search.trim() !== '') {
      params['search'] = search.trim();
    }
    const res = await apiClient.get('/announcements', { params });
    return res.data;
  }

  /**
   * End-User: Fetches the single latest visible announcement for conversation previews.
   * GET /api/v1/announcements/latest
   */
  async getLatestAnnouncement(): Promise<{
    success: boolean;
    data: (AnnouncementItem & { isRead: boolean }) | null;
  }> {
    const res = await apiClient.get('/announcements/latest');
    return res.data;
  }

  /**
   * End-User: Fetches unread official announcements count for badges.
   * GET /api/v1/announcements/unread-count
   */
  async getUnreadCount(): Promise<{ success: boolean; data: { unreadCount: number } }> {
    const res = await apiClient.get('/announcements/unread-count');
    return res.data;
  }

  /**
   * End-User: Fetches single announcement detail, marking it as read and incrementing views.
   * GET /api/v1/announcements/:id
   */
  async getAnnouncement(id: string): Promise<{ success: boolean; data: AnnouncementItem }> {
    const res = await apiClient.get(`/announcements/${id}`);
    return res.data;
  }

  /**
   * End-User: Explicitly marks an announcement as read.
   * POST /api/v1/announcements/:id/read
   */
  async markAsRead(id: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post(`/announcements/${id}/read`);
    return res.data;
  }

  /**
   * End-User: Marks all announcements as read.
   * POST /api/v1/announcements/read-all
   */
  async markAllAsRead(): Promise<{ success: boolean; markedCount: number }> {
    const res = await apiClient.post('/announcements/read-all');
    return res.data;
  }
}

export const announcementService = new AnnouncementService();
export default announcementService;
