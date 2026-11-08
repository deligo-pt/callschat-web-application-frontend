"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, MessageSquare, RotateCcw, ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";

interface RootErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: RootErrorProps) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Log unexpected exceptions to console for observability / monitoring
    console.error("[CallsChat Root Error Boundary caught error]:", error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#F8FAFC] dark:bg-[#0B0F19] text-[#111B21] dark:text-[#E9EDEF] px-4 py-8 font-sans selection:bg-[#3B58F5] selection:text-white">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[450px] w-[450px] rounded-full bg-red-500/10 dark:bg-red-500/15 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-[#3B58F5]/10 dark:bg-[#3B58F5]/15 blur-[140px]" />
      </div>

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center text-center">
        {/* Animated / Glowing Icon */}
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10 dark:bg-red-500/15 border border-red-500/20 shadow-lg shadow-red-500/5">
          <ShieldAlert className="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
          Something went wrong
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mb-8">
          An unexpected issue interrupted CallsChat. Your account data and messages remain secure.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center mb-6">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#3B58F5] hover:bg-[#2B46E2] text-white font-medium shadow-md shadow-[#3B58F5]/20 hover:shadow-lg hover:shadow-[#3B58F5]/30 transition-all active:scale-[0.98]"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </button>

          <Link
            href="/chats"
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#253248] font-medium transition-all active:scale-[0.98]"
          >
            <MessageSquare className="h-4 w-4 text-[#3B58F5]" />
            Go to Chats
          </Link>

          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-medium transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reload App
          </button>
        </div>

        {/* Collapsible Error Technical Details */}
        <div className="w-full rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-[#111827]/70 backdrop-blur-md overflow-hidden text-left shadow-sm">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex w-full items-center justify-between px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Technical Error Details
            </span>
            {showDetails ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showDetails && (
            <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800/60 font-mono text-xs text-slate-600 dark:text-slate-400 break-words space-y-2">
              <div>
                <span className="text-slate-400 dark:text-slate-500">Error:</span>{" "}
                <span className="text-red-600 dark:text-red-400 font-medium">
                  {error.message || "Unknown error"}
                </span>
              </div>
              {error.digest && (
                <div>
                  <span className="text-slate-400 dark:text-slate-500">Digest:</span>{" "}
                  <span className="text-slate-700 dark:text-slate-300">{error.digest}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

