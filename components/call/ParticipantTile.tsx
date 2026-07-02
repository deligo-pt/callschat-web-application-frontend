"use client";

import React from "react";
import { TrackReferenceOrPlaceholder, VideoTrack, useIsSpeaking } from "@livekit/components-react";
import { Track } from "livekit-client";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useContacts } from "@/hooks/useContacts";

interface ParticipantTileProps {
  trackRef: TrackReferenceOrPlaceholder;
}

export function ParticipantTile({ trackRef }: ParticipantTileProps) {
  const { participant } = trackRef;
  const isSpeaking = useIsSpeaking(participant);
  const { contacts } = useContacts();

  const isVideoOn = participant.isCameraEnabled && trackRef.source === Track.Source.Camera;
  const isMicrophoneEnabled = participant.isMicrophoneEnabled;
  let name = participant.name || participant.identity || "Unknown";
  let avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3B58F5&color=fff&size=256`;
  
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
      if (contact) {
        if (!name || name === participant.identity || name === "Unknown" || name === participant.name) {
          name = contact.name;
        }
        // Update avatar fallback string
        if (contact.avatarUrl && avatarUrl.includes("ui-avatars.com")) {
          avatarUrl = contact.avatarUrl;
        } else if (!avatarUrl.includes("ui-avatars.com")) {
           // keep current avatar
        } else {
          avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3B58F5&color=fff&size=256`;
        }
      } else {
         avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3B58F5&color=fff&size=256`;
      }
    }
  }

  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-[#0F172A] shadow-lg transition-all duration-300",
        isSpeaking ? "ring-4 ring-[#3B58F5] shadow-[0_0_20px_rgba(59,88,245,0.5)]" : "ring-1 ring-white/10"
      )}
    >
      {/* Video or Fallback Avatar */}
      {isVideoOn ? (
        <VideoTrack
          trackRef={trackRef as any}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#1D2A54]">
          <div className="relative">
            {isSpeaking && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-[#3B58F5] animate-ping opacity-20" style={{ animationDuration: '3s' }} />
                <div className="absolute -inset-8 rounded-full border border-[#3B58F5]/30 animate-pulse" />
              </>
            )}
            <img
              src={avatarUrl}
              alt={name}
              className="relative h-24 w-24 md:h-32 md:w-32 rounded-full object-cover border-4 border-[#3B58F5] shadow-lg"
            />
          </div>
        </div>
      )}

      {/* Status Overlays */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        {/* Name Tag */}
        <div className="flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-md">
          <span className="text-sm font-medium text-white shadow-sm drop-shadow-md truncate max-w-[120px] md:max-w-[200px]">
            {name} {participant.isLocal && "(You)"}
          </span>
        </div>

        {/* Mic Indicator */}
        <div className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md",
          isMicrophoneEnabled ? "bg-black/50 text-white" : "bg-red-500/80 text-white"
        )}>
          {isMicrophoneEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </div>
      </div>
    </div>
  );
}
