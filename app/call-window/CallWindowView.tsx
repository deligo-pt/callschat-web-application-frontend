"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import { ActiveCall } from "@/hooks/useCallSignaling";
import { callBroadcast } from "@/utils/callBroadcast";
import { resolveLivekitUrl } from "@/utils/livekit";
import { CustomCallLayout } from "@/components/call/ActiveCallRoom";
import { InviteParticipantModal } from "@/components/call/InviteParticipantModal";
import { CallContext, CallContextType } from "@/components/providers/CallContext";
import { PhoneOff, Loader2, ArrowDownLeft, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CallWindowView() {
  // Synchronously initialize from localStorage cache in pure client context
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(() => {
    return callBroadcast.getSavedActiveCall();
  });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const isClosingIntentionallyRef = useRef(false);

  // Initialize and synchronize activeCall via BroadcastChannel
  useEffect(() => {
    // 1. Check local storage again in case it updated
    const cachedCall = callBroadcast.getSavedActiveCall();
    if (cachedCall && !activeCall) {
      setActiveCall(cachedCall);
    }

    // 2. Announce that standalone window is ready
    callBroadcast.send({ type: "WINDOW_READY" });

    // 3. Subscribe to broadcast events from main tab
    const unsubscribe = callBroadcast.subscribe((event) => {
      if (event.type === "SYNC_ACTIVE_CALL") {
        setActiveCall(event.payload);
      } else if (event.type === "CALL_ENDED") {
        isClosingIntentionallyRef.current = true;
        setIsExiting(true);
        setTimeout(() => {
          window.close();
        }, 120);
      } else if (event.type === "RETURN_TO_MAIN") {
        isClosingIntentionallyRef.current = true;
        setIsExiting(true);
        setTimeout(() => {
          window.close();
        }, 120);
      }
    });

    return unsubscribe;
  }, [activeCall]);

  // Update browser window title dynamically
  useEffect(() => {
    if (activeCall) {
      const typeLabel = activeCall.callType.toLowerCase();
      const peerLabel = activeCall.isGroup
        ? "Group Call"
        : activeCall.peerName || "In Call";
      document.title = `(${typeLabel}) ${peerLabel} - CallsChat`;
    } else {
      document.title = "CallsChat Call";
    }
  }, [activeCall]);

  // Return call back to main chat tab with smooth opener focus
  const handleReturnToMain = useCallback(() => {
    if (isClosingIntentionallyRef.current) return;
    isClosingIntentionallyRef.current = true;

    // 1. Focus parent main window smoothly so focus doesn't drop to desktop
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.focus();
      } catch (err) {
        console.warn("Could not focus parent window", err);
      }
    }

    // 2. Broadcast return event to restore LiveKit in the main tab immediately
    callBroadcast.send({ type: "RETURN_TO_MAIN" });

    // 3. Smooth fade-out before window close
    setIsExiting(true);
    setTimeout(() => {
      window.close();
    }, 120);
  }, []);

  // Hangup call completely across both windows
  const handleEndCall = useCallback(() => {
    if (isClosingIntentionallyRef.current) return;
    isClosingIntentionallyRef.current = true;

    callBroadcast.send({ type: "HANGUP", callId: activeCall?.callId });

    if (window.opener && !window.opener.closed) {
      try {
        window.opener.focus();
      } catch (err) {
        console.warn("Could not focus parent window", err);
      }
    }

    setIsExiting(true);
    setTimeout(() => {
      window.close();
    }, 120);
  }, [activeCall?.callId]);

  // Keyboard shortcut: Escape returns to main window
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === "Escape") {
        e.preventDefault();
        handleReturnToMain();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleReturnToMain]);

  // Graceful fallback if window is closed via the OS 'X' close button
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isClosingIntentionallyRef.current) {
        callBroadcast.send({ type: "RETURN_TO_MAIN" });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Fallback CallContext so all internal buttons work seamlessly
  const mockCallContext: CallContextType = {
    activeCall,
    hangupCall: handleEndCall,
    leaveGroupCall: handleEndCall,
    isCallMinimized: false,
    setIsCallMinimized: () => {},
    isCallPoppedOut: true,
    setIsCallPoppedOut: () => {},
    popOutCallWindow: () => {},
    returnCallToMain: handleReturnToMain,
    onLiveKitDisconnected: () => {},
    reconnectingUserId: null,
    isAwaitingLocalReconnect: false,
    incomingCall: null,
    outgoingCall: null,
    outgoingCallStatus: "CALLING",
    callWaiting: null,
    incomingGroupCall: null,
    outgoingGroupCall: null,
    activeGroupCalls: [],
    initiateCall: () => {},
    acceptCall: () => {},
    acceptEscalatedCall: async () => {},
    rejectCall: () => {},
    acceptCallWaiting: () => {},
    declineCallWaiting: () => {},
    cancelOutgoingCall: () => {},
    startGroupCall: () => {},
    cancelGroupCall: () => {},
    acceptGroupCall: () => {},
    rejectGroupCall: () => {},
    joinGroupCall: () => {},
  };

  // Connecting state if active call data is still propagating
  if (!activeCall) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0C1317] text-[#E9EDEF] p-6 select-none animate-in fade-in duration-200">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#202C33] border border-white/10 shadow-xl">
            <Loader2 className="h-8 w-8 text-[#00A884] animate-spin" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#E9EDEF]">Connecting Call Window...</h1>
            <p className="text-sm text-[#8696A0] mt-1">
              Synchronizing with your CallsChat session.
            </p>
          </div>
          <button
            onClick={() => window.close()}
            className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#202C33] hover:bg-[#2A3942] text-sm font-semibold text-[#8696A0] hover:text-white transition-colors cursor-pointer border border-white/10"
          >
            <PhoneOff className="h-4 w-4 text-red-500" />
            <span>Cancel & Close</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <CallContext.Provider value={mockCallContext}>
      <div
        className={cn(
          "h-screen w-screen overflow-hidden bg-[#0C1317] select-none transition-all duration-150 relative",
          isExiting ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
        )}
      >
        {/* Sleek Native Titlebar Ribbon for Standalone Window */}
        <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-auto">
          {/* Left: Encryption badge */}
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
            <Lock className="h-3 w-3 text-[#00A884]" />
            <span className="text-[11px] font-medium text-[#8696A0]">End-to-End Encrypted</span>
          </div>

          {/* Right: Quick Return to Tab Button */}
          <button
            onClick={handleReturnToMain}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#202C33]/90 hover:bg-[#2A3942] text-[#E9EDEF] hover:text-[#25D366] text-xs font-medium border border-white/10 transition-all duration-200 shadow-md cursor-pointer active:scale-95"
            title="Return call to main browser tab (Esc)"
          >
            <ArrowDownLeft className="h-3.5 w-3.5 text-[#25D366]" />
            <span>Dock to Tab</span>
            <kbd className="hidden sm:inline text-[9px] bg-white/10 px-1 py-0.5 rounded text-[#8696A0]">Esc</kbd>
          </button>
        </header>

        <LiveKitRoom
          key={activeCall.token}
          video={activeCall.callType === "VIDEO"}
          audio={true}
          token={activeCall.token}
          serverUrl={resolveLivekitUrl(activeCall.serverUrl)}
          connect={true}
          onError={(error) => {
            console.warn("[LiveKit Popup] Room connection notice:", error);
          }}
          className="w-full h-full"
        >
          <CustomCallLayout
            inviteOpen={inviteOpen}
            onOpenInvite={() => setInviteOpen(true)}
            onCloseInvite={() => setInviteOpen(false)}
            isSpeakerMuted={isSpeakerMuted}
            setIsSpeakerMuted={setIsSpeakerMuted}
            isStandaloneWindow={true}
            onReturnToMain={handleReturnToMain}
            onEndCallOverride={handleEndCall}
          />

          <RoomAudioRenderer muted={isSpeakerMuted} />

          <InviteParticipantModal
            open={inviteOpen}
            onClose={() => setInviteOpen(false)}
            roomId={activeCall.roomName}
            callType={activeCall.callType}
          />
        </LiveKitRoom>
      </div>
    </CallContext.Provider>
  );
}
