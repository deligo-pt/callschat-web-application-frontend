import apiClient from './api.client';

export interface UpdateEmailPayload {
  email: string | null;
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
};
