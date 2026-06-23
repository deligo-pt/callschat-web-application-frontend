"use client";

import React from "react";
import { PhoneOff } from "lucide-react";
import { useCallContext } from "@/components/providers/CallContext";

export const OutgoingCallModal = () => {
  const { outgoingCall, cancelOutgoingCall } = useCallContext();

  if (!outgoingCall) return null;

  // Auto-generate avatar if none provided
  const displayName = outgoingCall.receiverName || outgoingCall.receiverId;
  const avatarUrl = outgoingCall.receiverAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3B58F5&color=fff&size=128`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto">
      {/* 
        Web-optimized floating modal 
        Using the deep blue #1D2A54 from the mobile design 
      */}
      <div className="relative w-[380px] overflow-hidden rounded-[2.5rem] bg-[#1D2A54] p-8 shadow-[0_0_80px_rgba(29,42,84,0.6)] border border-white/10 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 ease-out flex flex-col items-center">
        
        {/* Subtle background glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#3B58F5] opacity-20 blur-[80px] rounded-full pointer-events-none" />

        {/* Top Header */}
        <div className="flex w-full items-center justify-center mb-10 z-10">
          <span className="px-4 py-1.5 rounded-full bg-white/10 text-white/90 text-xs font-semibold tracking-wider uppercase backdrop-blur-md border border-white/5 shadow-sm animate-pulse">
            Calling ({outgoingCall.callType.toLowerCase()})...
          </span>
        </div>

        {/* Pulsing Avatar Area */}
        <div className="relative mb-8 z-10">
          {/* Outer pulsing ring */}
          <div className="absolute inset-0 rounded-full border-2 border-[#3B58F5] animate-ping opacity-75" style={{ animationDuration: '2s' }} />
          {/* Inner solid ring */}
          <div className="absolute -inset-4 rounded-full border-2 border-[#3B58F5]/50 animate-pulse" />
          
          <img 
            src={avatarUrl} 
            alt={displayName}
            className="relative h-28 w-28 rounded-full object-cover border-4 border-[#1D2A54] shadow-xl"
          />
        </div>
        
        {/* Receiver Info */}
        <div className="flex flex-col items-center text-center z-10 mb-12 w-full">
          <h2 className="text-[26px] font-bold text-white tracking-tight truncate w-full px-4">
            {displayName}
          </h2>
          <p className="mt-1.5 text-sm font-medium text-white/60">
            Ringing...
          </p>
        </div>
        
        {/* Bottom Action Bar (Pill shaped like the mobile design) */}
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
