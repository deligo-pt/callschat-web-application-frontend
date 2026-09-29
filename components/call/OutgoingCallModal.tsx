"use client";

import React from "react";
import { PhoneOff, Lock, Video, Phone } from "lucide-react";
import { useCallContext } from "@/components/providers/CallContext";
import { getOptimizedImageUrl } from "@/utils/image";

export const OutgoingCallModal = () => {
  const { outgoingCall, outgoingCallStatus, cancelOutgoingCall } = useCallContext();

  if (!outgoingCall) return null;

  // Auto-generate avatar if none provided
  const displayName = outgoingCall.receiverName || outgoingCall.receiverId;
  const avatarUrl = outgoingCall.receiverAvatar
    ? getOptimizedImageUrl(outgoingCall.receiverAvatar, 80, 80)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=00A884&color=fff&size=128`;

  // Determine state labels, subtitles, and visual themes
  const isVideo = outgoingCall.callType === "VIDEO";
  let badgeLabel = `Calling (${outgoingCall.callType.toLowerCase()})...`;
  let statusSubtitle = "Calling...";
  let glowColor = "bg-[#00A884]/20";
  let ringColor = "border-[#00A884]";
  let ringColorInner = "border-[#25D366]/50";
  let badgeStyle = "bg-[#00A884]/15 text-[#25D366] border-[#00A884]/30 animate-pulse";
  let subtitleStyle = "text-[#8696A0]";

  if (outgoingCallStatus === "RINGING") {
    badgeLabel = `Ringing (${outgoingCall.callType.toLowerCase()})...`;
    statusSubtitle = "Ringing...";
    glowColor = "bg-[#25D366]/25";
    ringColor = "border-[#25D366]";
    ringColorInner = "border-[#00A884]/60";
    badgeStyle = "bg-[#25D366]/20 text-[#25D366] border-[#25D366]/40 animate-pulse";
    subtitleStyle = "text-[#25D366] font-medium";
  } else if (outgoingCallStatus === "WAITING") {
    badgeLabel = "On Another Call";
    statusSubtitle = "Waiting...";
    glowColor = "bg-amber-500/25";
    ringColor = "border-amber-500";
    ringColorInner = "border-amber-500/50";
    badgeStyle = "bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse";
    subtitleStyle = "text-amber-300/90 font-medium";
  } else if (outgoingCallStatus === "BUSY") {
    badgeLabel = "User Busy";
    statusSubtitle = "User is on another call";
    glowColor = "bg-red-500/25";
    ringColor = "border-red-500";
    ringColorInner = "border-red-500/50";
    badgeStyle = "bg-red-500/20 text-red-300 border-red-500/30";
    subtitleStyle = "text-red-400 font-semibold";
  } else if (outgoingCallStatus === "DECLINED") {
    badgeLabel = "Call Declined";
    statusSubtitle = "Call was declined";
    glowColor = "bg-red-500/25";
    ringColor = "border-red-500";
    ringColorInner = "border-red-500/50";
    badgeStyle = "bg-red-500/20 text-red-300 border-red-500/30";
    subtitleStyle = "text-red-400 font-semibold";
  } else if (outgoingCallStatus === "NOT_ANSWERED") {
    badgeLabel = "No Answer";
    statusSubtitle = "User did not answer";
    glowColor = "bg-orange-500/25";
    ringColor = "border-orange-500";
    ringColorInner = "border-orange-500/50";
    badgeStyle = "bg-orange-500/20 text-orange-300 border-orange-500/30";
    subtitleStyle = "text-orange-400 font-semibold";
  } else if (outgoingCallStatus === "UNAVAILABLE") {
    badgeLabel = "Unavailable";
    statusSubtitle = "User is unavailable";
    glowColor = "bg-slate-500/20";
    ringColor = "border-slate-500";
    ringColorInner = "border-slate-500/50";
    badgeStyle = "bg-slate-500/20 text-slate-300 border-slate-500/30";
    subtitleStyle = "text-slate-400 font-semibold";
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto">
      {/* WhatsApp Web floating calling modal */}
      <div className="relative w-[380px] overflow-hidden rounded-[2.5rem] bg-[#111B21] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.8)] border border-white/10 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 ease-out flex flex-col items-center">
        
        {/* Subtle background emerald aura */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 ${glowColor} blur-[90px] rounded-full pointer-events-none transition-colors duration-500`}
        />

        {/* Top Header with E2EE Notice & Badge */}
        <div className="flex flex-col items-center gap-2 mb-8 z-10 w-full">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#8696A0] bg-white/5 px-3 py-1 rounded-full border border-white/5">
            <Lock className="w-3 h-3 text-[#00A884]" />
            <span>End-to-End Encrypted</span>
          </div>
          <span
            className={`px-3.5 py-1 rounded-full ${badgeStyle} text-[11.5px] font-semibold tracking-wide uppercase backdrop-blur-md border shadow-xs transition-all duration-300`}
          >
            {badgeLabel}
          </span>
        </div>

        {/* Pulsing Concentric Radar Rings Avatar Area */}
        <div className="relative mb-8 z-10">
          {/* Outer pulsing ring */}
          <div
            className={`absolute inset-0 rounded-full border-2 ${ringColor} animate-ping opacity-60`}
            style={{ animationDuration: '2s' }}
          />
          {/* Inner solid ring */}
          <div
            className={`absolute -inset-4 rounded-full border-2 ${ringColorInner} animate-pulse`}
          />
          
          <img 
            src={getOptimizedImageUrl(avatarUrl)} 
            alt={displayName}
            className="relative h-28 w-28 rounded-full object-cover border-4 border-[#111B21] shadow-2xl bg-[#202C33]"
          />

          {/* Call type icon badge */}
          <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#00A884] border-2 border-[#111B21] text-white shadow-md">
            {isVideo ? <Video className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" fill="currentColor" />}
          </div>
        </div>
        
        {/* Receiver Info */}
        <div className="flex flex-col items-center text-center z-10 mb-10 w-full">
          <h2 className="text-[24px] font-bold text-[#E9EDEF] tracking-tight truncate w-full px-4">
            {displayName}
          </h2>
          <p
            className={`mt-1 text-[13.5px] ${subtitleStyle} transition-colors duration-300`}
          >
            {statusSubtitle}
          </p>
        </div>
        
        {/* Bottom Action Bar */}
        <div className="flex w-full justify-center items-center bg-[#202C33]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-4 z-10 shadow-inner shadow-white/5">
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                cancelOutgoingCall();
              }}
              className="group flex h-14 w-14 items-center justify-center rounded-full bg-[#EA0038] transition-all hover:bg-[#d00030] hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(234,0,56,0.4)] cursor-pointer"
              aria-label="Cancel Call"
            >
              <PhoneOff className="h-6 w-6 text-white transition-transform group-hover:rotate-12" fill="currentColor" />
            </button>
            <span className="text-[11.5px] font-medium text-red-400">Cancel</span>
          </div>
        </div>

      </div>
    </div>
  );
};


