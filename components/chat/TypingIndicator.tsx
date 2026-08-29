"use client";

import React from "react";
import { getOptimizedImageUrl } from "@/utils/image";

interface TypingIndicatorProps {
  /** Display name of the person typing */
  name: string;
  /** Optional avatar URL */
  avatarUrl?: string;
}

/**
 * TypingIndicator — Messenger-style adaptive typing bubble.
 *
 * Works on both light and dark backgrounds:
 *  • Bubble uses `bg-black/[.08] dark:bg-white/[.12]` — a translucent neutral
 *    that reads as light-grey on white, and dark-grey on black. No hard color.
 *  • Dots inherit `currentColor` from the text layer so they always contrast.
 *  • Avatar ring adapts with `ring-black/10 dark:ring-white/10`.
 *  • Sequential scale + translateY wave matches Facebook Messenger motion.
 *  • Slide-up entrance animation keeps the appearance feeling alive.
 */
export function TypingIndicator({ name, avatarUrl }: TypingIndicatorProps) {
  return (
    <div
      className="typing-indicator-enter flex items-end gap-2 ml-1 select-none"
      aria-label={`${name} is typing`}
      aria-live="polite"
    >
      {/* ── Avatar ─────────────────────────────────────────────────────────── */}
      <div
        className="
          relative shrink-0 h-[30px] w-[30px] rounded-full overflow-hidden
          ring-2 ring-black/10 dark:ring-white/10
          shadow-sm
        "
      >
        {avatarUrl ? (
          <img
            src={getOptimizedImageUrl(avatarUrl)}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-[#E6EAFA] dark:bg-[#2A3370] text-[#3B58F5] text-[12px] font-bold">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* ── Bubble ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-[3px]">
        {/* Tiny name label — muted, never dominant */}
        <span className="text-[10px] font-medium text-black/40 dark:text-white/40 ml-1 leading-none">
          {name}
        </span>

        {/*
          Bubble: translucent neutral overlay on whatever is behind it.
          Light bg  → appears as soft light-grey  (#000 at 8% opacity)
          Dark bg   → appears as soft dark-grey  (#fff at 12% opacity)
          The corner is pinched bottom-left to mimic a received-message tail.
        */}
        <div
          className="
            flex items-center gap-[5px]
            bg-white dark:bg-[#202C33]
            border border-black/[0.04] dark:border-white/[0.04]
            rounded-[18px] rounded-bl-[4px]
            px-[14px] py-[10px]
            text-[#8696A0]
            shadow-xs
          "
        >
          <span className="typing-dot bg-[#00A884]" style={{ animationDelay: "0ms" }} />
          <span className="typing-dot bg-[#00A884]" style={{ animationDelay: "190ms" }} />
          <span className="typing-dot bg-[#00A884]" style={{ animationDelay: "380ms" }} />
        </div>
      </div>
    </div>
  );
}
