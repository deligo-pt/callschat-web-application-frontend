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
  ExternalLink,
  ArrowDownLeft,
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
        <img
          src={getOptimizedImageUrl(avatarUrl)}
          alt="Avatar"
          className="relative h-44 w-44 md:h-52 md:w-52 rounded-full object-cover border-4 border-[#00A884] shadow-[0_0_25px_rgba(0,168,132,0.35)] bg-[#202C33]"
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
      {/* Concentric Heartbeat Rings — ONLY active while user is speaking */}
      {isSpeaking && (
        <>
          <div className="absolute -inset-10 rounded-full border border-[#25D366]/40 scale-110 animate-heartbeat-ring-2 pointer-events-none" />
          <div className="absolute -inset-6 rounded-full border-2 border-[#25D366]/60 animate-heartbeat-ring-1 pointer-events-none" />
          <div className="absolute -inset-2 rounded-full bg-radial from-[#25D366]/40 to-transparent blur-md transition-all duration-300 pointer-events-none animate-call-heartbeat-fast opacity-90" />
        </>
      )}

      <img
        src={getOptimizedImageUrl(avatarUrl)}
        alt="Avatar"
        className={cn(
          "relative h-44 w-44 md:h-52 md:w-52 rounded-full object-cover border-4 transition-all duration-300 shadow-2xl bg-[#202C33]",
          isSpeaking
            ? "border-[#25D366] shadow-[0_0_40px_rgba(37,211,102,0.5)] animate-heartbeat-speaking"
            : "border-[#00A884] shadow-[0_0_25px_rgba(0,168,132,0.35)]"
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
          <img
            src={getOptimizedImageUrl(avatarUrl)}
            alt={name}
            className="relative h-28 w-28 md:h-36 md:w-36 rounded-full object-cover border-3 border-[#00A884] shadow-[0_0_15px_rgba(0,168,132,0.25)] bg-[#202C33]"
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
        {/* Heartbeat aura — ONLY render when user is actively speaking */}
        {isSpeaking && (
          <>
            <div className="absolute -inset-6 rounded-full border border-[#25D366]/40 animate-heartbeat-ring-1 pointer-events-none" />
            <div className="absolute -inset-10 rounded-full border border-[#25D366]/20 animate-heartbeat-ring-2 pointer-events-none" />
            <div className="absolute -inset-2 rounded-full bg-radial from-[#25D366]/40 to-transparent blur-md animate-call-heartbeat-fast pointer-events-none" />
          </>
        )}
        <img
          src={getOptimizedImageUrl(avatarUrl)}
          alt={name}
          className={cn(
            "relative h-28 w-28 md:h-36 md:w-36 rounded-full object-cover border-3 transition-all duration-300 shadow-2xl bg-[#202C33]",
            isSpeaking
              ? "border-[#25D366] shadow-[0_0_30px_rgba(37,211,102,0.5)] animate-heartbeat-speaking"
              : "border-[#00A884] shadow-[0_0_15px_rgba(0,168,132,0.25)]"
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

export interface CustomCallLayoutProps {
  inviteOpen: boolean;
  onOpenInvite: () => void;
  onCloseInvite: () => void;
  isSpeakerMuted: boolean;
  setIsSpeakerMuted: (muted: boolean) => void;
  isStandaloneWindow?: boolean;
  onReturnToMain?: () => void;
  onEndCallOverride?: () => void;
}

export const CustomCallLayout = ({
  inviteOpen,
  onOpenInvite,
  onCloseInvite,
  isSpeakerMuted,
  setIsSpeakerMuted,
  isStandaloneWindow = false,
  onReturnToMain,
  onEndCallOverride,
}: CustomCallLayoutProps) => {
  const {
    activeCall,
    hangupCall,
    leaveGroupCall,
    onLiveKitDisconnected,
    isCallMinimized,
    setIsCallMinimized,
    reconnectingUserId,
    popOutCallWindow,
  } = useCallContext();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
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
    if (onEndCallOverride) {
      onEndCallOverride();
      return;
    }
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

      {/* Pop out to Standalone Window OR Return to Tab */}
      {!isStandaloneWindow && popOutCallWindow && (
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={popOutCallWindow}
            className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-[#2A3942] text-[#E9EDEF] hover:bg-[#374248] hover:text-[#00A884] border border-white/10 transition-all duration-200 cursor-pointer"
            aria-label="Open in separate window"
            title="Open in separate window"
          >
            <ExternalLink className="h-5 w-5 md:h-6 md:w-6" />
          </button>
          <span className="text-[11px] font-medium text-[#8696A0]">Pop out</span>
        </div>
      )}

      {isStandaloneWindow && onReturnToMain && (
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onReturnToMain}
            className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-[#2A3942] text-[#E9EDEF] hover:bg-[#374248] hover:text-[#25D366] border border-white/10 transition-all duration-200 cursor-pointer"
            aria-label="Return to tab"
            title="Return to main tab"
          >
            <ArrowDownLeft className="h-5 w-5 md:h-6 md:w-6 text-[#25D366]" />
          </button>
          <span className="text-[11px] font-medium text-[#8696A0]">Return</span>
        </div>
      )}

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
  // Peer info resolution
  // ─────────────────────────────────────────────────────────────────────────
  const remotePeer = remoteParticipants[0];
  let singlePeerName = activeCall?.peerName || "CallsChat Call";
  let singleAvatarUrl = activeCall?.peerAvatar || "";

  if (activeCall?.isGroup) {
    singlePeerName = "CallsChat Group Call";
  } else if (remotePeer) {
    const liveName = remotePeer.name || remotePeer.identity || "";
    try {
      const metadata = JSON.parse(remotePeer.metadata || "{}");
      if (metadata.avatarUrl) singleAvatarUrl = metadata.avatarUrl;
      if (metadata.firstName || metadata.lastName) {
        singlePeerName = `${metadata.firstName || ""} ${metadata.lastName || ""}`.trim();
      } else if (metadata.displayName) {
        singlePeerName = metadata.displayName;
      } else if (liveName && liveName !== remotePeer.identity && singlePeerName === "CallsChat Call") {
        singlePeerName = liveName;
      }
    } catch (e) {}

    if (!singleAvatarUrl || singlePeerName === "CallsChat Call" || singlePeerName === remotePeer.identity) {
      const contact = contacts.find((c) => c.userId === remotePeer.identity);
      if (contact) {
        if (singlePeerName === "CallsChat Call" || singlePeerName === remotePeer.identity) {
          singlePeerName = contact.name;
        }
        if (!singleAvatarUrl && contact.avatarUrl) {
          singleAvatarUrl = contact.avatarUrl;
        }
      }
    }
  }

  const finalSingleAvatarUrl =
    singleAvatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(singlePeerName)}&background=00A884&color=fff&size=256`;

  // ─────────────────────────────────────────────────────────────────────────
  // MINIMIZED CALL WIDGET (Modern WhatsApp Web Picture-in-Picture & Audio Card)
  // ─────────────────────────────────────────────────────────────────────────
  if (isCallMinimized) {
    const isVideo = activeCall?.callType === "VIDEO" || anyoneHasCamera;

    // VIDEO MINIMIZED: High-end floating Picture-in-Picture card
    if (isVideo) {
      const primaryRemoteTrack =
        tracks.find((t) => !t.participant.isLocal && t.source === Track.Source.Camera) || tracks[0];

      return (
        <div
          onClick={() => setIsCallMinimized(false)}
          className="relative w-72 sm:w-80 h-48 sm:h-52 rounded-[1.75rem] overflow-hidden bg-[#111B21] border-2 border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_25px_rgba(0,168,132,0.2)] group cursor-pointer select-none transition-all duration-300 hover:scale-[1.02] animate-in slide-in-from-bottom-5 zoom-in-95 duration-200"
        >
          {primaryRemoteTrack && primaryRemoteTrack.publication?.isSubscribed && !primaryRemoteTrack.publication?.isMuted ? (
            <div className="absolute inset-0 w-full h-full bg-black">
              <ParticipantTile trackRef={primaryRemoteTrack} groupMembers={groupMembers} />
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#182229] to-[#0C1317]">
              <img
                src={getOptimizedImageUrl(finalSingleAvatarUrl, 64, 64)}
                alt={singlePeerName}
                className="h-16 w-16 rounded-full object-cover border-2 border-[#00A884] shadow-lg mb-2"
              />
              <span className="text-xs font-semibold text-[#E9EDEF]">{singlePeerName}</span>
            </div>
          )}

          {/* Top Floating Glass Header */}
          <div className="absolute top-0 left-0 right-0 p-2.5 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#25D366]" />
              </span>
              <span className="text-[11px] font-semibold text-white truncate max-w-[120px]">
                {formatDuration(duration)}
              </span>
            </div>

            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {!isStandaloneWindow && popOutCallWindow && (
                <button
                  onClick={popOutCallWindow}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
                  title="Pop out to separate window"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsCallMinimized(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00A884] hover:bg-[#02906f] text-white shadow-md transition-all active:scale-95 cursor-pointer"
                title="Expand to Fullscreen"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Bottom Floating Controls */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111B21]/90 backdrop-blur-xl border border-white/15 shadow-xl transition-all duration-200"
          >
            <button
              onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors cursor-pointer active:scale-95",
                isMicrophoneEnabled ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500/80 text-white"
              )}
              title={isMicrophoneEnabled ? "Mute Microphone" : "Unmute Microphone"}
            >
              {isMicrophoneEnabled ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
            </button>

            <button
              onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors cursor-pointer active:scale-95",
                isCameraEnabled ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500/80 text-white"
              )}
              title={isCameraEnabled ? "Turn off Camera" : "Turn on Camera"}
            >
              {isCameraEnabled ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
            </button>

            <button
              onClick={handleEndCall}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EA0038] hover:bg-[#d00030] text-white shadow-md transition-all cursor-pointer active:scale-95"
              title="End Call"
            >
              <PhoneOff className="h-3.5 w-3.5" fill="currentColor" />
            </button>
          </div>
        </div>
      );
    }

    // AUDIO MINIMIZED: Sleek WhatsApp Web Floating Audio Widget
    return (
      <div
        onClick={() => setIsCallMinimized(false)}
        className="relative w-[340px] sm:w-[380px] rounded-[1.75rem] bg-[#111B21]/95 backdrop-blur-2xl border border-white/15 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_25px_rgba(0,168,132,0.15)] group cursor-pointer select-none transition-all duration-300 hover:scale-[1.01] flex flex-col gap-3.5 animate-in slide-in-from-bottom-5 zoom-in-95 duration-200"
      >
        {/* Top: Peer Info & Controls */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative shrink-0">
            <img
              src={getOptimizedImageUrl(finalSingleAvatarUrl, 48, 48)}
              alt={singlePeerName}
              className="h-12 w-12 rounded-full object-cover border-2 border-[#00A884] shadow-md bg-[#202C33]"
            />
            <span className="absolute bottom-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#25D366] border-2 border-[#111B21]" />
            </span>
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-[13.5px] font-semibold text-[#E9EDEF] truncate">
                {singlePeerName}
              </h3>
              <Lock className="h-3 w-3 text-[#00A884] shrink-0" />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[12px] font-medium text-[#25D366]">
                {formatDuration(duration)}
              </span>
              <span className="text-[10px] text-[#8696A0]">·</span>
              <span className="text-[10.5px] text-[#8696A0] truncate">
                {activeCall?.isGroup ? "Group Audio" : "CallsChat Audio"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {!isStandaloneWindow && popOutCallWindow && (
              <button
                onClick={popOutCallWindow}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 hover:bg-white/15 text-[#8696A0] hover:text-[#00A884] transition-colors cursor-pointer"
                title="Pop out to separate window"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => setIsCallMinimized(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00A884] hover:bg-[#02906f] text-white shadow-[0_0_10px_rgba(0,168,132,0.3)] transition-all cursor-pointer active:scale-95"
              title="Expand to Fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Bottom: Quick Actions */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-between gap-2 pt-2 border-t border-white/10"
        >
          {/* Mic Toggle */}
          <button
            onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer active:scale-95",
              isMicrophoneEnabled
                ? "bg-white/10 hover:bg-white/20 text-[#E9EDEF]"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            )}
            title={isMicrophoneEnabled ? "Mute Microphone" : "Unmute Microphone"}
          >
            {isMicrophoneEnabled ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5 text-red-400" />}
            <span>{isMicrophoneEnabled ? "Mute" : "Unmuted"}</span>
          </button>

          {/* Speaker Toggle */}
          <button
            onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer active:scale-95",
              !isSpeakerMuted
                ? "bg-white/10 hover:bg-white/20 text-[#E9EDEF]"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            )}
            title={isSpeakerMuted ? "Unmute Speaker" : "Mute Speaker"}
          >
            {isSpeakerMuted ? <VolumeX className="h-3.5 w-3.5 text-amber-400" /> : <Volume2 className="h-3.5 w-3.5" />}
            <span>{isSpeakerMuted ? "Muted" : "Speaker"}</span>
          </button>

          {/* Camera Toggle */}
          <button
            onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-all cursor-pointer active:scale-95",
              isCameraEnabled
                ? "bg-[#00A884] text-white"
                : "bg-white/10 hover:bg-white/20 text-[#8696A0] hover:text-white"
            )}
            title={isCameraEnabled ? "Turn off camera" : "Turn on camera"}
          >
            {isCameraEnabled ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
          </button>

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EA0038] hover:bg-[#d00030] text-white shadow-[0_0_12px_rgba(234,0,56,0.4)] transition-all cursor-pointer active:scale-95"
            title="End Call"
          >
            <PhoneOff className="h-4 w-4" fill="currentColor" />
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AUDIO CALL UI (FULLSCREEN)
  // ─────────────────────────────────────────────────────────────────────────
  if (activeCall?.callType === "AUDIO") {
    const allParticipants = [localParticipant, ...remoteParticipants];

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
                {!isStandaloneWindow && popOutCallWindow && (
                  <button
                    onClick={popOutCallWindow}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#202C33]/80 text-white hover:bg-[#2A3942] hover:text-[#00A884] backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
                    title="Pop out to separate window"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </button>
                )}
                {isStandaloneWindow && onReturnToMain && (
                  <button
                    onClick={onReturnToMain}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#202C33]/80 text-white hover:bg-[#2A3942] hover:text-[#25D366] backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
                    title="Return call to main window"
                  >
                    <ArrowDownLeft className="h-5 w-5 text-[#25D366]" />
                  </button>
                )}
                {!isStandaloneWindow && (
                  <button
                    onClick={() => setIsCallMinimized(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#202C33]/80 text-white hover:bg-[#2A3942] backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
                    title="Minimize Call"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </button>
                )}
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
              {!isStandaloneWindow && popOutCallWindow && (
                <button
                  onClick={popOutCallWindow}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#202C33]/80 text-white hover:bg-[#2A3942] hover:text-[#00A884] backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
                  title="Pop out to separate window"
                >
                  <ExternalLink className="h-5 w-5" />
                </button>
              )}
              {isStandaloneWindow && onReturnToMain && (
                <button
                  onClick={onReturnToMain}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#202C33]/80 text-white hover:bg-[#2A3942] hover:text-[#25D366] backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
                  title="Return call to main window"
                >
                  <ArrowDownLeft className="h-5 w-5 text-[#25D366]" />
                </button>
              )}
              {!isStandaloneWindow && (
                <button
                  onClick={() => setIsCallMinimized(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#202C33]/80 text-white hover:bg-[#2A3942] backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
                  title="Minimize Call"
                >
                  <ChevronDown className="h-5 w-5" />
                </button>
              )}
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
          {!isStandaloneWindow && popOutCallWindow && (
            <button
              onClick={popOutCallWindow}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#202C33]/80 text-white hover:bg-[#2A3942] hover:text-[#00A884] backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
              title="Pop out to separate window"
            >
              <ExternalLink className="h-5 w-5" />
            </button>
          )}
          {isStandaloneWindow && onReturnToMain && (
            <button
              onClick={onReturnToMain}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#202C33]/80 text-white hover:bg-[#2A3942] hover:text-[#25D366] backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
              title="Return call to main window"
            >
              <ArrowDownLeft className="h-5 w-5 text-[#25D366]" />
            </button>
          )}
          {!isStandaloneWindow && (
            <button
              onClick={() => setIsCallMinimized(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#202C33]/80 text-white hover:bg-[#2A3942] backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
              title="Minimize Call"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          )}
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
  const {
    activeCall,
    isCallMinimized,
    setIsCallMinimized,
    isCallPoppedOut,
    returnCallToMain,
    hangupCall,
    onLiveKitDisconnected,
  } = useCallContext();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);

  if (!activeCall) return null;

  // When call is popped out to a separate window, show authentic WhatsApp Web sleek top calling capsule
  if (isCallPoppedOut) {
    const displayName = activeCall.isGroup ? "Group Call" : (activeCall.peerName || "In call");
    const avatarUrl = activeCall.peerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=00A884&color=fff&size=80`;

    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-lg w-[94vw] sm:w-auto animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto select-none">
        <div className="flex items-center justify-between gap-3 sm:gap-5 bg-[#111B21]/95 backdrop-blur-2xl border border-white/15 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(0,168,132,0.15)]">
          {/* Avatar & Pulsing Indicator */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src={getOptimizedImageUrl(avatarUrl, 40, 40)}
                alt={displayName}
                className="h-9 w-9 rounded-full object-cover border-2 border-[#00A884] bg-[#202C33]"
              />
              <span className="absolute bottom-0 right-0 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#25D366] border-2 border-[#111B21]" />
              </span>
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-semibold text-[#E9EDEF] truncate max-w-[140px] sm:max-w-[180px]">
                  {displayName}
                </span>
                <span className="text-[10px] font-medium text-[#00A884] bg-[#00A884]/15 px-2 py-0.5 rounded-full border border-[#00A884]/30 shrink-0">
                  {activeCall.callType.toLowerCase()}
                </span>
              </div>
              <span className="text-[11px] text-[#8696A0] truncate">
                Active in separate window · click to return
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0 pl-2 border-l border-white/10">
            <button
              onClick={returnCallToMain}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#00A884] hover:bg-[#02906f] text-white text-xs font-semibold transition-all duration-200 shadow-[0_0_12px_rgba(0,168,132,0.35)] cursor-pointer active:scale-95"
              title="Bring call back to this tab"
            >
              <ArrowDownLeft className="h-3.5 w-3.5 text-white" />
              <span className="hidden sm:inline">Return to tab</span>
              <span className="sm:hidden">Return</span>
            </button>
            <button
              onClick={() => hangupCall(activeCall.callId)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EA0038] hover:bg-[#d00030] text-white transition-all duration-200 shadow-[0_0_12px_rgba(234,0,56,0.35)] cursor-pointer active:scale-95"
              title="End Call"
            >
              <PhoneOff className="h-4 w-4" fill="currentColor" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "z-[100] transition-all duration-300 pointer-events-auto",
        isCallMinimized
          ? "fixed bottom-6 right-6"
          : "fixed inset-0 flex items-center justify-center bg-black overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      )}
    >
      <div className={cn(
        "relative",
        isCallMinimized ? "w-auto h-auto" : "w-full h-full"
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
          className={cn(isCallMinimized ? "w-auto h-auto" : "w-full h-full")}
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

