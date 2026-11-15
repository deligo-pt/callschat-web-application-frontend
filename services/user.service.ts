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
  isVerified?: boolean;
}

export interface SearchUsersResponse {
  success: boolean;
  data: SearchUserItem[];
}

export interface DeleteAccountPayload {
  reason?: string;
  confirmation?: string;
}

export interface AccountDeletionStatus {
  isScheduledForDeletion: boolean;
  status: string;
  deletionScheduledAt: string | null;
  daysRemaining: number | null;
}

export interface DeleteAccountResponse {
  success: boolean;
  message: string;
  data: {
    status: string;
    deletionScheduledAt: string;
    gracePeriodDays: number;
  };
}

export interface ReactivateAccountResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    status: string;
    accountType: string;
  };
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

  getAccountDeletionStatus: async (): Promise<{ success: boolean; data: AccountDeletionStatus }> => {
    const response = await apiClient.get<{ success: boolean; data: AccountDeletionStatus }>('/user/account/deletion-status');
    return response.data;
  },

  deleteAccount: async (payload?: DeleteAccountPayload): Promise<DeleteAccountResponse> => {
    const response = await apiClient.delete<DeleteAccountResponse>('/user/account', { data: payload });
    return response.data;
  },

  reactivateAccount: async (): Promise<ReactivateAccountResponse> => {
    const response = await apiClient.post<ReactivateAccountResponse>('/user/account/reactivate');
    return response.data;
  },
};
