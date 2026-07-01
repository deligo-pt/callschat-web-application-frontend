import apiClient from './api.client';

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
  }
};
