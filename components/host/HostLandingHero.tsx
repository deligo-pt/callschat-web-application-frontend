"use client";

import React from "react";
import { Mic2, Radio, Sparkles, Gem, Users, ShieldCheck, ArrowRight, Check } from "lucide-react";

interface HostLandingHeroProps {
  onStartApplication: () => void;
}

export function HostLandingHero({ onStartApplication }: HostLandingHeroProps) {
  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#7C3AED] p-8 md:p-12 text-white shadow-xl">
        {/* Background glow accents */}
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold backdrop-blur-md border border-white/20">
            <Radio className="h-3.5 w-3.5 text-red-400 animate-pulse" />
            <span>CallsChat Live Creator Studio</span>
          </div>

          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight">
            Become an Official Live Audio Host
          </h2>

          <p className="text-sm md:text-base text-blue-100/90 leading-relaxed font-normal">
            Host live interactive audio stages, invite listeners up to 10 speaker seats, build your loyal audience, and monetize with real-time diamond gifts.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={onStartApplication}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-white text-[#1E3A8A] px-7 py-3.5 text-sm font-extrabold shadow-lg hover:bg-blue-50 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Mic2 className="h-4.5 w-4.5 text-[#2563EB]" />
              <span>Apply to Become a Host</span>
              <ArrowRight className="h-4 w-4 text-[#2563EB]" />
            </button>
          </div>
        </div>
      </div>

      {/* Feature Value Props */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-3xl bg-white dark:bg-[#111B21] border border-[#E6EAFA] dark:border-[#222D34] p-6 shadow-xs space-y-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-[#2563EB] dark:text-[#38BDF8]">
            <Radio className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-[#1D2A54] dark:text-[#E9EDEF]">
            10-Seat Audio Stage
          </h3>
          <p className="text-xs text-[#8F95B2] dark:text-[#8696A0] leading-relaxed">
            Ultra-low latency SFU audio powered by WebRTC. Manage co-hosts, invite speakers, mute guests, and interact live.
          </p>
        </div>

        <div className="rounded-3xl bg-white dark:bg-[#111B21] border border-[#E6EAFA] dark:border-[#222D34] p-6 shadow-xs space-y-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400">
            <Gem className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-[#1D2A54] dark:text-[#E9EDEF]">
            Diamond Gift Monetization
          </h3>
          <p className="text-xs text-[#8F95B2] dark:text-[#8696A0] leading-relaxed">
            Receive animated gifts on stage that convert directly into creator diamond earnings, redeemable to your wallet.
          </p>
        </div>

        <div className="rounded-3xl bg-white dark:bg-[#111B21] border border-[#E6EAFA] dark:border-[#222D34] p-6 shadow-xs space-y-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-[#1D2A54] dark:text-[#E9EDEF]">
            Verified Creator Badge
          </h3>
          <p className="text-xs text-[#8F95B2] dark:text-[#8696A0] leading-relaxed">
            Stand out in the live discovery feed and across platform rooms with an official Verified Host badge.
          </p>
        </div>
      </div>

      {/* Requirements Card */}
      <div className="rounded-3xl bg-white dark:bg-[#111B21] border border-[#E6EAFA] dark:border-[#222D34] p-6 md:p-8 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-[#1D2A54] dark:text-[#E9EDEF] flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
          Application Requirements & Criteria
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#64748B] dark:text-[#94A3B8]">
          <div className="flex items-start gap-2.5">
            <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>Active CallsChat profile in good standing</span>
          </div>
          <div className="flex items-start gap-2.5">
            <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>Clear microphone / audio equipment setup</span>
          </div>
          <div className="flex items-start gap-2.5">
            <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>Commitment to minimum 3–5 hours of streaming per week</span>
          </div>
          <div className="flex items-start gap-2.5">
            <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>Compliance with CallsChat Live Community Guidelines</span>
          </div>
        </div>
      </div>
    </div>
  );
}
