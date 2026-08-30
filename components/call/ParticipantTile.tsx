"use client";

import React from "react";
import { TrackReferenceOrPlaceholder, VideoTrack, useIsSpeaking } from "@livekit/components-react";
import { Track } from "livekit-client";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useContacts } from "@/hooks/useContacts";
import { getOptimizedImageUrl } from "@/utils/image";

interface ParticipantTileProps {
  trackRef: TrackReferenceOrPlaceholder;
  disableOverlay?: boolean;
  hideName?: boolean;
  className?: string;
  groupMembers?: any[];
  isReconnecting?: boolean;
}

export function ParticipantTile({ trackRef, disableOverlay, hideName, className, groupMembers = [], isReconnecting }: ParticipantTileProps) {
  const { participant } = trackRef;
  const isSpeaking = useIsSpeaking(participant);
  const { contacts } = useContacts();

  const isVideoOn = participant.isCameraEnabled && trackRef.source === Track.Source.Camera;
  const isMicrophoneEnabled = participant.isMicrophoneEnabled;
  let name = participant.name || participant.identity || "Unknown";
  let avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00A884&color=fff&size=256`;
  
  if (!participant.isLocal) {
    try {
      const meta = JSON.parse(participant.metadata || "{}");
      if (meta.firstName || meta.lastName) {
        name = `${meta.firstName || ""} ${meta.lastName || ""}`.trim();
      } else if (meta.displayName) {
        name = meta.displayName;
      }
      if (meta.avatarUrl) {
        avatarUrl = meta.avatarUrl;
      }
    } catch(e) {}
    
    // Fallback to contacts lookup
    if (name === participant.identity || name === "Unknown" || name === participant.name || !avatarUrl.includes("ui-avatars.com") === false) {
      const contact = contacts.find(c => c.userId === participant.identity);
      const groupMember = groupMembers.find(m => m.id === participant.identity);

      if (contact || groupMember) {
        if (!name || name === participant.identity || name === "Unknown" || name === participant.name) {
          name = contact?.name || groupMember?.name || name;
        }
        // Update avatar fallback string
        if (contact?.avatarUrl && avatarUrl.includes("ui-avatars.com")) {
          avatarUrl = contact.avatarUrl;
        } else if (groupMember?.avatarUrl && avatarUrl.includes("ui-avatars.com")) {
          avatarUrl = groupMember.avatarUrl;
        } else if (!avatarUrl.includes("ui-avatars.com")) {
           // keep current avatar
        } else {
          avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00A884&color=fff&size=256`;
        }
      } else {
         avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00A884&color=fff&size=256`;
      }
    }
  }

  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-[#182229] shadow-xl transition-all duration-300 border border-white/5",
        isSpeaking ? "ring-3 ring-[#25D366] shadow-[0_0_25px_rgba(37,211,102,0.45)]" : "ring-1 ring-white/10",
        className
      )}
    >
      {/* Video or Fallback Avatar */}
      {isVideoOn ? (
        <VideoTrack
          trackRef={trackRef as any}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#111B21]">
          <div className="relative">
            {isSpeaking && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-[#25D366] animate-ping opacity-30" style={{ animationDuration: '2.5s' }} />
                <div className="absolute -inset-6 rounded-full border border-[#25D366]/40 animate-pulse" />
              </>
            )}
            <img
              src={getOptimizedImageUrl(avatarUrl)}
              alt={name}
              className="relative h-24 w-24 md:h-32 md:w-32 rounded-full object-cover border-4 border-[#00A884] shadow-xl bg-[#202C33]"
            />
          </div>
        </div>
      )}

      {/* Reconnecting Overlay (WhatsApp-style) */}
      {isReconnecting && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 backdrop-blur-[3px]">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-white/20 border-t-[#00A884] mb-3" />
          <span className="text-sm font-semibold text-[#E9EDEF] tracking-wide">
            Reconnecting...
          </span>
        </div>
      )}

      {/* Status Overlays */}
      {!disableOverlay && (
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
          {/* Name Tag */}
          {!hideName ? (
            <div className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 backdrop-blur-md border border-white/10 shadow-xs">
              <span className="text-[12.5px] font-medium text-[#E9EDEF] truncate max-w-[120px] md:max-w-[200px]">
                {name} {participant.isLocal && "(You)"}
              </span>
            </div>
          ) : (
            <div />
          )}

          {/* Mic Indicator */}
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-md shadow-xs border border-white/10",
            isMicrophoneEnabled ? "bg-black/60 text-[#25D366]" : "bg-[#EA0038] text-white"
          )}>
            {isMicrophoneEnabled ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
          </div>
        </div>
      )}
    </div>
  );
}

