import apiClient from './api.client';

export interface Session {
  id: string;
  platform: string;
  deviceName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface GetSessionsResponse {
  success: boolean;
  data: Session[];
}

export interface RevokeSessionResponse {
  success: boolean;
  data: {
    message: string;
  };
}

export const sessionService = {
  getSessions: async (): Promise<GetSessionsResponse> => {
    const response = await apiClient.get<GetSessionsResponse>('/auth/sessions');
    return response.data;
  },

  revokeSession: async (sessionId: string): Promise<RevokeSessionResponse> => {
    const response = await apiClient.delete<RevokeSessionResponse>(`/auth/sessions/${sessionId}`);
    return response.data;
  },

  revokeOtherSessions: async (): Promise<RevokeSessionResponse> => {
    const response = await apiClient.delete<RevokeSessionResponse>('/auth/sessions');
    return response.data;
  },
};

export default sessionService;
