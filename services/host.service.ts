import apiClient from './api.client';

// =============================================================================
// Types & Enums
// =============================================================================

export type HostNiche = 'TECH' | 'MUSIC' | 'TALK' | 'BUSINESS' | 'ENTERTAINMENT';

export type HostApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type HostProfileStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED';

export interface HostApplicationData {
  id: string;
  userId: string;
  niche: HostNiche;
  expectedHostingHoursPerWeek: number;
  motivation: string;
  bio?: string | null;
  introMediaUrl?: string | null;
  socialLinks?: Record<string, string> | null;
  qaResponses?: Record<string, any> | null;
  acceptedTerms: boolean;
  status: HostApplicationStatus;
  rejectionReason?: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HostProfileData {
  id: string;
  userId: string;
  status: HostProfileStatus;
  badgeLevel?: number;
  level?: number;
  totalLiveHours?: number;
  totalDiamondsEarned?: number;
  followersCount?: number;
  stats?: {
    totalLiveHours?: number;
    totalDiamondsEarned?: number;
    totalLiveSessions?: number;
    peakViewers?: number;
    totalGiftsReceived?: number;
  };
  earnings?: {
    withdrawableDiamonds?: number;
    pendingWithdrawalDiamonds?: number;
  };
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HostStatusData {
  isHost: boolean;
  hostProfile: HostProfileData | null;
  application: HostApplicationData | null;
}

export interface ApplyHostPayload {
  niche: HostNiche;
  expectedHostingHoursPerWeek: number;
  motivation: string;
  acceptedTerms: boolean;
  bio?: string;
  introMediaUrl?: string;
  socialLinks?: Record<string, string>;
  qaResponses?: Record<string, any>;
}

export interface MediaUploadResponse {
  url: string;
  key: string;
  filename: string;
  mimetype: string;
}

// =============================================================================
// Host Service API Client
// =============================================================================

export const HostService = {
  /**
   * Fetches the current user's host application and profile status.
   * GET /api/v1/live/host/application/status
   */
  getStatus: async (): Promise<{ success: boolean; data: HostStatusData }> => {
    const response = await apiClient.get('/live/host/application/status');
    return response.data;
  },

  /**
   * Submits a new host application or re-submits a rejected application.
   * POST /api/v1/live/host/apply
   */
  apply: async (
    payload: ApplyHostPayload,
  ): Promise<{ success: boolean; message: string; data: HostApplicationData }> => {
    const response = await apiClient.post('/live/host/apply', payload);
    return response.data;
  },

  /**
   * Uploads an audio/video demo file to RustFS object storage.
   * POST /api/v1/media/upload
   */
  uploadIntroMedia: async (file: File): Promise<MediaUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/media/upload', formData);

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to upload media sample');
    }

    return response.data.data;
  },
};
