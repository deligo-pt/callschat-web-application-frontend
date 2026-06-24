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
            className="flex items-center gap-3 p-4 bg-background border border-border shadow-xl rounded-2xl cursor-pointer hover:bg-muted/50 transition-colors w-[360px]"
            onClick={() => {
              toast.dismiss(t);
              routerRef.current.push(targetRoute);
            }}
          >
            {senderAvatar ? (
              <img
                src={senderAvatar}
                alt={senderName}
                className="w-11 h-11 rounded-full object-cover shrink-0 ring-2 ring-primary/20"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-primary/10 shrink-0 flex items-center justify-center ring-2 ring-primary/20">
                <span className="text-primary font-bold text-lg">
                  {senderName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 flex flex-col overflow-hidden">
              <span className="font-semibold text-foreground text-sm truncate">
                {senderName}
              </span>
              <span className="text-muted-foreground text-sm truncate">
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
            className="flex items-center gap-3 p-4 bg-background border border-border shadow-xl rounded-2xl cursor-pointer hover:bg-muted/50 transition-colors w-[360px]"
            onClick={() => {
              toast.dismiss(t);
              routerRef.current.push(targetRoute);
            }}
          >
            {senderAvatar ? (
              <img
                src={senderAvatar}
                alt={senderName}
                className="w-11 h-11 rounded-full object-cover shrink-0 ring-2 ring-primary/20"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-primary/10 shrink-0 flex items-center justify-center ring-2 ring-primary/20">
                <span className="text-primary font-bold text-lg">
                  {senderName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 flex flex-col overflow-hidden">
              <span className="font-semibold text-foreground text-sm truncate">
                {senderName}
                <span className="font-normal text-muted-foreground">
                  {" "}· {groupName}
                </span>
              </span>
              <span className="text-muted-foreground text-sm truncate">
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
