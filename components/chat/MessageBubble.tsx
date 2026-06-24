import React from "react";
import { cn } from "@/lib/utils";
import { VoiceMessagePlayer } from "./VoiceMessagePlayer";

interface MessageBubbleProps {
  msg: {
    id: string;
    senderId: string;
    text: string;
    createdAt: string;
    mediaUrl?: string;
    mediaType?: "image" | "video" | "audio" | "document" | null;
  };
  isMe: boolean;
  showTail: boolean;
}

export function MessageBubble({ msg, isMe, showTail }: MessageBubbleProps) {
  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

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
