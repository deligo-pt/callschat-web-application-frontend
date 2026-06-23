import apiClient from './api.client';

export interface GroupItem {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
  maxMembers: number;
  createdBy: string;
  createdAt: string;
  memberCount: number;
  myRole: string;
  joinedAt: string;
}

export const groupService = {
  async fetchMyGroups(): Promise<{ success: boolean; data: GroupItem[] }> {
    try {
      const response = await apiClient.get('/groups');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch groups', error);
      return { success: false, data: [] };
    }
  },

  async createGroup(data: {
    name: string;
    description?: string;
    avatarUrl?: string;
    isPublic?: boolean;
    maxMembers?: number;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.post('/groups', data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create group', error);
      return { success: false, error: error.response?.data?.message || 'Failed to create group' };
    }
  },

  async addMember(groupId: string, userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.post(`/groups/${groupId}/members`, { userId });
      return response.data;
    } catch (error: any) {
      console.error(`Failed to add member ${userId} to group ${groupId}`, error);
      return { success: false, error: error.response?.data?.message || 'Failed to add member' };
    }
  },
};
