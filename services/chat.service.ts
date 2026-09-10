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
  uploadPublicKey: async (deviceId: string, publicKey: string, registrationId?: string) => {
    const response = await apiClient.post('/encryption/keys', {
      deviceId,
      publicKey,
      ...(registrationId ? { registrationId } : {}),
    });
    return response.data;
  },

  fetchRecipientKey: async (userId: string) => {
    const response = await apiClient.get(`/encryption/keys/${userId}`);
    return response.data;
  },

  fetchBatchKeys: async (userIds: string[]) => {
    try {
      const response = await apiClient.post('/encryption/keys/batch', { userIds });
      return response.data?.data ?? {};
    } catch {
      return {};
    }
  },

  uploadPreKeys: async (payload: {
    deviceId: string;
    signedPreKey?: { keyId: number; publicKey: string; signature: string };
    oneTimePreKeys?: Array<{ keyId: number; publicKey: string }>;
  }) => {
    const response = await apiClient.post('/encryption/prekeys', payload);
    return response.data;
  },

  fetchPreKeyBundle: async (userId: string) => {
    try {
      const response = await apiClient.get(`/encryption/prekeys/bundle/${userId}`);
      return response.data;
    } catch {
      return null;
    }
  },

  fetchPreKeyCount: async (deviceId?: string) => {
    try {
      const response = await apiClient.get('/encryption/prekeys/count', {
        params: deviceId ? { deviceId } : {},
      });
      return response.data?.count ?? 0;
    } catch {
      return 0;
    }
  },

  uploadKeyBackup: async (payload: {
    encryptedVault: string;
    nonce: string;
    salt: string;
    kdfAlgorithm?: string;
    kdfIterations?: number;
    version?: number;
  }) => {
    const response = await apiClient.post('/encryption/backup', payload);
    return response.data;
  },

  fetchKeyBackup: async () => {
    try {
      const response = await apiClient.get('/encryption/backup');
      return response.data?.data ?? null;
    } catch {
      return null;
    }
  },

  deleteKeyBackup: async () => {
    const response = await apiClient.delete('/encryption/backup');
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
    
    // The backend will automatically apply the global disappearing timer to messages
    // when they are sent, so we do not need to read it from localStorage here.

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

  muteConversation: async (conversationId: string, isMuted: boolean, mutedUntil?: Date | null) => {
    const response = await apiClient.patch(`/conversations/${conversationId}/mute`, {
      isMuted,
      mutedUntil: mutedUntil ? mutedUntil.toISOString() : null,
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

  unsendMessage: async (conversationId: string, messageId: string) => {
    const response = await apiClient.delete(`/conversations/${conversationId}/messages/${messageId}/unsend`);
    return response.data;
  },
};

