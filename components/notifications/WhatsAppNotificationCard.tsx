"use client";

import React from "react";
import {
  Camera,
  Video,
  Mic,
  FileText,
  PhoneCall,
  Link2,
  Smile,
  User,
  MapPin,
  Pin,
  Users,
  X,
} from "lucide-react";
import { NotificationAttachmentType } from "@/utils/notificationPreview";
import { getOptimizedImageUrl } from "@/utils/image";

export interface WhatsAppNotificationCardProps {
  title: string;
  senderName?: string;
  isGroup?: boolean;
  displayText: string;
  attachmentType?: NotificationAttachmentType;
  avatarUrl?: string | null;
  groupAvatarUrl?: string | null;
  timestamp?: string;
  onClick: () => void;
  onClose: (e: React.MouseEvent) => void;
}

export const WhatsAppNotificationCard: React.FC<WhatsAppNotificationCardProps> = ({
  title,
  senderName,
  isGroup = false,
  displayText,
  attachmentType = "text",
  avatarUrl,
  groupAvatarUrl,
  timestamp = "Just now",
  onClick,
  onClose,
}) => {
  // Render media attachment icon
  const renderAttachmentIcon = () => {
    const iconClass = "h-3.5 w-3.5 shrink-0 text-[#00A884] dark:text-[#25D366]";

    switch (attachmentType) {
      case "image":
        return <Camera className={iconClass} />;
      case "video":
        return <Video className={iconClass} />;
      case "audio":
        return <Mic className={iconClass} />;
      case "document":
        return <FileText className={iconClass} />;
      case "call":
        return <PhoneCall className={iconClass} />;
      case "link":
        return <Link2 className={iconClass} />;
      case "sticker":
        return <Smile className={iconClass} />;
      case "contact":
        return <User className={iconClass} />;
      case "location":
        return <MapPin className={iconClass} />;
      case "pin":
        return <Pin className={iconClass} />;
      default:
        return null;
    }
  };

  const initial = title ? title.charAt(0).toUpperCase() : "C";
  const displayAvatar = isGroup ? (groupAvatarUrl || avatarUrl) : avatarUrl;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className="group relative flex w-[370px] max-w-[calc(100vw-32px)] cursor-pointer items-start gap-3.5 overflow-hidden rounded-2xl border border-[#E9EDEF] bg-white/98 p-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-md transition-all duration-200 hover:scale-[1.01] hover:border-[#00A884]/30 hover:shadow-[0_16px_48px_rgba(0,0,0,0.16)] active:scale-[0.99] dark:border-[#222E35] dark:bg-[#111B21]/98 dark:shadow-[0_16px_48px_rgba(0,0,0,0.55)] dark:hover:border-[#25D366]/30 select-none"
    >
      {/* WhatsApp Green Status Bar Accent */}
      <div className="absolute left-0 top-0 h-full w-[3.5px] bg-[#00A884] dark:bg-[#25D366]" />

      {/* Avatar Container */}
      <div className="relative mt-0.5 shrink-0">
        {displayAvatar ? (
          <img
            src={getOptimizedImageUrl(displayAvatar, 48, 48)}
            alt={title}
            className="h-11 w-11 rounded-full object-cover shadow-sm ring-1 ring-black/5 dark:ring-white/10"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#E7F8F5] to-[#D0F2EC] text-[16px] font-bold text-[#008069] shadow-sm ring-1 ring-black/5 dark:from-[#00A884]/20 dark:to-[#00A884]/10 dark:text-[#25D366] dark:ring-white/10">
            {initial}
          </div>
        )}

        {/* Group Badge Overlay */}
        {isGroup && (
          <div className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#00A884] text-white shadow-sm ring-2 ring-white dark:bg-[#25D366] dark:text-[#111B21] dark:ring-[#111B21]">
            <Users className="h-2.5 w-2.5" />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col overflow-hidden pt-0.5 min-w-0 pr-6">
        {/* Top Line: Contact / Group Name + Timestamp */}
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[14.5px] font-bold tracking-tight text-[#111B21] dark:text-[#E9EDEF]">
            {title}
          </span>
          <span className="shrink-0 text-[11px] font-medium text-[#667781] dark:text-[#8696A0]">
            {timestamp}
          </span>
        </div>

        {/* Bottom Line: Sender prefix (if group) + Media Icon + Preview Text */}
        <div className="mt-1 flex items-center gap-1.5 overflow-hidden text-[13px] leading-snug text-[#3B4A54] dark:text-[#8696A0]">
          {isGroup && senderName && (
            <span className="shrink-0 font-semibold text-[#111B21] dark:text-[#D1D7DB]">
              {senderName}:
            </span>
          )}

          {renderAttachmentIcon()}

          <span className="truncate">
            {displayText}
          </span>
        </div>
      </div>

      {/* Dismiss Button */}
      <button
        onClick={onClose}
        aria-label="Dismiss notification"
        className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full text-[#667781] opacity-60 transition-all hover:bg-black/5 hover:opacity-100 dark:text-[#8696A0] dark:hover:bg-white/10"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
