import React from "react";
import { cn } from "@/lib/utils";

interface ChatDateDividerProps {
  label: string;
  className?: string;
}

/**
 * Centered WhatsApp-style date pill divider for chat feeds.
 */
export const ChatDateDivider: React.FC<ChatDateDividerProps> = React.memo(
  ({ label, className }) => {
    return (
      <div
        className={cn(
          "flex justify-center my-3 select-none pointer-events-none",
          className
        )}
      >
        <span className="rounded-lg bg-white/90 dark:bg-[#182229]/90 px-3 py-1 text-[11px] font-semibold text-[#54656F] dark:text-[#8696A0] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] uppercase tracking-wider backdrop-blur-xs border border-black/5 dark:border-white/5 pointer-events-auto transition-colors">
          {label}
        </span>
      </div>
    );
  }
);

ChatDateDivider.displayName = "ChatDateDivider";
