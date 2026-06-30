import apiClient from './api.client';

export interface ChannelData {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  isMember?: boolean;
  memberCount?: number;
}

export interface CreateChannelPayload {
  name: string;
  description?: string;
  isPrivate: boolean;
}

export interface ChannelMessageData {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  createdAt: string;
}

export const ChannelService = {
  getChannels: async (workspaceId: string): Promise<{ success: boolean; data: ChannelData[] }> => {
    const response = await apiClient.get('/business/channels', {
      params: { workspaceId },
    });
    return response.data;
  },

  createChannel: async (workspaceId: string, data: CreateChannelPayload): Promise<{ success: boolean; data: ChannelData }> => {
    const response = await apiClient.post('/business/channels', {
      ...data,
      workspaceId,
    });
    return response.data;
  },

  joinChannel: async (workspaceId: string, channelId: string): Promise<{ success: boolean; data: ChannelData }> => {
    const response = await apiClient.post(`/business/channels/${channelId}/join`, null, {
      params: { workspaceId },
    });
    return response.data;
  },

  getChannelMessages: async (workspaceId: string, channelId: string): Promise<{ success: boolean; data: { messages: ChannelMessageData[] } }> => {
    const response = await apiClient.get(`/business/channels/${channelId}/messages`, {
      params: { workspaceId },
    });
    return response.data;
  },

  getChannelMembers: async (workspaceId: string, channelId: string): Promise<{ success: boolean; data: any[] }> => {
    const response = await apiClient.get(`/business/channels/${channelId}/members`, {
      params: { workspaceId },
    });
    return response.data;
  },
};
