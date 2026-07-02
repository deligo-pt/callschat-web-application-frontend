import React from "react";
import { cn } from "@/lib/utils";
import { VoiceMessagePlayer } from "./VoiceMessagePlayer";
import { Phone, Video, PhoneMissed, PhoneIncoming, PhoneOutgoing, Loader2, FileText, Download } from "lucide-react";
import { useCallContext } from "@/components/providers/CallContext";

interface MessageBubbleProps {
  msg: {
    id: string;
    senderId: string;
    text: string;
    createdAt: string;
    mediaUrl?: string;
    mediaType?: string | null;
  };
  isMe: boolean;
  showTail: boolean;
  peerId?: string;
  peerName?: string;
  peerAvatar?: string;
}

export function MessageBubble({ msg, isMe, showTail, peerId, peerName, peerAvatar }: MessageBubbleProps) {
  const { initiateCall } = useCallContext();

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (msg.mediaType === "call" && msg.mediaUrl) {
    let callData: { callId: string; type: "AUDIO" | "VIDEO"; status: string; durationSeconds: number } | null = null;
    try {
      callData = JSON.parse(msg.mediaUrl);
    } catch {}

    const isVideo = callData?.type === "VIDEO";
    const isMissed = callData?.status === "MISSED" || callData?.status === "DECLINED";
    const dur = callData?.durationSeconds ?? 0;

    const formatDur = (s: number) => {
      if (!s) return "";
      const m = Math.floor(s / 60);
      const rem = s % 60;
      if (m > 0) return `${m} mins`;
      return `${rem} secs`;
    };

    const subtitle = isMissed 
      ? (callData?.status === "DECLINED" ? "Declined" : "No answer") 
      : (dur > 0 ? formatDur(dur) : "Call ended");

    return (
      <div className={cn("flex w-full z-10 flex-col my-1", isMe ? "items-end" : "items-start")}>
        <div
          onClick={() => peerId && initiateCall(peerId, isVideo ? 'VIDEO' : 'AUDIO', peerName, peerAvatar)}
          className={cn(
            "flex items-center gap-3.5 px-4 py-3 rounded-2xl border shadow-sm max-w-[280px] w-full transition-colors cursor-pointer",
            isMe 
              ? "bg-[#EEF2FF] border-[#D8E2FF] hover:bg-[#E0E9FF]" 
              : "bg-white border-gray-200 hover:bg-gray-50"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-full shrink-0 flex items-center justify-center shadow-sm",
            isMissed ? "bg-red-50 text-red-500" : "bg-[#E0E9FF] text-[#254BCC]"
          )}>
            {isVideo ? (
              <Video className="w-5 h-5" />
            ) : isMissed ? (
              <PhoneMissed className="w-5 h-5" />
            ) : isMe ? (
              <PhoneOutgoing className="w-5 h-5" />
            ) : (
              <PhoneIncoming className="w-5 h-5" />
            )}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className={cn("font-bold text-[14px] truncate", isMissed ? "text-red-500" : "text-[#254BCC]")}>
              {isVideo ? "Video call" : "Audio call"}
            </span>
            <span className="text-xs text-gray-500 font-medium">
              {subtitle}
            </span>
          </div>
          <span className="text-[10px] text-gray-400 font-medium self-end ml-1">
            {formatTime(msg.createdAt)}
          </span>
        </div>
      </div>
    );
  }

  const isVoice =
    msg.mediaUrl && (msg.mediaType?.startsWith("audio") || msg.mediaType === "audio");

  // Voice messages skip the text-bubble wrapper entirely
  if (isVoice) {
    return (
      <div className={cn("flex w-full z-10 flex-col mb-1", isMe ? "items-end" : "items-start")}>
        <VoiceMessagePlayer
          key={`voice-${msg.id}`}
          src={msg.mediaUrl!}
          messageId={msg.id}
          isMe={isMe}
        />
        <div className={cn("flex items-center gap-1 mt-1 px-1", isMe ? "justify-end text-gray-500" : "justify-start text-gray-500")}>
          <span className="text-[11px] font-medium">
            {formatTime(msg.createdAt)}
          </span>
        </div>
      </div>
    );
  }

  const renderMedia = () => {
    if (!msg.mediaUrl) return null;

    const mediaKey = `media-${msg.id}-${msg.mediaUrl}`;
    const isOptimistic = msg.id.startsWith("optimistic-");

    if (msg.mediaType === 'link') {
      return null;
    }

    if (msg.mediaType?.startsWith("image")) {
      return (
        <div className="relative mb-1">
          <img
            key={mediaKey}
            src={msg.mediaUrl}
            alt="Attached Image"
            className={cn("rounded-lg max-w-sm w-full cursor-pointer object-cover", isOptimistic && "opacity-70 blur-[2px]")}
          />
          {isOptimistic && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/50 p-3 rounded-full text-white shadow-lg backdrop-blur-sm">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            </div>
          )}
        </div>
      );
    }

    if (msg.mediaType?.startsWith("video")) {
      return (
        <div className="relative mb-1">
          <video
            key={mediaKey}
            src={msg.mediaUrl}
            controls={!isOptimistic}
            className={cn("rounded-lg max-w-sm w-full max-h-[300px]", isOptimistic && "opacity-70 blur-[2px]")}
          />
          {isOptimistic && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/50 p-3 rounded-full text-white shadow-lg backdrop-blur-sm">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            </div>
          )}
        </div>
      );
    }

    // Document Card
    return (
      <a
        key={mediaKey}
        href={isOptimistic ? undefined : msg.mediaUrl}
        target={isOptimistic ? undefined : "_blank"}
        rel="noopener noreferrer"
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl mb-1 min-w-[200px] border shadow-sm transition-colors",
          isMe 
            ? "bg-white/10 border-white/20 hover:bg-white/20 text-white" 
            : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800",
          isOptimistic && "pointer-events-none opacity-80"
        )}
      >
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg shrink-0",
          isMe ? "bg-white/20" : "bg-blue-100 text-blue-600"
        )}>
          {isOptimistic ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <FileText className="w-5 h-5" />
          )}
        </div>
        <div className="flex flex-col flex-1 truncate">
          <span className="text-sm font-semibold truncate leading-tight">Document</span>
          <span className={cn("text-xs font-medium", isMe ? "text-blue-100" : "text-slate-500")}>
            {isOptimistic ? "Uploading..." : "Click to view"}
          </span>
        </div>
        {!isOptimistic && (
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", isMe ? "hover:bg-white/20" : "hover:bg-slate-200")}>
            <Download className="w-4 h-4" />
          </div>
        )}
      </a>
    );
  };

  return (
    <div className={cn("flex w-full z-10 flex-col mb-1", isMe ? "items-end" : "items-start")}>
      <div
        className={cn(
          "relative max-w-[75%] px-5 py-3 text-[15px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex flex-col group",
          isMe ? "bg-[#254BCC] text-white rounded-[24px] rounded-br-[6px]" : "bg-white text-[#11142D] rounded-[24px] rounded-bl-[6px]"
        )}
      >

        {renderMedia()}

        {msg.text && (
          <span
            className="leading-snug whitespace-pre-wrap"
            style={{ wordBreak: "break-word" }}
          >
            {msg.text}
          </span>
        )}
      </div>
      
      {/* Timestamp outside the bubble */}
      <div className={cn("flex items-center gap-1 mt-1 px-1", isMe ? "justify-end text-gray-500" : "justify-start text-gray-500")}>
        <span className="text-[11px] font-medium">
          {isMe ? "Sent" : formatTime(msg.createdAt)}
        </span>
      </div>
    </div>
  );
}
