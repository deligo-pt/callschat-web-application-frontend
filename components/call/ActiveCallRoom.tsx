"use client";

import React, { useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import { useCallContext } from "@/components/providers/CallContext";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  ArrowLeft,
  UserPlus,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ParticipantTile } from "./ParticipantTile";
import { InviteParticipantModal } from "./InviteParticipantModal";

// ---------------------------------------------------------------------------
// Inner layout — must be a child of <LiveKitRoom> so LiveKit hooks work
// ---------------------------------------------------------------------------

interface CustomCallLayoutProps {
  onOpenInvite: () => void;
}

const CustomCallLayout = ({ onOpenInvite }: CustomCallLayoutProps) => {
  const { activeCall, hangupCall, leaveGroupCall } = useCallContext();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();

  // -------------------------------------------------------------------------
  // Phase 5: Dynamic Grid Engine
  //
  // useTracks() automatically re-renders whenever a participant joins or
  // leaves, so the grid reflows seamlessly when the 3rd (or 4th) participant
  // joins via the escalated invite flow.
  //
  // We subscribe to Camera tracks (with placeholder so offline-camera users
  // still occupy a tile) and ScreenShare tracks (no placeholder — only show
  // when someone is actively sharing).
  // -------------------------------------------------------------------------
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  // Auto-scaling grid algorithm
  let gridClass =
    "grid gap-3 w-full h-full pb-32 pt-24 px-4 transition-all duration-300";

  if (tracks.length === 1) {
    // 1 Participant: Full viewport
    gridClass += " grid-cols-1 grid-rows-1";
  } else if (tracks.length === 2) {
    // 2 Participants: Stack on mobile, side-by-side on desktop
    gridClass += " grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1";
  } else if (tracks.length <= 4) {
    // 3–4 Participants: Uniform 2×2
    gridClass += " grid-cols-2 grid-rows-2";
  } else {
    // 5+ Participants: 3-column mosaic with vertical scroll
    gridClass +=
      " grid-cols-2 md:grid-cols-3 auto-rows-[minmax(200px,1fr)] overflow-y-auto";
  }

  // Call duration timer
  const [duration, setDuration] = React.useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleEndCall = () => {
    if (activeCall?.isGroup && leaveGroupCall) {
      leaveGroupCall(activeCall.callId);
    } else if (activeCall) {
      hangupCall(activeCall.callId);
    }
  };

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[#0A0F24]">

      {/* ─── Top Header ─── */}
      <div className="absolute left-0 top-0 z-40 flex w-full items-center justify-between p-4 md:p-6 bg-gradient-to-b from-black/60 to-transparent">
        <button
          onClick={handleEndCall}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-[#3B58F5] transition-all hover:bg-white/20 backdrop-blur-md"
          aria-label="Back / End call"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center">
          <h2 className="text-sm font-bold tracking-wide text-[#3B58F5]">
            {activeCall?.isGroup ? "Group Call" : "Call"}
          </h2>
          <p className="text-xs font-semibold text-[#3B58F5]">
            {formatDuration(duration)}
          </p>
        </div>

        <div className="flex gap-2 md:gap-4">
          {/* Phase 3: Add Participant button — hidden for group calls (already multi-party) */}
          {!activeCall?.isGroup && (
            <button
              onClick={onOpenInvite}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-[#3B58F5] transition-all hover:bg-[#3B58F5]/30 hover:text-white backdrop-blur-md"
              title="Add participant"
              aria-label="Invite someone to this call"
            >
              <UserPlus className="h-4 w-4" />
            </button>
          )}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-[#3B58F5] transition-all hover:bg-white/20 backdrop-blur-md"
            aria-label="More options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ─── Dynamic Participant Grid ─── */}
      <div className={cn("absolute inset-0 z-0", gridClass)}>
        {tracks.map((trackRef, idx) => (
          <ParticipantTile
            key={`${trackRef.participant.identity}-${trackRef.source}-${idx}`}
            trackRef={trackRef}
          />
        ))}
      </div>

      {/* ─── Floating Control Dock ─── */}
      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center justify-center gap-6 rounded-[2rem] bg-[#111936]/80 px-8 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl border border-white/5">

        {/* Toggle Camera */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300",
              isCameraEnabled
                ? "bg-[#3B58F5] text-white shadow-lg shadow-[#3B58F5]/30"
                : "bg-white/10 text-white/60 hover:bg-white/20",
            )}
            aria-label={isCameraEnabled ? "Turn off camera" : "Turn on camera"}
          >
            {isCameraEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
          </button>
          <span className="text-[11px] font-medium text-white/50">Video</span>
        </div>

        {/* Toggle Mic */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300",
              isMicrophoneEnabled
                ? "bg-[#3B58F5] text-white shadow-lg shadow-[#3B58F5]/30"
                : "bg-white/10 text-white/60 hover:bg-white/20",
            )}
            aria-label={isMicrophoneEnabled ? "Mute" : "Unmute"}
          >
            {isMicrophoneEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </button>
          <span className="text-[11px] font-medium text-white/50">Mic</span>
        </div>

        {/* End Call */}
        <div className="flex flex-col items-center gap-1.5 ml-2">
          <button
            onClick={handleEndCall}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white transition-all duration-300 hover:scale-105 hover:bg-red-600 active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
            aria-label="End call"
          >
            <PhoneOff className="h-6 w-6" fill="currentColor" />
          </button>
          <span className="text-[11px] font-medium text-red-400">End</span>
        </div>

      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// ActiveCallRoom — public export
// Wraps <LiveKitRoom> and passes the invite modal state into the inner layout
// ---------------------------------------------------------------------------

export const ActiveCallRoom = () => {
  const { activeCall, hangupCall, leaveGroupCall, onLiveKitDisconnected } = useCallContext();
  const [inviteOpen, setInviteOpen] = useState(false);

  if (!activeCall) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black pointer-events-auto">
      <LiveKitRoom
        video={activeCall.callType === "VIDEO"}
        audio={true}
        token={activeCall.token}
        serverUrl={activeCall.serverUrl}
        connect={true}
        onDisconnected={onLiveKitDisconnected}
        className="w-full h-full"
      >
        {/* Phase 5: CustomCallLayout uses useTracks() which reflows the grid
            automatically when a 3rd participant joins via the escalated invite.
            Camera/mic state is managed by LiveKit internally and is unaffected
            by participant count changes. */}
        <CustomCallLayout onOpenInvite={() => setInviteOpen(true)} />

        {/* System Integrity Control: renders remote audio tracks */}
        <RoomAudioRenderer />

        {/* Phase 2+3: Invite modal — lives inside <LiveKitRoom> so that
            useParticipants() inside InviteParticipantModal works correctly */}
        {!activeCall.isGroup && (
          <InviteParticipantModal
            open={inviteOpen}
            onClose={() => setInviteOpen(false)}
            roomId={activeCall.roomName}
            callType={activeCall.callType}
          />
        )}
      </LiveKitRoom>
    </div>
  );
};
