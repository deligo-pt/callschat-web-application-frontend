import apiClient from './api.client';

export interface WorkspaceData {
  id: string;
  name: string;
  businessId: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  role?: 'OWNER' | 'ADMIN' | 'AGENT';
}

export interface CreateWorkspacePayload {
  name: string;
  businessId: string;
}

export const WorkspaceService = {
  createWorkspace: async (data: CreateWorkspacePayload): Promise<{ success: boolean; data: WorkspaceData }> => {
    const response = await apiClient.post('/business/workspaces', data);
    return response.data;
  },

  getMyWorkspace: async (): Promise<{ success: boolean; data: WorkspaceData | null }> => {
    const response = await apiClient.get('/business/workspaces/me');
    return response.data;
  },

  inviteWorkspaceMember: async (phone: string, role: string = 'AGENT'): Promise<any> => {
    const response = await apiClient.post('/business/workspaces/invites', { phone, role });
    return response.data;
  },

  getMyInvites: async (): Promise<any> => {
    const response = await apiClient.get('/business/workspaces/invites/pending');
    return response.data;
  },

  acceptInvite: async (inviteId: string): Promise<any> => {
    const response = await apiClient.post(`/business/workspaces/invites/${inviteId}/accept`);
    return response.data;
  },

  rejectInvite: async (inviteId: string): Promise<any> => {
    const response = await apiClient.post(`/business/workspaces/invites/${inviteId}/reject`);
    return response.data;
  },

  leaveWorkspace: async (workspaceId: string): Promise<any> => {
    const response = await apiClient.post('/business/workspaces/leave', {}, {
      headers: {
        'x-workspace-id': workspaceId,
      }
    });
    return response.data;
  },
};
