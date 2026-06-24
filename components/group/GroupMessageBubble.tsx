import React from "react";
import { cn } from "@/lib/utils";
import { VoiceMessagePlayer } from "@/components/chat/VoiceMessagePlayer";

interface GroupMessageBubbleProps {
  msg: {
    id: string;
    senderId: string;
    text: string;
    createdAt: string;
    mediaUrl?: string;
    mediaType?: "image" | "video" | "audio" | "document" | null;
    sender?: {
      profile?: {
        displayName: string;
        avatarUrl: string | null;
      } | null;
    };
  };
  isMe: boolean;
  showAvatar: boolean;
  isNextSameSender: boolean;
  isFirstFromSender: boolean;
}

export function GroupMessageBubble({ msg, isMe, showAvatar, isNextSameSender, isFirstFromSender }: GroupMessageBubbleProps) {
  const senderName = msg.sender?.profile?.displayName || "Unknown";
  const senderInitials = senderName.charAt(0).toUpperCase();

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

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

    if (msg.mediaType?.startsWith("audio") || msg.mediaType === "audio") {
      return <VoiceMessagePlayer key={`voice-${msg.id}`} src={msg.mediaUrl} messageId={msg.id} isMe={isMe} />;
    }

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
    <div className={cn("flex w-full mb-1", isMe ? "justify-end" : "justify-start")}>
      {!isMe && (
        <div className="w-8 shrink-0 mr-3 flex items-end pb-5">
          {showAvatar && (
            <div className="h-8 w-8 rounded-full flex items-center justify-center bg-[#3B58F5] text-white text-xs font-bold shadow-sm overflow-hidden">
              {msg.sender?.profile?.avatarUrl ? (
                <img
                  src={msg.sender.profile.avatarUrl}
                  className="h-full w-full object-cover"
                  alt={senderName}
                />
              ) : (
                senderInitials
              )}
            </div>
          )}
        </div>
      )}

      <div className={cn("flex flex-col max-w-[75%]", isMe ? "items-end" : "items-start")}>
        {!isMe && isFirstFromSender && (
          <span className="text-[12px] font-semibold text-[#3B58F5] ml-1 mb-1">
            {senderName}
          </span>
        )}

        <div
          className={cn(
            "px-4 py-3 text-[14.5px] shadow-sm leading-relaxed flex flex-col group",
            isMe
              ? "bg-[#3B58F5] text-white rounded-[20px] rounded-br-sm"
              : "bg-white text-[#11142D] rounded-[20px] rounded-bl-sm"
          )}
        >
          {renderMedia()}

          {msg.text && (
            <span
              className="whitespace-pre-wrap"
              style={{ wordBreak: "break-word" }}
            >
              {msg.text}
            </span>
          )}
        </div>

        {(!isNextSameSender || isMe) && (
          <div className={cn("flex flex-col mt-1", isMe ? "items-end mr-1" : "ml-1")}>
            <span className="text-[11px] font-medium text-[#8F95B2]">
              {formatTime(msg.createdAt)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
