"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type VerifiedBadgeType = "USER" | "BUSINESS";
export type VerifiedBadgeSize = "xs" | "sm" | "md" | "lg";

export interface VerifiedBadgeProps {
  /** Type of verification: personal identity or enterprise business */
  type?: VerifiedBadgeType;
  /** Size variant */
  size?: VerifiedBadgeSize;
  /** Whether to show a hover tooltip explaining the verification */
  showTooltip?: boolean;
  /** Custom tooltip title or description override */
  tooltipText?: string;
  /** Additional container classes */
  className?: string;
}

const SIZE_CONFIGS: Record<VerifiedBadgeSize, { badge: string; svg: string }> = {
  xs: { badge: "h-3.5 w-3.5", svg: "h-3.5 w-3.5" },
  sm: { badge: "h-4 w-4", svg: "h-4 w-4" },
  md: { badge: "h-5 w-5", svg: "h-5 w-5" },
  lg: { badge: "h-6 w-6", svg: "h-6 w-6" },
};

export function VerifiedBadge({
  type = "USER",
  size = "sm",
  showTooltip = true,
  tooltipText,
  className,
}: VerifiedBadgeProps) {
  const isBusiness = type === "BUSINESS";
  const { badge, svg } = SIZE_CONFIGS[size] || SIZE_CONFIGS.sm;

  const defaultTooltip = isBusiness
    ? "Verified Enterprise · Commercial business registration and identity confirmed (KYB)"
    : "Verified Identity · Government-issued legal identification confirmed (KYC)";

  const label = tooltipText || defaultTooltip;

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center shrink-0 align-middle select-none",
        showTooltip && "group cursor-help",
        badge,
        className
      )}
      aria-label={label}
      role="img"
    >
      {isBusiness ? (
        // Business KYB Badge: Emerald Green with Verified Check
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn(
            svg,
            "drop-shadow-[0_1px_2px_rgba(16,185,129,0.35)] transition-transform duration-200 group-hover:scale-110"
          )}
        >
          <path
            d="M10.29 2.308a2.23 2.23 0 0 1 3.42 0l.66.762a2.23 2.23 0 0 0 1.806.75l1.004-.07a2.23 2.23 0 0 1 2.378 2.379l-.07 1.004a2.23 2.23 0 0 0 .75 1.806l.762.66a2.23 2.23 0 0 1 0 3.42l-.762.66a2.23 2.23 0 0 0-.75 1.806l.07 1.004a2.23 2.23 0 0 1-2.379 2.378l-1.004-.07a2.23 2.23 0 0 0-1.806.75l-.66.762a2.23 2.23 0 0 1-3.42 0l-.66-.762a2.23 2.23 0 0 0-1.806-.75l-1.004.07a2.23 2.23 0 0 1-2.378-2.379l.07-1.004a2.23 2.23 0 0 0-.75-1.806l-.762-.66a2.23 2.23 0 0 1 0-3.42l.762-.66a2.23 2.23 0 0 0 .75-1.806l-.07-1.004a2.23 2.23 0 0 1 2.379-2.378l1.004.07a2.23 2.23 0 0 0 1.806-.75l.66-.762Z"
            fill="#059669"
          />
          <path
            d="m8.5 12 2.5 2.5 5-5"
            stroke="#ffffff"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        // Personal KYC Badge: Royal Blue with Verified Check
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn(
            svg,
            "drop-shadow-[0_1px_2px_rgba(37,99,235,0.35)] transition-transform duration-200 group-hover:scale-110"
          )}
        >
          <path
            d="M10.29 2.308a2.23 2.23 0 0 1 3.42 0l.66.762a2.23 2.23 0 0 0 1.806.75l1.004-.07a2.23 2.23 0 0 1 2.378 2.379l-.07 1.004a2.23 2.23 0 0 0 .75 1.806l.762.66a2.23 2.23 0 0 1 0 3.42l-.762.66a2.23 2.23 0 0 0-.75 1.806l.07 1.004a2.23 2.23 0 0 1-2.379 2.378l-1.004-.07a2.23 2.23 0 0 0-1.806.75l-.66.762a2.23 2.23 0 0 1-3.42 0l-.66-.762a2.23 2.23 0 0 0-1.806-.75l-1.004.07a2.23 2.23 0 0 1-2.378-2.379l.07-1.004a2.23 2.23 0 0 0-.75-1.806l-.762-.66a2.23 2.23 0 0 1 0-3.42l.762-.66a2.23 2.23 0 0 0 .75-1.806l-.07-1.004a2.23 2.23 0 0 1 2.379-2.378l1.004.07a2.23 2.23 0 0 0 1.806-.75l.66-.762Z"
            fill="#2563EB"
          />
          <path
            d="m8.5 12 2.5 2.5 5-5"
            stroke="#ffffff"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {/* Floating Tooltip */}
      {showTooltip && (
        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden w-max max-w-[220px] rounded-lg bg-[#0F172A] px-2.5 py-1.5 text-center text-[11px] font-medium leading-tight text-white shadow-xl opacity-0 transition-opacity duration-150 group-hover:block group-hover:opacity-100 z-50">
          <span className="font-bold block mb-0.5 text-white flex items-center justify-center gap-1">
            <span
              className={cn(
                "inline-block h-1.5 w-1.5 rounded-full",
                isBusiness ? "bg-emerald-400" : "bg-blue-400"
              )}
            />
            {isBusiness ? "Verified Business" : "Verified Account"}
          </span>
          <span className="text-slate-300 block text-[10px] leading-normal">{label}</span>
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0F172A]" />
        </span>
      )}
    </span>
  );
}

export default VerifiedBadge;
