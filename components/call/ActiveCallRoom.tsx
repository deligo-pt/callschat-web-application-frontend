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
  useIsSpeaking,
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
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ParticipantTile } from "./ParticipantTile";
import { InviteParticipantModal } from "./InviteParticipantModal";
import { getOptimizedImageUrl } from "@/utils/image";
import { resolveLivekitUrl } from "@/utils/livekit";

// ---------------------------------------------------------------------------
// Inner layout — must be a child of <LiveKitRoom> so LiveKit hooks work
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// 1v1 Audio Participant Avatar with Heartbeat & Voice-Activity
// ---------------------------------------------------------------------------
const SafeParticipantAvatar = ({
  participant,
  avatarUrl,
}: {
  participant?: any;
  avatarUrl: string;
}) => {
  if (!participant) {
    return (
      <div className="relative mb-2">
        <div className="absolute -inset-10 rounded-full border border-[#25D366]/25 animate-heartbeat-ring-2 pointer-events-none" />
        <div className="absolute -inset-6 rounded-full border-2 border-[#00A884]/40 animate-heartbeat-ring-1 pointer-events-none" />
        <div className="absolute -inset-2 rounded-full bg-radial from-[#00A884]/40 to-transparent blur-md transition-all duration-300 pointer-events-none animate-call-heartbeat opacity-60" />
        <img
          src={getOptimizedImageUrl(avatarUrl)}
          alt="Avatar"
          className="relative h-44 w-44 md:h-52 md:w-52 rounded-full object-cover border-4 border-[#00A884] shadow-[0_0_25px_rgba(0,168,132,0.35)] animate-call-heartbeat bg-[#202C33]"
        />
      </div>
    );
  }

  return <ActiveSpeaker1v1Avatar participant={participant} avatarUrl={avatarUrl} />;
};

const ActiveSpeaker1v1Avatar = ({
  participant,
  avatarUrl,
}: {
  participant: any;
  avatarUrl: string;
}) => {
  const isSpeaking = useIsSpeaking(participant);

  return (
    <div className="relative mb-2">
      {/* Concentric Heartbeat Rings */}
      <div
        className={cn(
          "absolute -inset-10 rounded-full border border-[#25D366]/25 animate-heartbeat-ring-2 pointer-events-none",
          isSpeaking && "border-[#25D366]/40 scale-110"
        )}
      />
      <div
        className={cn(
          "absolute -inset-6 rounded-full border-2 border-[#00A884]/40 animate-heartbeat-ring-1 pointer-events-none",
          isSpeaking && "border-[#25D366]/60"
        )}
      />
      <div
        className={cn(
          "absolute -inset-2 rounded-full bg-radial from-[#00A884]/40 to-transparent blur-md transition-all duration-300 pointer-events-none",
          isSpeaking ? "animate-call-heartbeat-fast opacity-90" : "animate-call-heartbeat opacity-60"
        )}
      />

      <img
        src={getOptimizedImageUrl(avatarUrl)}
        alt="Avatar"
        className={cn(
          "relative h-44 w-44 md:h-52 md:w-52 rounded-full object-cover border-4 transition-all duration-300 shadow-2xl bg-[#202C33]",
          isSpeaking
            ? "border-[#25D366] shadow-[0_0_40px_rgba(37,211,102,0.5)] animate-heartbeat-speaking"
            : "border-[#00A884] shadow-[0_0_25px_rgba(0,168,132,0.35)] animate-call-heartbeat"
        )}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Group Audio Participant Avatar with Heartbeat & Voice-Activity
// ---------------------------------------------------------------------------
const GroupAudioAvatar = ({
  participant,
  isLocal,
  name,
  avatarUrl,
}: {
  participant?: any;
  isLocal: boolean;
  name: string;
  avatarUrl: string;
}) => {
  if (!participant) {
    return (
      <div className="flex flex-col items-center">
        <div className="relative mb-3">
          <div className="absolute -inset-3 rounded-full border border-[#00A884]/20 animate-heartbeat-ring-1 pointer-events-none opacity-40" />
          <img
            src={getOptimizedImageUrl(avatarUrl)}
            alt={name}
            className="relative h-28 w-28 md:h-36 md:w-36 rounded-full object-cover border-3 border-[#00A884] shadow-[0_0_15px_rgba(0,168,132,0.25)] animate-call-heartbeat bg-[#202C33]"
          />
        </div>
        <h2 className="text-[16px] md:text-[18px] font-semibold text-[#E9EDEF] text-center">
          {name}
        </h2>
      </div>
    );
  }

  return (
    <ActiveSpeakerGroupAvatar
      participant={participant}
      isLocal={isLocal}
      name={name}
      avatarUrl={avatarUrl}
    />
  );
};

const ActiveSpeakerGroupAvatar = ({
  participant,
  isLocal,
  name,
  avatarUrl,
}: {
  participant: any;
  isLocal: boolean;
  name: string;
  avatarUrl: string;
}) => {
  const isSpeaking = useIsSpeaking(participant);

  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-3">
        {/* Heartbeat aura when speaking or ambient */}
        {isSpeaking ? (
          <>
            <div className="absolute -inset-6 rounded-full border border-[#25D366]/40 animate-heartbeat-ring-1 pointer-events-none" />
            <div className="absolute -inset-10 rounded-full border border-[#25D366]/20 animate-heartbeat-ring-2 pointer-events-none" />
            <div className="absolute -inset-2 rounded-full bg-radial from-[#25D366]/40 to-transparent blur-md animate-call-heartbeat-fast pointer-events-none" />
          </>
        ) : (
          <div className="absolute -inset-3 rounded-full border border-[#00A884]/20 animate-heartbeat-ring-1 pointer-events-none opacity-40" />
        )}
        <img
          src={getOptimizedImageUrl(avatarUrl)}
          alt={name}
          className={cn(
            "relative h-28 w-28 md:h-36 md:w-36 rounded-full object-cover border-3 transition-all duration-300 shadow-2xl bg-[#202C33]",
            isSpeaking
              ? "border-[#25D366] shadow-[0_0_30px_rgba(37,211,102,0.5)] animate-heartbeat-speaking"
              : "border-[#00A884] shadow-[0_0_15px_rgba(0,168,132,0.25)] animate-call-heartbeat"
          )}
        />
      </div>
      <div className="flex items-center gap-1.5">
        <h2 className="text-[16px] md:text-[18px] font-semibold text-[#E9EDEF] text-center">
          {name}
        </h2>
        {isSpeaking && (
          <span className="relative flex h-2 w-2 items-center justify-center">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75 animate-heartbeat-dot" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#25D366]" />
          </span>
        )}
      </div>
    </div>
  );
};

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
    "grid gap-3 w-full h-full pb-28 pt-20 px-4 transition-all duration-300";

  if (tracks.length === 1) {
    gridClass += " grid-cols-1 grid-rows-1";
  } else if (tracks.length === 2) {
    gridClass += " grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1";
  } else if (tracks.length <= 4) {
    gridClass += " grid-cols-2 grid-rows-2";
  } else {
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
  // Modern WhatsApp Control Dock
  // ─────────────────────────────────────────────────────────────────────────
  const ControlDock = ({ compact = false }: { compact?: boolean }) => (
    <div className={cn(
      "flex items-center justify-between gap-3 md:gap-5 z-50 rounded-full bg-[#202C33]/90 px-6 py-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl border border-white/10",
      compact
        ? "absolute bottom-6 left-1/2 -translate-x-1/2 w-auto max-w-[90vw]"
        : "absolute bottom-8 left-1/2 -translate-x-1/2 w-auto max-w-[90vw]"
    )}>
      {/* Video Toggle */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
          className={cn(
            "flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full transition-all duration-200 cursor-pointer",
            isCameraEnabled
              ? "bg-[#00A884] text-white shadow-md hover:bg-[#008069]"
              : "bg-[#2A3942] text-[#E9EDEF] hover:bg-[#374248] border border-white/10"
          )}
          aria-label={isCameraEnabled ? "Turn off camera" : "Turn on camera"}
          title={isCameraEnabled ? "Turn off camera" : "Turn on camera"}
        >
          {isCameraEnabled ? <Video className="h-5 w-5 md:h-6 md:w-6" /> : <VideoOff className="h-5 w-5 md:h-6 md:w-6" />}
        </button>
        <span className="text-[11px] font-medium text-[#8696A0]">Video</span>
      </div>

      {/* Mic Toggle */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
          className={cn(
            "flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full transition-all duration-200 cursor-pointer",
            isMicrophoneEnabled
              ? "bg-[#2A3942] text-[#E9EDEF] hover:bg-[#374248] border border-white/10"
              : "bg-[#EA0038] text-white shadow-md hover:bg-[#d00030]"
          )}
          aria-label={isMicrophoneEnabled ? "Mute Mic" : "Unmute Mic"}
          title={isMicrophoneEnabled ? "Mute Mic" : "Unmute Mic"}
        >
          {isMicrophoneEnabled ? <Mic className="h-5 w-5 md:h-6 md:w-6" /> : <MicOff className="h-5 w-5 md:h-6 md:w-6" />}
        </button>
        <span className="text-[11px] font-medium text-[#8696A0]">{isMicrophoneEnabled ? "Mic" : "Muted"}</span>
      </div>

      {/* Speaker Toggle */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
          className={cn(
            "flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full transition-all duration-200 cursor-pointer",
            !isSpeakerMuted
              ? "bg-[#2A3942] text-[#E9EDEF] hover:bg-[#374248] border border-white/10"
              : "bg-[#EA0038] text-white shadow-md hover:bg-[#d00030]"
          )}
          aria-label={!isSpeakerMuted ? "Mute Speaker" : "Unmute Speaker"}
          title={!isSpeakerMuted ? "Mute Speaker" : "Unmute Speaker"}
        >
          {!isSpeakerMuted ? <Volume2 className="h-5 w-5 md:h-6 md:w-6" /> : <VolumeX className="h-5 w-5 md:h-6 md:w-6" />}
        </button>
        <span className="text-[11px] font-medium text-[#8696A0]">Speaker</span>
      </div>

      {/* Add Participant shortcut */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={onOpenInvite}
          className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-[#2A3942] text-[#E9EDEF] hover:bg-[#374248] hover:text-[#00A884] border border-white/10 transition-all duration-200 cursor-pointer"
          aria-label="Add People"
          title="Add People to Call"
        >
          <UserPlus className="h-5 w-5 md:h-6 md:w-6" />
        </button>
        <span className="text-[11px] font-medium text-[#8696A0]">Add</span>
      </div>

      {/* End Call Button */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={handleEndCall}
          className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-[#EA0038] text-white transition-all duration-200 hover:bg-[#d00030] hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(234,0,56,0.4)] cursor-pointer"
          aria-label="End call"
          title="End Call"
        >
          <PhoneOff className="h-5 w-5 md:h-6 md:w-6" fill="currentColor" />
        </button>
        <span className="text-[11px] font-medium text-red-400">End</span>
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
    
    let singlePeerName = activeCall.peerName || "Unknown";
    let singleAvatarUrl = activeCall.peerAvatar || "";
    
    if (remotePeer) {
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
    }

    const finalSingleAvatarUrl = singleAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(singlePeerName)}&background=00A884&color=fff&size=256`;

    // If someone turned on camera, show video layout seamlessly
    if (anyoneHasCamera) {
      return (
        <div className="relative flex h-[100dvh] w-full overflow-hidden bg-[#0C1317]">
          <div className="flex-1 relative h-full">
            {/* Top Navigation Header */}
            <div className="absolute left-0 top-0 z-40 flex w-full items-center justify-between p-4 md:p-6 bg-gradient-to-b from-black/70 to-transparent">
              <button 
                onClick={handleEndCall} 
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#202C33]/80 text-white hover:bg-[#2A3942] backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
                title="End Call"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#00A884]/20 border border-[#00A884]/30 backdrop-blur-md">
                  <span className="relative flex h-2 w-2 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75 animate-heartbeat-dot" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#25D366]" />
                  </span>
                  <span className="text-xs font-semibold text-[#25D366]">📷 Video Active · {formatDuration(duration)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCallMinimized(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#202C33]/80 text-white hover:bg-[#2A3942] backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
                  title="Minimize Call"
                >
                  <ChevronDown className="h-5 w-5" />
                </button>
                <button 
                  onClick={onOpenInvite} 
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#202C33]/80 text-white hover:bg-[#2A3942] hover:text-[#00A884] backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
                  title="Add People"
                >
                  <UserPlus className="h-5 w-5" />
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

    // Default Audio Call Layout
    return (
      <div className="relative flex h-[100dvh] w-full overflow-hidden bg-[#0C1317]">
        <div className="flex-1 relative flex flex-col h-full transition-all duration-300">
          
          {/* Top Header */}
          <div className="absolute left-0 top-0 z-40 flex w-full items-center justify-between p-4 md:p-6 bg-gradient-to-b from-black/60 to-transparent">
            <button
              onClick={handleEndCall}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#202C33]/80 text-white hover:bg-[#2A3942] backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
              aria-label="Back / End call"
              title="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
    
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2 text-[11px] font-medium text-[#8696A0] bg-white/5 px-3 py-0.5 rounded-full border border-white/10 shadow-xs">
                <span className="relative flex h-2 w-2 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75 animate-heartbeat-dot" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#25D366]" />
                </span>
                <Lock className="w-3 h-3 text-[#00A884]" />
                <span>End-to-End Encrypted</span>
              </div>
              <h2 className="text-[16px] font-semibold tracking-wide text-[#E9EDEF]">
                {activeCall?.isGroup ? "CallsChat Group Call" : "CallsChat Call"}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCallMinimized(true)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#202C33]/80 text-white hover:bg-[#2A3942] backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
                title="Minimize Call"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
              <button
                onClick={onOpenInvite}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#202C33]/80 text-white hover:bg-[#2A3942] hover:text-[#00A884] backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
                title="Add participant"
                aria-label="Invite someone to this call"
              >
                <UserPlus className="h-5 w-5" />
              </button>
            </div>
          </div>
    
          {/* Center Content (Avatar, Name, Timer) */}
          <div className="flex flex-1 flex-col items-center justify-center pt-8 px-6 pb-28">
            {!activeCall.isGroup && remoteParticipants.length <= 1 ? (
              // 1-on-1 Audio Layout
              <div className="flex flex-col items-center justify-center gap-5">
                <SafeParticipantAvatar
                  participant={remotePeer || localParticipant}
                  avatarUrl={finalSingleAvatarUrl}
                />
                <div className="flex flex-col items-center gap-2">
                  <h1 className="text-[28px] md:text-[34px] font-bold text-[#E9EDEF] tracking-tight text-center px-4">
                    {singlePeerName}
                  </h1>
                  <span className="text-[18px] md:text-[20px] font-semibold text-[#25D366] text-center">
                    {formatDuration(duration)}
                  </span>
                </div>
              </div>
            ) : (
              // Group Audio Layout (Grid of Avatars)
              <div className="w-full max-w-3xl grid grid-cols-2 md:grid-cols-2 gap-y-10 gap-x-8 items-center justify-items-center">
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
                  
                  const av = pAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(isLocal ? "Y" : name)}&background=00A884&color=fff&size=256`;

                  return (
                    <GroupAudioAvatar
                      key={p.identity || idx}
                      participant={p}
                      isLocal={isLocal}
                      name={name}
                      avatarUrl={av}
                    />
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

  // VIDEO CALL UI
  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[#0C1317]">
      
      {/* Top Header */}
      <div className="absolute left-0 top-0 z-40 flex w-full items-center justify-between p-4 md:p-6 bg-gradient-to-b from-black/70 to-transparent">
        <button
          onClick={handleEndCall}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#202C33]/80 text-white hover:bg-[#2A3942] backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
          aria-label="Back / End call"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2 items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75 animate-heartbeat-dot" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#25D366]" />
            </span>
            <h2 className="text-[16px] font-semibold tracking-wide text-[#E9EDEF]">
              {activeCall?.isGroup ? "Group Video Call" : "Video Call"}
            </h2>
          </div>
          <span className="text-[13px] font-semibold text-[#25D366]">
            {formatDuration(duration)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCallMinimized(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#202C33]/80 text-white hover:bg-[#2A3942] backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
            title="Minimize Call"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
          <button
            onClick={onOpenInvite}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#202C33]/80 text-white hover:bg-[#2A3942] hover:text-[#00A884] backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
            title="Add participant"
            aria-label="Invite someone to this call"
          >
            <UserPlus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 flex flex-col pt-20 pb-28 px-4 md:px-6">
        {isOneOnOne && localTrack && remoteTrack ? (
          // 1-on-1 Picture-in-Picture Layout
          <div className="relative w-full h-full max-w-5xl mx-auto rounded-3xl overflow-visible shadow-2xl bg-[#111B21]">
             <div className="absolute inset-0 rounded-3xl overflow-hidden bg-black">
                <ParticipantTile 
                  key={`${remoteTrack.participant.identity}-remote`} 
                  trackRef={remoteTrack} 
                  disableOverlay 
                  className="rounded-none ring-0 shadow-none border-0" 
                  isReconnecting={remoteTrack.participant.identity === reconnectingUserId}
                />
             </div>
             
             {/* PiP Local Video */}
             <div className="absolute bottom-6 right-6 w-32 h-44 md:w-48 md:h-64 z-20 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
                <ParticipantTile key={`${localTrack.participant.identity}-local`} trackRef={localTrack} disableOverlay hideName className="shadow-none rounded-none" />
             </div>

             {/* Dock overlaying the bottom edge */}
             <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-full flex justify-center z-50">
               <ControlDock compact />
             </div>
          </div>
        ) : (
          // Group Call or multi-party layout
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
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-full flex justify-center z-50">
              <ControlDock compact />
            </div>
          </div>
        )}
      </div>

      {/* Local Reconnecting Overlay */}
      {isLocalReconnecting && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-[#00A884] mb-4" />
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
// ---------------------------------------------------------------------------

export const ActiveCallRoom = () => {
  const { activeCall, isCallMinimized, setIsCallMinimized, onLiveKitDisconnected } = useCallContext();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);

  if (!activeCall) return null;

  return (
    <div 
      className={cn(
        "z-[100] bg-black pointer-events-auto transition-all duration-300 overflow-hidden shadow-2xl",
        isCallMinimized
          ? "fixed bottom-6 right-6 w-56 h-80 rounded-3xl cursor-pointer hover:scale-105 active:scale-95 group border-2 border-emerald-500/40 shadow-emerald-500/10"
          : "fixed inset-0 flex items-center justify-center"
      )}
      onClick={() => {
        if (isCallMinimized) setIsCallMinimized(false);
      }}
    >
      {isCallMinimized && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/50 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00A884] text-white shadow-lg">
            <Maximize2 className="h-6 w-6" />
          </div>
          <span className="text-white text-xs font-semibold mt-2 drop-shadow-md">Tap to Expand</span>
        </div>
      )}
      
      <div className={cn(
        "w-full h-full relative",
        isCallMinimized && "pointer-events-none"
      )}>
        <LiveKitRoom
        key={activeCall.token}
        video={activeCall.callType === "VIDEO"}
        audio={true}
        token={activeCall.token}
        serverUrl={resolveLivekitUrl(activeCall.serverUrl)}
        connect={true}
        onError={(error) => {
          console.warn("[LiveKit] Room connection notice:", error);
        }}
        onDisconnected={onLiveKitDisconnected}
        className="w-full h-full"
      >
        <CustomCallLayout 
           inviteOpen={inviteOpen} 
           onOpenInvite={() => setInviteOpen(true)} 
           onCloseInvite={() => setInviteOpen(false)}
           isSpeakerMuted={isSpeakerMuted}
           setIsSpeakerMuted={setIsSpeakerMuted}
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
    </div>
  );
};

