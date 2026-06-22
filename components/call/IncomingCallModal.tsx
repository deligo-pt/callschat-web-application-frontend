"use client";

import React from "react";
import { Phone, PhoneOff, Video } from "lucide-react";
import { useCallContext } from "@/components/providers/CallContext";
import { cn } from "@/lib/utils";

export const IncomingCallModal = () => {
  const { incomingCall, acceptCall, rejectCall } = useCallContext();

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            {incomingCall.callType === "VIDEO" ? (
              <Video className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            ) : (
              <Phone className="h-10 w-10 text-blue-600 dark:text-blue-400 animate-pulse" />
            )}
          </div>
          
          <h2 className="mb-1 text-2xl font-bold text-zinc-900 dark:text-white">
            Incoming {incomingCall.callType.toLowerCase()} call
          </h2>
          <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
            From: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{incomingCall.callerId}</span>
          </p>
          
          <div className="flex w-full justify-center gap-6">
            <button
              onClick={() => rejectCall(incomingCall.callId)}
              className="group flex h-14 w-14 items-center justify-center rounded-full bg-red-500 transition-all hover:bg-red-600 hover:scale-105 active:scale-95 shadow-lg shadow-red-500/30"
              aria-label="Decline Call"
            >
              <PhoneOff className="h-6 w-6 text-white" fill="currentColor" />
            </button>
            
            <button
              onClick={() => acceptCall(incomingCall.callId)}
              className="group flex h-14 w-14 items-center justify-center rounded-full bg-green-500 transition-all hover:bg-green-600 hover:scale-105 active:scale-95 shadow-lg shadow-green-500/30 animate-bounce"
              aria-label="Accept Call"
            >
              <Phone className="h-6 w-6 text-white" fill="currentColor" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
