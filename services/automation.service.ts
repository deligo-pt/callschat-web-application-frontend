import apiClient from './api.client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuickReply {
  id: string;
  workspaceId: string;
  shortcut: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export type AutomationType = 'GREETING' | 'AWAY' | 'KEYWORD';

export interface AutomationRule {
  id: string;
  workspaceId: string;
  type: AutomationType;
  keyword: string | null;
  responseMessage: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetAutomationsResponse {
  quickReplies: QuickReply[];
  rules: AutomationRule[];
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const AutomationService = {
  /**
   * Fetch all quick replies and automation rules for the active workspace.
   */
  getAutomations: async (workspaceId?: string): Promise<{ success: boolean; data: GetAutomationsResponse }> => {
    const params: Record<string, string> = {};
    if (workspaceId) params.workspaceId = workspaceId;

    const response = await apiClient.get('/business/automations', { params });
    const rawData = response.data.data || {};
    return {
      success: response.data.success ?? true,
      data: {
        quickReplies: rawData.quickReplies || [],
        rules: rawData.automationRules || rawData.rules || [],
      },
    };
  },

  /**
   * Create a new quick reply shortcut.
   */
  createQuickReply: async (data: {
    shortcut: string;
    content: string;
    workspaceId?: string;
  }): Promise<{ success: boolean; data: QuickReply }> => {
    const response = await apiClient.post('/business/automations/quick-replies', data);
    return response.data;
  },

  /**
   * Delete a quick reply by ID.
   */
  deleteQuickReply: async (id: string, workspaceId?: string): Promise<{ success: boolean }> => {
    const params: Record<string, string> = {};
    if (workspaceId) params.workspaceId = workspaceId;

    const response = await apiClient.delete(`/business/automations/quick-replies/${id}`, { params });
    return response.data;
  },

  /**
   * Create a new automation rule (GREETING, AWAY, or KEYWORD).
   */
  createRule: async (data: {
    type: string;
    keyword?: string;
    responseMessage: string;
    workspaceId?: string;
  }): Promise<{ success: boolean; data: AutomationRule }> => {
    const response = await apiClient.post('/business/automations/rules', data);
    return response.data;
  },

  /**
   * Toggle the active status of an automation rule.
   */
  toggleRule: async (
    id: string,
    isActive: boolean,
    workspaceId?: string
  ): Promise<{ success: boolean; data: AutomationRule }> => {
    const response = await apiClient.patch(`/business/automations/rules/${id}/toggle`, {
      isActive,
      ...(workspaceId ? { workspaceId } : {}),
    });
    return response.data;
  },
};
