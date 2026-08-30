"use client";

import React from "react";
import { Phone, PhoneOff, Video } from "lucide-react";
import { useCallContext } from "@/components/providers/CallContext";
import { getOptimizedImageUrl } from "@/utils/image";

export const CallWaitingBanner = () => {
  const { callWaiting, acceptCallWaiting, declineCallWaiting } = useCallContext();

  if (!callWaiting) return null;

  const displayName = callWaiting.callerName || "Someone";
  const avatarUrl = callWaiting.callerAvatar
    ? getOptimizedImageUrl(callWaiting.callerAvatar, 64, 64)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=00A884&color=fff&size=128`;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[95vw] max-w-[480px] animate-in slide-in-from-top-6 duration-300 pointer-events-auto">
      <div className="relative overflow-hidden rounded-3xl bg-[#202C33]/95 border border-white/15 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl flex items-center justify-between gap-3 text-[#E9EDEF]">
        {/* Subtle background emerald glow */}
        <div className="absolute -left-10 -top-10 w-32 h-32 bg-[#00A884]/20 blur-[40px] rounded-full pointer-events-none" />

        {/* Left: Avatar and Caller Info */}
        <div className="flex items-center gap-3 min-w-0 z-10">
          <div className="relative flex-shrink-0">
            <div className="absolute -inset-1 rounded-full border-2 border-[#25D366]/50 animate-pulse" />
            <img
              src={getOptimizedImageUrl(avatarUrl)}
              alt={displayName}
              className="relative h-12 w-12 rounded-full object-cover border-2 border-[#111B21] shadow-md bg-[#182229]"
            />
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#00A884] border border-[#202C33] text-white">
              {callWaiting.callType === "VIDEO" ? (
                <Video className="h-2.5 w-2.5" />
              ) : (
                <Phone className="h-2.5 w-2.5" fill="currentColor" />
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                Call Waiting
              </span>
            </div>
            <h4 className="text-[14px] font-semibold text-[#E9EDEF] truncate">
              {displayName}
            </h4>
            <p className="text-[12px] text-[#8696A0] truncate">
              Incoming {callWaiting.callType.toLowerCase()} call
            </p>
          </div>
        </div>

        {/* Right: Actions (Decline vs End & Accept) */}
        <div className="flex items-center gap-2 z-10 flex-shrink-0">
          {/* Decline */}
          <button
            onClick={declineCallWaiting}
            className="flex items-center justify-center h-9 px-3 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 hover:text-red-200 transition-all text-xs font-semibold gap-1.5 active:scale-95 shadow-xs cursor-pointer"
            title="Decline waiting call"
          >
            <PhoneOff className="h-3.5 w-3.5" />
            <span>Decline</span>
          </button>

          {/* End & Accept */}
          <button
            onClick={acceptCallWaiting}
            className="flex items-center justify-center h-9 px-3.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white transition-all text-xs font-semibold gap-1.5 shadow-[0_0_20px_rgba(37,211,102,0.4)] hover:scale-105 active:scale-95 cursor-pointer"
            title="End current call and accept new call"
          >
            <Phone className="h-3.5 w-3.5" fill="currentColor" />
            <span>End & Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
};

