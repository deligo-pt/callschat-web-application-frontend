import apiClient from './api.client';

export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type AnnouncementStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type AnnouncementTargetAudience = 'ALL' | 'PERSONAL' | 'BUSINESS';
export type AnnouncementMediaType = 'IMAGE' | 'VIDEO';

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  targetAudience: AnnouncementTargetAudience;
  isPinned: boolean;
  pinnedAt?: string | null;
  mediaUrl?: string | null;
  mediaKey?: string | null;
  mediaType?: AnnouncementMediaType | null;
  mediaThumbnailUrl?: string | null;
  mediaDuration?: number | null;
  mediaSize?: number | null;
  actionText?: string | null;
  actionUrl?: string | null;
  isEncrypted: boolean;
  encryptedPayload?: any;
  authorId: string;
  author?: {
    id: string;
    phone?: string | null;
    email?: string | null;
    profile?: {
      displayName: string;
      avatarUrl?: string | null;
    } | null;
  };
  viewsCount: number;
  readCount?: number;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementPayload {
  title: string;
  content: string;
  priority?: AnnouncementPriority;
  status?: AnnouncementStatus;
  targetAudience?: AnnouncementTargetAudience;
  isPinned?: boolean;
  mediaUrl?: string | null;
  mediaKey?: string | null;
  mediaType?: AnnouncementMediaType | null;
  mediaThumbnailUrl?: string | null;
  mediaDuration?: number | null;
  mediaSize?: number | null;
  actionText?: string | null;
  actionUrl?: string | null;
  isEncrypted?: boolean;
  encryptedPayload?: any;
}

export interface AdminStatsResponse {
  totalPublished: number;
  totalDrafts: number;
  totalImpressions: number;
  totalPinned: number;
  totalReadReceipts: number;
}

export interface AdminAnnouncementsResponse {
  success: boolean;
  data: AnnouncementItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class AdminAnnouncementService {
  /**
   * Admin: Creates and broadcasts an announcement.
   * POST /api/v1/admin/announcements
   */
  async createAnnouncement(
    payload: CreateAnnouncementPayload
  ): Promise<{ success: boolean; data: AnnouncementItem }> {
    const res = await apiClient.post('/admin/announcements', payload);
    return res.data;
  }

  /**
   * Admin: Lists announcements with filters and pagination.
   * GET /api/v1/admin/announcements
   */
  async getAnnouncements(params: {
    page?: number;
    limit?: number;
    status?: AnnouncementStatus;
    priority?: AnnouncementPriority;
    targetAudience?: AnnouncementTargetAudience;
    search?: string;
    isPinned?: boolean;
  } = {}): Promise<AdminAnnouncementsResponse> {
    const res = await apiClient.get('/admin/announcements', { params });
    return res.data;
  }

  /**
   * Admin: Fetches aggregate impressions, view rates, and read counts.
   * GET /api/v1/admin/announcements/stats
   */
  async getStats(): Promise<{ success: boolean; data: AdminStatsResponse }> {
    const res = await apiClient.get('/admin/announcements/stats');
    return res.data;
  }

  /**
   * Admin: Updates an announcement by ID.
   * PATCH /api/v1/admin/announcements/:id
   */
  async updateAnnouncement(
    id: string,
    payload: Partial<CreateAnnouncementPayload>
  ): Promise<{ success: boolean; data: AnnouncementItem }> {
    const res = await apiClient.patch(`/admin/announcements/${id}`, payload);
    return res.data;
  }

  /**
   * Admin: Deletes an announcement.
   * DELETE /api/v1/admin/announcements/:id
   */
  async deleteAnnouncement(id: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.delete(`/admin/announcements/${id}`);
    return res.data;
  }

  /**
   * Admin: Toggles pinned state.
   * POST /api/v1/admin/announcements/:id/pin
   */
  async togglePin(
    id: string,
    isPinned: boolean
  ): Promise<{ success: boolean; data: AnnouncementItem }> {
    const res = await apiClient.post(`/admin/announcements/${id}/pin`, { isPinned });
    return res.data;
  }

  /**
   * Uploads an image or short video directly to RustFS via the media endpoint.
   * POST /api/v1/media/upload
   */
  async uploadMedia(file: File): Promise<{
    url: string;
    key: string;
    filename: string;
    mimetype: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiClient.post('/media/upload', formData);
    return res.data.data;
  }
}

export const adminAnnouncementService = new AdminAnnouncementService();
export default adminAnnouncementService;
