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
};
