import apiClient from './api.client';

// ---------------------------------------------------------------------------
// Response shape from GET /api/v1/calls/token
// ---------------------------------------------------------------------------
export interface CallTokenResult {
  token: string;
  livekitUrl: string;
  roomName: string;
  identity: string;
}

export interface CallHistoryParticipant {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  isOnline: boolean;
}

export interface CallHistoryItem {
  id: string;
  type: 'AUDIO' | 'VIDEO';
  status: string;
  roomName: string;
  callerId: string;
  receiverId: string;
  groupId?: string | null;
  groupName?: string | null;
  groupAvatarUrl?: string | null;
  initiator: CallHistoryParticipant;
  receiver: CallHistoryParticipant;
  startedAt: string | null;
  answeredAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  createdAt: string;
}

export interface CallHistoryResult {
  calls: CallHistoryItem[];
  total: number;
  page: number;
  limit: number;
}

// ---------------------------------------------------------------------------
// Call Service
// Thin HTTP client layer for the calls REST API.
// All socket-level signaling is handled by useCallSignaling.ts.
// ---------------------------------------------------------------------------
export const CallService = {
  /**
   * Fetches a LiveKit access token for an EXISTING room without mutating any
   * CallLog record in the database.
   */
  async getCallToken(
    roomId: string,
    callType: 'AUDIO' | 'VIDEO' = 'AUDIO',
  ): Promise<CallTokenResult> {
    const response = await apiClient.get<{ success: true; data: CallTokenResult }>(
      '/calls/token',
      { params: { roomId, callType } },
    );
    return response.data.data;
  },

  /**
   * Fetches paginated call history for the authenticated user.
   */
  async getCallHistory(page: number = 1, limit: number = 20): Promise<CallHistoryResult> {
    const response = await apiClient.get<{ success: true; data: CallHistoryResult }>(
      '/calls/history',
      { params: { page, limit } },
    );
    return response.data.data;
  },
};
