"use client";

import React from "react";
import { AlertCircle, RotateCcw, MessageSquareWarning, ShieldAlert, ArrowRight } from "lucide-react";
import { HostApplicationData } from "@/services/host.service";

interface HostRejectedCardProps {
  application: HostApplicationData;
  onReapply: () => void;
}

export function HostRejectedCard({
  application,
  onReapply,
}: HostRejectedCardProps) {
  const reviewedDate = application.reviewedAt
    ? new Date(application.reviewedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Recently";

  return (
    <div className="rounded-3xl bg-white dark:bg-[#111B21] border border-[#E6EAFA] dark:border-[#222D34] shadow-xs p-6 md:p-8 space-y-6">
      {/* Top Banner */}
      <div className="flex items-start gap-4 pb-6 border-b border-[#F1F5F9] dark:border-[#222D34]">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/50">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#1D2A54] dark:text-[#E9EDEF]">
              Application Needs Revision
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
              REJECTED
            </span>
          </div>
          <p className="text-xs font-medium text-[#8F95B2] dark:text-[#8696A0] mt-1">
            Reviewed on {reviewedDate} • You are eligible to update and re-apply immediately
          </p>
        </div>
      </div>

      {/* Reviewer Feedback Callout */}
      <div className="rounded-2xl bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 p-5 space-y-2">
        <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs uppercase tracking-wider">
          <MessageSquareWarning className="h-4 w-4" />
          Reviewer Notes & Feedback
        </div>
        <p className="text-sm font-medium text-rose-900 dark:text-rose-200 leading-relaxed">
          {application.rejectionReason ||
            "Your application did not meet our live broadcasting criteria. Please review your intro demo, bio, or equipment description and resubmit."}
        </p>
      </div>

      {/* Re-apply CTA */}
      <div className="rounded-2xl bg-[#F8FAFC] dark:bg-[#182229] p-5 border border-[#F1F5F9] dark:border-[#222D34] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-[#1D2A54] dark:text-[#E9EDEF]">
            Ready to improve your application?
          </h4>
          <p className="text-xs text-[#8F95B2] dark:text-[#8696A0]">
            Your previous answers will be pre-filled so you can easily update the requested items.
          </p>
        </div>

        <button
          type="button"
          onClick={onReapply}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 shadow-md transition-all cursor-pointer shrink-0"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Edit & Re-apply</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
