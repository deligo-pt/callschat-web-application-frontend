"use client";

import React from "react";
import { User, Briefcase, CheckCircle2 } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";

interface WorkspaceSwitcherProps {
  className?: string;
  compact?: boolean;
}

export function WorkspaceSwitcher({ className, compact = true }: WorkspaceSwitcherProps) {
  const { currentMode, businessProfile, workspace } = useUser();
  const isBusiness = currentMode === "BUSINESS";
  const isVerified = businessProfile?.isVerified;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-[1.25rem] transition-all duration-300 select-none",
        compact ? "h-12 w-12" : "h-12 px-3 gap-2.5 w-full",
        isBusiness
          ? "bg-purple-50 text-[#8B5CF6] border border-purple-100 shadow-sm"
          : "bg-[#EEF2FB] text-[#3B58F5] border border-blue-100 shadow-sm",
        className
      )}
      title={`Account Type: ${isBusiness ? (businessProfile?.companyName || workspace?.name || "Business Account") + (isVerified ? " (Verified)" : "") : "Personal Account"}`}
    >
      {isBusiness ? (
        <Briefcase className="h-5 w-5 shrink-0" strokeWidth={2.5} />
      ) : (
        <User className="h-5 w-5 shrink-0" strokeWidth={2.5} />
      )}

      {!compact && (
        <div className="flex flex-col items-start overflow-hidden text-left">
          <span className="text-[12px] font-bold tracking-tight truncate leading-tight flex items-center gap-1">
            {isBusiness ? businessProfile?.companyName || workspace?.name || "Business Account" : "Personal Account"}
            {isBusiness && isVerified && <CheckCircle2 className="h-3 w-3 text-[#3B58F5] fill-[#3B58F5]" />}
          </span>
          <span className="text-[10px] font-medium opacity-75 truncate leading-tight">
            {isBusiness ? "Business Mode" : "Personal Mode"}
          </span>
        </div>
      )}

      {/* Mode Badge indicator for compact view */}
      {compact && (
        <span
          className={cn(
            "absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-extrabold text-white shadow-xs",
            isBusiness ? "bg-[#8B5CF6]" : "bg-[#3B58F5]"
          )}
        >
          {isBusiness ? "B" : "P"}
        </span>
      )}

      {compact && isBusiness && isVerified && (
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white shadow-xs">
          <CheckCircle2 className="h-3 w-3 text-[#3B58F5] fill-[#3B58F5]" />
        </span>
      )}
    </div>
  );
}
