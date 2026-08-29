"use client";

import React, { useState, useEffect } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useRemoteParticipants,
  useTracks,
  useMediaDeviceSelect,
  useConnectionState,
} from "@livekit/components-react";
import { Track, ConnectionState } from "livekit-client";
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
  Volume2,
  VolumeX,
  ChevronDown,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ParticipantTile } from "./ParticipantTile";
import { InviteParticipantModal } from "./InviteParticipantModal";
import { getOptimizedImageUrl } from "@/utils/image";

// ---------------------------------------------------------------------------
// Inner layout — must be a child of <LiveKitRoom> so LiveKit hooks work
// ---------------------------------------------------------------------------

interface CustomCallLayoutProps {
  inviteOpen: boolean;
  onOpenInvite: () => void;
  onCloseInvite: () => void;
  isSpeakerMuted: boolean;
  setIsSpeakerMuted: (muted: boolean) => void;
}
const CustomCallLayout = ({ inviteOpen, onOpenInvite, onCloseInvite, isSpeakerMuted, setIsSpeakerMuted }: CustomCallLayoutProps) => {
  const { activeCall, hangupCall, leaveGroupCall, onLiveKitDisconnected, isCallMinimized, setIsCallMinimized, reconnectingUserId } = useCallContext();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const { contacts } = useContacts();

  const [groupMembers, setGroupMembers] = useState<any[]>([]);

  useEffect(() => {
    if (activeCall?.isGroup && activeCall.groupId) {
      const fetchGroupMembers = async () => {
        try {
          const token = localStorage.getItem("accessToken");
          if (!token) return;
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1";
          const res = await fetch(`${baseUrl}/groups/${activeCall.groupId}/members`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success && data.data && Array.isArray(data.data.members)) {
             setGroupMembers(data.data.members.map((m: any) => ({
               id: m.userId || m.id,
               name: m.user?.name || m.name || m.profile?.name || "Unknown",
               avatarUrl: m.user?.avatarUrl || m.avatarUrl || m.profile?.avatarUrl || null
             })));
          }
        } catch(err) {
          console.error("Failed to fetch group members", err);
        }
      };
      fetchGroupMembers();
    }
  }, [activeCall?.isGroup, activeCall?.groupId]);

  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({ 
    kind: 'videoinput',
    requestPermissions: activeCall?.callType === "VIDEO" || isCameraEnabled
  });

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

  const connectionState = useConnectionState();
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const { isAwaitingLocalReconnect } = useCallContext();

  const isLocalReconnecting = 
    connectionState === ConnectionState.Reconnecting || 
    connectionState === ConnectionState.Connecting ||
    isOffline ||
    isAwaitingLocalReconnect;

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
      "flex items-center justify-between",
      compact
        ? "absolute -bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-[44px] bg-white/5 px-8 py-5 shadow-[0_12px_50px_0_rgba(0,0,0,0.4),inset_0_1.5px_0_0_rgba(255,255,255,0.1)] backdrop-blur-xl border border-white/10 w-[95vw] max-w-[545px]"
        : "absolute bottom-10 left-1/2 z-50 flex -translate-x-1/2 rounded-[44px] bg-white/5 p-8 shadow-[0_12px_50px_0_rgba(0,0,0,0.4),inset_0_1.5px_0_0_rgba(255,255,255,0.1)] backdrop-blur-xl border border-white/10 w-full max-w-[545px]",
    )}>
      <div className="flex flex-col items-center gap-[12px]">
        <button
          onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
          className={cn(
            "flex h-[84px] w-[84px] items-center justify-center rounded-full transition-all duration-300",
            isCameraEnabled
              ? "bg-white/20 border-[1.7px] border-white/30 text-white shadow-[0_6px_9px_-6px_rgba(0,0,0,0.1),0_15.5px_23px_-4px_rgba(0,0,0,0.1)]"
              : "bg-white/10 border-[1.7px] border-white/20 text-white/80 hover:bg-white/20 shadow-[0_6px_9px_-6px_rgba(0,0,0,0.1),0_15.5px_23px_-4px_rgba(0,0,0,0.1)]",
          )}
          aria-label={isCameraEnabled ? "Turn off camera" : "Turn on camera"}
        >
          {isCameraEnabled ? <Video className="h-8 w-8" /> : <VideoOff className="h-8 w-8" />}
        </button>
        <span className="text-[15.5px] font-normal text-white/50">Video</span>
      </div>

      <div className="flex flex-col items-center gap-[12px]">
        <button
          onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
          className={cn(
            "flex h-[84px] w-[84px] items-center justify-center rounded-full transition-all duration-300",
            isMicrophoneEnabled
              ? "bg-[#2563EB] text-white shadow-[0_6px_9px_-6px_rgba(0,0,0,0.1),0_15.5px_23px_-4px_rgba(0,0,0,0.1)]"
              : "bg-white/10 border-[1.7px] border-white/20 text-white/80 hover:bg-white/20 shadow-[0_6px_9px_-6px_rgba(0,0,0,0.1),0_15.5px_23px_-4px_rgba(0,0,0,0.1)]",
          )}
          aria-label={isMicrophoneEnabled ? "Mute Mic" : "Unmute Mic"}
        >
          {isMicrophoneEnabled ? <Mic className="h-8 w-8" /> : <MicOff className="h-8 w-8" />}
        </button>
        <span className="text-[15.5px] font-normal text-white/50">Mic</span>
      </div>

      <div className="flex flex-col items-center gap-[12px]">
        <button
          onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
          className={cn(
            "flex h-[84px] w-[84px] items-center justify-center rounded-full transition-all duration-300",
            !isSpeakerMuted
              ? "bg-white/10 border-[1.7px] border-white/20 text-white hover:bg-white/20 shadow-[0_6px_9px_-6px_rgba(0,0,0,0.1),0_15.5px_23px_-4px_rgba(0,0,0,0.1)]"
              : "bg-[#2563EB] text-white shadow-[0_6px_9px_-6px_rgba(0,0,0,0.1),0_15.5px_23px_-4px_rgba(0,0,0,0.1)]"
          )}
          aria-label={!isSpeakerMuted ? "Mute Speaker" : "Unmute Speaker"}
        >
          {!isSpeakerMuted ? <VolumeX className="h-8 w-8" /> : <Volume2 className="h-8 w-8" />}
        </button>
        <span className="text-[15.5px] font-normal text-white/50">Mute</span>
      </div>

      <div className="flex flex-col items-center gap-[12px]">
        <button
          onClick={handleEndCall}
          className="flex h-[84px] w-[84px] items-center justify-center rounded-full bg-gradient-to-br from-[#F43F5E] to-[#DC2626] text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_6px_31px_0_rgba(244,63,94,0.5)]"
          aria-label="End call"
        >
          <PhoneOff className="h-8 w-8" fill="currentColor" />
        </button>
        <span className="text-[15.5px] font-normal text-[#F43F5E]">End</span>
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
                <button
                  onClick={() => setIsCallMinimized(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-md"
                  title="Minimize Call"
                >
                  <ChevronDown className="h-5 w-5" />
                </button>
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
                <ParticipantTile 
                  key={`${trackRef.participant.identity}-${trackRef.source}-${idx}`} 
                  trackRef={trackRef} 
                  groupMembers={groupMembers} 
                  isReconnecting={trackRef.participant.identity === reconnectingUserId}
                />
              ))}
            </div>

            <ControlDock />
          </div>
        </div>
      );
    }

    // ── Default: avatar layout ───────────────────────────────────────────────
    return (
      <div className="relative flex h-[100dvh] w-full overflow-hidden bg-[#102A63]">
        {/* ─── Main Content Area ─── */}
        <div className="flex-1 relative flex flex-col h-full transition-all duration-300">
          
          {/* ─── Top Header ─── */}
          <div className="absolute left-0 top-0 z-40 flex w-full items-center justify-between p-6">
            <button
              onClick={handleEndCall}
              className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-[#E9EFFD] border border-[#9BB7F6] text-[#2563EB] transition-all hover:bg-blue-100 backdrop-blur-md shadow-sm"
              aria-label="Back / End call"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
    
            <div className="flex flex-col items-center">
               <h2 className="text-[20px] font-bold tracking-wide text-white">
                 {activeCall?.isGroup ? "Call" : ""}
               </h2>
               {/* Timer moved down for 1-on-1 */}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setIsCallMinimized(true)}
                className="flex h-10 w-10 items-center justify-center rounded-[15px] bg-white/10 border border-white/15 text-white transition-all hover:bg-white/20 backdrop-blur-md"
                title="Minimize Call"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
              <button
                onClick={onOpenInvite}
                className="flex h-10 w-10 items-center justify-center rounded-[15px] bg-white/10 border border-white/15 text-white transition-all hover:bg-white/20 backdrop-blur-md"
                title="Add participant"
                aria-label="Invite someone to this call"
              >
                <UserPlus className="h-5 w-5" />
              </button>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-[15px] bg-white/10 border border-white/15 text-white transition-all hover:bg-white/20 backdrop-blur-md"
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
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="relative mb-2">
                  <img 
                    src={getOptimizedImageUrl(finalSingleAvatarUrl)} 
                    alt="Avatar" 
                    className="relative h-56 w-56 rounded-full object-cover border-[4px] border-[#2563EB] shadow-2xl"
                  />
                </div>
                <div className="flex flex-col items-center gap-[14px]">
                  <h1 className="text-[40px] font-semibold text-white leading-[1.2em] text-center px-4">
                    {singlePeerName}
                  </h1>
                  <p className="text-[20px] font-normal text-white leading-[29px] text-center">
                    {formatDuration(duration)}
                  </p>
                </div>
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
                    const groupMember = groupMembers.find(m => m.id === p.identity);
                    
                    if (contact || groupMember) {
                      if (!name || name === p.identity || name === "Unknown" || name === p.name) {
                        name = contact?.name || groupMember?.name || name;
                      }
                      if (!pAvatar) {
                        pAvatar = contact?.avatarUrl || groupMember?.avatarUrl || pAvatar;
                      }
                    }
                  }
                  
                  const av = pAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(isLocal ? "Y" : name)}&background=3B58F5&color=fff&size=256`;

                  return (
                    <div key={p.identity || idx} className="flex flex-col items-center">
                       <div className="relative mb-4">
                          <img 
                            src={getOptimizedImageUrl(av)} 
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

  const isOneOnOne = !activeCall?.isGroup && tracks.length === 2;
  const localTrack = tracks.find(t => t.participant.isLocal);
  const remoteTrack = tracks.find(t => !t.participant.isLocal);

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[#102A63]">
      
      {/* ─── Top Header ─── */}
      <div className="absolute left-0 top-0 z-40 flex w-full items-center justify-between p-6">
        <button
          onClick={handleEndCall}
          className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-[#E9EFFD] border border-[#9BB7F6] text-[#2563EB] transition-all hover:bg-blue-100 shadow-md"
          aria-label="Back / End call"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center">
          <h2 className="text-[20px] font-bold tracking-wide text-white">
            {activeCall?.isGroup ? "Group Call" : "Call"}
          </h2>
          <p className="text-[13px] font-medium text-white/70">
            {formatDuration(duration)}
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setIsCallMinimized(true)}
            className="flex h-10 w-10 items-center justify-center rounded-[15px] bg-white/10 border border-white/15 text-white transition-all hover:bg-white/20 backdrop-blur-md"
            title="Minimize Call"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
          <button
            onClick={onOpenInvite}
            className="flex h-10 w-10 items-center justify-center rounded-[15px] bg-white/10 border border-white/15 text-white transition-all hover:bg-white/20 backdrop-blur-md"
            title="Add participant"
            aria-label="Invite someone to this call"
          >
            <UserPlus className="h-5 w-5" />
          </button>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-[15px] bg-white/10 border border-white/15 text-white transition-all hover:bg-white/20 backdrop-blur-md"
            aria-label="More options"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ─── Main Video Area ─── */}
      <div className="flex-1 flex flex-col pt-24 pb-32 px-6">
        {isOneOnOne && localTrack && remoteTrack ? (
          // 1-on-1 Picture-in-Picture Layout
          <div className="relative w-full h-full max-w-5xl mx-auto rounded-[32px] overflow-visible shadow-2xl bg-[#0F172A]">
             <div className="absolute inset-0 rounded-[32px] overflow-hidden bg-black">
                <ParticipantTile 
                  key={`${remoteTrack.participant.identity}-remote`} 
                  trackRef={remoteTrack} 
                  disableOverlay 
                  className="rounded-none ring-0 shadow-none border-0" 
                  isReconnecting={remoteTrack.participant.identity === reconnectingUserId}
                />
             </div>
             
             {/* PiP Local Video */}
             <div className="absolute bottom-6 right-6 w-32 h-44 md:w-48 md:h-64 z-10">
                <ParticipantTile key={`${localTrack.participant.identity}-local`} trackRef={localTrack} disableOverlay hideName className="shadow-2xl ring-2 ring-white/20" />
             </div>

             {/* Dock overlaying the bottom edge */}
             <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-full flex justify-center z-50">
               <ControlDock compact />
             </div>
          </div>
        ) : (
          // Group Call or other layout
          <div className="relative w-full h-full">
            <div className={cn("absolute inset-0 z-0", gridClass)}>
              {tracks.map((trackRef, idx) => (
                <ParticipantTile
                  key={`${trackRef.participant.identity}-${trackRef.source}-${idx}`}
                  trackRef={trackRef}
                  isReconnecting={trackRef.participant.identity === reconnectingUserId}
                />
              ))}
            </div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-full flex justify-center z-50">
              <ControlDock compact />
            </div>
          </div>
        )}
      </div>

      {/* Local Reconnecting Overlay (when OUR network drops) */}
      {isLocalReconnecting && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-[#3B58F5] mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Reconnecting...</h3>
          <p className="text-white/70 text-center max-w-[300px]">
            Please wait while we try to restore your connection.
          </p>
        </div>
      )}

    </div>
  );
};


// ---------------------------------------------------------------------------
// ActiveCallRoom — public export
// Wraps <LiveKitRoom> and passes the invite modal state into the inner layout
// ---------------------------------------------------------------------------

export const ActiveCallRoom = () => {
  const { activeCall, hangupCall, leaveGroupCall, onLiveKitDisconnected, isCallMinimized, setIsCallMinimized } = useCallContext();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);

  if (!activeCall) return null;

  return (
    <div 
      className={cn(
        "z-[100] bg-black pointer-events-auto transition-all duration-300 overflow-hidden shadow-2xl",
        isCallMinimized
          ? "fixed bottom-6 right-6 w-56 h-80 rounded-2xl cursor-pointer hover:scale-105 active:scale-95 group border-2 border-white/20"
          : "fixed inset-0 flex items-center justify-center"
      )}
      onClick={() => {
        if (isCallMinimized) setIsCallMinimized(false);
      }}
    >
      {isCallMinimized && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md shadow-lg">
            <Maximize2 className="h-6 w-6" />
          </div>
          <span className="text-white text-xs font-semibold mt-2 drop-shadow-md">Tap to Expand</span>
        </div>
      )}
      
      <div className={cn(
        "w-full h-full relative",
        isCallMinimized && "pointer-events-none" // Disable interaction in UI when minimized so clicks bubble to expand
      )}>
        <LiveKitRoom
        key={activeCall.token}
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
           isSpeakerMuted={isSpeakerMuted}
           setIsSpeakerMuted={setIsSpeakerMuted}
        />

        {/* System Integrity Control: renders remote audio tracks */}
        <RoomAudioRenderer muted={isSpeakerMuted} />

        {/* Unified Add People Modal for both Audio and Video calls */}
        <InviteParticipantModal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          roomId={activeCall.roomName}
          callType={activeCall.callType}
        />
      </LiveKitRoom>
      </div>
    </div>
  );
};
