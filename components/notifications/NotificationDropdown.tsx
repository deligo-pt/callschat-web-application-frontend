"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, MessageSquare, PhoneMissed, Users, Info } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { AppNotification } from "@/services/notification.service";

// Simple relative time formatter
function getRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
}

// Fallback icon based on type
function getFallbackIcon(type: AppNotification["type"]) {
  switch (type) {
    case "MESSAGE":
      return <MessageSquare className="h-5 w-5 text-blue-500" />;
    case "CALL_MISSED":
      return <PhoneMissed className="h-5 w-5 text-red-500" />;
    case "GROUP_INVITE":
      return <Users className="h-5 w-5 text-green-500" />;
    default:
      return <Info className="h-5 w-5 text-gray-500" />;
  }
}

export function NotificationDropdown() {
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    filter,
    setFilter,
    loadMore,
    handleMarkAsRead,
    handleMarkAllAsRead,
  } = useNotifications();
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  // Scroll listener for pagination
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const bottom =
      e.currentTarget.scrollHeight - e.currentTarget.scrollTop <=
      e.currentTarget.clientHeight + 20; // 20px threshold
    if (bottom && !isLoading && hasMore) {
      loadMore();
    }
  };

  const onNotificationClick = (notification: AppNotification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    
    setOpen(false);

    if (notification.routeId) {
      switch (notification.type) {
        case "MESSAGE":
          router.push(`/chats/${notification.routeId}`);
          break;
        case "GROUP_INVITE":
          router.push(`/groups/${notification.routeId}`);
          break;
        case "CALL_MISSED":
          // Maybe navigate to calls log or just stay
          router.push(`/calls`);
          break;
        default:
          break;
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#E6EAFA] bg-[#F4F6FC] transition-colors hover:bg-[#E6EAFA]">
          <Bell className="h-5 w-5 text-[#3B58F5]" strokeWidth={2.5} />
          {unreadCount > 0 && (
            <div className="absolute right-2 top-2 flex h-3 w-3 items-center justify-center rounded-full border-2 border-[#F4F6FC] bg-red-500 text-[8px] font-bold text-white">
              <span className="sr-only">Unread notifications</span>
            </div>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-[380px] p-0 rounded-2xl shadow-xl overflow-hidden border border-border mr-4 mt-2 bg-white" align="end">
        {/* Header */}
        <div className="flex flex-col gap-4 p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Notifications</h2>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-semibold transition-colors",
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-muted text-foreground hover:bg-muted/80"
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-semibold transition-colors",
                filter === "unread"
                  ? "bg-blue-600 text-white"
                  : "bg-muted text-foreground hover:bg-muted/80"
              )}
            >
              Unread
            </button>
          </div>
        </div>

        {/* List */}
        <div
          className="max-h-[60vh] overflow-y-auto overscroll-contain flex flex-col"
          onScroll={handleScroll}
        >
          {notifications.length === 0 && !isLoading ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center">
              <Bell className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="font-medium text-sm">No notifications found.</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const issuerName =
                notification.issuer?.profile?.displayName || "Someone";
              const avatarUrl = notification.issuer?.profile?.avatarUrl;

              return (
                <div
                  key={notification.id}
                  onClick={() => onNotificationClick(notification)}
                  className={cn(
                    "flex items-start gap-4 p-4 border-b border-border/50 cursor-pointer transition-colors hover:bg-muted/50",
                    !notification.isRead ? "bg-blue-50/30" : ""
                  )}
                >
                  {/* Avatar or Fallback */}
                  <div className="shrink-0 relative">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={issuerName}
                        className="h-12 w-12 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center border border-border">
                        {getFallbackIcon(notification.type)}
                      </div>
                    )}
                    {/* Tiny type icon badge overlay */}
                    {avatarUrl && (
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background flex items-center justify-center shadow-sm border border-border/50">
                        <div className="scale-[0.6]">
                          {getFallbackIcon(notification.type)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col pt-1">
                    <p className="text-sm text-foreground leading-tight">
                      <span className="font-bold">{issuerName}</span>{" "}
                      {notification.content.replace(issuerName, "").trim()}
                    </p>
                    <span className="text-xs font-medium text-muted-foreground mt-1.5">
                      {getRelativeTime(notification.createdAt)}
                    </span>
                  </div>

                  {/* Unread Dot */}
                  {!notification.isRead && (
                    <div className="shrink-0 pt-2 pl-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="p-4 flex justify-center">
              <div className="h-5 w-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
