import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { VoiceMessagePlayer } from "./VoiceMessagePlayer";
import { Phone, Video, PhoneMissed, PhoneIncoming, PhoneOutgoing, Loader2, FileText, Download, MoreHorizontal, Edit2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useCallContext } from "@/components/providers/CallContext";

interface MessageBubbleProps {
  msg: {
    id: string;
    senderId: string;
    text: string;
    createdAt: string;
    mediaUrl?: string;
    mediaType?: string | null;
    isEdited?: boolean;
  };
  isMe: boolean;
  showTail: boolean;
  peerId?: string;
  peerName?: string;
  peerAvatar?: string;
  onEdit?: (messageId: string, newText: string) => void;
}

export function MessageBubble({ msg, isMe, showTail, peerId, peerName, peerAvatar, onEdit }: MessageBubbleProps) {
  const { initiateCall } = useCallContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(msg.text);

  const renderOptionsMenu = () => {
    if (!isMe || msg.id.startsWith("optimistic-") || !msg.text) return null;
    return (
      <div
        className={cn(
          "flex items-center gap-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity self-center px-1.5 shrink-0 z-20 order-first"
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shadow-xs bg-white/90 border border-slate-200/80 cursor-pointer"
              title="Message options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-white p-1.5 rounded-xl shadow-lg border border-slate-100 z-50"
          >
            <DropdownMenuItem
              onClick={() => {
                setEditText(msg.text);
                setIsEditing(true);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#3B58F5]" />
              <span>Edit message</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

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
    <div className={cn("flex w-full z-10 my-1 group/bubble relative items-center", isMe ? "justify-end" : "justify-start")}>
      {renderOptionsMenu()}
      <div className={cn("flex flex-col max-w-[75%]", isMe ? "items-end" : "items-start")}>
        <div
          className={cn(
            "relative px-5 py-3 text-[15px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex flex-col group",
            isMe ? "bg-[#254BCC] text-white rounded-[24px] rounded-br-[6px]" : "bg-white text-[#11142D] rounded-[24px] rounded-bl-[6px]"
          )}
        >

          {renderMedia()}

          {msg.text && (
            isEditing ? (
              <div className="flex flex-col gap-2 w-full min-w-[200px] mt-1">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (editText.trim() && editText.trim() !== msg.text) {
                        onEdit?.(msg.id, editText.trim());
                      }
                      setIsEditing(false);
                    } else if (e.key === "Escape") {
                      setIsEditing(false);
                      setEditText(msg.text);
                    }
                  }}
                  className="w-full text-sm bg-white/20 text-white placeholder-white/60 border border-white/30 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                  rows={2}
                  autoFocus
                />
                <div className="flex justify-end gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditText(msg.text);
                    }}
                    className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (editText.trim() && editText.trim() !== msg.text) {
                        onEdit?.(msg.id, editText.trim());
                      }
                      setIsEditing(false);
                    }}
                    className="px-2.5 py-1 rounded bg-white font-medium text-[#254BCC] hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <span
                className="leading-snug whitespace-pre-wrap"
                style={{ wordBreak: "break-word" }}
              >
                {msg.text}
              </span>
            )
          )}
        </div>
        
        {/* Timestamp outside the bubble */}
        <div className={cn("flex items-center gap-1 mt-1 px-1", isMe ? "justify-end text-gray-500" : "justify-start text-gray-500")}>
          <span className="text-[11px] font-medium flex items-center gap-1">
            {msg.isEdited && <span className="italic font-normal">(edited)</span>}
            {isMe ? "Sent" : formatTime(msg.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
