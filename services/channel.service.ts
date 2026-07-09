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
  phones?: string[];
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
  viewsCount?: number;
  likesCount?: number;
  isLikedByMe?: boolean;
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

export interface JoinRequestData {
  id: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  requestedAt: string;
}

export interface ChannelInvitationData {
  id: string;
  channelId: string;
  channelName: string;
  channelAvatarUrl: string | null;
  channelIsPrivate: boolean;
  channelCategory: string | null;
  channelMemberCount: number;
  inviterId: string;
  inviterName: string;
  inviterAvatarUrl: string | null;
  role: string;
  status: string;
  createdAt: string;
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

  joinChannel: async (channelId: string, workspaceId?: string | null): Promise<{ success: boolean; data: { status: 'joined' | 'pending' } }> => {
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

  addChannelMembers: async (channelId: string, memberIds: string[], phones?: string[], role: string = 'MEMBER'): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/business/channels/${channelId}/members`, { memberIds, phones, role });
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

  incrementMessageViews: async (channelId: string, messageId: string): Promise<{ success: boolean; data: { viewsCount: number } }> => {
    const response = await apiClient.patch(`/business/channels/${channelId}/messages/${messageId}/view`);
    return response.data;
  },

  toggleMessageReaction: async (channelId: string, messageId: string): Promise<{ success: boolean; data: { isLikedByMe: boolean; likesCount: number } }> => {
    const response = await apiClient.post(`/business/channels/${channelId}/messages/${messageId}/react`);
    return response.data;
  },

  updateChannelMemberRole: async (
    channelId: string,
    memberUserId: string,
    role: 'MEMBER' | 'MODERATOR' | 'ADMIN'
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.patch(`/business/channels/${channelId}/members/${memberUserId}`, { role });
    return response.data;
  },

  removeChannelMember: async (
    channelId: string,
    memberUserId: string
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/business/channels/${channelId}/members/${memberUserId}`);
    return response.data;
  },

  getJoinRequests: async (channelId: string): Promise<{ success: boolean; data: JoinRequestData[] }> => {
    const response = await apiClient.get(`/business/channels/${channelId}/join-requests`);
    return response.data;
  },

  approveJoinRequest: async (channelId: string, requestId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/business/channels/${channelId}/join-requests/${requestId}/approve`);
    return response.data;
  },

  rejectJoinRequest: async (channelId: string, requestId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/business/channels/${channelId}/join-requests/${requestId}/reject`);
    return response.data;
  },

  getMyChannelInvitations: async (): Promise<{ success: boolean; data: ChannelInvitationData[] }> => {
    const response = await apiClient.get('/business/channels/invitations/me');
    return response.data;
  },

  acceptChannelInvitation: async (invitationId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/business/channels/invitations/${invitationId}/accept`);
    return response.data;
  },

  rejectChannelInvitation: async (invitationId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/business/channels/invitations/${invitationId}/reject`);
    return response.data;
  },
};
