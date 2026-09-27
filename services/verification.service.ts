import apiClient from './api.client';

// ---------------------------------------------------------------------------
// Types & Enums
// ---------------------------------------------------------------------------

export type VerificationTargetType = 'USER_IDENTITY' | 'BUSINESS_ENTITY';

export type VerificationStatus =
  | 'PENDING'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'REVOKED';

export type VerificationRejectionCode =
  | 'BLURRY_DOCUMENT'
  | 'EXPIRED_DOCUMENT'
  | 'NAME_MISMATCH'
  | 'INVALID_DOCUMENT'
  | 'INCOMPLETE_DOCUMENT'
  | 'OTHER';

export interface EncryptedDocumentMeta {
  vaultKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface VerificationRequestItem {
  id: string;
  targetType: VerificationTargetType;
  userId: string | null;
  businessId?: string | null;
  workspaceId?: string | null;
  status: VerificationStatus;
  idType: string | null;
  documents?: EncryptedDocumentMeta[] | any[] | null;
  rejectionCode?: VerificationRejectionCode | null;
  rejectionReason?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
}

export interface MyVerificationStatusData {
  userKyc: VerificationRequestItem | null;
  businessKyb: VerificationRequestItem | null;
  history: VerificationRequestItem[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// ---------------------------------------------------------------------------
// Verification Service
// ---------------------------------------------------------------------------

export const VerificationService = {
  /**
   * Retrieves active KYC and KYB verification states and past submission history.
   */
  getMyStatus: async (): Promise<ApiResponse<MyVerificationStatusData>> => {
    const response = await apiClient.get<ApiResponse<MyVerificationStatusData>>(
      '/verification/my-status',
    );
    return response.data;
  },

  /**
   * Submits a new verification request with multipart/form-data.
   * Documents are encrypted using AES-256-GCM before storage in the secure KYC vault.
   */
  submit: async (
    formData: FormData,
  ): Promise<ApiResponse<VerificationRequestItem>> => {
    const response = await apiClient.post<ApiResponse<VerificationRequestItem>>(
      '/verification/submit',
      formData,
    );
    return response.data;
  },

  /**
   * Replaces documents and resubmits an existing pending or rejected verification request.
   * Resets request status to PENDING_REVIEW and registers an audit trail entry.
   */
  update: async (
    formData: FormData,
  ): Promise<ApiResponse<VerificationRequestItem>> => {
    const response = await apiClient.patch<ApiResponse<VerificationRequestItem>>(
      '/verification/update',
      formData,
    );
    return response.data;
  },
};

export default VerificationService;
