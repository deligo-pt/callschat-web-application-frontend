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
  conversationId: string;
  senderId: string;
  ciphertext: string | null;
  mediaType: string | null;
  ticketId: string | null;
  createdAt: string;
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
   * Add a private internal note to a ticket (not visible to customers).
   */
  createInternalNote: async (
    ticketId: string,
    content: string
  ): Promise<{ success: boolean; data: InternalNote }> => {
    const response = await apiClient.post(`/business/inbox/${ticketId}/notes`, { content });
    return response.data;
  },
};
