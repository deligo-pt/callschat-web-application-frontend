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

  async fetchGroupDetails(groupId: string): Promise<{ success: boolean; data?: any }> {
    try {
      const response = await apiClient.get(`/groups/${groupId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch group details for ${groupId}`, error);
      return { success: false };
    }
  },

  async fetchGroupMembers(groupId: string): Promise<{ success: boolean; data?: { members: any[]; total: number; requesterRole: string } }> {
    try {
      const response = await apiClient.get(`/groups/${groupId}/members`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch group members for ${groupId}`, error);
      return { success: false };
    }
  },

  async createGroup(data: {
    name: string;
    description?: string;
    avatarUrl?: string;
    isPublic?: boolean;
    maxMembers?: number;
    keys?: Array<{ userId: string; encryptedGroupKey: string; keyNonce: string }>;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.post('/groups', data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create group', error.response?.data || error);
      return { 
        success: false, 
        error: error.response?.data?.message 
          ? JSON.stringify(error.response.data.message) 
          : 'Failed to create group' 
      };
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

  async fetchGroupKey(groupId: string): Promise<{ success: boolean; data?: { encryptedGroupKey: string; keyNonce: string } }> {
    try {
      const response = await apiClient.get(`/groups/${groupId}/key`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch group key for ${groupId}`, error);
      return { success: false };
    }
  },

  async fetchGroupMessages(groupId: string): Promise<{ success: boolean; data?: any[] }> {
    try {
      const response = await apiClient.get(`/groups/${groupId}/messages`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch group messages for ${groupId}`, error);
      return { success: false };
    }
  },
};
