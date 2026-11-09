"use client";

import React from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import {
  Bell,
  BellOff,
  CheckCheck,
  ChevronDown,
  Eraser,
  Heart,
  LogOut,
  Mail,
  Trash2,
} from "lucide-react";

export interface ConversationContextMenuProps {
  children: React.ReactNode;
  isGroup?: boolean;
  myRole?: string; // 'ADMIN' | 'MEMBER' | 'CREATOR' | 'OWNER'
  isMuted?: boolean;
  isFavourite?: boolean;
  hasUnread?: boolean;
  className?: string;
  onToggleRead?: () => void;
  onToggleMute?: () => void;
  onToggleFavourite?: () => void;
  onClearChat?: () => void;
  onLeaveGroup?: () => void;
  onDelete?: () => void;
}

export function ConversationContextMenu({
  children,
  isGroup = false,
  myRole,
  isMuted = false,
  isFavourite = false,
  hasUnread = false,
  className,
  onToggleRead,
  onToggleMute,
  onToggleFavourite,
  onClearChat,
  onLeaveGroup,
  onDelete,
}: ConversationContextMenuProps) {
  // Trigger contextmenu programmatically when the subtle hover chevron is clicked
  const handleChevronClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: rect.left,
      clientY: rect.bottom + 4,
    });
    e.currentTarget.dispatchEvent(event);
  };

  const isGroupAdmin = myRole === "ADMIN" || myRole === "CREATOR" || myRole === "OWNER";

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className={cn("relative group w-full select-none", className)}>
          {children}

          {/* WhatsApp-Style Subtle ChevronDown Button on Row Hover */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-auto">
            <button
              type="button"
              onClick={handleChevronClick}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 dark:bg-[#111B21]/90 shadow-sm border border-black/5 dark:border-white/10 hover:bg-[#F0F2F5] dark:hover:bg-[#202C33] text-[#54656F] dark:text-[#8696A0] hover:text-[#111B21] dark:hover:text-[#E9EDEF] transition-all cursor-pointer"
              title="Menu"
              aria-label="Conversation options"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-56 bg-white dark:bg-[#202C33] p-1.5 rounded-[16px] shadow-2xl border border-black/5 dark:border-white/10 z-50 text-[#111B21] dark:text-[#E9EDEF] animate-in fade-in zoom-in-95 duration-100">
        {/* Mark as read / Mark as unread */}
        {onToggleRead && (
          <ContextMenuItem
            onClick={onToggleRead}
            className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-[#111B21] dark:text-[#E9EDEF] rounded-lg hover:bg-[#F5F6F6] dark:hover:bg-[#182229] cursor-pointer"
          >
            {hasUnread ? (
              <>
                <CheckCheck className="h-4 w-4 text-[#00A884]" />
                <span>Mark as read</span>
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 text-[#8696A0]" />
                <span>Mark as unread</span>
              </>
            )}
          </ContextMenuItem>
        )}

        {/* Mute notifications / Unmute notifications */}
        {onToggleMute && (
          <ContextMenuItem
            onClick={onToggleMute}
            className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-[#111B21] dark:text-[#E9EDEF] rounded-lg hover:bg-[#F5F6F6] dark:hover:bg-[#182229] cursor-pointer"
          >
            {isMuted ? (
              <>
                <Bell className="h-4 w-4 text-[#00A884]" />
                <span>Unmute notifications</span>
              </>
            ) : (
              <>
                <BellOff className="h-4 w-4 text-[#8696A0]" />
                <span>Mute notifications</span>
              </>
            )}
          </ContextMenuItem>
        )}

        {/* Add to favorites / Remove from favorites */}
        {onToggleFavourite && (
          <ContextMenuItem
            onClick={onToggleFavourite}
            className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-[#111B21] dark:text-[#E9EDEF] rounded-lg hover:bg-[#F5F6F6] dark:hover:bg-[#182229] cursor-pointer"
          >
            <Heart
              className={cn(
                "h-4 w-4",
                isFavourite ? "fill-red-500 text-red-500" : "text-[#8696A0]"
              )}
            />
            <span>{isFavourite ? "Remove from favorites" : "Add to favorites"}</span>
          </ContextMenuItem>
        )}

        {/* Clear chat (Direct chats only) */}
        {!isGroup && onClearChat && (
          <ContextMenuItem
            onClick={onClearChat}
            className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-[#111B21] dark:text-[#E9EDEF] rounded-lg hover:bg-[#F5F6F6] dark:hover:bg-[#182229] cursor-pointer"
          >
            <Eraser className="h-4 w-4 text-[#8696A0]" />
            <span>Clear chat</span>
          </ContextMenuItem>
        )}

        {/* Destructive Section */}
        {((isGroup && onLeaveGroup) || onDelete) && (
          <ContextMenuSeparator className="my-1 bg-[#F0F2F5] dark:bg-[#2A3942]" />
        )}

        {/* Leave group (Groups only) */}
        {isGroup && onLeaveGroup && (
          <ContextMenuItem
            variant="destructive"
            onClick={onLeaveGroup}
            className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Leave group</span>
          </ContextMenuItem>
        )}

        {/* Delete conversation / Delete group (Admin only for groups) */}
        {onDelete && (!isGroup || isGroupAdmin) && (
          <ContextMenuItem
            variant="destructive"
            onClick={onDelete}
            className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            <span>{isGroup ? "Delete group" : "Delete chat"}</span>
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

