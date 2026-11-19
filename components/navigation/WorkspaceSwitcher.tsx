"use client";

import React from "react";
import { User, Briefcase } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";

interface WorkspaceSwitcherProps {
  className?: string;
  compact?: boolean;
}

export function WorkspaceSwitcher({ className, compact = true }: WorkspaceSwitcherProps) {
  const { currentMode, businessProfile, workspace, user, isCurrentVerified } = useUser();
  const isBusiness = currentMode === "BUSINESS";
  const isVerified = isCurrentVerified ?? (isBusiness ? Boolean(businessProfile?.isVerified || workspace?.isVerified) : Boolean(user?.isVerified));
  const badgeType = isBusiness ? "BUSINESS" : "USER";

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-[1.25rem] transition-all duration-300 select-none",
        compact ? "h-12 w-12" : "h-12 px-3 gap-2.5 w-full",
        isBusiness
          ? "bg-purple-50 text-[#8B5CF6] border border-purple-100 shadow-sm dark:bg-[#28183F] dark:text-[#C084FC] dark:border-[#4C1D95]/40 dark:shadow-none"
          : "bg-[#EEF2FB] text-[#2563EB] border border-blue-100 shadow-sm dark:bg-[#202C33] dark:text-[#53BDEB] dark:border-[#2A3942] dark:shadow-none",
        className
      )}
      title={`Account Type: ${isBusiness ? (businessProfile?.companyName || workspace?.name || "Business Account") : "Personal Account"}${isVerified ? " (Verified)" : ""}`}
    >
      {isBusiness ? (
        <Briefcase className="h-5 w-5 shrink-0" strokeWidth={2.2} />
      ) : (
        <User className="h-5 w-5 shrink-0" strokeWidth={2.2} />
      )}

      {!compact && (
        <div className="flex flex-col items-start overflow-hidden text-left">
          <span className="text-[12px] font-bold tracking-tight truncate leading-tight flex items-center gap-1.5 text-[#111B21] dark:text-[#E9EDEF]">
            <span>{isBusiness ? businessProfile?.companyName || workspace?.name || "Business Account" : "Personal Account"}</span>
            {isVerified && (
              <VerifiedBadge
                type={badgeType}
                size="xs"
                showTooltip={false}
              />
            )}
          </span>
          <span className="text-[10px] font-medium opacity-75 truncate leading-tight text-[#54656F] dark:text-[#8696A0]">
            {isBusiness ? "Business Mode" : "Personal Mode"}
          </span>
        </div>
      )}

      {/* Mode Badge indicator for compact view */}
      {compact && (
        <span
          className={cn(
            "absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-extrabold text-white shadow-xs ring-2 ring-white dark:ring-[#111B21]",
            isBusiness ? "bg-[#8B5CF6] dark:bg-[#A855F7]" : "bg-[#2563EB] dark:bg-[#0284C7]"
          )}
        >
          {isBusiness ? "B" : "P"}
        </span>
      )}

      {compact && isVerified && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-[#111B21] shadow-xs ring-2 ring-white dark:ring-[#111B21]">
          <VerifiedBadge
            type={badgeType}
            size="xs"
            showTooltip={false}
          />
        </span>
      )}
    </div>
  );
}
