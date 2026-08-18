import apiClient from './api.client';

export interface Session {
  id: string;
  platform: string;
  deviceName: string | null;
  browser: string | null;
  ipAddress: string | null;
  location: string | null;
  userAgent: string | null;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface GetSessionsResponse {
  success: boolean;
  data: Session[];
}

export interface UpdateSessionResponse {
  success: boolean;
  data: {
    id: string;
    deviceName: string;
    updatedAt: string;
  };
}

export interface PingSessionResponse {
  success: boolean;
  data: {
    message: string;
    lastActiveAt: string;
  };
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

  updateSessionName: async (sessionId: string, deviceName: string): Promise<UpdateSessionResponse> => {
    const response = await apiClient.patch<UpdateSessionResponse>(`/auth/sessions/${sessionId}`, {
      deviceName,
    });
    return response.data;
  },

  pingSession: async (): Promise<PingSessionResponse> => {
    const response = await apiClient.post<PingSessionResponse>('/auth/sessions/ping');
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
