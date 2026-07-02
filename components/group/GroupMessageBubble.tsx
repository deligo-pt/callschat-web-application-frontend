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
      <div className={cn("flex w-full mb-2", isMe ? "justify-end" : "justify-start")}>
        <div className={cn("flex flex-col w-full max-w-[280px]", isMe ? "items-end" : "items-start")}>
          <div
            onClick={() => groupId && startGroupCall(groupId, isVideo ? 'VIDEO' : 'AUDIO')}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl border shadow-sm w-full transition-colors cursor-pointer",
              isMe ? "bg-[#EEF2FF] border-[#E0E7FF] hover:bg-[#E0E7FF]" : "bg-[#EEF2FF] border-[#E0E7FF] hover:bg-[#E0E7FF]"
            )}
          >
            <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[#2563EB]">
              {isVideo ? <Video className="w-4 h-4" /> : isMissed ? <PhoneMissed className="w-4 h-4 text-red-500" /> : <Phone className="w-4 h-4" strokeWidth={2.5} />}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className={cn("font-bold text-[13px] truncate", isMissed ? "text-red-500" : "text-[#2563EB]")}>
                {isVideo ? "Video call" : "Audio call"}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">{subtitle}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium self-end mb-0.5">{formatTime(msg.createdAt).toLowerCase()}</span>
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
    <div className={cn("flex w-full mb-4", isMe ? "justify-end" : "justify-start")}>
      <div className={cn("flex flex-col max-w-[65%]", isMe ? "items-end" : "items-start")}>
        <div
          className={cn(
            "px-4 py-2.5 text-[14px] shadow-sm leading-relaxed flex flex-col group",
            isMe
              ? "bg-[#2563EB] text-white rounded-[20px] rounded-tr-sm"
              : "bg-white text-[#1E293B] rounded-[20px] rounded-tl-sm"
          )}
        >
          {renderMedia()}

          {msg.text && (
            <span
              className="whitespace-pre-wrap font-medium"
              style={{ wordBreak: "break-word" }}
            >
              {msg.text}
            </span>
          )}
        </div>

        {(!isNextSameSender || isMe) && (
          <div className={cn("flex flex-col mt-1.5", isMe ? "items-end mr-1" : "ml-1")}>
            <span className="text-[11px] font-semibold text-slate-400">
              {isMe ? "Sent" : formatTime(msg.createdAt).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
