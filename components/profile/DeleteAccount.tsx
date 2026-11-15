"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  ArrowLeft, 
  Trash2, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  Loader2, 
  Undo2, 
  Lock, 
  EyeOff, 
  Calendar,
  Smartphone,
  BellOff,
  PauseCircle,
  MessageSquare,
  ShieldCheck,
  UserCircle2,
  Check
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { UserService, AccountDeletionStatus } from "@/services/user.service";
import { useUser } from "@/context/UserContext";

interface DeleteAccountProps {
  onBack?: () => void;
}

interface ReasonOption {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DEPARTURE_REASONS: ReasonOption[] = [
  {
    id: "switching",
    label: "Switching to another app",
    description: "Moving to another messaging or communications platform",
    icon: Smartphone,
  },
  {
    id: "privacy",
    label: "Privacy or security concerns",
    description: "I want to minimize my digital footprint or data sharing",
    icon: ShieldAlert,
  },
  {
    id: "notifications",
    label: "Too many notifications",
    description: "The volume of alerts or incoming messages is overwhelming",
    icon: BellOff,
  },
  {
    id: "break",
    label: "Taking a temporary break",
    description: "Stepping away from messaging for personal reasons",
    icon: PauseCircle,
  },
  {
    id: "other",
    label: "Other reason",
    description: "I have a different reason or specific feedback to share",
    icon: MessageSquare,
  },
];

export function DeleteAccount({ onBack }: DeleteAccountProps) {
  const router = useRouter();
  const { user, currentMode } = useUser();
  const [loading, setLoading] = useState(true);
  const [deletionStatus, setDeletionStatus] = useState<AccountDeletionStatus | null>(null);

  // Form states
  const [selectedReasonId, setSelectedReasonId] = useState<string>("switching");
  const [customFeedback, setCustomFeedback] = useState("");
  const [isAcknowledgeChecked, setIsAcknowledgeChecked] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Fetch deletion status on mount
  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await UserService.getAccountDeletionStatus();
      if (res?.success && res.data) {
        setDeletionStatus(res.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch account deletion status:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Teardown local credentials and redirect to login
  const cleanupAndRedirect = (message: string) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("currentMode");
      sessionStorage.removeItem("auth_account_mode");
      document.cookie = "accessToken=; path=/; max-age=0";
      document.cookie = "refreshToken=; path=/; max-age=0";

      const encodedMessage = encodeURIComponent(message);
      window.location.href = `/login?reason=session_revoked&message=${encodedMessage}`;
    }
  };

  // Submit deletion request
  const handleScheduleDeletion = async () => {
    if (!isAcknowledgeChecked || confirmInput.trim().toUpperCase() !== "DELETE") {
      toast.error("Please complete the acknowledgment and type DELETE to confirm.");
      return;
    }

    try {
      setIsSubmitting(true);
      const chosenReasonObj = DEPARTURE_REASONS.find(r => r.id === selectedReasonId);
      const reasonLabel = chosenReasonObj?.label || selectedReasonId;
      const combinedReason = selectedReasonId === "other"
        ? (customFeedback.trim() || "Other reason")
        : `${reasonLabel}${customFeedback ? `: ${customFeedback}` : ""}`;

      const res = await UserService.deleteAccount({
        reason: combinedReason.trim(),
        confirmation: "DELETE",
      });

      if (res?.success) {
        toast.success("Account scheduled for deletion. You have 30 days to cancel this request.");
        setShowConfirmModal(false);
        cleanupAndRedirect(
          "Your account has been scheduled for deletion and will be permanently removed in 30 days. You can log in anytime before then to cancel this request and reactivate your account."
        );
      }
    } catch (err: any) {
      console.error("Account deletion request failed:", err);
      toast.error(err?.response?.data?.message || "Failed to schedule account deletion. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reactivate account if already scheduled
  const handleReactivateAccount = async () => {
    try {
      setIsReactivating(true);
      const res = await UserService.reactivateAccount();
      if (res?.success) {
        toast.success("Your account has been successfully reactivated! Welcome back.");
        await fetchStatus();
      }
    } catch (err: any) {
      console.error("Reactivation failed:", err);
      toast.error(err?.response?.data?.message || "Failed to reactivate account. Please try again.");
    } finally {
      setIsReactivating(false);
    }
  };

  const isConfirmed = isAcknowledgeChecked && confirmInput.trim().toUpperCase() === "DELETE";

  const maskedPhone = useMemo(() => {
    if (!user?.phone) return null;
    const len = user.phone.length;
    if (len < 6) return user.phone;
    return `${user.phone.slice(0, 3)} ••• ••• ${user.phone.slice(-3)}`;
  }, [user?.phone]);

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white dark:bg-[#111B21]">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563EB] dark:text-[#38BDF8]" />
        <p className="mt-3 text-[13px] font-medium text-slate-500 dark:text-[#8696A0]">Verifying account status...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#F8FAFC] dark:bg-[#0C1317] relative overflow-hidden">
      {/* Sleek Enterprise Top Header */}
      <div className="border-b border-slate-200 dark:border-[#222D34] bg-white dark:bg-[#111B21] px-6 py-4.5 shrink-0 shadow-xs">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack ? onBack : () => router.push("/profile/edit")}
              aria-label="Go back"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-[#2A3942] bg-slate-50 dark:bg-[#182229] text-slate-600 dark:text-[#8696A0] hover:bg-slate-100 dark:hover:bg-[#202C33] transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[17px] font-bold text-[#0F172A] dark:text-[#E9EDEF] tracking-tight">
                  Delete Account
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/80 dark:border-red-900/60">
                  Danger Zone
                </span>
              </div>
              <p className="text-[12px] font-medium text-slate-500 dark:text-[#8696A0] mt-0.5">
                Deactivate and schedule permanent removal with a 30-day recovery window
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-8 scrollbar-hide">
        <div className="mx-auto max-w-[620px] flex flex-col gap-6 pb-16">

          {/* CASE 1: Account is already SCHEDULED_FOR_DELETION */}
          {deletionStatus?.isScheduledForDeletion ? (
            <div className="flex flex-col gap-5">
              <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/20 p-6 shadow-xs">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-sm">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-[16px] font-bold text-amber-950 dark:text-amber-200">
                        Account Scheduled for Deletion
                      </h3>
                      {deletionStatus.daysRemaining !== null && (
                        <span className="rounded-full bg-amber-200 dark:bg-amber-900/60 px-3 py-0.5 text-[11px] font-bold text-amber-900 dark:text-amber-100">
                          {deletionStatus.daysRemaining} days remaining
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-[13px] font-medium leading-relaxed text-amber-900/90 dark:text-amber-200/90">
                      Your account is currently in a 30-day grace period. Active sessions have been logged out and your profile is hidden from search and contacts.
                    </p>
                    {deletionStatus.deletionScheduledAt && (
                      <div className="mt-3.5 flex items-center gap-2 rounded-xl bg-white/70 dark:bg-[#182229]/60 px-3.5 py-2.5 text-[13px] font-bold text-amber-950 dark:text-amber-100 border border-amber-200/60 dark:border-amber-900/40">
                        <Calendar className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0" />
                        <span>Permanent Purge: {new Date(deletionStatus.deletionScheduledAt).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-[#222D34] bg-white dark:bg-[#111B21] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-[14px] font-bold text-[#0F172A] dark:text-[#E9EDEF]">
                    Changed your mind?
                  </h4>
                  <p className="mt-1 text-[13px] text-slate-500 dark:text-[#8696A0] leading-relaxed max-w-md">
                    You can immediately cancel the deletion request. Your account will return to active status and all chats and contacts will remain preserved.
                  </p>
                </div>
                <button
                  onClick={handleReactivateAccount}
                  disabled={isReactivating}
                  className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-5 text-[13px] font-bold text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isReactivating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Undo2 className="h-4 w-4" />
                  )}
                  Keep Account Active
                </button>
              </div>
            </div>
          ) : (
            /* CASE 2: Active Account - Enterprise Deletion Flow */
            <div className="flex flex-col gap-6">

              {/* Account Identity Preview Card */}
              {user && (
                <div className="rounded-2xl border border-slate-200 dark:border-[#222D34] bg-white dark:bg-[#111B21] p-4.5 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#EEF2FF] dark:bg-[#202C33] border border-slate-200 dark:border-[#2A3942]">
                      {user.profile?.avatarUrl ? (
                        <img src={user.profile.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <UserCircle2 className="h-6 w-6 text-slate-400 dark:text-[#8696A0]" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[14px] font-bold text-[#0F172A] dark:text-[#E9EDEF]">
                          {user.profile?.displayName || "CallsChat User"}
                        </span>
                        {user.isVerified && (
                          <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#2563EB] text-white">
                            <Check className="h-2 w-2" strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <span className="text-[12px] font-medium text-slate-500 dark:text-[#8696A0]">
                        {user.profile?.username ? `@${user.profile.username}` : maskedPhone}
                      </span>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-100 dark:bg-[#202C33] px-3 py-1 text-[11px] font-bold text-slate-600 dark:text-[#8696A0]">
                    {currentMode === "BUSINESS" ? "Business Account" : "Personal Account"}
                  </span>
                </div>
              )}

              {/* Visual 30-Day Policy Timeline */}
              <div className="rounded-2xl border border-slate-200 dark:border-[#222D34] bg-white dark:bg-[#111B21] p-6 shadow-xs">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-[13px] font-bold text-slate-800 dark:text-[#E9EDEF] uppercase tracking-wider">
                    How Account Deletion Works
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-[#8696A0]">
                    30-Day Policy
                  </span>
                </div>

                <div className="relative flex flex-col gap-6 pl-4 border-l-2 border-blue-500/20 dark:border-blue-500/30 ml-3">
                  {/* Step 1: Immediate */}
                  <div className="relative flex items-start gap-4">
                    <div className="absolute -left-[23px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 ring-4 ring-white dark:ring-[#111B21]">
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-[#0F172A] dark:text-[#E9EDEF]">
                          Day 0: Immediate Sign-Out
                        </span>
                        <span className="rounded-md bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-[#38BDF8]">
                          Instant
                        </span>
                      </div>
                      <p className="text-[12px] text-slate-500 dark:text-[#8696A0] mt-1 leading-relaxed">
                        All sessions on your mobile devices, web tabs, and desktop apps are terminated immediately. Your profile and presence are hidden from contacts and search.
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Grace period */}
                  <div className="relative flex items-start gap-4">
                    <div className="absolute -left-[23px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 ring-4 ring-white dark:ring-[#111B21]">
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-[#0F172A] dark:text-[#E9EDEF]">
                          Days 1–30: Reversible Grace Period
                        </span>
                        <span className="rounded-md bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                          Reversible
                        </span>
                      </div>
                      <p className="text-[12px] text-slate-500 dark:text-[#8696A0] mt-1 leading-relaxed">
                        Your account is safely held in recovery mode. If you change your mind, simply log in before the 30 days end to automatically cancel deletion and restore your profile.
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Permanent purge */}
                  <div className="relative flex items-start gap-4">
                    <div className="absolute -left-[23px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 ring-4 ring-white dark:ring-[#111B21]">
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-[#0F172A] dark:text-[#E9EDEF]">
                          Day 30+: Permanent Purge
                        </span>
                        <span className="rounded-md bg-red-50 dark:bg-red-950/40 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:text-red-400">
                          Irreversible
                        </span>
                      </div>
                      <p className="text-[12px] text-slate-500 dark:text-[#8696A0] mt-1 leading-relaxed">
                        After 30 days, your account data, conversations, contacts, and personal information are permanently and irreversibly purged from our servers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Departure Reason Tiles */}
              <div className="rounded-2xl border border-slate-200 dark:border-[#222D34] bg-white dark:bg-[#111B21] p-6 shadow-xs flex flex-col gap-4">
                <div className="flex flex-col">
                  <h3 className="text-[14px] font-bold text-[#0F172A] dark:text-[#E9EDEF]">
                    Why are you requesting account deletion?
                  </h3>
                  <p className="text-[12px] text-slate-500 dark:text-[#8696A0] mt-0.5">
                    Your feedback helps us understand how we can make CallsChat better.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2.5 pt-1">
                  {DEPARTURE_REASONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedReasonId === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedReasonId(option.id)}
                        className={cn(
                          "flex items-center justify-between rounded-xl border p-3.5 text-left transition-all cursor-pointer",
                          isSelected
                            ? "border-blue-500 bg-blue-50/50 dark:border-[#2563EB] dark:bg-[#2563EB]/15 shadow-xs"
                            : "border-slate-200 dark:border-[#2A3942] bg-[#F8FAFC] dark:bg-[#182229] hover:bg-slate-100/70 dark:hover:bg-[#202C33]"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                            isSelected 
                              ? "bg-blue-600 text-white shadow-xs" 
                              : "bg-slate-200/80 dark:bg-[#202C33] text-slate-600 dark:text-[#8696A0]"
                          )}>
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <div className="flex flex-col">
                            <span className={cn(
                              "text-[13px] font-bold",
                              isSelected ? "text-blue-900 dark:text-[#38BDF8]" : "text-[#0F172A] dark:text-[#E9EDEF]"
                            )}>
                              {option.label}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-[#8696A0] mt-0.5">
                              {option.description}
                            </span>
                          </div>
                        </div>

                        <div className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
                          isSelected 
                            ? "border-blue-600 bg-blue-600 text-white" 
                            : "border-slate-300 dark:border-[#384248] bg-transparent"
                        )}>
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Additional Feedback Textarea */}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-[#222D34]">
                  <label className="text-[12px] font-bold text-slate-700 dark:text-[#8696A0]">
                    Additional Feedback or Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={customFeedback}
                    onChange={(e) => setCustomFeedback(e.target.value.slice(0, 500))}
                    placeholder="Tell us what we could have done differently..."
                    className="w-full rounded-xl border border-slate-200 dark:border-[#2A3942] bg-[#F8FAFC] dark:bg-[#182229] p-3 text-[13px] font-medium text-[#0F172A] dark:text-[#E9EDEF] placeholder:text-slate-400 dark:placeholder:text-[#8696A0] focus:border-blue-500 focus:bg-white dark:focus:bg-[#182229] focus:outline-none transition-all resize-none"
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-400 dark:text-[#8696A0]">
                    <span>Never share passwords or payment details here.</span>
                    <span>{customFeedback.length}/500</span>
                  </div>
                </div>
              </div>

              {/* Guardrails / Confirmation Box */}
              <div className="rounded-2xl border border-red-200 dark:border-red-950/60 bg-red-50/50 dark:bg-red-950/20 p-5 flex flex-col gap-4.5">
                <label className="flex items-start gap-3.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAcknowledgeChecked}
                    onChange={(e) => setIsAcknowledgeChecked(e.target.checked)}
                    className="mt-1 h-4.5 w-4.5 rounded border-red-300 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-red-950 dark:text-red-200 leading-snug">
                      I understand the deletion terms
                    </span>
                    <span className="text-[12px] text-red-900/80 dark:text-red-300/80 mt-0.5 leading-relaxed">
                      All sessions will be closed immediately, and after 30 days my account, messages, and media will be permanently and irreversibly purged.
                    </span>
                  </div>
                </label>

                <div className="flex flex-col gap-2 pt-3 border-t border-red-200/60 dark:border-red-950/40">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-bold text-red-950 dark:text-red-200">
                      Type <span className="font-extrabold underline tracking-wider">DELETE</span> to confirm:
                    </label>
                    {confirmInput.trim().toUpperCase() === "DELETE" && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Matched
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={confirmInput}
                    onChange={(e) => setConfirmInput(e.target.value)}
                    placeholder="DELETE"
                    className="h-11 w-full rounded-xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-[#182229] px-3.5 text-[13px] font-bold tracking-wider text-red-600 dark:text-red-400 uppercase placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:border-red-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onBack ? onBack : () => router.push("/profile/edit")}
                  className="w-full sm:w-auto h-11 px-5 rounded-xl border border-slate-200 dark:border-[#2A3942] bg-white dark:bg-[#182229] text-[13px] font-bold text-slate-700 dark:text-[#E9EDEF] hover:bg-slate-50 dark:hover:bg-[#202C33] transition-colors cursor-pointer"
                >
                  Keep My Account
                </button>

                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={!isConfirmed || isSubmitting}
                  className={cn(
                    "w-full sm:w-auto h-11 px-6 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-2",
                    isConfirmed && !isSubmitting
                      ? "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 cursor-pointer"
                      : "bg-slate-200 dark:bg-[#202C33] text-slate-400 dark:text-slate-600 cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Schedule Account Deletion
                </button>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Final Safety Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-[420px] rounded-2xl border border-slate-200 dark:border-[#222D34] bg-white dark:bg-[#111B21] p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="flex flex-col gap-1.5">
              <h3 className="text-[17px] font-bold text-[#0F172A] dark:text-[#E9EDEF]">
                Are you absolutely sure?
              </h3>
              <p className="text-[13px] text-slate-500 dark:text-[#8696A0] leading-relaxed">
                Your account will be logged out everywhere immediately and scheduled for permanent deletion in 30 days. You can reactivate anytime during the 30 days simply by logging back in.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="h-10 px-4 rounded-xl border border-slate-200 dark:border-[#2A3942] bg-white dark:bg-[#182229] text-[13px] font-bold text-slate-700 dark:text-[#E9EDEF] hover:bg-slate-50 dark:hover:bg-[#202C33] transition-colors cursor-pointer"
              >
                Never mind
              </button>

              <button
                type="button"
                onClick={handleScheduleDeletion}
                disabled={isSubmitting}
                className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-[13px] font-bold text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, Schedule Deletion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
