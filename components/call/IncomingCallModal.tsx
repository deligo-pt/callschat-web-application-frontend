"use client";

import React, { useState, useEffect } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";
import { useCallContext } from "@/components/providers/CallContext";
import { cn } from "@/lib/utils";

export const IncomingCallModal = () => {
  const { incomingCall, acceptCall, rejectCall } = useCallContext();
  const [callerName, setCallerName] = useState<string>("");
  const [callerAvatar, setCallerAvatar] = useState<string>("");

  useEffect(() => {
    if (!incomingCall?.callerId) return;

    const fetchCallerProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1";
        
        // Try fetching all users to find the caller
        const res = await fetch(`${baseUrl}/user/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        
        if (data.success && Array.isArray(data.data)) {
          const caller = data.data.find((u: any) => u.id === incomingCall.callerId);
          if (caller) {
            const firstName = caller.profile?.firstName || "";
            const lastName = caller.profile?.lastName || "";
            const fullName = `${firstName} ${lastName}`.trim();
            const displayName = caller.profile?.displayName || fullName || caller.username || "Anonymous";
            setCallerName(displayName);
            setCallerAvatar(caller.profile?.avatarUrl || "");
          }
        }
      } catch (err) {
        console.error("Failed to fetch caller profile", err);
      }
    };

    fetchCallerProfile();
  }, [incomingCall?.callerId]);

  if (!incomingCall) return null;

  const displayName = callerName || incomingCall.callerId;
  const avatarUrl = callerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3B58F5&color=fff&size=128`;

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
          <span className="px-4 py-1.5 rounded-full bg-white/10 text-white/90 text-xs font-semibold tracking-wider uppercase backdrop-blur-md border border-white/5 shadow-sm">
            Incoming {incomingCall.callType.toLowerCase()} call
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
        
        {/* Caller Info */}
        <div className="flex flex-col items-center text-center z-10 mb-12 w-full">
          <h2 className="text-[26px] font-bold text-white tracking-tight truncate w-full px-4">
            {displayName}
          </h2>
          <p className="mt-1.5 text-sm font-medium text-white/60">
            CallsChat Call
          </p>
        </div>
        
        {/* Bottom Action Bar (Pill shaped like the mobile design) */}
        <div className="flex w-full justify-between items-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 z-10 shadow-inner shadow-white/5">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                rejectCall(incomingCall.callId, incomingCall.roomName);
              }}
              className="group flex h-14 w-14 items-center justify-center rounded-full bg-red-500 transition-all hover:bg-red-600 hover:scale-105 active:scale-95 shadow-lg shadow-red-500/30"
              aria-label="Decline Call"
            >
              <PhoneOff className="h-6 w-6 text-white transition-transform group-hover:rotate-12" fill="currentColor" />
            </button>
            <span className="text-[11px] font-semibold text-white/70">Decline</span>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                acceptCall(incomingCall.callId, incomingCall.roomName);
              }}
              className="group flex h-16 w-16 items-center justify-center rounded-full bg-[#22C55E] transition-all hover:bg-[#16A34A] hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(34,197,94,0.4)] animate-bounce"
              aria-label="Accept Call"
            >
              {incomingCall.callType === "VIDEO" ? (
                <Video className="h-7 w-7 text-white" fill="currentColor" />
              ) : (
                <Phone className="h-7 w-7 text-white" fill="currentColor" />
              )}
            </button>
            <span className="text-[11px] font-semibold text-[#22C55E]">Accept</span>
          </div>
        </div>

      </div>
    </div>
  );
};
