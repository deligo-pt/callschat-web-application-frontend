"use client";

import React, { useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useRemoteParticipants,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import { useCallContext } from "@/components/providers/CallContext";
import { useContacts } from "@/hooks/useContacts";
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
import { InviteParticipantSidebar } from "./InviteParticipantSidebar";

// ---------------------------------------------------------------------------
// Inner layout — must be a child of <LiveKitRoom> so LiveKit hooks work
// ---------------------------------------------------------------------------

interface CustomCallLayoutProps {
  inviteOpen: boolean;
  onOpenInvite: () => void;
  onCloseInvite: () => void;
}

const CustomCallLayout = ({ inviteOpen, onOpenInvite, onCloseInvite }: CustomCallLayoutProps) => {
  const { activeCall, hangupCall, leaveGroupCall, onLiveKitDisconnected } = useCallContext();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const { contacts } = useContacts();

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

  const anyoneHasCamera = tracks.some(
    (t) => t.source === Track.Source.Camera && t.participant.isCameraEnabled,
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Shared control dock
  // ─────────────────────────────────────────────────────────────────────────
  const ControlDock = ({ compact = false }: { compact?: boolean }) => (
    <div className={cn(
      "flex items-center justify-center gap-5",
      compact
        ? "absolute bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-[2rem] bg-[#111936]/80 px-8 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl border border-white/5"
        : "absolute bottom-10 left-1/2 z-50 flex -translate-x-1/2 rounded-[2rem] bg-[#223263]/90 px-8 py-5 shadow-2xl backdrop-blur-xl border border-white/10",
    )}>
      <div className="flex flex-col items-center gap-1.5">
        <button
          onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
          className={cn(
            "flex h-[60px] w-[60px] items-center justify-center rounded-full transition-all duration-300",
            isCameraEnabled
              ? "bg-[#3B58F5] text-white shadow-lg shadow-[#3B58F5]/30"
              : "bg-white/10 text-white/80 hover:bg-white/20",
          )}
          aria-label={isCameraEnabled ? "Turn off camera" : "Turn on camera"}
        >
          {isCameraEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
        </button>
        <span className="text-[12px] font-medium text-white/50">Video</span>
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <button
          onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
          className={cn(
            "flex h-[60px] w-[60px] items-center justify-center rounded-full transition-all duration-300",
            isMicrophoneEnabled
              ? "bg-[#3B58F5] text-white shadow-lg shadow-[#3B58F5]/30"
              : "bg-white/10 text-white/80 hover:bg-white/20",
          )}
          aria-label={isMicrophoneEnabled ? "Mute" : "Unmute"}
        >
          {isMicrophoneEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
        </button>
        <span className="text-[12px] font-medium text-white/50">Mic</span>
      </div>

      <div className="flex flex-col items-center gap-1.5 ml-2">
        <button
          onClick={handleEndCall}
          className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#EF4444] text-white transition-all duration-300 hover:scale-105 hover:bg-red-600 active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
          aria-label="End call"
        >
          <PhoneOff className="h-6 w-6" fill="currentColor" />
        </button>
        <span className="text-[12px] font-medium text-[#EF4444]">End</span>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // AUDIO CALL UI
  // ─────────────────────────────────────────────────────────────────────────
  if (activeCall?.callType === "AUDIO") {
    const remoteParticipants = useRemoteParticipants();
    const allParticipants = [localParticipant, ...remoteParticipants];
    
    const remotePeer = remoteParticipants[0];
    
    // Seed from the stored peer info (captured at call initiation/reception)
    let singlePeerName = activeCall.peerName || "Unknown";
    let singleAvatarUrl = activeCall.peerAvatar || "";
    
    if (remotePeer) {
      // Only override if we have better data from the live participant
      const liveName = remotePeer.name || remotePeer.identity || "";
      try {
        const metadata = JSON.parse(remotePeer.metadata || "{}");
        if (metadata.avatarUrl) singleAvatarUrl = metadata.avatarUrl;
        if (metadata.firstName || metadata.lastName) {
          singlePeerName = `${metadata.firstName || ""} ${metadata.lastName || ""}`.trim();
        } else if (metadata.displayName) {
          singlePeerName = metadata.displayName;
        } else if (liveName && liveName !== remotePeer.identity && singlePeerName === "Unknown") {
          singlePeerName = liveName;
        }
      } catch (e) {}
      
      // Fallback to contacts lookup if name is still just the raw identity
      if (!singlePeerName || singlePeerName === remotePeer.identity || singlePeerName === "Unknown") {
        const contact = contacts.find(c => c.userId === remotePeer.identity);
        if (contact) {
          singlePeerName = contact.name;
          if (!singleAvatarUrl && contact.avatarUrl) {
            singleAvatarUrl = contact.avatarUrl;
          }
        }
      } else if (!singleAvatarUrl) {
        const contact = contacts.find(c => c.userId === remotePeer.identity);
        if (contact?.avatarUrl) singleAvatarUrl = contact.avatarUrl;
      }
    } else {
      // Remote hasn't joined yet — look up from contacts as fallback
      // (we don't know the peer userId here, but peerName is already set from context)
    }

    const finalSingleAvatarUrl = singleAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(singlePeerName)}&background=3B58F5&color=fff&size=256`;

    // ── Messenger-style camera upgrade: someone turned on video ──────────────
    if (anyoneHasCamera) {
      return (
        <div className="relative flex h-[100dvh] w-full overflow-hidden bg-[#0A0F24]">
          {/* Sidebar */}
          <div className={cn(
            "transition-all duration-300 ease-in-out z-50",
            inviteOpen ? "w-[360px] opacity-100" : "w-0 opacity-0 overflow-hidden",
          )}>
            <InviteParticipantSidebar open={inviteOpen} onClose={onCloseInvite} roomId={activeCall.roomName} callType={activeCall.callType} />
          </div>

          <div className="flex-1 relative h-full">
            {/* Header */}
            <div className="absolute left-0 top-0 z-40 flex w-full items-center justify-between p-6 bg-gradient-to-b from-black/60 to-transparent">
              <button onClick={handleEndCall} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-md">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex flex-col items-center">
                <p className="text-xs font-semibold text-white/70 bg-[#3B58F5]/40 px-3 py-1 rounded-full">📷 Video On · {formatDuration(duration)}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={onOpenInvite} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-md">
                  <UserPlus className="h-5 w-5" />
                </button>
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-md">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Video grid */}
            <div className={cn("absolute inset-0 z-0", gridClass)}>
              {tracks.map((trackRef, idx) => (
                <ParticipantTile key={`${trackRef.participant.identity}-${trackRef.source}-${idx}`} trackRef={trackRef} />
              ))}
            </div>

            <ControlDock />
          </div>
        </div>
      );
    }

    // ── Default: avatar layout ───────────────────────────────────────────────
    return (
      <div className="relative flex h-[100dvh] w-full overflow-hidden bg-[#1D2A54]">

        
        {/* ─── Add Friends Sidebar (Slide in from left) ─── */}
        <div className={cn(
          "transition-all duration-300 ease-in-out z-50",
          inviteOpen ? "w-[360px] opacity-100 translate-x-0" : "w-0 opacity-0 -translate-x-full overflow-hidden"
        )}>
          <InviteParticipantSidebar 
            open={inviteOpen} 
            onClose={onCloseInvite} 
            roomId={activeCall.roomName} 
            callType={activeCall.callType} 
          />
        </div>

        {/* ─── Main Content Area ─── */}
        <div className="flex-1 relative flex flex-col h-full transition-all duration-300">
          
          {/* ─── Top Header ─── */}
          <div className="absolute left-0 top-0 z-40 flex w-full items-center justify-between p-6">
            <button
              onClick={handleEndCall}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition-all hover:bg-white/30 backdrop-blur-md"
              aria-label="Back / End call"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
    
            <div className="flex flex-col items-center">
               <h2 className="text-[20px] font-bold tracking-wide text-white">
                 {activeCall?.isGroup ? "Call" : ""}
               </h2>
               <p className="text-[13px] font-medium text-white/70">
                 {formatDuration(duration)}
               </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={onOpenInvite}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 backdrop-blur-md"
                title="Add participant"
                aria-label="Invite someone to this call"
              >
                <UserPlus className="h-5 w-5" />
              </button>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 backdrop-blur-md"
                aria-label="More options"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          </div>
    
          {/* ─── Center Content (Avatar, Name, Timer) ─── */}
          <div className="flex flex-1 flex-col items-center justify-center pt-10 px-8 pb-32">
            {!activeCall.isGroup && remoteParticipants.length <= 1 ? (
              // 1-on-1 Layout
              <div className="flex flex-col items-center justify-center">
                <div className="relative mb-6">
                  <div className="absolute -inset-2 rounded-full bg-[#3B58F5] opacity-60 blur-lg animate-pulse"></div>
                  <img 
                    src={finalSingleAvatarUrl} 
                    alt="Avatar" 
                    className="relative h-44 w-44 rounded-full object-cover border-[3px] border-[#3B58F5] shadow-2xl"
                  />
                </div>
                <h1 className="text-[32px] font-bold text-white tracking-wide mb-2 mt-4 text-center px-4">
                  {singlePeerName}
                </h1>
                <p className="text-[13px] font-medium text-white/50 mt-1">{formatDuration(duration)}</p>
                {/* Messenger-style: tap to turn on camera */}
                <button
                  onClick={() => localParticipant.setCameraEnabled(true)}
                  className="mt-5 flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-[13px] font-semibold text-white/70 hover:bg-[#3B58F5]/40 hover:text-white transition-all"
                >
                  <Video className="h-4 w-4" />
                  Turn on camera
                </button>
              </div>
            ) : (
              // Group Layout (Grid of Avatars)
              <div className="w-full max-w-3xl grid grid-cols-2 md:grid-cols-2 gap-y-12 gap-x-8 items-center justify-items-center">
                {allParticipants.map((p, idx) => {
                  const isLocal = p.identity === localParticipant.identity;
                  let name = isLocal ? "You" : p.name || p.identity || "Unknown";
                  let pAvatar = "";
                  if (!isLocal) {
                    try {
                       const meta = JSON.parse(p.metadata || "{}");
                       pAvatar = meta.avatarUrl || "";
                       if (meta.firstName || meta.lastName) {
                         name = `${meta.firstName || ""} ${meta.lastName || ""}`.trim();
                       } else if (meta.displayName) {
                         name = meta.displayName;
                       }
                    } catch(e) {}
                  } else {
                     // Try to get local user avatar if needed, else fallback
                  }
                  
                  if (!isLocal && (name === p.identity || name === "Unknown" || name === p.name || !pAvatar)) {
                    const contact = contacts.find(c => c.userId === p.identity);
                    if (contact) {
                      if (!name || name === p.identity || name === "Unknown" || name === p.name) {
                        name = contact.name;
                      }
                      if (!pAvatar && contact.avatarUrl) {
                        pAvatar = contact.avatarUrl;
                      }
                    }
                  }
                  
                  const av = pAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(isLocal ? "Y" : name)}&background=3B58F5&color=fff&size=256`;

                  return (
                    <div key={p.identity || idx} className="flex flex-col items-center">
                       <div className="relative mb-4">
                          <img 
                            src={av} 
                            alt={name} 
                            className="relative h-32 w-32 md:h-40 md:w-40 rounded-full object-cover border-[3px] border-[#3B58F5] shadow-2xl"
                          />
                       </div>
                       <h2 className="text-[18px] md:text-[20px] font-bold text-white text-center">
                          {name}
                       </h2>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
    
          <ControlDock />
        </div>
      </div>
    );
  }

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

      <ControlDock compact />
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
        <CustomCallLayout 
           inviteOpen={inviteOpen} 
           onOpenInvite={() => setInviteOpen(true)} 
           onCloseInvite={() => setInviteOpen(false)}
        />

        {/* System Integrity Control: renders remote audio tracks */}
        <RoomAudioRenderer />

        {/* Fallback modal for VIDEO calls */}
        {!activeCall.isGroup && activeCall.callType === "VIDEO" && (
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
