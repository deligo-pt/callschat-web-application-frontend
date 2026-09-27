import apiClient from './api.client';
import type {
  CreateFeedbackPayload,
  FeedbackApiResponse,
  FeedbackAttachmentInput,
  FeedbackItem,
  GetFeedbacksQuery,
  PaginatedFeedbacks,
  UpdateFeedbackPayload,
} from '@/types/feedback.types';

export const feedbackService = {
  /**
   * Submits a new bug report, improvement suggestion, report, or general feedback.
   */
  async createFeedback(payload: CreateFeedbackPayload): Promise<FeedbackItem> {
    const res = await apiClient.post<FeedbackApiResponse<FeedbackItem>>(
      '/user/feedbacks',
      payload
    );
    return res.data.data;
  },

  /**
   * Retrieves a paginated list of feedback tickets submitted by the authenticated user.
   */
  async getMyFeedbacks(query?: GetFeedbacksQuery): Promise<PaginatedFeedbacks> {
    const res = await apiClient.get<FeedbackApiResponse<PaginatedFeedbacks>>(
      '/user/feedbacks',
      {
        params: query,
      }
    );
    return res.data.data;
  },

  /**
   * Retrieves full details of a user's own feedback ticket including attachments and admin replies.
   */
  async getMyFeedbackDetails(id: string): Promise<FeedbackItem> {
    const res = await apiClient.get<FeedbackApiResponse<FeedbackItem>>(
      `/user/feedbacks/${id}`
    );
    return res.data.data;
  },

  /**
   * Updates subject and/or description of a user's feedback ticket while it remains in PENDING status.
   */
  async updateMyFeedback(
    id: string,
    payload: UpdateFeedbackPayload
  ): Promise<FeedbackItem> {
    const res = await apiClient.patch<FeedbackApiResponse<FeedbackItem>>(
      `/user/feedbacks/${id}`,
      payload
    );
    return res.data.data;
  },

  /**
   * Uploads an attachment file (screenshot, crash log, recording) to the media storage engine.
   * Returns metadata formatted for the feedback ticket's `attachments` array.
   */
  async uploadAttachment(file: File): Promise<FeedbackAttachmentInput> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiClient.post('/media/upload', formData);

    if (!res.data?.success) {
      throw new Error(res.data?.message || 'Failed to upload attachment file');
    }

    const { url, filename, mimetype } = res.data.data;

    return {
      fileUrl: url,
      fileName: filename || file.name,
      fileType: mimetype || file.type || 'application/octet-stream',
      fileSize: file.size,
    };
  },
};
