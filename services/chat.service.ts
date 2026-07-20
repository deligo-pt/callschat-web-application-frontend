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

  initiateConversation: async (
    params: string | {
      targetUserId?: string;
      groupId?: string;
      workspaceId?: string;
      /** When provided, creates a brand-new ephemeral conversation with this timer. */
      disappearAfterSeconds?: number | null;
    },
  ) => {
    const payload = typeof params === 'string' ? { targetUserId: params } : { ...params };
    
    // Automatically apply default disappearing messages setting for new 1v1 conversations
    if (payload.targetUserId && !payload.groupId && !payload.workspaceId && payload.disappearAfterSeconds === undefined) {
      if (typeof window !== 'undefined') {
        const defaultTimer = localStorage.getItem('callschat_default_disappear_seconds');
        if (defaultTimer && defaultTimer !== 'null' && defaultTimer !== '0') {
          const seconds = parseInt(defaultTimer, 10);
          if (!isNaN(seconds) && seconds > 0) {
            payload.disappearAfterSeconds = seconds;
          }
        }
      }
    }

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
    const response = await apiClient.post(`/conversations/${conversationId}/upload`, formData);
    return response.data; // { success, data: { mediaUrl, mediaType } }
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

  /**
   * Sets or clears the disappearing-messages timer for an EXISTING conversation.
   * Both participants share the same setting since it is stored on the
   * Conversation row and broadcast via socket.
   *
   * @param conversationId - The conversation to update.
   * @param disappearAfterSeconds - Timer in seconds, or null to turn off.
   */
  setDisappearSettings: async (conversationId: string, disappearAfterSeconds: number | null) => {
    const response = await apiClient.patch(`/conversations/${conversationId}/disappear`, {
      disappearAfterSeconds,
    });
    return response.data;
  },

  /**
   * Triggers server-side auto-deletion of an ephemeral conversation once all
   * messages have expired. The server independently re-validates before deleting.
   *
   * @param conversationId - The ephemeral conversation to clean up.
   */
  triggerEphemeralCleanup: async (conversationId: string) => {
    const response = await apiClient.post(`/conversations/${conversationId}/ephemeral-cleanup`);
    return response.data;
  },
};

