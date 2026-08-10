import apiClient from './api.client';
import { CommunityItem } from '@/components/communities/CreateCommunitiesUI';

export interface CommunityDetailGroup {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  memberCount: number;
  createdAt: string;
}

export interface CommunityDetailData extends CommunityItem {
  groups: CommunityDetailGroup[];
}

export const communityService = {
  async fetchMyCommunities(): Promise<{ success: boolean; data: CommunityItem[] }> {
    try {
      const response = await apiClient.get('/communities');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch communities:', error);
      return { success: false, data: [] };
    }
  },

  async createCommunity(data: {
    name: string;
    description?: string;
    category?: string;
    avatarUrl?: string;
    groupNames?: string[];
  }): Promise<{ success: boolean; data?: CommunityItem; error?: string }> {
    try {
      const response = await apiClient.post('/communities', data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create community:', error.response?.data || error);
      return {
        success: false,
        error: error.response?.data?.message
          ? JSON.stringify(error.response.data.message)
          : 'Failed to create community',
      };
    }
  },

  async updateCommunity(communityId: string, data: {
    name?: string;
    description?: string;
    category?: string;
    avatarUrl?: string | null;
  }): Promise<{ success: boolean; data?: CommunityItem; error?: string }> {
    try {
      const response = await apiClient.patch(`/communities/${communityId}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to update community:', error.response?.data || error);
      return {
        success: false,
        error: error.response?.data?.message
          ? JSON.stringify(error.response.data.message)
          : 'Failed to update community',
      };
    }
  },

  async fetchCommunityDetails(communityId: string): Promise<{ success: boolean; data?: CommunityDetailData; error?: string }> {
    try {
      const response = await apiClient.get(`/communities/${communityId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch community details for ${communityId}:`, error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch community details',
      };
    }
  },

  async addGroupToCommunity(communityId: string, data: { name: string; description?: string; isPublic?: boolean }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.post(`/communities/${communityId}/groups`, data);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to add group to community ${communityId}:`, error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to add group',
      };
    }
  },

  async deleteCommunity(communityId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await apiClient.delete(`/communities/${communityId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to delete community ${communityId}:`, error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete community',
      };
    }
  },
};
