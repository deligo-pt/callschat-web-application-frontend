"use client";

import React from "react";
import { UsersRound } from "lucide-react";
import { useTranslations } from "next-intl";

export default function CommunitiesPage() {
  const t = useTranslations("options");
  return (
    <div className="hidden flex-1 flex-col items-center justify-center bg-white md:flex w-full h-full">
      <div className="flex flex-col items-center text-center max-w-sm px-6">
        <div className="relative mb-8">
          <div className="h-[120px] w-[120px] rounded-full bg-[#EEF2FF] flex items-center justify-center border border-[#E0E7FF] shadow-2xl shadow-blue-500/10">
            <UsersRound className="h-16 w-16 text-[#2563EB]" strokeWidth={1.5} />
          </div>
        </div>
        
        <h2 className="text-[22px] font-bold text-[#0F172A] mb-3">No Communities Yet</h2>
        <p className="text-[13px] font-semibold text-[#1E293B] leading-relaxed max-w-[260px]">
          Join or create vibrant communities to bring multiple groups together under one unified umbrella.
        </p>
      </div>
    </div>
  );
}
