"use client";

import React, { useEffect, useState } from "react";
import { LiveKitRoom, RoomAudioRenderer, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { useMeetingStore } from "@/hooks/useMeetingStore";
import { MeetingService } from "@/services/meeting.service";
import { useUser } from "@/context/UserContext";

export function HuddleOverlay() {
  const { token, meetingId, clearMeeting } = useMeetingStore();
  const { workspace } = useUser();
  const [wsUrl, setWsUrl] = useState<string>("");

  useEffect(() => {
    // In production, this should be an env variable (e.g. NEXT_PUBLIC_LIVEKIT_URL)
    // We'll try to extract it from env or fallback to the actual LiveKit cloud URL.
    const url = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://callschat-mvp-qay10xfl.livekit.cloud";
    setWsUrl(url);
  }, []);

  if (!token || !meetingId || !wsUrl) {
    return null;
  }

  const handleDisconnected = async () => {
    clearMeeting();
    try {
      if (workspace?.id) {
        await MeetingService.endMeeting(meetingId, workspace.id);
      }
    } catch (err: any) {
      // It's perfectly normal to get a 403 if a non-host leaves the huddle.
      // We only want to end the meeting if the host leaves, otherwise they just disconnect locally.
      if (err?.response?.status !== 403) {
        console.error("Failed to end meeting", err);
      }
    }
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-black/90 z-50 flex flex-col pointer-events-auto">
      {/* LiveKit Room Wrapper */}
      <LiveKitRoom
        token={token}
        serverUrl={wsUrl}
        connect={true}
        audio={true}
        video={false} // Start with audio only for Huddles
        onDisconnected={handleDisconnected}
        data-lk-theme="default"
        style={{ height: "100%", width: "100%" }}
      >
        {/* Render the standard conference UI which includes participant grid and control bar */}
        <VideoConference />

        {/* Responsible for playing audio from the room */}
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
