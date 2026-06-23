"use client";

import React, { useState, useEffect } from "react";
import { 
  LiveKitRoom, 
  RoomAudioRenderer,
  useLocalParticipant,
  useRemoteParticipants,
  useTracks,
  VideoTrack
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import { useCallContext } from "@/components/providers/CallContext";
import { Maximize, Minimize, Mic, MicOff, Video, VideoOff, Volume2, VolumeX, PhoneOff, ArrowLeft, UserPlus, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

// Formatting helper for call duration
const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const CustomCallLayout = ({ isMaximized, setIsMaximized }: { isMaximized: boolean, setIsMaximized: (v: boolean) => void }) => {
  const { activeCall, hangupCall } = useCallContext();
  const remoteParticipants = useRemoteParticipants();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const [duration, setDuration] = useState(0);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const remoteParticipant = remoteParticipants[0];
  
  // Use useTracks to ensure reactivity when tracks are published/unpublished
  const cameraTracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: false }]);
  const remoteTrackRef = cameraTracks.find((t) => t.participant.identity !== localParticipant.identity);
  const localTrackRef = cameraTracks.find((t) => t.participant.identity === localParticipant.identity);

  const isVideoMode = activeCall?.callType === 'VIDEO' || isCameraEnabled || remoteParticipant?.isCameraEnabled;

  // Avatar generator
  const remoteName = activeCall?.roomName?.split('_')[0] || "Unknown User"; // fallback logic
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(remoteName)}&background=3B58F5&color=fff&size=256`;

  return (
    <div className={cn(
      "relative flex flex-col w-full h-full overflow-hidden transition-colors duration-500",
      isVideoMode ? "bg-black" : "bg-[#1D2A54]"
    )}>
      
      {/* Video Background Layer */}
      {isVideoMode && (
        <div className="absolute inset-0 z-0">
          {remoteParticipant ? (
            remoteTrackRef ? (
              <VideoTrack 
                trackRef={remoteTrackRef} 
                className="w-full h-full object-cover" 
              />
            ) : (
              // Remote joined but video is off
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#1D2A54]">
                 <img src={avatarUrl} alt={remoteName} className="h-44 w-44 rounded-full object-cover border-4 border-[#3B58F5]" />
              </div>
            )
          ) : localTrackRef ? (
            // Remote hasn't joined, show local video full screen
            <VideoTrack 
              trackRef={localTrackRef} 
              className="w-full h-full object-cover scale-x-[-1]" 
            />
          ) : null}

          <div className="absolute inset-0 bg-black/20" /> {/* Subtle overlay */}
          
          {/* Overlay text if waiting for remote participant */}
          {!remoteParticipant && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <span className="text-white text-lg font-medium tracking-wide drop-shadow-lg">
                Calling...
              </span>
            </div>
          )}
        </div>
      )}

      {/* Top Header Layer */}
      <div className="absolute top-0 left-0 w-full z-10 flex items-center justify-between p-6 pointer-events-auto">
        <button 
          onClick={() => setIsMaximized(!isMaximized)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white transition-all hover:bg-black/40 border border-white/10"
        >
          {isMaximized ? <Minimize className="h-6 w-6" /> : <Maximize className="h-6 w-6" />}
        </button>

        <div className="flex gap-4">
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white transition-all hover:bg-black/40 border border-white/10">
            <UserPlus className="h-5 w-5" />
          </button>
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white transition-all hover:bg-black/40 border border-white/10">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Center Audio Layout Layer (Only visible in Audio Mode) */}
      {!isVideoMode && (
        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center mt-[-10vh]">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-[#3B58F5] animate-ping opacity-20" style={{ animationDuration: '3s' }} />
            <div className="absolute -inset-8 rounded-full border border-[#3B58F5]/30 animate-pulse" />
            <img 
              src={avatarUrl} 
              alt={remoteName}
              className="relative h-44 w-44 rounded-full object-cover border-4 border-[#3B58F5] shadow-[0_0_60px_rgba(59,88,245,0.4)]"
            />
          </div>
          
          <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">
            {remoteName}
          </h2>
          <p className="text-lg font-medium text-white/70 tracking-widest">
            {formatDuration(duration)}
          </p>
        </div>
      )}

      {/* Video Mode Top Center Info */}
      {isVideoMode && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center text-center drop-shadow-lg">
           <h2 className="text-xl font-bold text-white drop-shadow-md tracking-wide">
            {remoteName}
          </h2>
          <p className="text-sm font-medium text-white/90 drop-shadow-md">
            {formatDuration(duration)}
          </p>
        </div>
      )}

      {/* Local Video Picture-in-Picture (Only in Video Mode when remote has joined) */}
      {isVideoMode && remoteParticipant && localTrackRef && (
        <div className="absolute bottom-36 right-6 z-20 w-32 h-44 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-800 transition-all hover:scale-105">
          <VideoTrack 
            trackRef={localTrackRef} 
            className="w-full h-full object-cover scale-x-[-1]" 
          />
        </div>
      )}

      {/* Bottom Action Pill Control Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center justify-between gap-2 px-6 py-4 rounded-[2rem] bg-[#1D2A54]/80 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-w-[340px]">
        
        {/* Video Toggle */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full transition-all",
              isCameraEnabled ? "bg-white/10 text-white hover:bg-white/20" : "bg-white/10 text-white/50 hover:bg-white/20"
            )}
          >
            {isCameraEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
          </button>
          <span className="text-[10px] font-medium text-white/60">Video</span>
        </div>

        {/* Mic Toggle */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full transition-all shadow-lg",
              isMicrophoneEnabled ? "bg-[#3B58F5] text-white hover:bg-[#2a44d4]" : "bg-white/10 text-white/50 hover:bg-white/20"
            )}
          >
            {isMicrophoneEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </button>
          <span className="text-[10px] font-medium text-white/60">Mic</span>
        </div>

        {/* Speaker Toggle (UI only for now, WebRTC handles routing via browser mostly) */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full transition-all",
              isSpeakerOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-white/10 text-white/50 hover:bg-white/20"
            )}
          >
            {isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
          </button>
          <span className="text-[10px] font-medium text-white/60">Speaker</span>
        </div>

        {/* End Call Button */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => activeCall && hangupCall(activeCall.callId)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white transition-all hover:bg-red-600 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
          >
            <PhoneOff className="h-6 w-6" fill="currentColor" />
          </button>
          <span className="text-[10px] font-medium text-red-400">End</span>
        </div>

      </div>
    </div>
  );
};

export const ActiveCallRoom = () => {
  const { activeCall, hangupCall } = useCallContext();
  const [isMaximized, setIsMaximized] = useState(false);

  if (!activeCall) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md pointer-events-auto">
      <div 
        className={cn(
          "relative overflow-hidden shadow-2xl transition-all duration-500 flex flex-col",
          isMaximized 
            ? "w-full h-full rounded-none" 
            : "w-[95vw] h-[85vh] max-w-[1400px] max-h-[900px] rounded-[2.5rem] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.6)]"
        )}
      >
        <LiveKitRoom
          video={activeCall.callType === 'VIDEO'}
          audio={true}
          token={activeCall.token}
          serverUrl={activeCall.serverUrl}
          connect={true}
          onDisconnected={() => hangupCall(activeCall.callId)}
          className="flex-1 w-full h-full"
        >
          <CustomCallLayout isMaximized={isMaximized} setIsMaximized={setIsMaximized} />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  );
};
