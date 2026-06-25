"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, MessageSquare, PhoneMissed, Users, Info } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { AppNotification } from "@/services/notification.service";
import { NotificationItem } from "./NotificationItem";



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
    handleAcceptContact,
    processingIds,
    actionTakenIds,
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
              <div className="h-5 w-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
