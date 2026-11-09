"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquareOff, RotateCcw, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

interface ChatsErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ChatsError({ error, reset }: ChatsErrorProps) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error("[CallsChat Conversation Error Boundary]:", error);
  }, [error]);

  return (
    <div className="flex h-full min-h-[420px] w-full flex-col items-center justify-center p-6 text-center bg-[#F8FAFC] dark:bg-[#0C1317]">
      <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 shadow-md">
        <MessageSquareOff className="h-8 w-8 text-amber-600 dark:text-amber-400" />
      </div>

      <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
        Unable to load conversation
      </h2>

      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mb-6">
        An error occurred while loading this chat thread. Your messages and history are safely stored.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#3B58F5] hover:bg-[#2B46E2] text-white font-medium text-sm shadow-sm transition-all active:scale-[0.98]"
        >
          <RotateCcw className="h-4 w-4" />
          Retry Conversation
        </button>

        <Link
          href="/chats"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#253248] text-sm font-medium transition-all"
        >
          Back to Conversations
        </Link>
      </div>

      {/* Collapsible Error Info */}
      <div className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-[#111827]/70 overflow-hidden text-left shadow-xs">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
            Error Details
          </span>
          {showDetails ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>

        {showDetails && (
          <div className="px-3 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800/60 font-mono text-xs text-slate-600 dark:text-slate-400 break-words">
            <span className="text-amber-600 dark:text-amber-400">
              {error.message || "Unknown rendering exception"}
            </span>
            {error.digest && (
              <div className="mt-1 text-[11px] text-slate-400">
                Digest: {error.digest}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

