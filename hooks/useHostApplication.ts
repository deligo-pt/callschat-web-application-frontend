"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useSocket } from "@/components/providers/SocketProvider";
import {
  HostService,
  HostStatusData,
  ApplyHostPayload,
  HostApplicationData,
} from "@/services/host.service";

export interface HostApplicationReviewedSocketPayload {
  applicationId: string;
  status: "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
  reviewedAt?: string;
}

export interface HostStatusUpdatedSocketPayload {
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
  reason?: string | null;
}

export function useHostApplication() {
  const { socket } = useSocket();

  const [statusData, setStatusData] = useState<HostStatusData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches latest application & profile status from backend.
   */
  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await HostService.getStatus();
      if (response && response.success) {
        setStatusData(response.data);
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        "Failed to load host application status.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  /**
   * Real-time Socket.io listener for host review and status updates.
   */
  useEffect(() => {
    if (!socket) return;

    const handleApplicationReviewed = (payload: HostApplicationReviewedSocketPayload) => {
      console.log("[HostApplication] Application reviewed event received:", payload);

      if (payload.status === "APPROVED") {
        toast.success("Congratulations! Your host application has been approved 🎉", {
          description: "You now have creator host privileges to launch live audio rooms.",
          duration: 6000,
        });
      } else if (payload.status === "REJECTED") {
        toast.error("Host Application Update", {
          description: payload.rejectionReason || "Application was reviewed and requires updates.",
          duration: 6000,
        });
      }

      fetchStatus();
    };

    const handleHostStatusUpdated = (payload: HostStatusUpdatedSocketPayload) => {
      console.log("[HostApplication] Host status updated event received:", payload);

      if (payload.status === "ACTIVE") {
        toast.success("Host privileges restored!", {
          description: "Your live hosting permissions are active.",
        });
      } else if (payload.status === "SUSPENDED" || payload.status === "BANNED") {
        toast.warning(`Host status updated: ${payload.status}`, {
          description: payload.reason || "Your hosting privileges have been updated by administrators.",
          duration: 7000,
        });
      }

      fetchStatus();
    };

    socket.on("host:application_reviewed", handleApplicationReviewed);
    socket.on("host:status_updated", handleHostStatusUpdated);

    return () => {
      socket.off("host:application_reviewed", handleApplicationReviewed);
      socket.off("host:status_updated", handleHostStatusUpdated);
    };
  }, [socket, fetchStatus]);

  /**
   * Submits new or re-submitted application.
   */
  const submitApplication = async (payload: ApplyHostPayload): Promise<HostApplicationData> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await HostService.apply(payload);
      if (response?.success) {
        toast.success("Application Submitted!", {
          description: "Your host application has been received and is under review.",
        });
        await fetchStatus();
        return response.data;
      }
      throw new Error(response?.message || "Failed to submit host application");
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        "An error occurred while submitting your application.";
      setError(msg);
      toast.error("Submission Failed", { description: msg });
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    statusData,
    isLoading,
    isSubmitting,
    error,
    refetch: fetchStatus,
    submitApplication,
    isHost: Boolean(statusData?.isHost),
    application: statusData?.application || null,
    hostProfile: statusData?.hostProfile || null,
  };
}
