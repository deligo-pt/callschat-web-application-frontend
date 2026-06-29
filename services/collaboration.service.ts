import apiClient from './api.client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface WorkspaceTask {
  id: string;
  workspaceId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignedUserId: string | null;
  dueDate: string | null;
  channelId?: string | null;
  ticketId?: string | null;
  createdAt: string;
  updatedAt: string;
  assignedUser?: {
    id: string;
    phone: string;
    email: string | null;
    profile?: {
      displayName: string;
      avatarUrl: string | null;
    };
  } | null;
}

export interface WorkspaceFileRecord {
  id: string;
  workspaceId: string;
  uploaderId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  sizeBytes: number;
  channelId: string | null;
  ticketId?: string | null;
  createdAt: string;
  uploader?: {
    id: string;
    phone: string;
    email: string | null;
    profile?: {
      displayName: string;
      avatarUrl: string | null;
    };
  } | null;
}

export interface ScheduleMessagePayload {
  content: string;
  scheduledFor: string;
  channelId?: string;
  ticketId?: string;
  workspaceId?: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const CollaborationService = {
  /**
   * Fetch workspace tasks with optional status or assignee filtering.
   */
  getTasks: async (filters?: {
    status?: TaskStatus;
    assignedUserId?: string;
    workspaceId?: string;
    channelId?: string;
    ticketId?: string;
  }): Promise<{ success: boolean; data: WorkspaceTask[] }> => {
    const params: Record<string, string> = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.assignedUserId) params.assignedUserId = filters.assignedUserId;
    if (filters?.workspaceId) params.workspaceId = filters.workspaceId;
    if (filters?.channelId) params.channelId = filters.channelId;
    if (filters?.ticketId) params.ticketId = filters.ticketId;

    const response = await apiClient.get('/business/tasks', { params });
    return {
      success: response.data.success ?? true,
      data: response.data.data || [],
    };
  },

  /**
   * Create a new workspace task.
   */
  createTask: async (data: {
    title: string;
    description?: string;
    assignedUserId?: string | null;
    dueDate?: string | null;
    workspaceId?: string;
    channelId?: string | null;
    ticketId?: string | null;
  }): Promise<{ success: boolean; data: WorkspaceTask }> => {
    const response = await apiClient.post('/business/tasks', data);
    return response.data;
  },

  /**
   * Update task status, assignee, or details.
   */
  updateTask: async (
    taskId: string,
    data: {
      title?: string;
      description?: string | null;
      status?: TaskStatus;
      assignedUserId?: string | null;
      dueDate?: string | null;
      workspaceId?: string;
    }
  ): Promise<{ success: boolean; data: WorkspaceTask }> => {
    const response = await apiClient.patch(`/business/tasks/${taskId}`, data);
    return response.data;
  },

  /**
   * Delete a task.
   */
  deleteTask: async (taskId: string, workspaceId?: string): Promise<{ success: boolean }> => {
    const params: Record<string, string> = {};
    if (workspaceId) params.workspaceId = workspaceId;

    const response = await apiClient.delete(`/business/tasks/${taskId}`, { params });
    return response.data;
  },

  /**
   * Fetch shared media/documents registry for the workspace.
   */
  getFiles: async (channelId?: string, workspaceId?: string, ticketId?: string): Promise<{ success: boolean; data: WorkspaceFileRecord[] }> => {
    const params: Record<string, string> = {};
    if (channelId) params.channelId = channelId;
    if (workspaceId) params.workspaceId = workspaceId;
    if (ticketId) params.ticketId = ticketId;

    const response = await apiClient.get('/business/files', { params });
    return {
      success: response.data.success ?? true,
      data: response.data.data || [],
    };
  },

  /**
   * Register file metadata into workspace gallery.
   */
  registerFile: async (data: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    sizeBytes: number;
    channelId?: string | null;
    ticketId?: string | null;
    workspaceId?: string;
  }): Promise<{ success: boolean; data: WorkspaceFileRecord }> => {
    const response = await apiClient.post('/business/files/register', data);
    return response.data;
  },

  /**
   * Upload file directly to Cloudinary and register in registry.
   */
  uploadFile: async (
    file: File,
    channelId?: string | null,
    ticketId?: string | null,
    workspaceId?: string
  ): Promise<{ success: boolean; data: WorkspaceFileRecord }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (channelId) formData.append('channelId', channelId);
    if (ticketId) formData.append('ticketId', ticketId);
    if (workspaceId) formData.append('workspaceId', workspaceId);

    const response = await apiClient.post('/business/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Schedule a message for future delivery.
   */
  scheduleMessage: async (data: ScheduleMessagePayload): Promise<{ success: boolean; data: any }> => {
    const response = await apiClient.post('/business/messages/schedule', data);
    return response.data;
  },
};
