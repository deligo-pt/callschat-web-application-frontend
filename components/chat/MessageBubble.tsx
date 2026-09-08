import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { getOptimizedImageUrl, getRawMediaUrl } from "@/utils/image";
import { VoiceMessagePlayer } from "./VoiceMessagePlayer";
import {
  Phone,
  Video,
  PhoneMissed,
  PhoneIncoming,
  PhoneOutgoing,
  Loader2,
  FileText,
  Download,
  MoreHorizontal,
  Edit2,
  Pin,
  PinOff,
  Clock,
  Trash2,
  Check,
  CheckCheck,
  Reply,
  Camera,
  Mic,
  Copy,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuLabel,
} from "@/components/ui/context-menu";
import { toast } from "sonner";
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

interface MessageBubbleProps {
  msg: {
    id: string;
    senderId: string;
    text: string;
    createdAt: string;
    mediaUrl?: string;
    mediaType?: string | null;
    isEdited?: boolean;
    isDeleted?: boolean;
    replyToId?: string | null;
    replyTo?: {
      id: string;
      senderId: string;
      senderName?: string;
      text: string;
      mediaUrl?: string | null;
      mediaType?: string | null;
    } | null;
    receipts?: {
      id: string;
      userId: string;
      deliveredAt: string | null;
      seenAt: string | null;
    }[];
  };
  isMe: boolean;
  showTail: boolean;
  peerId?: string;
  peerName?: string;
  peerAvatar?: string;
  onEdit?: (messageId: string, newText: string) => void;
  isPinned?: boolean;
  onPin?: (durationSeconds?: number, previewText?: string, previewMedia?: string) => void;
  onUnpin?: () => void;
  onUnsend?: (messageId: string) => void;
  onReply?: (msg: any) => void;
  onScrollToMessage?: (messageId: string) => void;
  /** Per-message disappear timer in seconds, or null if not set. */
  disappearAfterSeconds?: number | null;
  currentUserId?: string;
}

export function MessageBubble({
  msg,
  isMe,
  showTail,
  peerId,
  peerName,
  peerAvatar,
  onEdit,
  isPinned,
  onPin,
  onUnpin,
  onUnsend,
  onReply,
  onScrollToMessage,
  disappearAfterSeconds,
  currentUserId,
}: MessageBubbleProps) {
  const { initiateCall } = useCallContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(msg.text);
  // Live countdown in seconds remaining (null = not disappearing)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const getMessageStatus = () => {
    if (msg.id.startsWith("optimistic-") && (!msg.receipts || msg.receipts.length === 0)) {
      return "SENDING";
    }
    if (!msg.receipts || msg.receipts.length === 0) return "SENT";
    const recipientReceipts = msg.receipts.filter((r) => r.userId !== msg.senderId);
    const targetReceipts = recipientReceipts.length > 0 ? recipientReceipts : msg.receipts;
    if (targetReceipts.some((r) => r.seenAt)) return "SEEN";
    if (targetReceipts.some((r) => r.deliveredAt)) return "DELIVERED";
    return "SENT";
  };
  const status = getMessageStatus();

  useEffect(() => {
    if (!disappearAfterSeconds) {
      setSecondsLeft(null);
      return;
    }
    const expiresAt = new Date(msg.createdAt).getTime() + disappearAfterSeconds * 1000;
    const calc = () => {
      const remaining = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [disappearAfterSeconds, msg.createdAt]);

  /** Format remaining seconds into a human-readable WhatsApp-style label. */
  const formatCountdown = (secs: number): string => {
    if (secs <= 0) return "0s";
    const d = Math.floor(secs / 86400);
    const h = Math.floor((secs % 86400) / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (d > 0) return h > 0 ? `${d}d ${h}h` : `${d}d`;
    if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
    if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`;
    return `${s}s`;
  };

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
                <strong className="font-semibold text-[#334155]">{payload.pinnerName || "You"}</strong>{" "}
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
      <div className={cn("flex w-full z-10 my-1 group/bubble relative items-center", isMe ? "justify-end" : "justify-start")}>
        <div className={cn("flex flex-col max-w-[75%]", isMe ? "items-end" : "items-start")}>
          <div
            className={cn(
              "px-4 py-2.5 text-[14px] italic text-[#8F95B2] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px]",
              isMe ? "rounded-br-[4px]" : "rounded-bl-[4px]"
            )}
          >
            🚫 This message was deleted
          </div>
        </div>
      </div>
    );
  }

  const renderOptionsMenu = () => {
    if (msg.id.startsWith("optimistic-") || msg.isDeleted || (!msg.text && !msg.mediaUrl) || msg.text?.startsWith("__PIN_EVENT__:")) return null;
    return (
      <div
        className={cn(
          "flex items-center gap-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity self-center px-1.5 shrink-0 z-20",
          isMe ? "order-first" : "order-last"
        )}
      >
        <button
          type="button"
          onClick={() => onReply?.(msg)}
          className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shadow-xs bg-white/90 border border-slate-200/80 cursor-pointer"
          title="Reply"
        >
          <Reply className="w-4 h-4" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shadow-xs bg-white/90 border border-slate-200/80 cursor-pointer"
              title="Message options"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={isMe ? "end" : "start"}
            className="w-52 bg-white dark:bg-[#233138] p-1.5 rounded-[16px] shadow-2xl border border-black/5 dark:border-white/10 z-50 text-[#111B21] dark:text-[#E9EDEF]"
          >
            <DropdownMenuItem
              onClick={() => onReply?.(msg)}
              className="flex items-center gap-3 px-3 py-2 text-[13.5px] font-medium text-[#111B21] dark:text-[#E9EDEF] rounded-lg hover:bg-[#F5F6F6] dark:hover:bg-[#182229] cursor-pointer"
            >
              <Reply className="w-4 h-4 text-[#54656F] dark:text-[#8696A0]" />
              <span>Reply</span>
            </DropdownMenuItem>

            {msg.text && (
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(msg.text);
                  toast.success("Copied to clipboard");
                }}
                className="flex items-center gap-3 px-3 py-2 text-[13.5px] font-medium text-[#111B21] dark:text-[#E9EDEF] rounded-lg hover:bg-[#F5F6F6] dark:hover:bg-[#182229] cursor-pointer"
              >
                <Copy className="w-4 h-4 text-[#54656F] dark:text-[#8696A0]" />
                <span>Copy</span>
              </DropdownMenuItem>
            )}

            {!isPinned ? (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="flex items-center gap-3 px-3 py-2 text-[13.5px] font-medium text-[#111B21] dark:text-[#E9EDEF] rounded-lg hover:bg-[#F5F6F6] dark:hover:bg-[#182229] cursor-pointer">
                  <Pin className="w-4 h-4 text-[#54656F] dark:text-[#8696A0]" />
                  <span>Pin</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48 bg-white dark:bg-[#233138] rounded-[16px] shadow-2xl border border-black/5 dark:border-white/10 p-1.5">
                  <DropdownMenuLabel className="text-[11px] font-semibold text-[#54656F] dark:text-[#8696A0] px-3 py-1">
                    Choose duration
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => onPin?.(86400, msg.text, msg.mediaType || undefined)}
                    className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#111B21] dark:text-[#E9EDEF] rounded-lg hover:bg-[#F5F6F6] dark:hover:bg-[#182229] cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#00A884] dark:text-[#25D366]" />
                    <span>For 24 hours</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onPin?.(604800, msg.text, msg.mediaType || undefined)}
                    className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#111B21] dark:text-[#E9EDEF] rounded-lg hover:bg-[#F5F6F6] dark:hover:bg-[#182229] cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#00A884] dark:text-[#25D366]" />
                    <span>For 7 days</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onPin?.(2592000, msg.text, msg.mediaType || undefined)}
                    className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#111B21] dark:text-[#E9EDEF] rounded-lg hover:bg-[#F5F6F6] dark:hover:bg-[#182229] cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#00A884] dark:text-[#25D366]" />
                    <span>For 30 days</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-white/10" />
                  <DropdownMenuItem
                    onClick={() => onPin?.(undefined, msg.text, msg.mediaType || undefined)}
                    className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#111B21] dark:text-[#E9EDEF] rounded-lg hover:bg-[#F5F6F6] dark:hover:bg-[#182229] cursor-pointer"
                  >
                    <Pin className="w-3.5 h-3.5 text-[#00A884] dark:text-[#25D366]" />
                    <span>Until unpinned</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ) : (
              <DropdownMenuItem
                onClick={() => onUnpin?.()}
                className="flex items-center gap-3 px-3 py-2 text-[13.5px] font-medium text-[#111B21] dark:text-[#E9EDEF] rounded-lg hover:bg-[#F5F6F6] dark:hover:bg-[#182229] cursor-pointer"
              >
                <PinOff className="w-4 h-4 text-[#54656F] dark:text-[#8696A0]" />
                <span>Unpin message</span>
              </DropdownMenuItem>
            )}

            {isMe && msg.text && (
              <DropdownMenuItem
                onClick={() => {
                  setEditText(msg.text);
                  setIsEditing(true);
                }}
                className="flex items-center gap-3 px-3 py-2 text-[13.5px] font-medium text-[#111B21] dark:text-[#E9EDEF] rounded-lg hover:bg-[#F5F6F6] dark:hover:bg-[#182229] cursor-pointer"
              >
                <Edit2 className="w-4 h-4 text-[#54656F] dark:text-[#8696A0]" />
                <span>Edit message</span>
              </DropdownMenuItem>
            )}

            {isMe && (
              <>
                <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-white/10" />
                <DropdownMenuItem
                  onClick={() => onUnsend?.(msg.id)}
                  className="flex items-center gap-3 px-3 py-2 text-[13.5px] font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </>
            )}
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
    let callData: {
      callId: string;
      type: "AUDIO" | "VIDEO";
      status: string;
      durationSeconds: number;
      failureReason?: string;
    } | null = null;
    try {
      callData = JSON.parse(msg.mediaUrl);
    } catch {}

    const isVideo = callData?.type === "VIDEO";
    const isMissed =
      callData?.status === "MISSED" ||
      callData?.status === "DECLINED" ||
      callData?.status === "FAILED";
    const dur = callData?.durationSeconds ?? 0;

    const formatDur = (s: number) => {
      if (!s) return "";
      const m = Math.floor(s / 60);
      const rem = s % 60;
      if (m > 0) return `${m}m ${rem}s`;
      return `${rem}s`;
    };

    let subtitle = "Call ended";
    if (callData?.failureReason === "BUSY") {
      subtitle = "User busy";
    } else if (callData?.failureReason === "CANCELLED") {
      subtitle = isMe ? "Canceled call" : "Missed call";
    } else if (callData?.failureReason === "TIMEOUT") {
      subtitle = isMe ? "No answer" : "Missed call";
    } else if (callData?.status === "DECLINED") {
      subtitle = isMe ? "Call declined" : "Declined";
    } else if (callData?.status === "MISSED") {
      subtitle = isMe ? "No answer" : "Missed call";
    } else if (dur > 0) {
      subtitle = formatDur(dur);
    }

    return (
      <div className={cn("flex w-full z-10 flex-col my-1", isMe ? "items-end" : "items-start")}>
        <div
          onClick={() => peerId && initiateCall(peerId, isVideo ? 'VIDEO' : 'AUDIO', peerName, peerAvatar)}
          className={cn(
            "flex items-center gap-3.5 px-4 py-3 rounded-2xl border shadow-xs max-w-[280px] w-full transition-colors cursor-pointer",
            isMe 
              ? "bg-[#D9FDD3] dark:bg-[#005C4B] border-emerald-200/60 dark:border-emerald-700/40 hover:bg-[#D0F8CA]" 
              : "bg-white dark:bg-[#202C33] border-gray-200/70 dark:border-[#2A3942] hover:bg-gray-50 dark:hover:bg-[#233138]"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-full shrink-0 flex items-center justify-center shadow-xs",
            isMissed ? "bg-red-50 dark:bg-red-950/40 text-red-500" : isMe ? "bg-[#00A884]/20 text-[#008069] dark:text-[#25D366]" : "bg-emerald-50 dark:bg-emerald-950/40 text-[#00A884]"
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
            <span className={cn("font-semibold text-[14px] truncate", isMissed ? "text-red-500" : "text-[#111B21] dark:text-[#E9EDEF]")}>
              {isVideo ? "Video call" : "Audio call"}
            </span>
            <span className={cn("text-xs font-medium", isMissed ? "text-red-400" : "text-[#667781] dark:text-[#8696A0]")}>
              {subtitle}
            </span>
          </div>
          <span className="text-[10px] text-[#8696A0] font-medium self-end ml-1">
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
          src={getRawMediaUrl(msg.mediaUrl)}
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
          "flex items-center gap-3 p-2.5 rounded-xl mb-1 min-w-[220px] border shadow-xs transition-colors",
          isMe 
            ? "bg-black/[0.04] dark:bg-white/[0.08] border-black/[0.06] dark:border-white/[0.08] hover:bg-black/[0.08] text-[#111B21] dark:text-[#E9EDEF]" 
            : "bg-[#F0F2F5] dark:bg-[#182229] border-gray-200 dark:border-[#2A3942] hover:bg-[#E5E9EC] text-[#111B21] dark:text-[#E9EDEF]",
          isOptimistic && "pointer-events-none opacity-80"
        )}
      >
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg shrink-0",
          isMe ? "bg-[#00A884]/15 text-[#008069] dark:text-[#25D366]" : "bg-emerald-50 dark:bg-emerald-950/40 text-[#00A884]"
        )}>
          {isOptimistic ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <FileText className="w-5 h-5" />
          )}
        </div>
        <div className="flex flex-col flex-1 truncate">
          <span className="text-sm font-semibold truncate leading-tight" title={fileName}>{fileName}</span>
          <span className={cn("text-xs font-medium", isMe ? "text-[#54656F] dark:text-[#8696A0]" : "text-[#667781] dark:text-[#8696A0]")}>
            {isOptimistic ? "Uploading..." : isEmailFile ? "Email File · Click to open" : "Document · Click to open"}
          </span>
        </div>
        {!isOptimistic && (
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", isMe ? "hover:bg-black/10 dark:hover:bg-white/10" : "hover:bg-slate-200")}>
            <Download className="w-4 h-4 text-[#54656F] dark:text-[#8696A0]" />
          </div>
        )}
      </a>
    );
  };

  const renderPinnedBadge = () => {
    if (!isPinned) return null;
    return (
      <div
        className={cn(
          "flex items-center gap-1 text-[11px] font-semibold text-[#00A884] mb-1 px-1",
          isMe ? "justify-end" : "justify-start"
        )}
      >
        <Pin className="w-3 h-3 fill-[#00A884] rotate-45" />
        <span>Pinned</span>
      </div>
    );
  };

  return (
    <div
      id={`msg-${msg.id}`}
      className={cn("flex w-full z-10 my-1 group/bubble relative items-center transition-all", isMe ? "justify-end" : "justify-start")}
    >
      {renderOptionsMenu()}
      <div className={cn("flex flex-col max-w-[80%] sm:max-w-[70%]", isMe ? "items-end" : "items-start")}>
        {renderPinnedBadge()}
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              className={cn(
                "relative px-4 py-2.5 text-[14.5px] leading-relaxed shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] flex flex-col group cursor-default select-text transition-all",
                isMe 
                  ? "bg-[#D9FDD3] dark:bg-[#005C4B] text-[#111B21] dark:text-[#E9EDEF] rounded-2xl rounded-tr-[4px] border border-emerald-300/30 dark:border-emerald-700/20" 
                  : "bg-white dark:bg-[#202C33] text-[#111B21] dark:text-[#E9EDEF] rounded-2xl rounded-tl-[4px] border border-gray-200/60 dark:border-[#2A3942]"
              )}
            >
              {/* WhatsApp-Style In-Bubble Quoted Card */}
              {msg.replyTo && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (msg.replyTo?.id) onScrollToMessage?.(msg.replyTo.id);
                  }}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "relative mb-2 flex items-center justify-between gap-2 overflow-hidden rounded-[8px] p-2 pl-3 text-left cursor-pointer transition-all",
                    isMe
                      ? "bg-black/[0.06] hover:bg-black/[0.09] dark:bg-white/[0.08] dark:hover:bg-white/[0.12] text-[#111B21] dark:text-[#E9EDEF]"
                      : "bg-black/[0.04] hover:bg-black/[0.07] dark:bg-white/[0.06] dark:hover:bg-white/[0.10] text-[#111B21] dark:text-[#E9EDEF]"
                  )}
                >
                  {/* WhatsApp Left Vertical Colored Stripe Bar */}
                  <div
                    className={cn(
                      "absolute left-0 top-0 bottom-0 w-[4px]",
                      msg.replyTo.senderId === currentUserId || msg.replyTo.senderName === "You"
                        ? "bg-[#2563EB]"
                        : "bg-[#00A884]"
                    )}
                  />

                  <div className="flex flex-col min-w-0 flex-1 pl-1">
                    <span
                      className={cn(
                        "text-[12.5px] font-bold tracking-tight truncate leading-tight",
                        msg.replyTo.senderId === currentUserId || msg.replyTo.senderName === "You"
                          ? "text-[#2563EB]"
                          : "text-[#008069] dark:text-[#25D366]"
                      )}
                    >
                      {msg.replyTo.senderId === currentUserId || msg.replyTo.senderName === "You"
                        ? "You"
                        : msg.replyTo.senderName || peerName || "Contact"}
                    </span>
                    <div className="flex items-center gap-1 text-[12px] truncate mt-0.5 leading-snug text-[#54656F] dark:text-[#8696A0]">
                      {msg.replyTo.mediaType === "image" && <Camera className="h-3.5 w-3.5 shrink-0" />}
                      {msg.replyTo.mediaType === "video" && <Video className="h-3.5 w-3.5 shrink-0" />}
                      {msg.replyTo.mediaType === "audio" && <Mic className="h-3.5 w-3.5 shrink-0" />}
                      {msg.replyTo.mediaType === "document" && <FileText className="h-3.5 w-3.5 shrink-0" />}
                      <span className="truncate">
                        {msg.replyTo.text ||
                          (msg.replyTo.mediaType
                            ? msg.replyTo.mediaType === "image"
                              ? "Photo"
                              : msg.replyTo.mediaType === "video"
                              ? "Video"
                              : msg.replyTo.mediaType === "audio"
                              ? "Voice message"
                              : "Document"
                            : "")}
                      </span>
                    </div>
                  </div>
                  {msg.replyTo.mediaUrl && msg.replyTo.mediaType?.startsWith("image") && (
                    <img
                      src={getOptimizedImageUrl(msg.replyTo.mediaUrl, 44, 44)}
                      alt="Quoted attachment"
                      className="h-10 w-10 rounded-[6px] object-cover ring-1 ring-black/5 shrink-0 ml-1.5"
                    />
                  )}
                </div>
              )}

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
                      className="w-full text-sm bg-white/70 dark:bg-black/30 text-[#111B21] dark:text-[#E9EDEF] border border-[#00A884] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#00A884] resize-none"
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
                        className="px-2.5 py-1 rounded-md bg-black/10 dark:bg-white/10 hover:bg-black/20 text-[#111B21] dark:text-[#E9EDEF] transition-colors cursor-pointer"
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
                        className="px-3 py-1 rounded-md bg-[#00A884] font-semibold text-white hover:bg-[#008069] transition-colors cursor-pointer shadow-xs"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (msg as any).isDecryptionPending || msg.text?.includes("Waiting for this message") ? (
                  <div className="flex items-center gap-2 text-[13px] text-[#54656F] dark:text-[#8696A0] italic py-0.5 select-none">
                    <Clock className="w-3.5 h-3.5 shrink-0 animate-pulse text-amber-500 dark:text-amber-400" />
                    <span>{msg.text}</span>
                  </div>
                ) : (
                  <span
                    className="leading-snug whitespace-pre-wrap"
                    style={{ wordBreak: "break-word" }}
                  >
                    {formatTextWithLinks(msg.text)}
                  </span>
                )
              )}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-52 bg-white dark:bg-[#233138] p-1.5 rounded-[16px] shadow-2xl border border-black/5 dark:border-white/10 z-50 text-[#111B21] dark:text-[#E9EDEF]">
            <ContextMenuItem
              onClick={() => onReply?.(msg)}
              className="flex items-center gap-3 px-3 py-2 text-[13.5px] font-medium text-[#111B21] dark:text-[#E9EDEF] rounded-lg hover:bg-[#F5F6F6] dark:hover:bg-[#182229] cursor-pointer"
            >
              <Reply className="w-4 h-4 text-[#54656F] dark:text-[#8696A0]" />
              <span>Reply</span>
            </ContextMenuItem>

            {msg.text && (
              <ContextMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(msg.text);
                  toast.success("Copied to clipboard");
                }}
                className="flex items-center gap-3 px-3 py-2 text-[13.5px] font-medium text-[#111B21] dark:text-[#E9EDEF] rounded-lg hover:bg-[#F5F6F6] dark:hover:bg-[#182229] cursor-pointer"
              >
                <Copy className="w-4 h-4 text-[#54656F] dark:text-[#8696A0]" />
                <span>Copy</span>
              </ContextMenuItem>
            )}

            {!isPinned ? (
              <ContextMenuSub>
                <ContextMenuSubTrigger className="flex items-center gap-3 px-3 py-2 text-[13.5px] font-medium text-[#111B21] dark:text-[#E9EDEF] rounded-lg hover:bg-[#F5F6F6] dark:hover:bg-[#182229] cursor-pointer">
                  <Pin className="w-4 h-4 text-[#54656F] dark:text-[#8696A0]" />
                  <span>Pin</span>
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-48 bg-white dark:bg-[#233138] rounded-[16px] shadow-2xl border border-black/5 dark:border-white/10 p-1.5">
                  <ContextMenuLabel className="text-[11px] font-semibold text-[#54656F] dark:text-[#8696A0] px-3 py-1">
                    Choose duration
                  </ContextMenuLabel>
                  <ContextMenuItem
                    onClick={() => onPin?.(86400, msg.text, msg.mediaType || undefined)}
                    className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#111B21] dark:text-[#E9EDEF] rounded-lg hover:bg-[#F5F6F6] dark:hover:bg-[#182229] cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#00A884] dark:text-[#25D366]" />
                    <span>For 24 hours</span>
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => onPin?.(604800, msg.text, msg.mediaType || undefined)}
                    className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#111B21] dark:text-[#E9EDEF] rounded-lg hover:bg-[#F5F6F6] dark:hover:bg-[#182229] cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#00A884] dark:text-[#25D366]" />
                    <span>For 7 days</span>
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => onPin?.(2592000, msg.text, msg.mediaType || undefined)}
                    className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#111B21] dark:text-[#E9EDEF] rounded-lg hover:bg-[#F5F6F6] dark:hover:bg-[#182229] cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#00A884] dark:text-[#25D366]" />
                    <span>For 30 days</span>
                  </ContextMenuItem>
                  <ContextMenuSeparator className="my-1 bg-slate-100 dark:bg-white/10" />
                  <ContextMenuItem
                    onClick={() => onPin?.(undefined, msg.text, msg.mediaType || undefined)}
                    className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#111B21] dark:text-[#E9EDEF] rounded-lg hover:bg-[#F5F6F6] dark:hover:bg-[#182229] cursor-pointer"
                  >
                    <Pin className="w-3.5 h-3.5 text-[#00A884] dark:text-[#25D366]" />
                    <span>Until unpinned</span>
                  </ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
            ) : (
              <ContextMenuItem
                onClick={() => onUnpin?.()}
                className="flex items-center gap-3 px-3 py-2 text-[13.5px] font-medium text-[#111B21] dark:text-[#E9EDEF] rounded-lg hover:bg-[#F5F6F6] dark:hover:bg-[#182229] cursor-pointer"
              >
                <PinOff className="w-4 h-4 text-[#54656F] dark:text-[#8696A0]" />
                <span>Unpin message</span>
              </ContextMenuItem>
            )}

            {isMe && msg.text && (
              <ContextMenuItem
                onClick={() => {
                  setEditText(msg.text);
                  setIsEditing(true);
                }}
                className="flex items-center gap-3 px-3 py-2 text-[13.5px] font-medium text-[#111B21] dark:text-[#E9EDEF] rounded-lg hover:bg-[#F5F6F6] dark:hover:bg-[#182229] cursor-pointer"
              >
                <Edit2 className="w-4 h-4 text-[#54656F] dark:text-[#8696A0]" />
                <span>Edit message</span>
              </ContextMenuItem>
            )}

            {isMe && (
              <>
                <ContextMenuSeparator className="my-1 bg-slate-100 dark:bg-white/10" />
                <ContextMenuItem
                  onClick={() => onUnsend?.(msg.id)}
                  className="flex items-center gap-3 px-3 py-2 text-[13.5px] font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                  <span>Delete</span>
                </ContextMenuItem>
              </>
            )}
          </ContextMenuContent>
        </ContextMenu>
        
        {/* Timestamp + disappear countdown outside the bubble */}
        <div className={cn("flex items-center gap-1.5 mt-1 px-1", isMe ? "justify-end text-gray-500" : "justify-start text-gray-500")}>
          {/* WhatsApp-style countdown badge */}
          {secondsLeft !== null && (
            <span
              title={`This message will disappear in ${formatCountdown(secondsLeft)}`}
              className={cn(
                "flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full",
                isMe
                  ? "bg-white/20 text-white"
                  : "bg-purple-100 text-purple-700"
              )}
            >
              {/* Spinning clock icon */}
              <svg
                className="w-3 h-3 animate-spin-slow"
                style={{ animation: "spin 4s linear infinite" }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{formatCountdown(secondsLeft)}</span>
            </span>
          )}
          <span className="text-[11px] font-medium flex items-center gap-1">
            {msg.isEdited && <span className="italic font-normal">(edited)</span>}
            {formatTime(msg.createdAt)}
            {isMe && (
              <span className="ml-0.5 inline-flex items-center">
                {status === "SENDING" && <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 animate-pulse" />}
                {status === "SENT" && <Check className="w-4 h-4 text-gray-400 dark:text-gray-400" strokeWidth={2.2} />}
                {status === "DELIVERED" && <CheckCheck className="w-4 h-4 text-gray-400 dark:text-gray-400" strokeWidth={2.2} />}
                {status === "SEEN" && <CheckCheck className="w-4 h-4 text-[#53BDEB]" strokeWidth={2.2} />}
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
