import apiClient from './api.client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContactBusinessResponse {
  ticketId: string;
  conversationId: string;
  message: {
    id: string;
    senderId: string;
    senderName: string;
    senderAvatar: string | null;
    ciphertext: string | null;
    nonce: string | null;
    mediaUrl: string | null;
    mediaType: string | null;
    createdAt: string;
  };
  business: {
    id: string;
    name: string;
    isVerified: boolean;
  };
}

export interface CustomerThread {
  ticketId: string;
  workspaceId: string;
  businessName: string;
  businessIsVerified: boolean;
  status: 'OPEN' | 'PENDING' | 'CLOSED';
  lastMessage: {
    preview: string | null;
    createdAt: string;
    fromMe: boolean;
  } | null;
  updatedAt: string;
}

export interface CustomerThreadMessage {
  id: string;
  ticketId: string | null;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  ciphertext: string | null;
  nonce: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// CustomerService
//
// Customer-facing B2C bridge endpoints. Called by PERSONAL mode users to
// contact a business, list their support threads, and read thread history.
// ---------------------------------------------------------------------------

export const CustomerService = {
  /**
   * Send a message to a business by its unique handle.
   * Creates a new Ticket (or reuses an open one) and posts the message.
   *
   * Maps to: POST /api/v1/support/contact
   */
  contactBusiness: async (
    businessHandle: string,
    messageContent: string,
  ): Promise<{ success: boolean; data: ContactBusinessResponse }> => {
    const response = await apiClient.post('/support/contact', {
      businessHandle,
      message: messageContent,
    });
    return response.data;
  },

  /**
   * List all support threads (tickets) for the authenticated customer.
   *
   * Maps to: GET /api/v1/support/threads
   */
  listThreads: async (): Promise<{ success: boolean; data: CustomerThread[] }> => {
    const response = await apiClient.get('/support/threads');
    return response.data;
  },

  /**
   * Fetch the full message history for a specific support thread.
   * Formatted identically to a regular chat conversation.
   *
   * Maps to: GET /api/v1/support/threads/:ticketId
   */
  getThread: async (
    ticketId: string,
  ): Promise<{ success: boolean; data: CustomerThreadMessage[] }> => {
    const response = await apiClient.get(`/support/threads/${ticketId}`);
    return response.data;
  },
};
