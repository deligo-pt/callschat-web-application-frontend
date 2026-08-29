"use client";

import React from "react";
import { PhoneOff } from "lucide-react";
import { useCallContext } from "@/components/providers/CallContext";
import { getOptimizedImageUrl } from "@/utils/image";

export const OutgoingCallModal = () => {
  const { outgoingCall, outgoingCallStatus, cancelOutgoingCall } = useCallContext();

  if (!outgoingCall) return null;

  // Auto-generate avatar if none provided
  const displayName = outgoingCall.receiverName || outgoingCall.receiverId;
  const avatarUrl = outgoingCall.receiverAvatar
    ? getOptimizedImageUrl(outgoingCall.receiverAvatar, 80, 80)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3B58F5&color=fff&size=128`;

  // Determine state labels, subtitles, and visual themes
  let badgeLabel = `Calling (${outgoingCall.callType.toLowerCase()})...`;
  let statusSubtitle = "Calling...";
  let glowColor = "bg-[#3B58F5] opacity-20";
  let ringColor = "border-[#3B58F5]";
  let ringColorInner = "border-[#3B58F5]/50";
  let badgeStyle = "bg-white/10 text-white/90 border-white/5 animate-pulse";
  let subtitleStyle = "text-white/60";

  if (outgoingCallStatus === "RINGING") {
    badgeLabel = `Ringing (${outgoingCall.callType.toLowerCase()})...`;
    statusSubtitle = "Ringing...";
    glowColor = "bg-emerald-500 opacity-25";
    ringColor = "border-emerald-500";
    ringColorInner = "border-emerald-500/50";
    badgeStyle = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 animate-pulse";
    subtitleStyle = "text-emerald-300/80 font-medium";
  } else if (outgoingCallStatus === "WAITING") {
    badgeLabel = "On Another Call";
    statusSubtitle = "Waiting...";
    glowColor = "bg-amber-500 opacity-25";
    ringColor = "border-amber-500";
    ringColorInner = "border-amber-500/50";
    badgeStyle = "bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse";
    subtitleStyle = "text-amber-300/90 font-medium";
  } else if (outgoingCallStatus === "BUSY") {
    badgeLabel = "User Busy";
    statusSubtitle = "User is on another call";
    glowColor = "bg-red-500 opacity-25";
    ringColor = "border-red-500";
    ringColorInner = "border-red-500/50";
    badgeStyle = "bg-red-500/20 text-red-300 border-red-500/30";
    subtitleStyle = "text-red-400 font-semibold";
  } else if (outgoingCallStatus === "DECLINED") {
    badgeLabel = "Call Declined";
    statusSubtitle = "Call was declined";
    glowColor = "bg-red-500 opacity-25";
    ringColor = "border-red-500";
    ringColorInner = "border-red-500/50";
    badgeStyle = "bg-red-500/20 text-red-300 border-red-500/30";
    subtitleStyle = "text-red-400 font-semibold";
  } else if (outgoingCallStatus === "NOT_ANSWERED") {
    badgeLabel = "No Answer";
    statusSubtitle = "User did not answer";
    glowColor = "bg-orange-500 opacity-25";
    ringColor = "border-orange-500";
    ringColorInner = "border-orange-500/50";
    badgeStyle = "bg-orange-500/20 text-orange-300 border-orange-500/30";
    subtitleStyle = "text-orange-400 font-semibold";
  } else if (outgoingCallStatus === "UNAVAILABLE") {
    badgeLabel = "Unavailable";
    statusSubtitle = "User is unavailable";
    glowColor = "bg-slate-500 opacity-20";
    ringColor = "border-slate-500";
    ringColorInner = "border-slate-500/50";
    badgeStyle = "bg-slate-500/20 text-slate-300 border-slate-500/30";
    subtitleStyle = "text-slate-400 font-semibold";
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto">
      {/* 
        Web-optimized floating modal 
        Using the deep blue #1D2A54 from the mobile design 
      */}
      <div className="relative w-[380px] overflow-hidden rounded-[2.5rem] bg-[#1D2A54] p-8 shadow-[0_0_80px_rgba(29,42,84,0.6)] border border-white/10 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 ease-out flex flex-col items-center">
        
        {/* Subtle background glow effect */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 ${glowColor} blur-[80px] rounded-full pointer-events-none transition-colors duration-500`}
        />

        {/* Top Header Badge */}
        <div className="flex w-full items-center justify-center mb-10 z-10">
          <span
            className={`px-4 py-1.5 rounded-full ${badgeStyle} text-xs font-semibold tracking-wider uppercase backdrop-blur-md border shadow-sm transition-all duration-300`}
          >
            {badgeLabel}
          </span>
        </div>

        {/* Pulsing Avatar Area */}
        <div className="relative mb-8 z-10">
          {/* Outer pulsing ring */}
          <div
            className={`absolute inset-0 rounded-full border-2 ${ringColor} animate-ping opacity-75`}
            style={{ animationDuration: '2s' }}
          />
          {/* Inner solid ring */}
          <div
            className={`absolute -inset-4 rounded-full border-2 ${ringColorInner} animate-pulse`}
          />
          
          <img 
            src={getOptimizedImageUrl(avatarUrl)} 
            alt={displayName}
            className="relative h-28 w-28 rounded-full object-cover border-4 border-[#1D2A54] shadow-xl"
          />
        </div>
        
        {/* Receiver Info */}
        <div className="flex flex-col items-center text-center z-10 mb-12 w-full">
          <h2 className="text-[26px] font-bold text-white tracking-tight truncate w-full px-4">
            {displayName}
          </h2>
          <p
            className={`mt-1.5 text-sm ${subtitleStyle} transition-colors duration-300`}
          >
            {statusSubtitle}
          </p>
        </div>
        
        {/* Bottom Action Bar */}
        <div className="flex w-full justify-center items-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 z-10 shadow-inner shadow-white/5">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                cancelOutgoingCall();
              }}
              className="group flex h-16 w-16 items-center justify-center rounded-full bg-red-500 transition-all hover:bg-red-600 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
              aria-label="Cancel Call"
            >
              <PhoneOff className="h-7 w-7 text-white transition-transform group-hover:rotate-12" fill="currentColor" />
            </button>
            <span className="text-[11px] font-semibold text-red-400">Cancel</span>
          </div>
        </div>

      </div>
    </div>
  );
};

