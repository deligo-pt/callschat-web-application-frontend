import apiClient from './api.client';

export interface UpdateEmailPayload {
  email: string | null;
}

export interface SearchUserItem {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  phone: string | null;
  accountType: string;
  isOnline: boolean;
  isContact: boolean;
  relationship: 'NONE' | 'CONTACT' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'BLOCKED';
}

export interface SearchUsersResponse {
  success: boolean;
  data: SearchUserItem[];
}

export const UserService = {
  getProfile: async () => {
    const response = await apiClient.get('/user/profile');
    return response.data;
  },

  updateProfile: async (formData: FormData) => {
    const response = await apiClient.patch('/user/profile', formData);
    return response.data;
  },

  updateEmail: async (data: UpdateEmailPayload) => {
    const response = await apiClient.patch('/user/email', data);
    return response.data;
  },

  updatePrivacy: async (data: any) => {
    const response = await apiClient.patch('/user/profile/privacy', data);
    return response.data;
  },

  checkUsername: async (username: string) => {
    const response = await apiClient.get(`/user/username/check?username=${encodeURIComponent(username)}`);
    return response.data;
  },

  updateUsername: async (username: string) => {
    const response = await apiClient.patch('/user/username', { username });
    return response.data;
  },

  searchUsers: async (query: string, limit: number = 20): Promise<SearchUsersResponse> => {
    const response = await apiClient.get<SearchUsersResponse>('/user/search', {
      params: { query, limit },
    });
    return response.data;
  },
};
