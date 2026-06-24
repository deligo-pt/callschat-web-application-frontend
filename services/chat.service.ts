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

  initiateConversation: async (targetUserId: string) => {
    const response = await apiClient.post('/conversations/initiate', {
      targetUserId
    });
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
};
