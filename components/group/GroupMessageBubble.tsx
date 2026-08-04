import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { getOptimizedImageUrl, getRawMediaUrl } from "@/utils/image";
import { VoiceMessagePlayer } from "@/components/chat/VoiceMessagePlayer";
import {
  Phone,
  Video,
  PhoneMissed,
  PhoneIncoming,
  PhoneOutgoing,
  Loader2,
  FileText,
  Download,
  Pin,
  PinOff,
  MoreHorizontal,
  Clock,
  Edit2,
  Trash2,
  Check,
  CheckCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useCallContext } from "@/components/providers/CallContext";

const formatTextWithLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a 
          key={i} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="underline underline-offset-2 hover:opacity-80 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

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
    isEdited?: boolean;
    isDeleted?: boolean;
    receipts?: {
      id: string;
      userId: string;
      deliveredAt: string | null;
      seenAt: string | null;
    }[];
  };
  isMe: boolean;
  showAvatar: boolean;
  isNextSameSender: boolean;
  isFirstFromSender: boolean;
  groupId?: string;
  isPinned?: boolean;
  onPin?: (durationSeconds?: number, previewText?: string, previewMedia?: string) => void;
  onUnpin?: () => void;
  onEdit?: (messageId: string, newText: string) => void;
  onUnsend?: (messageId: string) => void;
  groupMembersCount?: number;
}

export function GroupMessageBubble({
  msg,
  isMe,
  showAvatar,
  isNextSameSender,
  isFirstFromSender,
  groupId,
  isPinned,
  onPin,
  onUnpin,
  onEdit,
  onUnsend,
  groupMembersCount,
}: GroupMessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(msg.text);

  const getMessageStatus = () => {
    if (!msg.receipts || msg.receipts.length === 0) return "SENT";
    
    // For groups, if everyone else has seen it, it's SEEN
    // If everyone else has it delivered, it's DELIVERED
    const expected = groupMembersCount ? Math.max(1, groupMembersCount - 1) : 1; // fallback to 1 if unknown
    
    const seenCount = msg.receipts.filter(r => r.seenAt).length;
    if (seenCount >= expected) return "SEEN";
    
    const deliveredCount = msg.receipts.filter(r => r.deliveredAt || r.seenAt).length;
    if (deliveredCount >= expected) return "DELIVERED";
    
    return "SENT";
  };
  const status = getMessageStatus();

  if (msg.text && msg.text.startsWith("__PIN_EVENT__:")) {
    try {
      const payload = JSON.parse(msg.text.substring("__PIN_EVENT__:".length));
      if (payload && payload.action) {
        const isPin = payload.action === "pin";
        return (
          <div className="flex justify-center my-3 w-full">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-1.5 rounded-full text-[12px] font-medium text-[#64748B] flex items-center gap-1.5 shadow-xs">
              <Pin className="w-3.5 h-3.5 text-[#3B58F5] shrink-0" />
              <span>
                <strong className="font-semibold text-[#334155]">{payload.pinnerName || "A member"}</strong>{" "}
                {isPin ? "pinned" : "unpinned"} a message
              </span>
            </div>
          </div>
        );
      }
    } catch (e) {}
    return null;
  }

  if (msg.isDeleted) {
    return (
      <div className={cn("flex w-full mb-4 group/bubble relative items-center", isMe ? "justify-end" : "justify-start")}>
        <div className={cn("flex flex-col max-w-[65%]", isMe ? "items-end" : "items-start")}>
          {!isMe && (isFirstFromSender || showAvatar) && (
            <span className="text-[12px] font-bold text-[#2563EB] mb-1 pl-1">
              {msg.sender?.profile?.displayName || "Unknown"}
            </span>
          )}
          <div
            className={cn(
              "px-4 py-2.5 text-[14px] italic text-[#8F95B2] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[20px]",
              isMe ? "rounded-tr-sm" : "rounded-tl-sm"
            )}
          >
            🚫 This message was deleted
          </div>
        </div>
      </div>
    );
  }

  const renderOptionsMenu = () => (
    <div
      className={cn(
        "flex items-center gap-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity self-center px-1.5 shrink-0 z-20",
        isMe ? "order-first" : "order-last"
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
          align={isMe ? "end" : "start"}
          className="w-48 bg-white p-1.5 rounded-xl shadow-lg border border-slate-100 z-50"
        >
          {isMe && !msg.id.startsWith("optimistic-") && msg.text && !msg.text.startsWith("__PIN_EVENT__:") && (
            <>
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
              <DropdownMenuItem
                onClick={() => onUnsend?.(msg.id)}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span>Unsend for everyone</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-slate-100" />
            </>
          )}
          {!isPinned ? (
            <>
              <DropdownMenuLabel className="text-[11px] font-semibold text-slate-400 px-2 py-1">
                Pin Message
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => onPin?.(86400, msg.text, msg.mediaType || undefined)}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-[#3B58F5]" />
                <span>For 24 hours</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onPin?.(604800, msg.text, msg.mediaType || undefined)}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-[#3B58F5]" />
                <span>For 7 days</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onPin?.(2592000, msg.text, msg.mediaType || undefined)}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-[#3B58F5]" />
                <span>For 30 days</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-slate-100" />
              <DropdownMenuItem
                onClick={() => onPin?.(undefined, msg.text, msg.mediaType || undefined)}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <Pin className="w-3.5 h-3.5 text-[#3B58F5]" />
                <span>Until unpinned</span>
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem
              onClick={() => onUnpin?.()}
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
            >
              <PinOff className="w-3.5 h-3.5 text-red-500" />
              <span>Unpin message</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const renderPinnedBadge = () => {
    if (!isPinned) return null;
    return (
      <div
        className={cn(
          "flex items-center gap-1 text-[10px] font-bold mb-1.5 px-2 py-0.5 rounded-full w-fit shadow-2xs",
          isMe
            ? "bg-white/20 text-white self-end"
            : "bg-[#3B58F5]/10 text-[#3B58F5] self-start"
        )}
      >
        <Pin className="w-2.5 h-2.5 rotate-45 shrink-0" />
        <span>Pinned</span>
      </div>
    );
  };
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
      <div id={`msg-${msg.id}`} className={cn("flex w-full mb-2 group/bubble relative items-center", isMe ? "justify-end" : "justify-start")}>
        {renderOptionsMenu()}
        <div className={cn("flex flex-col w-full max-w-[280px]", isMe ? "items-end" : "items-start")}>
          <div
            onClick={() => groupId && startGroupCall(groupId, isVideo ? 'VIDEO' : 'AUDIO')}
            className={cn(
              "flex flex-col px-4 py-3 rounded-xl border shadow-sm w-full transition-colors cursor-pointer",
              isMe ? "bg-[#EEF2FF] border-[#E0E7FF] hover:bg-[#E0E7FF]" : "bg-[#EEF2FF] border-[#E0E7FF] hover:bg-[#E0E7FF]"
            )}
          >
            {renderPinnedBadge()}
            <div className="flex items-center gap-3 w-full">
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
            src={getOptimizedImageUrl(msg.mediaUrl)}
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
            src={getRawMediaUrl(msg.mediaUrl)}
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

    if (msg.mediaType?.startsWith("audio") || msg.mediaType === "audio") {
      return <VoiceMessagePlayer key={`voice-${msg.id}`} src={getRawMediaUrl(msg.mediaUrl)} messageId={msg.id} isMe={isMe} />;
    }

    // Document / Email Card
    const fileName = msg.mediaUrl ? decodeURIComponent(msg.mediaUrl.split('/').pop()?.split('?')[0] || "Document") : "Document";
    const isEmailFile = fileName.toLowerCase().endsWith('.eml') || fileName.toLowerCase().endsWith('.msg');
    return (
      <a
        key={mediaKey}
        href={isOptimistic ? undefined : getRawMediaUrl(msg.mediaUrl)}
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
          <span className="text-sm font-semibold truncate leading-tight" title={fileName}>{fileName}</span>
          <span className={cn("text-xs font-medium", isMe ? "text-blue-100" : "text-slate-500")}>
            {isOptimistic ? "Uploading..." : isEmailFile ? "Email File · Click to open" : "Document · Click to open"}
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
    <div id={`msg-${msg.id}`} className={cn("flex w-full mb-4 group/bubble relative items-center", isMe ? "justify-end" : "justify-start")}>
      {renderOptionsMenu()}
      <div className={cn("flex flex-col max-w-[65%]", isMe ? "items-end" : "items-start")}>
        {!isMe && (isFirstFromSender || showAvatar) && (
          <span className="text-[12px] font-bold text-[#2563EB] mb-1 pl-1">
            {senderName}
          </span>
        )}
        <div
          className={cn(
            "px-4 py-2.5 text-[14px] shadow-sm leading-relaxed flex flex-col group",
            isMe
              ? "bg-[#2563EB] text-white rounded-[20px] rounded-tr-sm"
              : "bg-white text-[#1E293B] rounded-[20px] rounded-tl-sm"
          )}
        >
          {renderPinnedBadge()}
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
                    className="px-2.5 py-1 rounded bg-white font-medium text-[#2563EB] hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <span
                className="whitespace-pre-wrap font-medium"
                style={{ wordBreak: "break-word" }}
              >
                {formatTextWithLinks(msg.text)}
              </span>
            )
          )}
        </div>

        {(!isNextSameSender || isMe) && (
          <div className={cn("flex flex-col mt-1.5", isMe ? "items-end mr-1" : "ml-1")}>
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              {msg.isEdited && <span className="italic font-normal">(edited)</span>}
              {formatTime(msg.createdAt).toUpperCase()}
              {isMe && (
                <span className="ml-0.5 inline-flex items-center">
                  {status === "SENT" && <Check className="w-4 h-4 text-gray-400" strokeWidth={2.5} />}
                  {status === "DELIVERED" && <CheckCheck className="w-4 h-4 text-gray-400" strokeWidth={2.5} />}
                  {status === "SEEN" && <CheckCheck className="w-4 h-4 text-[#34B7F1]" strokeWidth={2.5} />}
                </span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
