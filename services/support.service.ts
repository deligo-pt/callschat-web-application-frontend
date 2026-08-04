import apiClient from './api.client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TicketStatus = 'OPEN' | 'PENDING' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TicketCustomer {
  id: string;
  name: string;
  avatarUrl: string | null;
  email: string | null;
  phone: string;
}

export interface TicketAgent {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface TicketLastMessage {
  id: string;
  conversationId?: string;
  senderId: string;
  /** Readable text (same as content for B2C; ciphertext bytes for P2P). */
  ciphertext: string | null;
  /** Plaintext copy — always populated for B2C ticket messages. */
  content?: string | null;
  /** Always null for B2C ticket messages; non-null only for P2P E2EE chats. */
  nonce?: string | null;
  /**
   * `false`  → plaintext B2C message (TLS + DB protected); skip libsodium.
   * `true`   → E2EE-encrypted personal chat message; call decryptMessage.
   * `undefined` → legacy/unknown; fall back to nonce-presence check.
   */
  isEncrypted?: boolean;
  preview: string | null;
  mediaType: string | null;
  createdAt: string;
  fromCustomer: boolean;
}

export interface TicketTag {
  id: string;
  name: string;
  colorCode: string;
  workspaceId: string;
}

export interface Ticket {
  id: string;
  workspaceId: string;
  customerId: string;
  assignedAgentId: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  customer: TicketCustomer;
  assignedAgent: TicketAgent | null;
  lastMessage: TicketLastMessage | null;
  tags: TicketTag[];
}

export interface InternalNote {
  id: string;
  ticketId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface GetInboxFilters {
  status?: TicketStatus;
  assignedTo?: string;
  workspaceId?: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const SupportService = {
  /**
   * Fetch all tickets for the active workspace.
   * Supports optional filtering by status and assignedTo agent ID.
   */
  getInbox: async (filters?: GetInboxFilters): Promise<{ success: boolean; data: Ticket[] }> => {
    const params: Record<string, string> = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.assignedTo) params.assignedTo = filters.assignedTo;
    if (filters?.workspaceId) params.workspaceId = filters.workspaceId;

    const response = await apiClient.get('/business/inbox', { params });
    return response.data;
  },

  /**
   * Assign a ticket to a specific workspace agent.
   */
  assignTicket: async (
    ticketId: string,
    agentId: string
  ): Promise<{ success: boolean; data: Ticket }> => {
    const response = await apiClient.patch(`/business/inbox/${ticketId}/assign`, { agentId });
    return response.data;
  },

  /**
   * Update the status lifecycle of a ticket.
   */
  updateTicketStatus: async (
    ticketId: string,
    status: TicketStatus
  ): Promise<{ success: boolean; data: Ticket }> => {
    const response = await apiClient.patch(`/business/inbox/${ticketId}/status`, { status });
    return response.data;
  },

  /**
   * Reply to a customer ticket. The message is delivered into the
   * customer's personal chat thread via the shared Message table.
   *
   * ENCRYPTION NOTE:
   * Agent replies are intentionally NOT encrypted with libsodium.
   * Reasons: (a) all agents on the workspace must be able to read the thread,
   *          (b) the Automation Engine reads raw text for auto-reply evaluation.
   * Security: protected by TLS in transit and DB-level encryption at rest.
   *
   * Maps to: POST /api/v1/business/inbox/:ticketId/reply
   */
  replyToTicket: async (
    ticketId: string,
    content: string, // plaintext — backend stores with nonce=null (no E2EE)
  ): Promise<{ success: boolean; data: { id: string; senderId: string; content: string | null; ciphertext: string | null; isEncrypted: boolean; createdAt: string } }> => {
    const response = await apiClient.post(`/business/inbox/${ticketId}/reply`, { content });
    return response.data;
  },

  /**
   * Add a private internal note to a ticket (not visible to customers).
   * Internal notes are plain text — never encrypted, as agents need to
   * collaborate freely on ticket resolution.
   *
   * Maps to: POST /api/v1/business/inbox/:ticketId/notes
   */
  createInternalNote: async (
    ticketId: string,
    content: string
  ): Promise<{ success: boolean; data: InternalNote }> => {
    const response = await apiClient.post(`/business/inbox/${ticketId}/notes`, { content });
    return response.data;
  },

  /**
   * Fetch the full thread (messages + internal notes) for a support ticket.
   * Returns a combined, chronologically-sorted array typed by { type: 'message'|'note' }.
   *
   * Maps to: GET /api/v1/business/inbox/:ticketId/thread
   */
  getTicketMessages: async (
    ticketId: string
  ): Promise<{ success: boolean; data: any[] }> => {
    const response = await apiClient.get(`/business/inbox/${ticketId}/thread`);
    return response.data;
  },
};
