import apiClient from './api.client';

export interface StartHuddleResponse {
  meetingId: string;
  status: string;
  isNew?: boolean;
}

export interface GetTokenResponse {
  token: string;
}

export class MeetingService {
  static async startHuddle(channelId: string, workspaceId: string): Promise<StartHuddleResponse> {
    const { data } = await apiClient.post<StartHuddleResponse>('/business/meetings/huddle', {
      channelId,
    }, {
      headers: {
        'x-workspace-id': workspaceId
      }
    });
    return data;
  }

  static async getToken(meetingId: string, workspaceId: string): Promise<GetTokenResponse> {
    const { data } = await apiClient.get<GetTokenResponse>(`/business/meetings/${meetingId}/token`, {
      headers: {
        'x-workspace-id': workspaceId
      }
    });
    return data;
  }

  static async endMeeting(meetingId: string, workspaceId: string): Promise<{ success: boolean }> {
    const { data } = await apiClient.post<{ success: boolean }>(`/business/meetings/${meetingId}/end`, {}, {
      headers: {
        'x-workspace-id': workspaceId
      }
    });
    return data;
  }
}
