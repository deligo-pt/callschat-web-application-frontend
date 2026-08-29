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
  isMuted?: boolean;
  mutedUntil?: string | null;
  editGroupInfoScope?: 'ALL_MEMBERS' | 'ONLY_ADMINS';
  sendMessagesScope?: 'ALL_MEMBERS' | 'ONLY_ADMINS';
  addMembersScope?: 'ALL_MEMBERS' | 'ONLY_ADMINS';
  joinApprovalMode?: 'DIRECT' | 'APPROVAL_REQUIRED';
  disappearAfterSeconds?: number | null;
}

export const groupService = {
  async fetchMyGroups(favourite?: boolean, mode?: 'PERSONAL' | 'BUSINESS'): Promise<{ success: boolean; data: GroupItem[] }> {
    try {
      const params: Record<string, any> = {};
      if (favourite !== undefined) params.favourite = favourite;
      if (mode !== undefined) params.mode = mode;
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

  async toggleMute(groupId: string, isMuted: boolean, durationHours?: number): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.patch(`/groups/${groupId}/mute`, { isMuted, durationHours });
      return response.data;
    } catch (error) {
      console.error(`Failed to toggle mute for group ${groupId}`, error);
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

  async updateGroup(
    groupId: string,
    data: { name?: string; description?: string | null; avatarUrl?: string | null; isPublic?: boolean }
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.patch(`/groups/${groupId}`, data);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to update group ${groupId}`, error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update group details',
      };
    }
  },

  async updateGroupSettings(
    groupId: string,
    data: {
      editGroupInfoScope?: 'ALL_MEMBERS' | 'ONLY_ADMINS';
      sendMessagesScope?: 'ALL_MEMBERS' | 'ONLY_ADMINS';
      addMembersScope?: 'ALL_MEMBERS' | 'ONLY_ADMINS';
      joinApprovalMode?: 'DIRECT' | 'APPROVAL_REQUIRED';
      disappearAfterSeconds?: number | null;
    }
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.patch(`/groups/${groupId}/settings`, data);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to update group settings for ${groupId}`, error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update group settings',
      };
    }
  },

  async fetchGroupMembers(groupId: string): Promise<{ success: boolean; data?: { members: Array<{ id: string; userId: string; role?: string; publicKey?: string | null; keyEncryptedBy?: string | null; [key: string]: any }>; total: number; requesterRole: string } }> {
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
    editGroupInfoScope?: 'ALL_MEMBERS' | 'ONLY_ADMINS';
    sendMessagesScope?: 'ALL_MEMBERS' | 'ONLY_ADMINS';
    addMembersScope?: 'ALL_MEMBERS' | 'ONLY_ADMINS';
    joinApprovalMode?: 'DIRECT' | 'APPROVAL_REQUIRED';
    disappearAfterSeconds?: number | null;
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
          ? (typeof error.response.data.message === 'string' ? error.response.data.message : JSON.stringify(error.response.data.message))
          : 'Failed to create group' 
      };
    }
  },

  async addMember(groupId: string, userId: string, encryptedGroupKey: string, keyNonce: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.post(`/groups/${groupId}/members`, { userId, encryptedGroupKey, keyNonce });
      return response.data;
    } catch (error: any) {
      console.error(`Failed to add member ${userId} to group ${groupId}`, error);
      return { success: false, error: error.response?.data?.message || 'Failed to add member' };
    }
  },

  async fetchGroupKey(groupId: string): Promise<{ success: boolean; data?: { encryptedGroupKey: string; keyNonce: string; senderId?: string } }> {
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

  async fetchGroupMessages(groupId: string, cursor?: string, limit?: number): Promise<{ success: boolean; data?: any[] }> {
    try {
      const response = await apiClient.get(`/groups/${groupId}/messages`, {
        params: { cursor, limit },
      });
      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch group messages for ${groupId}`, JSON.stringify(error.response?.data || error.message));
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

  async fetchInviteCode(groupId: string): Promise<{ success: boolean; data?: { inviteCode: string } }> {
    try {
      const response = await apiClient.get(`/groups/${groupId}/invite`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch invite code for ${groupId}`, error);
      return { success: false };
    }
  },

  async resetInviteCode(groupId: string): Promise<{ success: boolean; data?: { inviteCode: string } }> {
    try {
      const response = await apiClient.post(`/groups/${groupId}/invite/reset`);
      return response.data;
    } catch (error) {
      console.error(`Failed to reset invite code for ${groupId}`, error);
      return { success: false };
    }
  },

  async previewGroupByInvite(code: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.get(`/groups/invite/${code}`);
      return response.data;
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Invalid invite link' };
    }
  },

  async joinGroupByInvite(code: string, encryptedGroupKey?: string, keyNonce?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.post(`/groups/invite/${code}/join`, {
        encryptedGroupKey,
        keyNonce,
      });
      return response.data;
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to join group' };
    }
  },

  async fetchJoinRequests(groupId: string): Promise<{ success: boolean; data?: any[] }> {
    try {
      const response = await apiClient.get(`/groups/${groupId}/join-requests`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch join requests for ${groupId}`, error);
      return { success: false };
    }
  },

  async reviewJoinRequest(
    groupId: string,
    requestId: string,
    decision: 'APPROVE' | 'REJECT',
    encryptedGroupKey?: string,
    keyNonce?: string
  ): Promise<{ success: boolean; data?: any }> {
    try {
      const response = await apiClient.post(`/groups/${groupId}/join-requests/${requestId}/review`, {
        decision,
        encryptedGroupKey,
        keyNonce,
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to review join request for ${groupId}`, error);
      return { success: false };
    }
  },

  async addReaction(groupId: string, messageId: string, emoji: string): Promise<{ success: boolean; data?: any }> {
    try {
      const response = await apiClient.post(`/groups/${groupId}/messages/${messageId}/reactions`, { emoji });
      return response.data;
    } catch (error) {
      console.error(`Failed to add reaction to message ${messageId}`, error);
      return { success: false };
    }
  },

  async removeReaction(groupId: string, messageId: string): Promise<{ success: boolean; data?: any }> {
    try {
      const response = await apiClient.delete(`/groups/${groupId}/messages/${messageId}/reactions`);
      return response.data;
    } catch (error) {
      console.error(`Failed to remove reaction from message ${messageId}`, error);
      return { success: false };
    }
  },

  async pinMessage(groupId: string, messageId: string, durationSeconds?: number): Promise<{ success: boolean; data?: any }> {
    try {
      const response = await apiClient.post(`/groups/${groupId}/messages/${messageId}/pin`, { durationSeconds });
      return response.data;
    } catch (error) {
      console.error(`Failed to pin message ${messageId}`, error);
      return { success: false };
    }
  },

  async unpinMessage(groupId: string, messageId: string): Promise<{ success: boolean; data?: any }> {
    try {
      const response = await apiClient.delete(`/groups/${groupId}/messages/${messageId}/unpin`);
      return response.data;
    } catch (error) {
      console.error(`Failed to unpin message ${messageId}`, error);
      return { success: false };
    }
  },

  async fetchPinnedMessages(groupId: string): Promise<{ success: boolean; data?: any[] }> {
    try {
      const response = await apiClient.get(`/groups/${groupId}/pinned-messages`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch pinned messages for ${groupId}`, error);
      return { success: false };
    }
  },

  async createPoll(
    groupId: string,
    question: string,
    options: string[],
    allowMultiple: boolean
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.post(`/groups/${groupId}/polls`, {
        question,
        options,
        allowMultiple,
      });
      return response.data;
    } catch (error: any) {
      console.error(`Failed to create poll in group ${groupId}`, error);
      return { success: false, error: error.response?.data?.message || 'Failed to create poll' };
    }
  },

  async votePoll(groupId: string, optionId: string, allowMultiple: boolean): Promise<{ success: boolean; data?: any }> {
    try {
      const response = await apiClient.post(`/groups/${groupId}/polls/${optionId}/vote`, {
        optionId,
        allowMultiple,
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to vote on poll option ${optionId}`, error);
      return { success: false };
    }
  },

  async fetchMessageInfo(groupId: string, messageId: string): Promise<{ success: boolean; data?: any[] }> {
    try {
      const response = await apiClient.get(`/groups/${groupId}/messages/${messageId}/info`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch message info for ${messageId}`, error);
      return { success: false };
    }
  },

  async uploadGroupMedia(groupId: string, file: File): Promise<{ success: boolean; data?: { mediaUrl: string; mediaType: string }; error?: string }> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.post(`/groups/${groupId}/upload`, formData);
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

  async unsendMessage(groupId: string, messageId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.delete(`/groups/${groupId}/messages/${messageId}/unsend`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to unsend message ${messageId} in group ${groupId}`, error);
      return { success: false, error: error.response?.data?.message || 'Failed to unsend message' };
    }
  },
};
