"use client";

import React from "react";
import { Users, Lock, ShieldCheck, Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function GroupsPage() {
  const t = useTranslations("options");
  return (
    <div className="hidden flex-1 flex-col items-center justify-center chat-canvas-bg md:flex w-full select-none p-8 relative">
      <div className="relative z-10 flex flex-col items-center max-w-[460px] text-center bg-white/80 dark:bg-[#202C33]/80 backdrop-blur-md p-8 rounded-3xl border border-white/60 dark:border-white/10 shadow-xl">
        {/* Animated Group Shield Graphic */}
        <div className="relative mb-6">
          <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-[#00A884] to-[#25D366] flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 animate-in zoom-in duration-300">
            <Users className="h-9 w-9" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white dark:bg-[#111B21] flex items-center justify-center shadow-md">
            <ShieldCheck className="h-5 w-5 text-[#00A884]" />
          </div>
        </div>

        <h2 className="text-[24px] font-bold text-[#111B21] dark:text-[#E9EDEF] tracking-tight mb-2">
          CallsChat Groups
        </h2>
        <p className="text-[14px] text-[#54656F] dark:text-[#8696A0] leading-relaxed mb-6">
          Stay connected with friends, family, and teams. Group chats are private and protected with end-to-end encryption.
        </p>

        {/* Action Button */}
        <Link 
          href="/groups/create"
          className="flex items-center gap-2 bg-[#00A884] hover:bg-[#008069] text-white px-6 py-3 rounded-2xl font-semibold text-[14px] shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] mb-6 cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Create New Group</span>
        </Link>

        {/* E2EE Guarantee Footer */}
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#667781] dark:text-[#8696A0] bg-[#00A884]/10 dark:bg-[#00A884]/15 px-3 py-1.5 rounded-full">
          <Lock className="h-3.5 w-3.5 text-[#00A884]" />
          <span>End-to-end encrypted group messages</span>
        </div>
      </div>
    </div>
  );
}
