"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, MessageSquare, PhoneMissed, Users, Info } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { AppNotification } from "@/services/notification.service";
import { NotificationItem } from "./NotificationItem";
import { useTranslations } from "next-intl";



export interface NotificationDropdownProps {
  channelId?: string;
  onlyChannelTypes?: boolean;
  customTrigger?: React.ReactNode | ((unreadCount: number) => React.ReactNode);
}

export function NotificationDropdown({ channelId, onlyChannelTypes, customTrigger }: NotificationDropdownProps = {}) {
  const t = useTranslations("notifications");
  const {
    notifications: rawNotifications,
    unreadCount: totalUnreadCount,
    isLoading,
    hasMore,
    filter,
    setFilter,
    loadMore,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleAcceptContact,
    processingIds,
    actionTakenIds,
  } = useNotifications();
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const notifications = React.useMemo(() => {
    return rawNotifications.filter((n) => {
      if (channelId) {
        return n.routeId === channelId;
      }
      if (onlyChannelTypes) {
        return n.type === "CHANNEL_INVITATION" || n.type === "CHANNEL_MESSAGE" || n.type === "CHANNEL_UPDATE";
      }
      return true;
    });
  }, [rawNotifications, channelId, onlyChannelTypes]);

  const unreadCount = React.useMemo(() => {
    if (channelId || onlyChannelTypes) {
      return notifications.filter((n) => !n.isRead).length;
    }
    return totalUnreadCount;
  }, [channelId, onlyChannelTypes, notifications, totalUnreadCount]);

  // Scroll listener for pagination
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const bottom =
      e.currentTarget.scrollHeight - e.currentTarget.scrollTop <=
      e.currentTarget.clientHeight + 20; // 20px threshold
    if (bottom && !isLoading && hasMore) {
      loadMore();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {customTrigger ? (
          typeof customTrigger === "function" ? (
            customTrigger(unreadCount)
          ) : (
            customTrigger
          )
        ) : (
          <button 
            type="button"
            aria-label="Notifications"
            title="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#54656F] dark:text-[#8696A0] hover:bg-[#F0F2F5] dark:hover:bg-[#202C33] hover:text-[#00A884] dark:hover:text-[#00A884] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00A884] cursor-pointer"
          >
            <Bell className="h-5 w-5" strokeWidth={2} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-[#00A884] ring-2 ring-white dark:ring-[#111B21]">
                <span className="sr-only">Unread notifications</span>
              </span>
            )}
          </button>
        )}
      </PopoverTrigger>

      <PopoverContent className="w-[380px] p-0 rounded-2xl shadow-xl overflow-hidden border border-[#E2E8F0] dark:border-[#222D34] mr-4 mt-2 bg-white dark:bg-[#111B21] text-[#111B21] dark:text-[#E9EDEF]" align="end">
        {/* Header */}
        <div className="flex flex-col gap-4 p-4 border-b border-[#F0F2F5] dark:border-[#202C33]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#111B21] dark:text-[#E9EDEF]">{t("title")}</h2>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs font-semibold text-[#00A884] hover:underline transition-colors cursor-pointer"
              >
                {t("mark_all_read")}
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "px-3.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer",
                filter === "all"
                  ? "bg-[#00A884] text-white"
                  : "bg-[#F0F2F5] dark:bg-[#202C33] text-[#54656F] dark:text-[#8696A0] hover:bg-[#E2E8F0] dark:hover:bg-[#2A3942]"
              )}
            >
              {t("all")}
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={cn(
                "px-3.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer",
                filter === "unread"
                  ? "bg-[#00A884] text-white"
                  : "bg-[#F0F2F5] dark:bg-[#202C33] text-[#54656F] dark:text-[#8696A0] hover:bg-[#E2E8F0] dark:hover:bg-[#2A3942]"
              )}
            >
              {t("unread")}
            </button>
          </div>
        </div>

        {/* List */}
        <div
          className="max-h-[60vh] overflow-y-auto overscroll-contain flex flex-col"
          onScroll={handleScroll}
        >
          {notifications.length === 0 && !isLoading ? (
            <div className="p-8 text-center text-[#8696A0] flex flex-col items-center justify-center">
              <Bell className="h-10 w-10 text-[#8696A0]/40 mb-3" />
              <p className="font-medium text-sm text-[#8696A0]">{channelId ? "No notifications for this channel" : t("no_notifications")}</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onCloseDropdown={() => setOpen(false)}
                onAcceptContact={handleAcceptContact}
                isProcessing={processingIds.has(notification.id)}
                isResolved={actionTakenIds.has(notification.id)}
              />
            ))
          )}

          {isLoading && (
            <div className="p-4 flex justify-center">
              <div className="h-5 w-5 rounded-full border-2 border-[#00A884] border-t-transparent animate-spin" />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
