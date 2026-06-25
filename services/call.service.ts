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

// ---------------------------------------------------------------------------
// Call Service
// Thin HTTP client layer for the calls REST API.
// All socket-level signaling is handled by useCallSignaling.ts.
// ---------------------------------------------------------------------------
export const CallService = {
  /**
   * Fetches a LiveKit access token for an EXISTING room without mutating any
   * CallLog record in the database.
   *
   * Used when a user accepts an escalated `call:incoming` event
   * (`isEscalatedCall: true`) — they join the live room directly rather than
   * going through the normal call:accept → call:connected socket flow.
   *
   * @param roomId   The LiveKit room name (from the call:incoming payload).
   * @param callType Media mode the participant should be granted.
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
};
