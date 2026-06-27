import apiClient from './api.client';

export interface SetupBusinessPayload {
  companyName: string;
  category: string;
  description?: string;
  website?: string;
  address?: string;
}

export const BusinessService = {
  setupAccount: async (data: SetupBusinessPayload) => {
    const response = await apiClient.post('/business/setup', data);
    return response.data;
  },

  switchMode: async (mode: 'PERSONAL' | 'BUSINESS') => {
    const response = await apiClient.post('/business/switch-mode', { mode });
    return response.data;
  },
};
