"use client";

import React from "react";
import { Clock, RefreshCw, Radio, Sparkles, CheckCircle2, FileVideo } from "lucide-react";
import { HostApplicationData } from "@/services/host.service";
import { cn } from "@/lib/utils";

interface HostPendingCardProps {
  application: HostApplicationData;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const NICHE_LABELS: Record<string, string> = {
  TECH: "💻 Technology & Coding",
  MUSIC: "🎵 Music & Live Audio",
  TALK: "🎙️ Talk Shows & Podcasts",
  BUSINESS: "💼 Business & Career",
  ENTERTAINMENT: "🎉 Comedy & Entertainment",
};

export function HostPendingCard({
  application,
  onRefresh,
  isRefreshing = false,
}: HostPendingCardProps) {
  const formattedDate = application.createdAt
    ? new Date(application.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Recently";

  return (
    <div className="rounded-3xl bg-white dark:bg-[#111B21] border border-[#E6EAFA] dark:border-[#222D34] shadow-xs p-6 md:p-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#F1F5F9] dark:border-[#222D34]">
        <div className="flex items-start gap-4">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40">
            <Clock className="h-6 w-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500">
              <span className="h-2 w-2 rounded-full bg-white animate-ping" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#1D2A54] dark:text-[#E9EDEF]">
                Application Under Review
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                PENDING
              </span>
            </div>
            <p className="text-xs font-medium text-[#8F95B2] dark:text-[#8696A0] mt-1">
              Submitted on {formattedDate} • Review typically takes 24–48 hours
            </p>
          </div>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className={cn(
              "inline-flex items-center gap-2 self-start sm:self-auto rounded-xl px-4 py-2 text-xs font-bold border transition-colors cursor-pointer",
              "border-[#E6EAFA] dark:border-[#222D34] bg-[#F8FAFC] dark:bg-[#182229] hover:bg-[#EEF2FF] text-[#1D2A54] dark:text-[#E9EDEF]",
              isRefreshing && "opacity-60 cursor-not-allowed"
            )}
            title="Refresh status"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
            <span>{isRefreshing ? "Checking..." : "Refresh Status"}</span>
          </button>
        )}
      </div>

      {/* Realtime status pulse indicator */}
      <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 border border-blue-100/70 dark:border-blue-900/30">
        <Radio className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 animate-pulse" />
        <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed font-medium">
          <strong>Real-Time Sync Active:</strong> You don’t need to stay on this page. When an administrator makes a decision, your account will update automatically and you’ll receive an instant notification.
        </p>
      </div>

      {/* Submitted Application Details */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold tracking-wider uppercase text-[#8F95B2] dark:text-[#8696A0]">
          Application Summary
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="rounded-2xl bg-[#F8FAFC] dark:bg-[#182229] p-4 border border-[#F1F5F9] dark:border-[#222D34]">
            <span className="text-[11px] font-semibold text-[#8F95B2] dark:text-[#8696A0]">
              Content Niche
            </span>
            <div className="text-sm font-bold text-[#1D2A54] dark:text-[#E9EDEF] mt-1">
              {NICHE_LABELS[application.niche] || application.niche}
            </div>
          </div>

          <div className="rounded-2xl bg-[#F8FAFC] dark:bg-[#182229] p-4 border border-[#F1F5F9] dark:border-[#222D34]">
            <span className="text-[11px] font-semibold text-[#8F95B2] dark:text-[#8696A0]">
              Weekly Commitment
            </span>
            <div className="text-sm font-bold text-[#1D2A54] dark:text-[#E9EDEF] mt-1">
              {application.expectedHostingHoursPerWeek} hours / week
            </div>
          </div>
        </div>

        {application.bio && (
          <div className="rounded-2xl bg-[#F8FAFC] dark:bg-[#182229] p-4 border border-[#F1F5F9] dark:border-[#222D34]">
            <span className="text-[11px] font-semibold text-[#8F95B2] dark:text-[#8696A0]">
              Creator Bio
            </span>
            <p className="text-xs text-[#1D2A54] dark:text-[#E9EDEF] mt-1 leading-relaxed">
              {application.bio}
            </p>
          </div>
        )}

        <div className="rounded-2xl bg-[#F8FAFC] dark:bg-[#182229] p-4 border border-[#F1F5F9] dark:border-[#222D34]">
          <span className="text-[11px] font-semibold text-[#8F95B2] dark:text-[#8696A0]">
            Motivation & Streaming Vision
          </span>
          <p className="text-xs text-[#1D2A54] dark:text-[#E9EDEF] mt-1 leading-relaxed">
            {application.motivation}
          </p>
        </div>

        {application.introMediaUrl && (
          <div className="rounded-2xl bg-[#F8FAFC] dark:bg-[#182229] p-4 border border-[#F1F5F9] dark:border-[#222D34] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileVideo className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <span className="text-xs font-bold text-[#1D2A54] dark:text-[#E9EDEF]">
                  Uploaded Audio/Video Demo
                </span>
                <p className="text-[11px] text-[#8F95B2] dark:text-[#8696A0]">
                  Attached to your application for audio clarity review
                </p>
              </div>
            </div>
            <a
              href={application.introMediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View Sample ↗
            </a>
          </div>
        )}
      </div>

      {/* Next Steps Checklist */}
      <div className="rounded-2xl border border-dashed border-[#CBD5E1] dark:border-[#334155] p-5 space-y-3">
        <h4 className="text-xs font-bold text-[#1D2A54] dark:text-[#E9EDEF] flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          What happens when approved?
        </h4>
        <ul className="text-xs text-[#64748B] dark:text-[#94A3B8] space-y-2">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>Your official <strong>Live Room Host</strong> status will activate immediately.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>You will unlock the 10-seat interactive audio stage to start broadcasting.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>You can receive diamond gifts and earn revenue directly into your creator wallet.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
