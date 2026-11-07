"use client";

import React from "react";
import {
  Mic2,
  Radio,
  Clock,
  Gem,
  Users,
  Award,
  Sparkles,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { HostProfileData } from "@/services/host.service";

interface HostActiveCardProps {
  profile: HostProfileData;
  onLaunchStudio?: () => void;
}

export function HostActiveCard({ profile, onLaunchStudio }: HostActiveCardProps) {
  const approvedDate = profile.approvedAt
    ? new Date(profile.approvedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Active";

  const totalDiamonds =
    profile.stats?.totalDiamondsEarned ??
    profile.totalDiamondsEarned ??
    0;
  const totalLiveHours =
    profile.stats?.totalLiveHours ??
    profile.totalLiveHours ??
    0;
  const followersCount = profile.followersCount ?? 0;
  const badgeLevel = profile.badgeLevel ?? profile.level ?? 1;

  return (
    <div className="space-y-6">
      {/* Active Host Status Header */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-700 p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold backdrop-blur-md border border-white/25">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-200" />
            <span>Verified Live Creator</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome to Creator Host Studio
          </h2>

          <p className="text-xs md:text-sm text-emerald-100 max-w-xl font-normal leading-relaxed">
            Your host privileges are active. You can create live interactive audio rooms, host up to 10 stage speakers, and earn diamond gifts from listeners.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onLaunchStudio}
              className="inline-flex items-center gap-2 rounded-2xl bg-white text-emerald-800 px-6 py-3 text-xs md:text-sm font-extrabold shadow-lg hover:bg-emerald-50 transition-all cursor-pointer"
            >
              <Radio className="h-4 w-4 text-emerald-600 animate-pulse" />
              <span>Go Live & Create Room</span>
            </button>
          </div>
        </div>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-3xl bg-white dark:bg-[#111B21] border border-[#E6EAFA] dark:border-[#222D34] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#8F95B2] dark:text-[#8696A0] uppercase">
              Live Hours
            </span>
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-[#1D2A54] dark:text-[#E9EDEF]">
            {totalLiveHours}h
          </div>
          <p className="text-[10px] text-[#8F95B2] dark:text-[#8696A0]">Total stage broadcast time</p>
        </div>

        <div className="rounded-3xl bg-white dark:bg-[#111B21] border border-[#E6EAFA] dark:border-[#222D34] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#8F95B2] dark:text-[#8696A0] uppercase">
              Diamonds Earned
            </span>
            <Gem className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-[#1D2A54] dark:text-[#E9EDEF]">
            {totalDiamonds.toLocaleString()}
          </div>
          <p className="text-[10px] text-[#8F95B2] dark:text-[#8696A0]">Stage gifts revenue</p>
        </div>

        <div className="rounded-3xl bg-white dark:bg-[#111B21] border border-[#E6EAFA] dark:border-[#222D34] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#8F95B2] dark:text-[#8696A0] uppercase">
              Followers
            </span>
            <Users className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-[#1D2A54] dark:text-[#E9EDEF]">
            {followersCount.toLocaleString()}
          </div>
          <p className="text-[10px] text-[#8F95B2] dark:text-[#8696A0]">Loyal stage listeners</p>
        </div>

        <div className="rounded-3xl bg-white dark:bg-[#111B21] border border-[#E6EAFA] dark:border-[#222D34] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#8F95B2] dark:text-[#8696A0] uppercase">
              Host Tier
            </span>
            <Award className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-[#1D2A54] dark:text-[#E9EDEF]">
            Level {badgeLevel}
          </div>
          <p className="text-[10px] text-[#8F95B2] dark:text-[#8696A0]">Approved since {approvedDate}</p>
        </div>
      </div>

      {/* Host Tips & Best Practices */}
      <div className="rounded-3xl bg-white dark:bg-[#111B21] border border-[#E6EAFA] dark:border-[#222D34] p-6 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-[#1D2A54] dark:text-[#E9EDEF] flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
          Tips for High-Engagement Live Rooms
        </h3>
        <ul className="text-xs text-[#64748B] dark:text-[#94A3B8] space-y-2.5">
          <li className="flex items-start gap-2.5">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
            <span><strong>Choose Clear Topics:</strong> Rooms with specific titles attract 3x more listeners.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
            <span><strong>Involve Your Audience:</strong> Invite active listeners to vacant speaker seats to build lively discussions.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
            <span><strong>Acknowledge Gifting:</strong> Thank listeners live when they send diamond gifts to boost stage interactions.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
