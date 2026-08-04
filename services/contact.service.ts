import apiClient from './api.client';
import type {
  SyncContactsRequest,
  SyncContactsResponse,
  ListUnregisteredResponse,
  InviteContactRequest,
  InviteContactResponse,
} from '@/types/contact.types';

export const ContactService = {
  fetchContacts: async () => {
    const response = await apiClient.get('/contacts');
    return response.data;
  },
  
  addContact: async (phoneNumber: string, customName: string) => {
    const response = await apiClient.post('/contacts', { phoneNumber, customName });
    return response.data;
  },

  toggleFavourite: async (contactId: string, isFavourite: boolean) => {
    const response = await apiClient.patch(`/contacts/${contactId}/favourite`, { isFavourite });
    return response.data;
  },

  toggleFavouriteByUser: async (targetUserId: string, isFavourite: boolean) => {
    const response = await apiClient.patch(`/contacts/favourite-user/${targetUserId}`, { isFavourite });
    return response.data;
  },

  addMutualContact: async (targetId: string) => {
    const response = await apiClient.post(`/contacts/add-back/${targetId}`);
    return response.data;
  },

  /**
   * Syncs phonebook contacts against registered CallsChat accounts.
   * Registered users are automatically added to contacts list.
   * Unregistered contacts are saved/upserted for SMS invitations.
   */
  syncContacts: async (payload: SyncContactsRequest): Promise<SyncContactsResponse> => {
    const response = await apiClient.post('/contacts/sync', payload);
    return response.data;
  },

  /**
   * Lists paginated unregistered contacts (invitable friends).
   * Supports real-time filtering by name or phone number.
   */
  listUnregisteredContacts: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ListUnregisteredResponse> => {
    const response = await apiClient.get('/contacts/unregistered', { params });
    return response.data;
  },

  /**
   * Dispatches an SMS invitation to an unregistered contact.
   */
  inviteContact: async (payload: InviteContactRequest): Promise<InviteContactResponse> => {
    const response = await apiClient.post('/contacts/invite', payload);
    return response.data;
  },
};

