"use client";

import React, { useState } from "react";
import { Loader2, AlertCircle, RefreshCw, Mic2 } from "lucide-react";
import { useHostApplication } from "@/hooks/useHostApplication";
import { HostLandingHero } from "./HostLandingHero";
import { HostApplicationWizard } from "./HostApplicationWizard";
import { HostPendingCard } from "./HostPendingCard";
import { HostRejectedCard } from "./HostRejectedCard";
import { HostActiveCard } from "./HostActiveCard";
import { ApplyHostPayload } from "@/services/host.service";
import { useRouter } from "next/navigation";

export function HostStatusContainer() {
  const router = useRouter();
  const {
    statusData,
    isLoading,
    isSubmitting,
    error,
    refetch,
    submitApplication,
    isHost,
    application,
    hostProfile,
  } = useHostApplication();

  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSubmitApplication = async (payload: ApplyHostPayload) => {
    await submitApplication(payload);
    setIsApplying(false);
  };

  // 1. Loading State
  if (isLoading && !statusData) {
    return (
      <div className="rounded-3xl bg-white dark:bg-[#111B21] border border-[#E6EAFA] dark:border-[#222D34] shadow-xs p-12 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 text-[#2563EB] animate-spin" />
        <p className="text-xs font-semibold text-[#8F95B2] dark:text-[#8696A0]">
          Loading creator host status...
        </p>
      </div>
    );
  }

  // 2. Error State with retry
  if (error && !statusData) {
    return (
      <div className="rounded-3xl bg-white dark:bg-[#111B21] border border-rose-200 dark:border-rose-900/40 p-8 text-center space-y-4 shadow-xs">
        <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#1D2A54] dark:text-[#E9EDEF]">
            Unable to load host information
          </h3>
          <p className="text-xs text-[#8F95B2] dark:text-[#8696A0] mt-1 max-w-sm mx-auto">
            {error}
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold px-4 py-2 hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  // 3. Approved Active Host
  if (isHost && hostProfile) {
    return (
      <HostActiveCard
        profile={hostProfile}
        onLaunchStudio={() => {
          // Future live room creation trigger or modal
          router.push("/calls");
        }}
      />
    );
  }

  // 4. Form Mode (When user clicked "Apply" or "Edit & Re-apply")
  if (isApplying) {
    return (
      <HostApplicationWizard
        initialData={application}
        onSubmit={handleSubmitApplication}
        onCancel={() => setIsApplying(false)}
        isSubmitting={isSubmitting}
      />
    );
  }

  // 5. Application Pending Review
  if (application?.status === "PENDING") {
    return (
      <HostPendingCard
        application={application}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
    );
  }

  // 6. Application Rejected (Can re-apply)
  if (application?.status === "REJECTED") {
    return (
      <HostRejectedCard
        application={application}
        onReapply={() => setIsApplying(true)}
      />
    );
  }

  // 7. Not Applied (Default Landing Hero)
  return <HostLandingHero onStartApplication={() => setIsApplying(true)} />;
}
