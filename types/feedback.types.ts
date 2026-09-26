/**
 * Feedback Module - TypeScript Types & Data Models
 * Matches backend contracts at /api/v1/user/feedbacks
 */

export type FeedbackType = 'BUG' | 'IMPROVEMENT' | 'REPORT' | 'OTHER';

export type FeedbackStatus =
  | 'PENDING'
  | 'REVIEWING'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED';

export type FeedbackPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface FeedbackAttachmentInput {
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number; // Size in bytes
}

export interface FeedbackAttachment extends FeedbackAttachmentInput {
  id: string;
  feedbackId: string;
  createdAt: string;
}

export interface FeedbackSenderProfile {
  displayName: string | null;
  avatarUrl: string | null;
  username?: string | null;
}

export interface FeedbackReplySender {
  id: string;
  role: string;
  profile: FeedbackSenderProfile | null;
}

export interface FeedbackReply {
  id: string;
  feedbackId: string;
  senderId: string;
  message: string;
  createdAt: string;
  sender: FeedbackReplySender;
}

export interface FeedbackItem {
  id: string;
  userId: string;
  type: FeedbackType;
  subject: string;
  description: string;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  userDeviceInfo: string | null;
  adminResponse: string | null;
  assignedAdminId: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  attachments?: FeedbackAttachment[];
  replies?: FeedbackReply[];
  _count?: {
    attachments: number;
    replies: number;
  };
}

export interface CreateFeedbackPayload {
  type?: FeedbackType;
  subject: string;
  description: string;
  priority?: FeedbackPriority;
  userDeviceInfo?: string;
  attachments?: FeedbackAttachmentInput[];
}

export interface UpdateFeedbackPayload {
  subject?: string;
  description?: string;
}

export interface GetFeedbacksQuery {
  page?: number;
  limit?: number;
  status?: FeedbackStatus;
  type?: FeedbackType;
}

export interface FeedbackPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedFeedbacks {
  items: FeedbackItem[];
  meta: FeedbackPaginationMeta;
}

export interface FeedbackApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
