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
  }
};
