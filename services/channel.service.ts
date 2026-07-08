import apiClient from './api.client';

export interface ChannelData {
  id: string;
  name: string;
  description: string | null;
  website?: string | null;
  avatarUrl?: string | null;
  category?: string | null;
  whoCanJoin?: string;
  whoCanPost?: string;
  enableReactions?: boolean;
  defaultNotification?: string;
  ownerId?: string | null;
  isPrivate: boolean;
  workspaceId?: string | null;
  createdAt: string;
  updatedAt: string;
  isMember?: boolean;
  memberCount?: number;
  myRole?: string;
}

export interface CreateChannelPayload {
  name: string;
  description?: string | null;
  website?: string | null;
  avatarUrl?: string | null;
  category?: string;
  whoCanJoin?: string;
  whoCanPost?: string;
  enableReactions?: boolean;
  defaultNotification?: string;
  memberIds?: string[];
  isPrivate?: boolean;
  workspaceId?: string | null;
}

export interface UpdateChannelPayload extends Partial<CreateChannelPayload> {}

export interface ChannelMessageData {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  isPinned?: boolean;
  isSent?: boolean;
  scheduledFor?: string | null;
  createdAt: string;
}

export interface ChannelMemberData {
  id: string;
  name: string;
  avatarUrl?: string | null;
  isOnline: boolean;
  role?: string;
}

export const ChannelService = {
  getChannels: async (workspaceId?: string | null): Promise<{ success: boolean; data: ChannelData[] }> => {
    const params: Record<string, string> = {};
    if (workspaceId) params.workspaceId = workspaceId;
    const response = await apiClient.get('/business/channels', { params });
    return response.data;
  },

  getChannel: async (channelId: string, workspaceId?: string | null): Promise<{ success: boolean; data: ChannelData }> => {
    const params: Record<string, string> = {};
    if (workspaceId) params.workspaceId = workspaceId;
    const response = await apiClient.get(`/business/channels/${channelId}`, { params });
    return response.data;
  },

  createChannel: async (data: CreateChannelPayload, workspaceId?: string | null): Promise<{ success: boolean; data: ChannelData }> => {
    const payload = { ...data };
    if (workspaceId !== undefined && workspaceId !== null) {
      payload.workspaceId = workspaceId;
    }
    const response = await apiClient.post('/business/channels', payload);
    return response.data;
  },

  updateChannel: async (channelId: string, data: UpdateChannelPayload): Promise<{ success: boolean; data: ChannelData }> => {
    const response = await apiClient.patch(`/business/channels/${channelId}`, data);
    return response.data;
  },

  deleteChannel: async (channelId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/business/channels/${channelId}`);
    return response.data;
  },

  joinChannel: async (channelId: string, workspaceId?: string | null): Promise<{ success: boolean; data: ChannelData }> => {
    const params: Record<string, string> = {};
    if (workspaceId) params.workspaceId = workspaceId;
    const response = await apiClient.post(`/business/channels/${channelId}/join`, null, { params });
    return response.data;
  },

  leaveChannel: async (channelId: string, workspaceId?: string | null): Promise<{ success: boolean }> => {
    const params: Record<string, string> = {};
    if (workspaceId) params.workspaceId = workspaceId;
    const response = await apiClient.delete(`/business/channels/${channelId}/leave`, { params });
    return response.data;
  },

  addChannelMembers: async (channelId: string, memberIds: string[]): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/business/channels/${channelId}/members`, { memberIds });
    return response.data;
  },

  getChannelMessages: async (channelId: string, workspaceId?: string | null): Promise<{ success: boolean; data: { messages: ChannelMessageData[] } }> => {
    const params: Record<string, string> = {};
    if (workspaceId) params.workspaceId = workspaceId;
    const response = await apiClient.get(`/business/channels/${channelId}/messages`, { params });
    return response.data;
  },

  sendChannelMessage: async (
    channelId: string,
    content: string,
    mediaUrl?: string | null,
    mediaType?: string | null,
    workspaceId?: string | null,
    scheduledFor?: string | null
  ): Promise<{ success: boolean; data: ChannelMessageData }> => {
    const payload: Record<string, any> = { channelId, content };
    if (mediaUrl) payload.mediaUrl = mediaUrl;
    if (mediaType) payload.mediaType = mediaType;
    if (workspaceId) payload.workspaceId = workspaceId;
    if (scheduledFor) payload.scheduledFor = scheduledFor;
    const response = await apiClient.post(`/business/channels/${channelId}/messages`, payload);
    return response.data;
  },

  getChannelMembers: async (channelId: string, workspaceId?: string | null): Promise<{ success: boolean; data: ChannelMemberData[] }> => {
    const params: Record<string, string> = {};
    if (workspaceId) params.workspaceId = workspaceId;
    const response = await apiClient.get(`/business/channels/${channelId}/members`, { params });
    return response.data;
  },

  updateChannelMessage: async (
    channelId: string,
    messageId: string,
    payload: { content?: string; mediaUrl?: string | null; mediaType?: string | null; isPinned?: boolean }
  ): Promise<{ success: boolean; data: ChannelMessageData }> => {
    const response = await apiClient.patch(`/business/channels/${channelId}/messages/${messageId}`, payload);
    return response.data;
  },

  deleteChannelMessage: async (
    channelId: string,
    messageId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/business/channels/${channelId}/messages/${messageId}`);
    return response.data;
  },
};
