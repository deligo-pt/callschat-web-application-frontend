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
    const response = await apiClient.patch('/user/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateEmail: async (data: UpdateEmailPayload) => {
    const response = await apiClient.patch('/user/email', data);
    return response.data;
  },

  checkUsername: async (username: string) => {
    const response = await apiClient.get(`/user/username/check?username=${encodeURIComponent(username)}`);
    return response.data;
  },
};
