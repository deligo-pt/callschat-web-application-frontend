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
  updatedAt: string;
  memberCount: number;
  myRole: string;
  joinedAt: string;
  isFavourite?: boolean;
}

export const groupService = {
  async fetchMyGroups(favourite?: boolean): Promise<{ success: boolean; data: GroupItem[] }> {
    try {
      const params = favourite !== undefined ? { favourite } : {};
      const response = await apiClient.get('/groups', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch groups', error);
      return { success: false, data: [] };
    }
  },

  async toggleFavourite(groupId: string, isFavourite: boolean): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.patch(`/groups/${groupId}/favourite`, { isFavourite });
      return response.data;
    } catch (error) {
      console.error(`Failed to toggle favourite for group ${groupId}`, error);
      return { success: false };
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

  async rekeyGroup(groupId: string, keys: Array<{ userId: string; encryptedGroupKey: string; keyNonce: string }>): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.post(`/groups/${groupId}/rekey`, { keys });
      return response.data;
    } catch (error: any) {
      console.error(`Failed to re-key group ${groupId}`, error);
      return { success: false, error: error.response?.data?.message || 'Failed to re-key group' };
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

  async removeMember(groupId: string, memberUserId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.delete(`/groups/${groupId}/members/${memberUserId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to remove member ${memberUserId} from group ${groupId}`, error);
      return { success: false, error: error.response?.data?.message || 'Failed to remove member' };
    }
  },

  async updateMemberRole(groupId: string, memberUserId: string, role: "ADMIN" | "MEMBER"): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.patch(`/groups/${groupId}/members/${memberUserId}/role`, { role });
      return response.data;
    } catch (error: any) {
      console.error(`Failed to update role for member ${memberUserId} in group ${groupId}`, error);
      return { success: false, error: error.response?.data?.message || 'Failed to update member role' };
    }
  },

  async uploadGroupMedia(groupId: string, file: File): Promise<{ success: boolean; data?: { mediaUrl: string; mediaType: string }; error?: string }> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.post(`/groups/${groupId}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error: any) {
      console.error(`Failed to upload media for group ${groupId}`, error);
      return { success: false, error: error.response?.data?.message || "Failed to upload media" };
    }
  },

  async fetchGroupMedia(groupId: string, page: number = 1): Promise<{ success: boolean; data?: any }> {
    try {
      const response = await apiClient.get(`/groups/${groupId}/media`, {
        params: { page, limit: 50 },
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch group media for ${groupId}`, error);
      return { success: false };
    }
  },
};
