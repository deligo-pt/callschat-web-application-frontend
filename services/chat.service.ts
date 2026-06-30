import apiClient from './api.client';

export interface MessagePayload {
  id?: string;
  conversationId: string;
  senderId: string;
  ciphertext: string;
  nonce: string;
  createdAt?: string;
}

export const chatService = {
  uploadPublicKey: async (deviceId: string, publicKey: string) => {
    const response = await apiClient.post('/encryption/keys', {
      deviceId,
      publicKey
    });
    return response.data;
  },

  fetchRecipientKey: async (userId: string) => {
    const response = await apiClient.get(`/encryption/keys/${userId}`);
    return response.data;
  },

  initiateConversation: async (params: string | { targetUserId?: string; groupId?: string; workspaceId?: string }) => {
    const payload = typeof params === 'string' ? { targetUserId: params } : params;
    const response = await apiClient.post('/conversations/initiate', payload);
    return response.data;
  },

  fetchHistory: async (conversationId: string) => {
    const response = await apiClient.get(`/conversations/${conversationId}/messages`);
    return response.data;
  },

  fetchMyConversations: async () => {
    const response = await apiClient.get('/conversations');
    return response.data;
  },

  uploadMedia: async (conversationId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`/conversations/${conversationId}/upload`, formData, {
      headers: {
        'Content-Type': undefined, // Allow browser to set the multipart/form-data boundary
      },
    });
    return response.data;
  },

  fetchConversationMedia: async (conversationId: string, page: number = 1) => {
    const response = await apiClient.get(`/conversations/${conversationId}/media`, {
      params: { page, limit: 50 },
    });
    return response.data;
  },

  markConversationAsRead: async (conversationId: string) => {
    try {
      const response = await apiClient.patch(`/notifications/read-by-route/${conversationId}`);
      return response.data;
    } catch {
      // Fire-and-forget: a badge-clear failure must not break the chat UI
    }
  },

  clearChat: async (conversationId: string) => {
    const response = await apiClient.delete(`/chats/${conversationId}/clear`);
    return response.data;
  },

  sendMessage: async (payload: { conversationId: string; ciphertext: string; nonce: string; mediaUrl?: string | null; mediaType?: string | null; ticketId?: string }) => {
    const response = await apiClient.post(`/conversations/${payload.conversationId}/messages`, payload);
    return response.data;
  },
};
