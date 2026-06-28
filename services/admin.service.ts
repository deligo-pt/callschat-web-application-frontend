import apiClient from './api.client';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export interface AnalyticsData {
  summary?: {
    totalUsers: number;
    activeBusinessAccounts: number;
  };
  liveMetrics?: {
    currentActiveSessions: number;
    ongoingCallsCount: number;
  };
  historicalTotals?: {
    totalCallsConnected: number;
    totalCallDurationMinutes: number;
  };
  users?: {
    total: number;
    active: number;
    suspended: number;
  };
  businessAccounts?: {
    total: number;
    verified: number;
    unverified: number;
  };
  calls?: {
    active1v1: number;
    activeGroup: number;
  };
}

export interface AnalyticsResponse {
  success: boolean;
  data: AnalyticsData;
}

export interface PendingBusinessVerification {
  id: string;
  verificationRequestId?: string;
  businessId?: string;
  userId: string;
  companyName: string;
  category?: string | null;
  industry?: string | null;
  businessEmail?: string | null;
  taxId?: string | null;
  description?: string | null;
  website?: string | null;
  address?: string | null;
  documentUrl?: string | null;
  status?: string;
  submittedAt?: string | Date;
  createdAt: string | Date;
  userInfo?: {
    phone: string;
    email?: string | null;
    displayName?: string | null;
  } | null;
}

export interface PendingVerificationsResponse {
  success: boolean;
  data: PendingBusinessVerification[];
  pagination: PaginationMeta;
}

export interface AdminActionResponse {
  success: boolean;
  message: string;
}

export interface ManagedUser {
  id: string;
  phoneNumber: string;
  accountType: string;
  isActive: boolean;
  createdAt: string | Date;
}

export interface GetUsersResponse {
  success: boolean;
  data: ManagedUser[];
  pagination: PaginationMeta;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  accountType?: string;
  isActive?: boolean;
}

export class AdminService {
  /**
   * Retrieves platform-wide analytics aggregations.
   * GET /api/v1/admin/analytics
   */
  async getAnalytics(): Promise<AnalyticsResponse> {
    const response = await apiClient.get('/admin/analytics');
    return response.data;
  }

  /**
   * Retrieves a paginated list of businesses pending verification.
   * GET /api/v1/admin/businesses/pending?page=${page}&limit=${limit}
   */
  async getPendingVerifications(page = 1, limit = 20): Promise<PendingVerificationsResponse> {
    const response = await apiClient.get('/admin/businesses/pending', {
      params: { page, limit },
    });
    return response.data;
  }

  /**
   * Approves or rejects a business account verification request.
   * PATCH /api/v1/admin/business/${id}/verify
   */
  async updateVerification(
    id: string,
    action: 'APPROVE' | 'REJECT',
    reason?: string
  ): Promise<AdminActionResponse> {
    const payload: { action: 'APPROVE' | 'REJECT'; reason?: string } = { action };
    if (reason !== undefined) {
      payload.reason = reason;
    }
    const response = await apiClient.patch(`/admin/business/${id}/verify`, payload);
    return response.data;
  }

  /**
   * Retrieves users with advanced search and filtering.
   * GET /api/v1/admin/users/manage
   */
  async getUsers(params: GetUsersParams = {}): Promise<GetUsersResponse> {
    const cleanParams: Record<string, string | number | boolean> = {};
    if (params.page !== undefined) cleanParams.page = params.page;
    if (params.limit !== undefined) cleanParams.limit = params.limit;
    if (params.search !== undefined && params.search.trim() !== '') {
      cleanParams.search = params.search.trim();
    }
    if (params.accountType !== undefined) cleanParams.accountType = params.accountType;
    if (params.isActive !== undefined) cleanParams.isActive = params.isActive;

    const response = await apiClient.get('/admin/users/manage', {
      params: cleanParams,
    });
    return response.data;
  }

  /**
   * Suspends a user account and terminates active sessions.
   * POST /api/v1/admin/users/${id}/suspend
   */
  async suspendUser(
    id: string,
    reason: string,
    description: string
  ): Promise<AdminActionResponse> {
    const response = await apiClient.post(`/admin/users/${id}/suspend`, {
      reason,
      description,
    });
    return response.data;
  }

  /**
   * Atomically updates a user account's active/disabled status.
   * PATCH /api/v1/admin/users/${id}/state
   */
  async updateUserState(id: string, isActive: boolean): Promise<AdminActionResponse> {
    const response = await apiClient.patch(`/admin/users/${id}/state`, {
      isActive,
    });
    return response.data;
  }
}

export const adminService = new AdminService();
export default adminService;
