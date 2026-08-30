"use client";

import React, { useState, useEffect } from "react";
import { Phone, PhoneOff, Video, UserPlus, Lock } from "lucide-react";
import { useCallContext } from "@/components/providers/CallContext";
import { cn } from "@/lib/utils";
import { getOptimizedImageUrl } from "@/utils/image";

export const IncomingCallModal = () => {
  const { incomingCall, acceptCall, acceptEscalatedCall, rejectCall, joinGroupCall } =
    useCallContext();
  const [callerName, setCallerName] = useState<string>("");
  const [callerAvatar, setCallerAvatar] = useState<string>("");
  const [isAccepting, setIsAccepting] = useState(false);

  // Reset per-call local state whenever a new call arrives
  useEffect(() => {
    setIsAccepting(false);
  }, [incomingCall?.callId]);

  useEffect(() => {
    if (incomingCall?.callerName) {
      setCallerName(incomingCall.callerName);
    }
    if (incomingCall?.callerAvatar) {
      setCallerAvatar(getOptimizedImageUrl(incomingCall.callerAvatar, 80, 80));
    }

    // If both name and avatar are provided, skip fetch
    if (incomingCall?.callerName && incomingCall?.callerAvatar) {
      return;
    }
    if (!incomingCall?.callerId) return;

    const fetchCallerProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1";

        const res = await fetch(`${baseUrl}/user/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          const caller = data.data.find((u: any) => u.id === incomingCall.callerId);
          if (caller) {
            const fullName = `${caller.profile?.firstName || ""} ${caller.profile?.lastName || ""}`.trim();
            const displayName =
              fullName ||
              caller.profile?.displayName ||
              caller.username ||
              "Anonymous";
            if (!incomingCall.callerName) {
              setCallerName(displayName);
            }
            if (!incomingCall.callerAvatar && caller.profile?.avatarUrl) {
              setCallerAvatar(getOptimizedImageUrl(caller.profile.avatarUrl, 80, 80));
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch caller profile", err);
      }
    };

    fetchCallerProfile();
  }, [incomingCall?.callerId, incomingCall?.callerName, incomingCall?.callerAvatar]);

  if (!incomingCall) return null;

  const isEscalated = Boolean(incomingCall.isEscalatedCall);
  const displayName = callerName || incomingCall.callerId;
  const avatarUrl =
    callerAvatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=00A884&color=fff&size=128`;

  // ------------------------------------------------------------------
  // Accept handler – diverges based on escalation flag
  // ------------------------------------------------------------------
  const handleAccept = async () => {
    if (isAccepting) return;
    setIsAccepting(true);

    try {
      if (isEscalated) {
        // Phase 4: Escalated path — hit REST token API, skip call:accept socket event
        await acceptEscalatedCall(
          incomingCall.roomName,
          incomingCall.callType,
          callerName || undefined,
          callerAvatar || undefined,
        );
      } else if (incomingCall.isGroup && incomingCall.groupId) {
        joinGroupCall(incomingCall.groupId);
        rejectCall(incomingCall.callId, incomingCall.roomName, true);
      } else {
        acceptCall(incomingCall.callId, incomingCall.roomName, callerName || undefined, callerAvatar || undefined);
      }
    } finally {
      // If we are still mounted (e.g. token fetch failed), reset the spinner
      setIsAccepting(false);
    }
  };

  // ------------------------------------------------------------------
  // Decline handler – no socket emit for escalated invites
  // ------------------------------------------------------------------
  const handleDecline = () => {
    rejectCall(
      incomingCall.callId,
      incomingCall.roomName,
      incomingCall.isGroup,
      isEscalated,
    );
  };

  // Label variants
  const callLabel = isEscalated
    ? "Inviting you to join"
    : `Incoming ${incomingCall.isGroup ? "Group " : ""}${incomingCall.callType.toLowerCase()} call`;

  const subtitleLabel = isEscalated
    ? "Active call · tap to join"
    : incomingCall.isGroup
    ? "Group Call"
    : "CallsChat Call";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto">
      <div className="relative w-[380px] overflow-hidden rounded-[2.5rem] bg-[#111B21] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.8)] border border-white/10 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 ease-out flex flex-col items-center">

        {/* Subtle background emerald aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#25D366]/20 blur-[90px] rounded-full pointer-events-none" />

        {/* Escalated call indicator ribbon */}
        {isEscalated && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 z-10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[11px] font-semibold text-emerald-300 tracking-wide">LIVE</span>
          </div>
        )}

        {/* Top Header with E2EE Notice & Badge */}
        <div className="flex flex-col items-center gap-2 mb-8 z-10 w-full">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#8696A0] bg-white/5 px-3 py-1 rounded-full border border-white/5">
            <Lock className="w-3 h-3 text-[#00A884]" />
            <span>End-to-End Encrypted</span>
          </div>
          <span className="px-3.5 py-1 rounded-full bg-[#00A884]/15 text-[#25D366] text-[11.5px] font-semibold tracking-wide uppercase backdrop-blur-md border border-[#00A884]/30 shadow-xs animate-pulse">
            {callLabel}
          </span>
        </div>

        {/* Avatar with Concentric Radar Pulse Rings */}
        <div className="relative mb-8 z-10">
          <div className="absolute inset-0 rounded-full border-2 border-[#25D366] animate-ping opacity-60" style={{ animationDuration: '2s' }} />
          <div className="absolute -inset-4 rounded-full border-2 border-[#00A884]/60 animate-pulse" />
          <img
            src={getOptimizedImageUrl(avatarUrl)}
            alt={displayName}
            className="relative h-28 w-28 rounded-full object-cover border-4 border-[#111B21] shadow-2xl bg-[#202C33]"
          />
          {/* UserPlus badge for escalated invitations */}
          {isEscalated ? (
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] border-2 border-[#111B21] shadow-lg text-white">
              <UserPlus className="h-4 w-4" />
            </div>
          ) : (
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#00A884] border-2 border-[#111B21] text-white shadow-md">
              {incomingCall.callType === "VIDEO" ? <Video className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" fill="currentColor" />}
            </div>
          )}
        </div>

        {/* Caller Info */}
        <div className="flex flex-col items-center text-center z-10 mb-10 w-full">
          <h2 className="text-[24px] font-bold text-[#E9EDEF] tracking-tight truncate w-full px-4">
            {displayName}
          </h2>
          <p className="mt-1 text-[13.5px] font-medium text-[#8696A0]">{subtitleLabel}</p>
        </div>

        {/* Action Bar */}
        <div className="flex w-full justify-between items-center bg-[#202C33]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-4 z-10 shadow-inner shadow-white/5">

          {/* Decline */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={handleDecline}
              disabled={isAccepting}
              className="group flex h-14 w-14 items-center justify-center rounded-full bg-[#EA0038] transition-all hover:bg-[#d00030] hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(234,0,56,0.4)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Decline"
            >
              <PhoneOff className="h-6 w-6 text-white transition-transform group-hover:rotate-12" fill="currentColor" />
            </button>
            <span className="text-[11.5px] font-medium text-red-400">
              {isEscalated ? "Ignore" : "Decline"}
            </span>
          </div>

          {/* Accept */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={handleAccept}
              disabled={isAccepting}
              className={cn(
                "group flex h-15 w-15 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 animate-bounce disabled:animate-none cursor-pointer bg-[#25D366] hover:bg-[#20bd5a] shadow-[0_0_30px_rgba(37,211,102,0.45)]",
                isAccepting && "opacity-70 cursor-not-allowed",
              )}
              aria-label="Accept"
            >
              {isAccepting ? (
                <svg className="h-7 w-7 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : isEscalated ? (
                <UserPlus className="h-7 w-7 text-white" />
              ) : incomingCall.callType === "VIDEO" ? (
                <Video className="h-7 w-7 text-white" fill="currentColor" />
              ) : (
                <Phone className="h-7 w-7 text-white" fill="currentColor" />
              )}
            </button>
            <span className="text-[11.5px] font-semibold text-[#25D366]">
              {isAccepting ? "Joining..." : isEscalated ? "Join Call" : "Accept"}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

