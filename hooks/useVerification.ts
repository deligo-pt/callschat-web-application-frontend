"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useSocket } from "@/components/providers/SocketProvider";
import { useUser } from "@/context/UserContext";
import VerificationService, {
  MyVerificationStatusData,
  VerificationRequestItem,
  VerificationTargetType,
} from "@/services/verification.service";

export interface StatusChangedSocketPayload {
  requestId: string;
  targetType: VerificationTargetType;
  status: "APPROVED" | "REJECTED";
  rejectionCode?: string | null;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
}

export function useVerification(targetType?: VerificationTargetType) {
  const { socket } = useSocket();
  const { refetchUser, refetchBusinessProfile } = useUser();

  const [statusData, setStatusData] = useState<MyVerificationStatusData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await VerificationService.getMyStatus();
      if (response && response.success) {
        setStatusData(response.data);
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to load verification status.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Real-time Socket.io listener for status changes
  useEffect(() => {
    if (!socket) return;

    const handleStatusChanged = (payload: StatusChangedSocketPayload) => {
      console.log("[Verification] Status changed event received:", payload);

      if (payload.status === "APPROVED") {
        const isBiz = payload.targetType === "BUSINESS_ENTITY";
        toast.success(
          isBiz ? "Business Account Verified!" : "Identity Verified!",
          {
            description: isBiz
              ? "Your business verification has been approved. Verified badges and features are now active."
              : "Your identity verification has been approved.",
          }
        );
        refetchUser().catch(() => {});
        refetchBusinessProfile().catch(() => {});
      } else if (payload.status === "REJECTED") {
        toast.error("Verification Declined", {
          description:
            payload.rejectionReason ||
            "Your verification documents were declined. You can resubmit corrected documents.",
        });
      }

      // Refresh verification data to reflect latest audit logs and status
      fetchStatus();
    };

    socket.on("verification:status_changed", handleStatusChanged);

    return () => {
      socket.off("verification:status_changed", handleStatusChanged);
    };
  }, [socket, fetchStatus, refetchUser, refetchBusinessProfile]);

  // Submit new verification
  const submitVerification = async (formData: FormData): Promise<VerificationRequestItem> => {
    setIsSubmitting(true);
    try {
      const res = await VerificationService.submit(formData);
      if (!res.success) {
        throw new Error(res.message || "Failed to submit verification.");
      }
      toast.success(res.message || "Verification submitted successfully.");
      await fetchStatus();
      return res.data;
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to submit verification.";
      toast.error(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update or resubmit existing verification
  const updateVerification = async (formData: FormData): Promise<VerificationRequestItem> => {
    setIsSubmitting(true);
    try {
      const res = await VerificationService.update(formData);
      if (!res.success) {
        throw new Error(res.message || "Failed to update verification.");
      }
      toast.success(res.message || "Verification documents updated successfully.");
      await fetchStatus();
      return res.data;
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to update verification.";
      toast.error(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convenience selectors
  const activeItem: VerificationRequestItem | null =
    targetType === "BUSINESS_ENTITY"
      ? statusData?.businessKyb ?? null
      : targetType === "USER_IDENTITY"
      ? statusData?.userKyc ?? null
      : null;

  return {
    statusData,
    userKyc: statusData?.userKyc ?? null,
    businessKyb: statusData?.businessKyb ?? null,
    history: statusData?.history ?? [],
    activeItem,
    isLoading,
    isSubmitting,
    error,
    refetch: fetchStatus,
    submit: submitVerification,
    update: updateVerification,
  };
}

export default useVerification;
