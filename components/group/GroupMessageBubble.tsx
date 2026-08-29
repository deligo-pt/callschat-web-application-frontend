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
  Reply,
  Camera,
  Mic,
  Copy,
  ChevronDown,
  MessageSquare,
  Smile,
  BarChart2,
  Info,
  Shield,
  UserPlus,
  UserMinus,
  Settings,
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
import { toast } from "sonner";
import { useCallContext } from "@/components/providers/CallContext";

const SENDER_COLORS = [
  "text-[#00A884] dark:text-[#25D366]",
  "text-[#0284C7] dark:text-[#38BDF8]",
  "text-[#7C3AED] dark:text-[#A78BFA]",
  "text-[#D97706] dark:text-[#FBBF24]",
  "text-[#E11D48] dark:text-[#FB7185]",
  "text-[#0D9488] dark:text-[#2DD4BF]",
];

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

function getSenderColor(id: string) {
  if (!id) return SENDER_COLORS[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SENDER_COLORS.length;
  return SENDER_COLORS[index];
}

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
          className="underline underline-offset-2 hover:opacity-80 transition-opacity text-[#0284C7] dark:text-[#53BDEB]"
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
    deletedByAdmin?: boolean;
    isSystem?: boolean;
    systemEventType?: string | null;
    systemMetadata?: any;
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
    reactions?: Array<{
      id: string;
      emoji: string;
      userId: string;
      user?: {
        profile?: {
          displayName: string;
          avatarUrl: string | null;
        } | null;
      } | null;
    }>;
    poll?: any;
  };
  isMe: boolean;
  isAdmin?: boolean;
  showAvatar: boolean;
  isNextSameSender: boolean;
  isFirstFromSender: boolean;
  groupId?: string;
  isPinned?: boolean;
  onPin?: (durationSeconds?: number, previewText?: string, previewMedia?: string) => void;
  onUnpin?: () => void;
  onEdit?: (messageId: string, newText: string) => void;
  onUnsend?: (messageId: string) => void;
  onReply?: (msg: any) => void;
  onReplyPrivately?: (senderId: string, msg: any) => void;
  onScrollToMessage?: (messageId: string) => void;
  onShowMessageInfo?: (msg: any) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onVotePoll?: (optionId: string, allowMultiple: boolean) => void;
  groupMembersCount?: number;
  currentUserId?: string;
}

export function GroupMessageBubble({
  msg,
  isMe,
  isAdmin = false,
  showAvatar,
  isNextSameSender,
  isFirstFromSender,
  groupId,
  isPinned,
  onPin,
  onUnpin,
  onEdit,
  onUnsend,
  onReply,
  onReplyPrivately,
  onScrollToMessage,
  onShowMessageInfo,
  onReact,
  onVotePoll,
  groupMembersCount = 0,
  currentUserId,
}: GroupMessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(msg.text);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const { startGroupCall } = useCallContext();

  const senderName = isMe ? "You" : (msg.sender?.profile?.displayName || "Member");
  const senderColorClass = getSenderColor(msg.senderId);

  const getMessageStatus = () => {
    if (!msg.receipts || msg.receipts.length === 0) return "SENT";
    const otherReceipts = msg.receipts.filter((r) => r.userId !== msg.senderId);
    if (otherReceipts.length === 0) return "SENT";

    const expected = groupMembersCount ? Math.max(1, groupMembersCount - 1) : 1;
    const seenCount = otherReceipts.filter((r) => r.seenAt).length;
    if (seenCount >= expected) return "SEEN";

    const deliveredCount = otherReceipts.filter((r) => r.deliveredAt || r.seenAt).length;
    if (deliveredCount >= expected) return "DELIVERED";

    return "SENT";
  };
  const status = getMessageStatus();

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  // ── Render System Activity Timeline Event ─────────────────────────────────
  if (msg.isSystem || msg.systemEventType) {
    let text = msg.text || "System activity";
    let icon = <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;

    if (msg.systemEventType === "GROUP_CREATED") {
      icon = <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
      text = "Group created with End-to-End Encryption.";
    } else if (msg.systemEventType === "MEMBER_ADDED") {
      icon = <UserPlus className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
      text = text || "A new participant was added.";
    } else if (msg.systemEventType === "MEMBER_JOINED_LINK") {
      icon = <UserPlus className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
      text = text || "A participant joined using this group's invite link.";
    } else if (msg.systemEventType === "MEMBER_REMOVED" || msg.systemEventType === "MEMBER_LEFT") {
      icon = <UserMinus className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      text = text || "A participant left the group.";
    } else if (msg.systemEventType === "SETTINGS_UPDATED") {
      icon = <Settings className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
      text = text || "Group permissions or settings were updated.";
    } else if (msg.systemEventType === "DISAPPEARING_TIMER_UPDATED") {
      icon = <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
      text = text || "Disappearing message timer was changed.";
    }

    return (
      <div className="flex justify-center my-3 w-full animate-in fade-in duration-150">
        <div className="bg-[#FFF8E7] dark:bg-[#182229] border border-[#FFE8A3]/60 dark:border-[#2A3942] px-4 py-1.5 rounded-full text-[12px] font-medium text-[#54656F] dark:text-[#8696A0] flex items-center gap-2 shadow-xs max-w-[85%] text-center">
          {icon}
          <span>{text}</span>
        </div>
      </div>
    );
  }

  // ── Render Group Call Activity Bubble ────────────────────────────────────
  const isCallMessage =
    msg.mediaType === "call" ||
    (typeof msg.mediaUrl === "string" &&
      msg.mediaUrl.trim().startsWith("{") &&
      msg.mediaUrl.includes('"callId"'));

  if (isCallMessage) {
    let callData: {
      callId?: string;
      type?: "AUDIO" | "VIDEO";
      status?: string;
      durationSeconds?: number;
      participantCount?: number;
      participants?: string[];
      failureReason?: string;
    } | null = null;

    try {
      if (msg.mediaUrl) {
        callData = JSON.parse(msg.mediaUrl);
      }
    } catch {}

    const isVideo = callData?.type === "VIDEO";
    const dur = callData?.durationSeconds ?? 0;
    const isMissed =
      callData?.status === "MISSED" ||
      callData?.status === "DECLINED" ||
      callData?.status === "FAILED";

    const formatDur = (s: number) => {
      if (!s) return "";
      const m = Math.floor(s / 60);
      const rem = s % 60;
      if (m > 0) return `${m}m ${rem}s`;
      return `${rem}s`;
    };

    let subtitle = "Group call ended";
    if (callData?.failureReason === "BUSY") {
      subtitle = "Members busy";
    } else if (callData?.failureReason === "CANCELLED") {
      subtitle = isMe ? "Canceled call" : "Missed group call";
    } else if (callData?.failureReason === "TIMEOUT") {
      subtitle = isMe ? "No answer" : "Missed group call";
    } else if (callData?.status === "DECLINED") {
      subtitle = "Call declined";
    } else if (callData?.status === "MISSED") {
      subtitle = isMe ? "No answer" : "Missed group call";
    } else if (dur > 0) {
      subtitle = formatDur(dur);
      if (callData?.participantCount && callData.participantCount > 1) {
        subtitle += ` · ${callData.participantCount} participants`;
      }
    } else if (callData?.participantCount) {
      subtitle = `${callData.participantCount} participants`;
    }

    return (
      <div className={cn("flex w-full z-10 flex-col my-1.5", isMe ? "items-end" : "items-start")}>
        <div
          onClick={() => groupId && startGroupCall(groupId, isVideo ? "VIDEO" : "AUDIO")}
          className={cn(
            "flex items-center gap-3.5 px-4 py-3 rounded-2xl border shadow-xs max-w-[320px] w-full transition-colors cursor-pointer",
            isMe
              ? "bg-[#D9FDD3] dark:bg-[#005C4B] border-emerald-200/60 dark:border-emerald-700/40 hover:bg-[#D0F8CA]"
              : "bg-white dark:bg-[#202C33] border-gray-200/70 dark:border-[#2A3942] hover:bg-gray-50 dark:hover:bg-[#233138]"
          )}
        >
          <div
            className={cn(
              "w-10 h-10 rounded-full shrink-0 flex items-center justify-center shadow-xs",
              isMissed
                ? "bg-red-50 dark:bg-red-950/40 text-red-500"
                : isMe
                ? "bg-[#00A884]/20 text-[#008069] dark:text-[#25D366]"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-[#00A884]"
            )}
          >
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
            <span
              className={cn(
                "font-semibold text-[14px] truncate",
                isMissed ? "text-red-500" : "text-[#111B21] dark:text-[#E9EDEF]"
              )}
            >
              {isVideo ? "Group video call" : "Group audio call"}
            </span>
            <span
              className={cn(
                "text-xs font-medium truncate",
                isMissed ? "text-red-400" : "text-[#667781] dark:text-[#8696A0]"
              )}
            >
              {subtitle}
            </span>
          </div>
          <span className="text-[10px] text-[#8696A0] font-medium self-end ml-1 shrink-0">
            {formatTime(msg.createdAt)}
          </span>
        </div>
      </div>
    );
  }

  // ── Render Deleted Message ────────────────────────────────────────────────
  if (msg.isDeleted) {
    return (
      <div className={cn("flex w-full mb-3 group/bubble relative items-center", isMe ? "justify-end" : "justify-start")}>
        <div className={cn("flex flex-col max-w-[70%]", isMe ? "items-end" : "items-start")}>
          {!isMe && (isFirstFromSender || showAvatar) && (
            <span className={cn("text-[12.5px] font-semibold mb-1 pl-1", senderColorClass)}>
              {senderName}
            </span>
          )}
          <div
            className={cn(
              "px-3.5 py-2 text-[13.5px] italic text-[#8696A0] bg-[#F0F2F5] dark:bg-[#202C33] border border-[#E2E8F0] dark:border-[#2A3942] rounded-2xl",
              isMe ? "rounded-tr-[4px]" : "rounded-tl-[4px]"
            )}
          >
            {msg.deletedByAdmin ? "🚫 This message was deleted by an admin" : "🚫 This message was deleted"}
          </div>
        </div>
      </div>
    );
  }

  // ── Grouped Reactions Summary ─────────────────────────────────────────────
  const reactionCounts: { [emoji: string]: number } = {};
  (msg.reactions || []).forEach((r) => {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
  });
  const hasReactions = Object.keys(reactionCounts).length > 0;

  // ── Render Message Options Menu ───────────────────────────────────────────
  const renderOptionsMenu = () => {
    if (msg.id.startsWith("optimistic-") || msg.isDeleted) return null;
    return (
      <div
        className={cn(
          "flex items-center gap-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity self-center px-1 shrink-0 z-20",
          isMe ? "order-first" : "order-last"
        )}
      >
        {/* Quick React Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowReactionPicker((p) => !p)}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#8696A0] hover:text-[#111B21] dark:hover:text-[#E9EDEF] transition-colors shadow-xs bg-white dark:bg-[#202C33] border border-black/5 dark:border-white/10 cursor-pointer"
            title="React"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>

          {/* Floating Reaction Bar */}
          {showReactionPicker && (
            <div className="absolute bottom-full left-0 mb-1.5 flex items-center gap-1 p-1 bg-white dark:bg-[#233138] rounded-full shadow-2xl border border-black/10 dark:border-white/10 z-50 animate-in zoom-in-95 duration-100">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onReact?.(msg.id, emoji);
                    setShowReactionPicker(false);
                  }}
                  className="p-1 text-base hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onReply?.(msg)}
          className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#8696A0] hover:text-[#111B21] dark:hover:text-[#E9EDEF] transition-colors shadow-xs bg-white dark:bg-[#202C33] border border-black/5 dark:border-white/10 cursor-pointer"
          title="Reply"
        >
          <Reply className="w-3.5 h-3.5" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#8696A0] hover:text-[#111B21] dark:hover:text-[#E9EDEF] transition-colors shadow-xs bg-white dark:bg-[#202C33] border border-black/5 dark:border-white/10 cursor-pointer"
              title="Message options"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={isMe ? "end" : "start"}
            className="w-52 bg-white dark:bg-[#233138] p-1.5 rounded-[16px] shadow-2xl border border-black/5 dark:border-white/10 z-50 text-[#111B21] dark:text-[#E9EDEF]"
          >
            {/* Message Info */}
            <DropdownMenuItem
              onClick={() => onShowMessageInfo?.(msg)}
              className="flex items-center gap-3 px-3 py-2 text-[13.5px] font-medium text-[#111B21] dark:text-[#E9EDEF] rounded-lg hover:bg-[#F5F6F6] dark:hover:bg-[#182229] cursor-pointer"
            >
              <Info className="w-4 h-4 text-[#54656F] dark:text-[#8696A0]" />
              <span>Message info</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => onReply?.(msg)}
              className="flex items-center gap-3 px-3 py-2 text-[13.5px] font-medium text-[#111B21] dark:text-[#E9EDEF] rounded-lg hover:bg-[#F5F6F6] dark:hover:bg-[#182229] cursor-pointer"
            >
              <Reply className="w-4 h-4 text-[#54656F] dark:text-[#8696A0]" />
              <span>Reply</span>
            </DropdownMenuItem>

            {!isMe && onReplyPrivately && (
              <DropdownMenuItem
                onClick={() => onReplyPrivately(msg.senderId, msg)}
                className="flex items-center gap-3 px-3 py-2 text-[13.5px] font-medium text-[#111B21] dark:text-[#E9EDEF] rounded-lg hover:bg-[#F5F6F6] dark:hover:bg-[#182229] cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-[#54656F] dark:text-[#8696A0]" />
                <span>Reply privately</span>
              </DropdownMenuItem>
            )}

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

            {/* Pin Message */}
            {!isPinned ? (
              <DropdownMenuItem
                onClick={() => onPin?.(604800, msg.text, msg.mediaType || undefined)}
                className="flex items-center gap-3 px-3 py-2 text-[13.5px] font-medium text-[#111B21] dark:text-[#E9EDEF] rounded-lg hover:bg-[#F5F6F6] dark:hover:bg-[#182229] cursor-pointer"
              >
                <Pin className="w-4 h-4 text-[#54656F] dark:text-[#8696A0]" />
                <span>Pin message</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => onUnpin?.()}
                className="flex items-center gap-3 px-3 py-2 text-[13.5px] font-medium text-[#111B21] dark:text-[#E9EDEF] rounded-lg hover:bg-[#F5F6F6] dark:hover:bg-[#182229] cursor-pointer"
              >
                <PinOff className="w-4 h-4 text-[#54656F] dark:text-[#8696A0]" />
                <span>Unpin message</span>
              </DropdownMenuItem>
            )}

            {/* Unsend / Delete for Everyone */}
            {(isMe || isAdmin) && onUnsend && (
              <>
                <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-white/10" />
                <DropdownMenuItem
                  onClick={() => onUnsend(msg.id)}
                  className="flex items-center gap-3 px-3 py-2 text-[13.5px] font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                  <span>{isMe ? "Delete for everyone" : "Delete as Admin"}</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <div
      id={`msg-${msg.id}`}
      className={cn(
        "flex w-full mb-1 group/bubble relative items-end",
        isMe ? "justify-end" : "justify-start"
      )}
    >
      {/* Left Avatar */}
      {!isMe && (
        <div className="w-7 h-7 mr-2 shrink-0 self-end mb-1">
          {showAvatar ? (
            <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-[#2A3942] overflow-hidden flex items-center justify-center text-xs font-semibold">
              {msg.sender?.profile?.avatarUrl ? (
                <img
                  src={getOptimizedImageUrl(msg.sender.profile.avatarUrl)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                senderName[0]?.toUpperCase()
              )}
            </div>
          ) : (
            <div className="w-7" />
          )}
        </div>
      )}

      {renderOptionsMenu()}

      {/* Main Bubble Content */}
      <div
        className={cn(
          "flex flex-col max-w-[78%] md:max-w-[65%] rounded-2xl relative shadow-xs",
          isMe
            ? "bg-[#D9FDD3] dark:bg-[#005C4B] text-[#111B21] dark:text-[#E9EDEF] rounded-tr-[4px]"
            : "bg-white dark:bg-[#202C33] text-[#111B21] dark:text-[#E9EDEF] rounded-tl-[4px]"
        )}
      >
        {/* Sender Name in group */}
        {!isMe && (isFirstFromSender || showAvatar) && (
          <div className="px-3 pt-2">
            <span className={cn("text-[12px] font-semibold tracking-wide", senderColorClass)}>
              {senderName}
            </span>
          </div>
        )}

        {/* Quoted Message */}
        {msg.replyTo && (
          <div
            onClick={() => msg.replyToId && onScrollToMessage?.(msg.replyToId)}
            className="mx-2 mt-1.5 p-2 rounded-lg bg-black/5 dark:bg-black/20 border-l-4 border-emerald-500 text-xs cursor-pointer hover:opacity-90"
          >
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 block truncate">
              {msg.replyTo.senderName || "Quoted message"}
            </span>
            <span className="text-gray-600 dark:text-gray-300 truncate block">
              {msg.replyTo.text || (msg.replyTo.mediaType ? `[${msg.replyTo.mediaType}]` : "")}
            </span>
          </div>
        )}

        {/* Interactive Poll Widget */}
        {msg.poll && (
          <div className="p-3.5 space-y-3 min-w-[260px]">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
              <BarChart2 className="w-4 h-4" />
              <span>{msg.poll.question}</span>
            </div>
            <p className="text-[11px] text-gray-500">
              {msg.poll.allowMultiple ? "Select one or more options" : "Select one option"}
            </p>

            <div className="space-y-2">
              {msg.poll.options?.map((opt: any) => {
                const totalVotes = msg.poll.options.reduce(
                  (acc: number, o: any) => acc + (o.votes?.length || 0),
                  0
                );
                const optVotes = opt.votes?.length || 0;
                const percentage = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                const hasVoted = opt.votes?.some((v: any) => v.userId === currentUserId);

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onVotePoll?.(opt.id, msg.poll.allowMultiple)}
                    className={cn(
                      "w-full text-left p-2.5 rounded-xl border transition-all relative overflow-hidden",
                      hasVoted
                        ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30"
                        : "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-black/10 hover:border-emerald-300"
                    )}
                  >
                    {/* Vote progress fill */}
                    <div
                      className="absolute inset-0 bg-emerald-500/10 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="relative flex items-center justify-between z-10">
                      <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                        {opt.text}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-500">
                        {optVotes} ({percentage}%)
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Media Attachments */}
        {msg.mediaUrl && !isCallMessage && (
          <div className="p-1">
            {msg.mediaType?.startsWith("image") ? (
              <img
                src={getOptimizedImageUrl(msg.mediaUrl)}
                alt=""
                className="rounded-xl max-h-80 object-cover w-full"
              />
            ) : msg.mediaType?.startsWith("video") ? (
              <video
                src={getRawMediaUrl(msg.mediaUrl)}
                controls
                className="rounded-xl max-h-80 w-full"
              />
            ) : msg.mediaType?.startsWith("audio") ? (
              <VoiceMessagePlayer
                src={getRawMediaUrl(msg.mediaUrl)}
                messageId={msg.id}
                isMe={isMe}
              />
            ) : !msg.mediaUrl.trim().startsWith("{") ? (
              <a
                href={getRawMediaUrl(msg.mediaUrl)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 bg-black/5 dark:bg-black/20 rounded-xl"
              >
                <FileText className="w-8 h-8 text-emerald-500" />
                <span className="text-xs font-medium truncate flex-1">Document attachment</span>
                <Download className="w-4 h-4 text-gray-400" />
              </a>
            ) : null}
          </div>
        )}

        {/* Message Text */}
        {msg.text && !msg.poll && (
          <div className="px-3.5 py-2 text-[14px] leading-relaxed break-words whitespace-pre-wrap">
            {formatTextWithLinks(msg.text)}
          </div>
        )}

        {/* Bubble Footer (Time & Delivery Receipts) */}
        <div className="flex items-center justify-end gap-1.5 px-3 pb-1.5 -mt-1 text-[10.5px] text-[#667781] dark:text-[#8696A0]">
          {msg.isEdited && <span className="italic">edited</span>}
          <span>{formatTime(msg.createdAt)}</span>
          {isMe && (
            <span>
              {status === "SEEN" ? (
                <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]" />
              ) : status === "DELIVERED" ? (
                <CheckCheck className="w-3.5 h-3.5" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </span>
          )}
        </div>

        {/* Reaction Badges */}
        {hasReactions && (
          <div className="absolute -bottom-2.5 right-2 flex items-center gap-0.5 bg-white dark:bg-[#202C33] px-1.5 py-0.5 rounded-full shadow-md border border-gray-200 dark:border-gray-700 text-xs cursor-pointer hover:scale-105 transition-transform z-10">
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <span key={emoji} className="flex items-center gap-0.5">
                <span>{emoji}</span>
                {count > 1 && <span className="text-[10px] text-gray-500">{count}</span>}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
