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
import { Mic, MicOff, Video, VideoOff, PhoneOff, ArrowLeft, UserPlus, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { ParticipantTile } from "./ParticipantTile";

const CustomCallLayout = () => {
  const { activeCall, hangupCall, leaveGroupCall } = useCallContext();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();

  // Dynamic Grid Engine: Fetch all active camera and screenshare tracks with placeholders
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false }
    ],
    { onlySubscribed: false }
  );

  // Auto-scaling grid algorithm
  let gridClass = "grid gap-3 w-full h-full pb-32 pt-24 px-4 transition-all duration-300";
  
  if (tracks.length === 1) {
    // 1 Participant: Full screen card viewport
    gridClass += " grid-cols-1 grid-rows-1";
  } else if (tracks.length === 2) {
    // 2 Participants: Vertical split on mobile, horizontal on desktop
    gridClass += " grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1";
  } else if (tracks.length <= 4) {
    // 3 to 4 Participants: Uniform 2x2 grid
    gridClass += " grid-cols-2 grid-rows-2";
  } else {
    // 5+ Participants: Strict 3-column mosaic grid with scrolling boundaries
    gridClass += " grid-cols-2 md:grid-cols-3 auto-rows-[minmax(200px,1fr)] overflow-y-auto";
  }

  // Duration formatting (mock timer for the header, could be synced with actual call start)
  const [duration, setDuration] = React.useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
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
      
      {/* Top Header Layer */}
      <div className="absolute left-0 top-0 z-40 flex w-full items-center justify-between p-4 md:p-6 bg-gradient-to-b from-black/60 to-transparent">
        <button 
          onClick={handleEndCall}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-[#3B58F5] transition-all hover:bg-white/20 backdrop-blur-md"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center">
          <h2 className="text-sm font-bold tracking-wide text-[#3B58F5]">
            Call
          </h2>
          <p className="text-xs font-semibold text-[#3B58F5]">
            {formatDuration(duration)}
          </p>
        </div>

        <div className="flex gap-2 md:gap-4">
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-[#3B58F5] transition-all hover:bg-white/20 backdrop-blur-md">
            <UserPlus className="h-4 w-4" />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-[#3B58F5] transition-all hover:bg-white/20 backdrop-blur-md">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Dynamic Grid Layer */}
      <div className={cn("absolute inset-0 z-0", gridClass)}>
        {tracks.map((trackRef, idx) => (
          <ParticipantTile 
            key={`${trackRef.participant.identity}-${trackRef.source}-${idx}`} 
            trackRef={trackRef} 
          />
        ))}
      </div>

      {/* Floating Overlay Control Dock */}
      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center justify-center gap-6 rounded-[2rem] bg-[#111936]/80 px-8 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl border border-white/5">
        
        {/* Toggle Camera */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300",
              isCameraEnabled ? "bg-[#3B58F5] text-white shadow-lg shadow-[#3B58F5]/30" : "bg-white/10 text-white/60 hover:bg-white/20"
            )}
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
              isMicrophoneEnabled ? "bg-[#3B58F5] text-white shadow-lg shadow-[#3B58F5]/30" : "bg-white/10 text-white/60 hover:bg-white/20"
            )}
          >
            {isMicrophoneEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </button>
          <span className="text-[11px] font-medium text-white/50">Mic</span>
        </div>

        {/* End Call Button */}
        <div className="flex flex-col items-center gap-1.5 ml-2">
          <button
            onClick={handleEndCall}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white transition-all duration-300 hover:scale-105 hover:bg-red-600 active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
          >
            <PhoneOff className="h-6 w-6" fill="currentColor" />
          </button>
          <span className="text-[11px] font-medium text-red-400">End</span>
        </div>

      </div>
    </div>
  );
};

export const ActiveCallRoom = () => {
  const { activeCall, hangupCall, leaveGroupCall } = useCallContext();

  if (!activeCall) return null;

  const handleDisconnect = () => {
    if (activeCall.isGroup && leaveGroupCall) {
      leaveGroupCall(activeCall.callId);
    } else {
      hangupCall(activeCall.callId);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black pointer-events-auto">
      <LiveKitRoom
        video={activeCall.callType === 'VIDEO'}
        audio={true}
        token={activeCall.token}
        serverUrl={activeCall.serverUrl}
        connect={true}
        onDisconnected={handleDisconnect}
        className="w-full h-full"
      >
        <CustomCallLayout />
        {/* System Integrity Control: Audio Renderer */}
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
};
