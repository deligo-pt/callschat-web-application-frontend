"use client";

import React from "react";
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import { useCallContext } from "@/components/providers/CallContext";

export const ActiveCallRoom = () => {
  const { activeCall, hangupCall } = useCallContext();

  if (!activeCall) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white">
      <LiveKitRoom
        video={true}
        audio={true}
        token={activeCall.token}
        serverUrl={activeCall.livekitUrl}
        connect={true}
        onDisconnected={() => hangupCall(activeCall.roomName)}
        className="h-full w-full"
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
};
