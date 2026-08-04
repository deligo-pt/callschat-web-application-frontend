"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";
import { playNotificationSound } from "@/utils/sounds";
import { Socket } from "socket.io-client";
import React from "react";

/**
 * useGlobalNotifications
 *
 * Attaches to the shared Socket.io instance and listens for ALL incoming
 * chat and group messages globally — regardless of which page the user is on.
 *
 * Logic:
 *  - If the user is currently inside the exact conversation → play a soft pop, no toast.
 *  - If they are anywhere else in the app → play the pop + show a Messenger-style toast.
 */
export const useGlobalNotifications = (
  socket: Socket | null,
  currentUserId: string | null
) => {
  const pathname = usePathname();
  const router = useRouter();

  // Keep fresh path + router in refs so the socket listener closure never goes stale
  const pathRef = useRef(pathname);
  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const currentUserIdRef = useRef(currentUserId);
  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    if (!socket) return;

    // ── 1v1 Chat Messages ──────────────────────────────────────────────────
    const handleChatMessage = (payload: any) => {
      const senderId = payload.senderId || payload.sender?.id;

      // Only notify for messages from OTHER people
      if (!senderId || senderId === currentUserIdRef.current) return;

      const conversationId = payload.conversationId;
      const targetRoute = `/chats/${conversationId}`;
      const isInThisChat = pathRef.current === targetRoute;

      // Immediately mark as delivered since it reached our client
      socket.emit("chat:mark_delivered", {
        conversationId,
        messageId: payload.id,
      });

      if (isInThisChat) {
        // Soft in-chat pop — user is already reading this conversation
        playNotificationSound("message");
      } else {
        // User is somewhere else — full alert
        playNotificationSound("message");

        const senderName =
          payload.sender?.profile?.displayName ||
          payload.senderName ||
          "New Message";
        const senderAvatar =
          payload.sender?.profile?.avatarUrl || payload.senderAvatar || null;

        toast.custom((t) => (
          <div
            className="group relative flex w-[360px] cursor-pointer items-start gap-4 overflow-hidden rounded-[20px] bg-white/95 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl border border-white/20 transition-all hover:scale-[1.02] hover:bg-white active:scale-[0.98] dark:bg-[#1E1E1E]/95 dark:border-white/10 dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]"
            onClick={() => {
              toast.dismiss(t);
              routerRef.current.push(targetRoute);
            }}
          >
            {/* Blue unread indicator bar */}
            <div className="absolute left-0 top-0 h-full w-[3px] bg-[#3B58F5]" />

            {senderAvatar ? (
              <img
                src={senderAvatar}
                alt={senderName}
                className="mt-0.5 h-12 w-12 shrink-0 rounded-full object-cover shadow-sm ring-1 ring-black/5"
              />
            ) : (
              <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] text-[17px] font-bold text-[#3B58F5] shadow-sm ring-1 ring-black/5 dark:from-[#3B58F5]/20 dark:to-[#3B58F5]/10 dark:text-[#818CF8]">
                {senderName.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div className="flex flex-1 flex-col overflow-hidden pt-0.5">
              <div className="flex items-center justify-between">
                <span className="truncate text-[15px] font-semibold tracking-tight text-[#0F172A] dark:text-white">
                  {senderName}
                </span>
                <span className="text-[11px] font-medium text-slate-400">Now</span>
              </div>
              <span className="mt-0.5 line-clamp-2 text-[13.5px] leading-snug text-slate-500 dark:text-slate-400">
                {payload.text || "Sent an attachment"}
              </span>
            </div>
          </div>
        ));
      }
    };

    // ── Group Messages ─────────────────────────────────────────────────────
    const handleGroupMessage = (payload: any) => {
      const senderId = payload.senderId || payload.sender?.id;

      // Only notify for messages from OTHER people
      if (!senderId || senderId === currentUserIdRef.current) return;

      const groupId = payload.groupId;
      const targetRoute = `/groups/${groupId}`;
      const isInThisGroup = pathRef.current === targetRoute;

      // Immediately mark as delivered since it reached our client
      socket.emit("group:mark_delivered", {
        groupId,
        messageId: payload.id,
      });

      if (isInThisGroup) {
        playNotificationSound("message");
      } else {
        playNotificationSound("message");

        const senderName =
          payload.sender?.profile?.displayName ||
          payload.senderName ||
          "Group Message";
        const senderAvatar =
          payload.sender?.profile?.avatarUrl || payload.senderAvatar || null;
        const groupName = payload.groupName || "Group";

        toast.custom((t) => (
          <div
            className="group relative flex w-[360px] cursor-pointer items-start gap-4 overflow-hidden rounded-[20px] bg-white/95 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl border border-white/20 transition-all hover:scale-[1.02] hover:bg-white active:scale-[0.98] dark:bg-[#1E1E1E]/95 dark:border-white/10 dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]"
            onClick={() => {
              toast.dismiss(t);
              routerRef.current.push(targetRoute);
            }}
          >
            {/* Blue unread indicator bar */}
            <div className="absolute left-0 top-0 h-full w-[3px] bg-[#3B58F5]" />

            {senderAvatar ? (
              <img
                src={senderAvatar}
                alt={senderName}
                className="mt-0.5 h-12 w-12 shrink-0 rounded-full object-cover shadow-sm ring-1 ring-black/5"
              />
            ) : (
              <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] text-[17px] font-bold text-[#3B58F5] shadow-sm ring-1 ring-black/5 dark:from-[#3B58F5]/20 dark:to-[#3B58F5]/10 dark:text-[#818CF8]">
                {senderName.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div className="flex flex-1 flex-col overflow-hidden pt-0.5">
              <div className="flex items-center justify-between">
                <span className="truncate text-[15px] font-semibold tracking-tight text-[#0F172A] dark:text-white">
                  {groupName}
                </span>
                <span className="text-[11px] font-medium text-slate-400">Now</span>
              </div>
              <span className="mt-0.5 line-clamp-2 text-[13.5px] leading-snug text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-[#0F172A] dark:text-slate-300">{senderName}: </span>
                {payload.text || "Sent an attachment"}
              </span>
            </div>
          </div>
        ));
      }
    };

    socket.on("chat:receive_message", handleChatMessage);
    socket.on("group:receive_message", handleGroupMessage);

    return () => {
      socket.off("chat:receive_message", handleChatMessage);
      socket.off("group:receive_message", handleGroupMessage);
    };
  }, [socket]); // Only re-run if socket reference changes
};
