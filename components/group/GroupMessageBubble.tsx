import React from "react";
import { cn } from "@/lib/utils";
import { VoiceMessagePlayer } from "@/components/chat/VoiceMessagePlayer";
import { Phone, Video, PhoneMissed, PhoneIncoming, PhoneOutgoing } from "lucide-react";
import { useCallContext } from "@/components/providers/CallContext";

interface GroupMessageBubbleProps {
  msg: {
    id: string;
    senderId: string;
    text: string;
    createdAt: string;
    mediaUrl?: string;
    mediaType?: string | null;
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
  groupId?: string;
}

export function GroupMessageBubble({ msg, isMe, showAvatar, isNextSameSender, isFirstFromSender, groupId }: GroupMessageBubbleProps) {
  const { startGroupCall } = useCallContext();
  const senderName = msg.sender?.profile?.displayName || "Unknown";
  const senderInitials = senderName.charAt(0).toUpperCase();

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
      <div className={cn("flex w-full mb-1", isMe ? "justify-end" : "justify-start")}>
        {!isMe && (
          <div className="w-8 shrink-0 mr-3 flex items-end pb-2">
            {showAvatar && (
              <div className="h-8 w-8 rounded-full flex items-center justify-center bg-[#3B58F5] text-white text-xs font-bold shadow-sm overflow-hidden">
                {msg.sender?.profile?.avatarUrl ? (
                  <img src={msg.sender.profile.avatarUrl} className="h-full w-full object-cover" alt={senderName} />
                ) : senderInitials}
              </div>
            )}
          </div>
        )}

        <div className={cn("flex flex-col max-w-[75%]", isMe ? "items-end" : "items-start")}>
          {!isMe && isFirstFromSender && (
            <span className="text-[12px] font-semibold text-[#3B58F5] ml-1 mb-1">{senderName}</span>
          )}

          <div
            onClick={() => groupId && startGroupCall(groupId, isVideo ? 'VIDEO' : 'AUDIO')}
            className={cn(
              "flex items-center gap-3.5 px-4 py-3 rounded-2xl border shadow-sm max-w-[280px] w-full transition-colors cursor-pointer",
              isMe ? "bg-[#EEF2FF] border-[#D8E2FF] hover:bg-[#E0E9FF]" : "bg-white border-gray-200 hover:bg-gray-50"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-full shrink-0 flex items-center justify-center shadow-sm",
              isMissed ? "bg-red-50 text-red-500" : "bg-[#E0E9FF] text-[#254BCC]"
            )}>
              {isVideo ? <Video className="w-5 h-5" /> : isMissed ? <PhoneMissed className="w-5 h-5" /> : isMe ? <PhoneOutgoing className="w-5 h-5" /> : <PhoneIncoming className="w-5 h-5" />}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className={cn("font-bold text-[14px] truncate", isMissed ? "text-red-500" : "text-[#254BCC]")}>
                {isVideo ? "Group Video call" : "Group Audio call"}
              </span>
              <span className="text-xs text-gray-500 font-medium">{subtitle}</span>
            </div>
            <span className="text-[10px] text-gray-400 font-medium self-end ml-1">{formatTime(msg.createdAt)}</span>
          </div>
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
