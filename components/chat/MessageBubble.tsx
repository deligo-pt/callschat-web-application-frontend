import React from "react";
import { cn } from "@/lib/utils";
import { VoiceMessagePlayer } from "./VoiceMessagePlayer";
import { Phone, Video, PhoneMissed, PhoneIncoming, PhoneOutgoing } from "lucide-react";
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

    if (msg.mediaType?.startsWith("image")) {
      return (
        <img
          key={mediaKey}
          src={msg.mediaUrl}
          alt="Attached Image"
          className="rounded-lg max-w-sm w-full cursor-pointer object-cover mb-1"
        />
      );
    }

    if (msg.mediaType?.startsWith("video")) {
      return (
        <video
          key={mediaKey}
          src={msg.mediaUrl}
          controls
          className="rounded-lg max-w-sm w-full max-h-[300px] mb-1"
        />
      );
    }

    // Fallback: downloadable link
    return (
      <a
        key={mediaKey}
        href={msg.mediaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-blue-500 underline mb-1"
      >
        📎 Download Attachment
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
