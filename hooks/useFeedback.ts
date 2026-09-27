'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { feedbackService } from '@/services/feedback.service';
import type {
  CreateFeedbackPayload,
  FeedbackItem,
  FeedbackPaginationMeta,
  FeedbackStatus,
  FeedbackType,
  GetFeedbacksQuery,
  UpdateFeedbackPayload,
} from '@/types/feedback.types';

interface ErrorWithResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

/**
 * Extracts browser, device, screen, and runtime telemetry for bug diagnostics.
 */
export function detectDeviceDiagnostics(): string {
  if (typeof window === 'undefined') return 'Environment: Server-side rendering';

  const nav = window.navigator;
  const screen = window.screen;

  const userAgent = nav.userAgent;
  const platform =
    (nav as unknown as { userAgentData?: { platform?: string } })
      .userAgentData?.platform ||
    nav.platform ||
    'Unknown platform';
  const language = nav.language || 'en-US';
  const viewport = `${window.innerWidth}x${window.innerHeight}`;
  const screenResolution = `${screen.width}x${screen.height} (DPR: ${
    window.devicePixelRatio || 1
  })`;
  const onlineStatus = nav.onLine ? 'Online' : 'Offline';

  return [
    `Platform: ${platform}`,
    `User-Agent: ${userAgent}`,
    `Viewport: ${viewport}`,
    `Screen: ${screenResolution}`,
    `Language: ${language}`,
    `Network: ${onlineStatus}`,
    `App: CallsChat Web v0.1.0`,
  ].join('\n');
}

export function useFeedback(
  initialQuery: GetFeedbacksQuery = { page: 1, limit: 20 }
) {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [meta, setMeta] = useState<FeedbackPaginationMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<GetFeedbacksQuery>(initialQuery);

  const fetchFeedbacks = useCallback(
    async (customQuery?: GetFeedbacksQuery) => {
      setLoading(true);
      setError(null);
      try {
        const activeQuery = customQuery || query;
        const data = await feedbackService.getMyFeedbacks(activeQuery);
        setFeedbacks(data.items);
        setMeta(data.meta);
      } catch (err: unknown) {
        const errorObj = err as ErrorWithResponse;
        const msg =
          errorObj.response?.data?.message ||
          errorObj.message ||
          'Failed to load feedback tickets';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [query]
  );

  useEffect(() => {
    let isMounted = true;

    feedbackService
      .getMyFeedbacks(query)
      .then((data) => {
        if (isMounted) {
          setFeedbacks(data.items);
          setMeta(data.meta);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const errorObj = err as ErrorWithResponse;
          const msg =
            errorObj.response?.data?.message ||
            errorObj.message ||
            'Failed to load feedback tickets';
          setError(msg);
          toast.error(msg);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [query]);

  const setStatusFilter = useCallback((status?: FeedbackStatus) => {
    setLoading(true);
    setQuery((prev) => ({ ...prev, status, page: 1 }));
  }, []);

  const setTypeFilter = useCallback((type?: FeedbackType) => {
    setLoading(true);
    setQuery((prev) => ({ ...prev, type, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setLoading(true);
    setQuery((prev) => ({ ...prev, page }));
  }, []);

  const createFeedback = useCallback(
    async (payload: CreateFeedbackPayload): Promise<FeedbackItem> => {
      try {
        const finalPayload: CreateFeedbackPayload = {
          ...payload,
          userDeviceInfo: payload.userDeviceInfo || detectDeviceDiagnostics(),
        };
        const created = await feedbackService.createFeedback(finalPayload);
        toast.success(
          'Feedback submitted successfully! Our team will review it shortly.'
        );
        setFeedbacks((prev) => [created, ...prev]);
        return created;
      } catch (err: unknown) {
        const errorObj = err as ErrorWithResponse;
        const msg =
          errorObj.response?.data?.message ||
          errorObj.message ||
          'Failed to submit feedback';
        toast.error(msg);
        throw err;
      }
    },
    []
  );

  const updateFeedback = useCallback(
    async (
      id: string,
      payload: UpdateFeedbackPayload
    ): Promise<FeedbackItem> => {
      try {
        const updated = await feedbackService.updateMyFeedback(id, payload);
        toast.success('Feedback updated successfully.');
        setFeedbacks((prev) =>
          prev.map((f) => (f.id === id ? { ...f, ...updated } : f))
        );
        return updated;
      } catch (err: unknown) {
        const errorObj = err as ErrorWithResponse;
        const msg =
          errorObj.response?.data?.message ||
          errorObj.message ||
          'Failed to update feedback';
        toast.error(msg);
        throw err;
      }
    },
    []
  );

  const getFeedbackDetails = useCallback(
    async (id: string): Promise<FeedbackItem> => {
      try {
        return await feedbackService.getMyFeedbackDetails(id);
      } catch (err: unknown) {
        const errorObj = err as ErrorWithResponse;
        const msg =
          errorObj.response?.data?.message ||
          errorObj.message ||
          'Failed to fetch ticket details';
        toast.error(msg);
        throw err;
      }
    },
    []
  );

  return {
    feedbacks,
    meta,
    loading,
    error,
    query,
    setStatusFilter,
    setTypeFilter,
    setPage,
    refetch: fetchFeedbacks,
    createFeedback,
    updateFeedback,
    getFeedbackDetails,
    detectDeviceDiagnostics,
  };
}
