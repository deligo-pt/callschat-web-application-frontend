"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  ArrowLeft,
  FileText,
  Check,
  AlertTriangle,
  Building2,
  UserCheck,
  RefreshCw,
  Sparkles,
  ChevronRight,
  ShieldQuestion,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useVerification } from "@/hooks/useVerification";
import { useUser } from "@/context/UserContext";
import { VerificationForm } from "@/components/business/VerificationForm";
import {
  VerificationTargetType,
  VerificationRequestItem,
  VerificationRejectionCode,
} from "@/services/verification.service";

interface VerificationStatusProps {
  className?: string;
  onBack?: () => void;
  /** Verification subject: individual user or business organization */
  targetType?: VerificationTargetType;
}

const REJECTION_DESCRIPTIONS: Record<VerificationRejectionCode | string, string> = {
  BLURRY_DOCUMENT:
    "The submitted document was blurry or unreadable. Please ensure all text, numbers, and edges are crisp and clearly visible in good lighting.",
  EXPIRED_DOCUMENT:
    "The submitted document has passed its expiration date. Please provide a currently valid, active identification or trade license.",
  NAME_MISMATCH:
    "The legal name on your identification does not match your registered account name.",
  INVALID_DOCUMENT:
    "The document submitted is not recognized as an official government or corporate compliance document.",
  INCOMPLETE_DOCUMENT:
    "The document is missing pages or important sections are obscured.",
  OTHER:
    "The submission did not satisfy compliance guidelines. Please review our verification standards and resubmit.",
};

const REJECTION_LABELS: Record<VerificationRejectionCode | string, string> = {
  BLURRY_DOCUMENT: "Image Quality / Blur Detected",
  EXPIRED_DOCUMENT: "Document Expired",
  NAME_MISMATCH: "Name Discrepancy",
  INVALID_DOCUMENT: "Unaccepted Document Type",
  INCOMPLETE_DOCUMENT: "Incomplete / Cutoff Document",
  OTHER: "Compliance Requirements Not Met",
};

export function VerificationStatus({
  className,
  onBack,
  targetType = "BUSINESS_ENTITY",
}: VerificationStatusProps) {
  const { user, businessProfile, refetchUser, refetchBusinessProfile } = useUser();
  const {
    userKyc,
    businessKyb,
    isLoading: isVerificationLoading,
    refetch: refetchVerification,
  } = useVerification();

  const isUserIdentity = targetType === "USER_IDENTITY";
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"submit" | "update">("submit");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Active verification item matching targetType
  const activeRequest: VerificationRequestItem | null = isUserIdentity
    ? userKyc
    : businessKyb;

  // Determine current verification status
  const isApproved =
    activeRequest?.status === "APPROVED" ||
    (isUserIdentity ? Boolean((user as any)?.isVerified) : Boolean(businessProfile?.isVerified));

  const isPending =
    activeRequest?.status === "PENDING" || activeRequest?.status === "PENDING_REVIEW";

  const isRejected = activeRequest?.status === "REJECTED";
  const isRevoked = activeRequest?.status === "REVOKED";
  const isUnverified = !isApproved && !isPending && !isRejected && !isRevoked;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchVerification();
      if (isUserIdentity) {
        await refetchUser().catch(() => {});
      } else {
        await refetchBusinessProfile().catch(() => {});
      }
      toast.success("Verification status refreshed");
    } catch {
      toast.error("Failed to refresh verification status");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenForm = (mode: "submit" | "update") => {
    setFormMode(mode);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    handleRefresh();
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "N/A";
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  if (isVerificationLoading && !activeRequest) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
        <Loader2 className="h-9 w-9 animate-spin text-[#2563EB] dark:text-[#38BDF8] mb-4" />
        <h4 className="text-base font-bold text-[#1D2A54] dark:text-[#E9EDEF]">Checking Verification Status</h4>
        <p className="text-xs text-[#8F95B2] dark:text-[#8696A0] mt-1">Retrieving latest compliance credentials...</p>
      </div>
    );
  }

  // If in Form View (Submission / Update)
  if (showForm) {
    return (
      <div className={cn("space-y-4 max-w-2xl mx-auto w-full", className)}>
        <VerificationForm
          targetType={targetType}
          mode={formMode}
          requestId={activeRequest?.id}
          initialIdType={activeRequest?.idType || undefined}
          onSuccess={handleFormSuccess}
          onCancel={() => setShowForm(false)}
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6 max-w-3xl mx-auto w-full", className)}>
      {/* Top Bar with Refresh & Context */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-[#F4F6FC] dark:border-[#222D34]">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-full p-2 bg-white dark:bg-[#111B21] border border-[#E6EAFA] dark:border-[#222D34] hover:bg-gray-50 dark:hover:bg-[#202C33] transition-colors shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 text-[#1D2A54] dark:text-[#E9EDEF]" />
            </button>
          )}
          <div>
            <h2 className="text-lg font-extrabold text-[#1D2A54] dark:text-[#E9EDEF] flex items-center gap-2">
              {isUserIdentity ? (
                <>
                  <UserCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Personal Identity Verification
                </>
              ) : (
                <>
                  <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Business Entity Verification
                </>
              )}
            </h2>
            <p className="text-xs text-[#8F95B2] dark:text-[#8696A0]">
              {isUserIdentity
                ? "Identity authentication for verified user checkmark and trust badge"
                : "Official compliance and credentials for your commercial business account"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E6EAFA] dark:border-[#222D34] bg-white dark:bg-[#111B21] text-xs font-semibold text-[#1D2A54] dark:text-[#E9EDEF] hover:bg-gray-50 dark:hover:bg-[#202C33] transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
          title="Refresh Status"
        >
          <RefreshCw className={cn("h-3.5 w-3.5 text-[#8F95B2] dark:text-[#8696A0]", isRefreshing && "animate-spin")} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 1. APPROVED STATE */}
      {/* --------------------------------------------------------------------- */}
      {isApproved && (
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-3xl border border-emerald-200/80 dark:border-emerald-800/40 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/50 dark:from-emerald-950/30 dark:via-[#111B21] dark:to-emerald-950/20 p-6 md:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/25">
                  <ShieldCheck className="h-8 w-8" strokeWidth={2.5} />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 px-3 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-2">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    Official Verified Status
                  </div>
                  <h3 className="text-xl font-extrabold text-[#1D2A54] dark:text-[#E9EDEF]">
                    {isUserIdentity
                      ? user?.profile?.displayName || user?.phone || "Verified Identity"
                      : businessProfile?.companyName || "Verified Enterprise"}
                  </h3>
                  <p className="mt-1 text-xs md:text-sm text-[#546285] dark:text-[#8696A0] max-w-lg leading-relaxed">
                    Your verification application has been thoroughly reviewed and officially approved by our compliance department.
                    Your verified badge is actively displayed on your calls and profile.
                  </p>
                </div>
              </div>
            </div>

            {/* Approved Details Pill Box */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-emerald-100 dark:border-emerald-900/40">
              <div className="rounded-2xl bg-white/80 dark:bg-[#202C33] p-3.5 border border-emerald-100 dark:border-[#2A3942] shadow-2xs">
                <span className="text-[11px] font-bold text-gray-400 dark:text-[#8696A0] uppercase tracking-wider block">Target Subject</span>
                <span className="text-xs font-bold text-[#1D2A54] dark:text-[#E9EDEF] mt-0.5 block">
                  {isUserIdentity ? "Individual (KYC)" : "Business Entity (KYB)"}
                </span>
              </div>
              <div className="rounded-2xl bg-white/80 dark:bg-[#202C33] p-3.5 border border-emerald-100 dark:border-[#2A3942] shadow-2xs">
                <span className="text-[11px] font-bold text-gray-400 dark:text-[#8696A0] uppercase tracking-wider block">Document Type</span>
                <span className="text-xs font-bold text-[#1D2A54] dark:text-[#E9EDEF] mt-0.5 block">
                  {activeRequest?.idType || "Government / Legal Document"}
                </span>
              </div>
              <div className="rounded-2xl bg-white/80 dark:bg-[#202C33] p-3.5 border border-emerald-100 dark:border-[#2A3942] shadow-2xs">
                <span className="text-[11px] font-bold text-gray-400 dark:text-[#8696A0] uppercase tracking-wider block">Approval Date</span>
                <span className="text-xs font-bold text-[#1D2A54] dark:text-[#E9EDEF] mt-0.5 block">
                  {formatDate(activeRequest?.reviewedAt || activeRequest?.submittedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 2. PENDING REVIEW STATE */}
      {/* --------------------------------------------------------------------- */}
      {isPending && (
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-3xl border border-amber-200/80 dark:border-amber-800/40 bg-gradient-to-br from-amber-50/90 via-white to-amber-50/40 dark:from-amber-950/30 dark:via-[#111B21] dark:to-amber-950/20 p-6 md:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/25">
                  <Clock className="h-8 w-8 animate-pulse" strokeWidth={2.5} />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-600"></span>
                  </span>
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/50 px-3 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-300 mb-2">
                    <Clock className="h-3 w-3" />
                    Application Under Review
                  </div>
                  <h3 className="text-xl font-extrabold text-[#1D2A54] dark:text-[#E9EDEF]">Compliance Review in Progress</h3>
                  <p className="mt-1 text-xs md:text-sm text-[#546285] dark:text-[#8696A0] max-w-lg leading-relaxed">
                    Our compliance team is securely inspecting your submitted documents. Verification decisions are typically
                    completed within <strong>24 to 48 hours</strong>.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenForm("update")}
                className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 rounded-2xl bg-white dark:bg-[#202C33] px-5 py-3 text-xs font-bold text-[#1D2A54] dark:text-[#E9EDEF] border border-amber-200 dark:border-amber-700/50 shadow-sm hover:bg-amber-50/80 dark:hover:bg-[#2A3942] transition-all cursor-pointer"
              >
                <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                Update / Replace Documents
              </button>
            </div>

            {/* Submission Metadata */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-amber-100 dark:border-amber-900/40">
              <div className="rounded-2xl bg-white/80 dark:bg-[#202C33] p-3.5 border border-amber-100 dark:border-[#2A3942] shadow-2xs">
                <span className="text-[11px] font-bold text-gray-400 dark:text-[#8696A0] uppercase tracking-wider block">Submitted On</span>
                <span className="text-xs font-bold text-[#1D2A54] dark:text-[#E9EDEF] mt-0.5 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-amber-500" />
                  {formatDate(activeRequest?.submittedAt)}
                </span>
              </div>
              <div className="rounded-2xl bg-white/80 dark:bg-[#202C33] p-3.5 border border-amber-100 dark:border-[#2A3942] shadow-2xs">
                <span className="text-[11px] font-bold text-gray-400 dark:text-[#8696A0] uppercase tracking-wider block">Document Type</span>
                <span className="text-xs font-bold text-[#1D2A54] dark:text-[#E9EDEF] mt-0.5 block">
                  {activeRequest?.idType || "Pending Classification"}
                </span>
              </div>
              <div className="rounded-2xl bg-white/80 dark:bg-[#202C33] p-3.5 border border-amber-100 dark:border-[#2A3942] shadow-2xs">
                <span className="text-[11px] font-bold text-gray-400 dark:text-[#8696A0] uppercase tracking-wider block">Encryption Vault</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  AES-256-GCM Secured
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 3. REJECTED STATE */}
      {/* --------------------------------------------------------------------- */}
      {isRejected && (
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-3xl border border-rose-200 dark:border-rose-800/40 bg-gradient-to-br from-rose-50/90 via-white to-rose-50/40 dark:from-rose-950/30 dark:via-[#111B21] dark:to-rose-950/20 p-6 md:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-600/25">
                  <ShieldAlert className="h-8 w-8" strokeWidth={2.5} />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 dark:bg-rose-950/50 px-3 py-0.5 text-xs font-bold text-rose-800 dark:text-rose-300 mb-2">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Application Rejected
                  </div>
                  <h3 className="text-xl font-extrabold text-[#1D2A54] dark:text-[#E9EDEF]">
                    Verification Requires Correction
                  </h3>
                  <p className="mt-1 text-xs md:text-sm text-[#546285] dark:text-[#8696A0] max-w-lg leading-relaxed">
                    Our compliance department reviewed your submission and identified issues that need to be resolved.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenForm("update")}
                className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-700 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-rose-600/25 transition-all active:scale-[0.98] cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                Resubmit Verification Now
              </button>
            </div>

            {/* Rejection Specific Details */}
            <div className="mt-6 rounded-2xl bg-white dark:bg-[#202C33] border border-rose-200 dark:border-rose-900/40 p-5 shadow-2xs space-y-3">
              <div className="flex items-start gap-3">
                <ShieldQuestion className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-950 dark:text-rose-300 uppercase tracking-wider">Reason:</span>
                    <span className="inline-block rounded-md bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 text-[11px] font-extrabold text-rose-800 dark:text-rose-300">
                      {REJECTION_LABELS[activeRequest?.rejectionCode || "OTHER"] || activeRequest?.rejectionCode}
                    </span>
                  </div>
                  <p className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed font-medium">
                    {activeRequest?.rejectionReason ||
                      REJECTION_DESCRIPTIONS[activeRequest?.rejectionCode || "OTHER"] ||
                      "Your documents did not meet our verification requirements. Please upload a clear and valid document."}
                  </p>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="mt-4 flex items-center justify-between text-[11px] text-[#8F95B2] dark:text-[#8696A0] px-1">
              <span>Reviewed on: {formatDate(activeRequest?.reviewedAt)}</span>
              <span>Submission ID: {activeRequest?.id ? `${activeRequest.id.substring(0, 12)}...` : "N/A"}</span>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 4. UNVERIFIED / NOT SUBMITTED STATE */}
      {/* --------------------------------------------------------------------- */}
      {isUnverified && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#E6EAFA] dark:border-[#222D34] bg-white dark:bg-[#111B21] p-6 md:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pb-6 border-b border-[#F4F6FC] dark:border-[#222D34]">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-500/25">
                  <Sparkles className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-extrabold text-[#1D2A54] dark:text-[#E9EDEF]">
                    {isUserIdentity
                      ? "Get Your Account Verified"
                      : "Elevate Your Business with Verified Enterprise Status"}
                  </h3>
                  <p className="mt-1 text-xs md:text-sm text-[#8F95B2] dark:text-[#8696A0] max-w-xl leading-relaxed">
                    {isUserIdentity
                      ? "Complete a fast, confidential identity check with a government-issued photo ID to receive an official verified badge across all your calls and chats."
                      : "Register your enterprise credentials to unlock verified caller badges, official enterprise trust labels, and direct client communications."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenForm("submit")}
                className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 rounded-2xl bg-[#8B5CF6] hover:bg-[#7C3AED] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>Start Verification</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Benefits List */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-[#F8FAFC] dark:bg-[#202C33] border border-[#E6EAFA] dark:border-[#2A3942] p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/40 text-[#8B5CF6] dark:text-purple-300 mb-3">
                  <ShieldCheck className="h-4 w-4" strokeWidth={2.5} />
                </div>
                <h4 className="text-xs font-bold text-[#1D2A54] dark:text-[#E9EDEF]">Official Verified Badge</h4>
                <p className="mt-1 text-[11px] text-[#8F95B2] dark:text-[#8696A0] leading-relaxed">
                  Display an authentic badge next to your name and organization across the platform.
                </p>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] dark:bg-[#202C33] border border-[#E6EAFA] dark:border-[#2A3942] p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 mb-3">
                  <UserCheck className="h-4 w-4" strokeWidth={2.5} />
                </div>
                <h4 className="text-xs font-bold text-[#1D2A54] dark:text-[#E9EDEF]">Higher Caller Trust</h4>
                <p className="mt-1 text-[11px] text-[#8F95B2] dark:text-[#8696A0] leading-relaxed">
                  Prevent impersonation and reassure clients and contacts that you represent a legitimate entity.
                </p>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] dark:bg-[#202C33] border border-[#E6EAFA] dark:border-[#2A3942] p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 mb-3">
                  <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
                </div>
                <h4 className="text-xs font-bold text-[#1D2A54] dark:text-[#E9EDEF]">Military-Grade Privacy</h4>
                <p className="mt-1 text-[11px] text-[#8F95B2] dark:text-[#8696A0] leading-relaxed">
                  Your files are stored in an encrypted vault (AES-256-GCM) with strict regulatory isolation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VerificationStatus;
