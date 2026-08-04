import apiClient from './api.client';

export interface SetupBusinessPayload {
  companyName: string;
  category: string;
  description?: string;
  website?: string;
  address?: string;
}

export interface VerificationRequestData {
  id: string;
  businessId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  documentUrl?: string;
  documents?: any;
  submittedAt: string;
}

export interface BusinessProfileData {
  id: string;
  userId: string;
  companyName: string;
  category: string;
  description?: string;
  website?: string;
  address?: string;
  operatingHours?: any;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  verificationRequests?: VerificationRequestData[];
}

export const uploadMedia = async (file: File): Promise<{ url: string; key: string; filename: string; mimetype: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/media/upload', formData);
  
  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Failed to upload media');
  }

  return response.data.data; // { url, key, filename, mimetype }
};

export const BusinessService = {
  setupAccount: async (data: SetupBusinessPayload) => {
    const response = await apiClient.post('/business/setup', data);
    return response.data;
  },

  getProfile: async (): Promise<{ success: boolean; data: BusinessProfileData; message?: string }> => {
    const response = await apiClient.get('/business/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<{ companyName: string; category: string; description: string | null; website: string | null; address: string | null; operatingHours: Record<string, any> | null }>): Promise<{ success: boolean; data: BusinessProfileData; message?: string }> => {
    const response = await apiClient.patch('/business/profile', data);
    return response.data;
  },

  submitVerification: async (data: { documentUrl?: string | null; documents?: Record<string, string> | null }) => {
    const response = await apiClient.post('/business/verify', data);
    return response.data;
  },

  getDirectory: async (): Promise<{ success: boolean; data: Array<{ workspaceId: string; name: string; isVerified: boolean; avatarUrl: string | null; description: string | null }> }> => {
    const response = await apiClient.get('/business/directory');
    return response.data;
  },
};
