"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";
import { playNotificationSound } from "@/utils/sounds";
import { Socket } from "socket.io-client";
import React from "react";
import {
  decrypt1v1Notification,
  decryptGroupNotification,
  formatWhatsAppMessagePreview,
} from "@/utils/notificationPreview";
import { WhatsAppNotificationCard } from "@/components/notifications/WhatsAppNotificationCard";

/**
 * useGlobalNotifications
 *
 * Attaches to the shared Socket.io instance and listens for ALL incoming
 * 1v1 and group messages globally across the entire CallsChat app.
 *
 * WhatsApp Web Notification Logic:
 *  - If the user is currently inside the target chat/group → play soft pop chime, no toast.
 *  - If the user is anywhere else in the app (active tab) → play chime + show WhatsApp Web floating notification card.
 *  - If the tab is backgrounded/minimized → fire native HTML5 Desktop Notification + play sound.
 */
export const useGlobalNotifications = (
  socket: Socket | null,
  currentUserId: string | null
) => {
  const pathname = usePathname();
  const router = useRouter();

  // Keep fresh references in refs so listeners never operate on stale state closures
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

  // Request browser Notification permission on mount if supported
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    // ── 1v1 Chat Messages ──────────────────────────────────────────────────
    const handleChatMessage = async (payload: any) => {
      const senderId = payload.senderId || payload.sender?.id;

      // Only notify for messages from OTHER participants
      if (!senderId || senderId === currentUserIdRef.current) return;

      const conversationId = payload.conversationId;
      const targetRoute = `/chats/${conversationId}`;
      const currentPath = pathRef.current || "";
      const isInThisChat = currentPath === targetRoute || currentPath.endsWith(conversationId);

      // Immediately mark as delivered over socket
      socket.emit("chat:mark_delivered", {
        conversationId,
        messageId: payload.id,
      });

      if (isInThisChat) {
        // User is already reading this conversation
        playNotificationSound("message");
        return;
      }

      // Check if conversation is locally muted
      try {
        const mutedRaw = localStorage.getItem(`muted_${conversationId}`);
        if (mutedRaw) {
          const mutedData = JSON.parse(mutedRaw);
          if (mutedData.isMuted && (!mutedData.until || new Date(mutedData.until) > new Date())) {
            return; // Silently ignore muted conversation
          }
        }
      } catch {}

      // Play WhatsApp notification chime
      playNotificationSound("message");

      // 1. Resolve Sender Info
      const senderName =
        payload.sender?.profile?.displayName ||
        payload.sender?.profile?.username ||
        payload.senderName ||
        "New Message";
      const senderAvatar =
        payload.sender?.profile?.avatarUrl || payload.senderAvatar || null;

      // 2. Real-time Decryption
      const decryptedText = await decrypt1v1Notification(
        payload,
        currentUserIdRef.current || ""
      );

      // 3. Format into WhatsApp media preview
      const preview = formatWhatsAppMessagePreview(
        decryptedText,
        payload.mediaType,
        payload.mediaUrl
      );

      // 4. Browser Background Native Notification (when tab is minimized / unfocused)
      const isWindowHidden =
        typeof document !== "undefined" &&
        (document.visibilityState === "hidden" || !document.hasFocus());

      if (
        isWindowHidden &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          const nativeNotif = new Notification(senderName, {
            body: preview.displayText,
            icon: senderAvatar || "/call_chats_logo.png",
            tag: `conv-${conversationId}`,
          });

          nativeNotif.onclick = () => {
            window.focus();
            routerRef.current.push(targetRoute);
            nativeNotif.close();
          };
        } catch {
          // Fallback to in-app toast below
        }
      }

      // 5. In-App WhatsApp Notification Card Toast
      toast.custom(
        (t) => (
          <WhatsAppNotificationCard
            title={senderName}
            isGroup={false}
            displayText={preview.displayText}
            attachmentType={preview.attachmentType}
            avatarUrl={senderAvatar}
            timestamp="Just now"
            onClick={() => {
              toast.dismiss(t);
              routerRef.current.push(targetRoute);
            }}
            onClose={(e) => {
              e.stopPropagation();
              e.preventDefault();
              toast.dismiss(t);
            }}
          />
        ),
        {
          duration: 5000,
        }
      );
    };

    // ── Group Messages ─────────────────────────────────────────────────────
    const handleGroupMessage = async (payload: any) => {
      const senderId = payload.senderId || payload.sender?.id;

      // Only notify for messages from OTHER participants
      if (!senderId || senderId === currentUserIdRef.current) return;

      const groupId = payload.groupId;
      const targetRoute = `/groups/${groupId}`;
      const currentPath = pathRef.current || "";
      const isInThisGroup = currentPath === targetRoute || currentPath.endsWith(groupId);

      // Immediately mark as delivered over socket
      socket.emit("group:mark_delivered", {
        groupId,
        messageId: payload.id,
      });

      if (isInThisGroup) {
        playNotificationSound("message");
        return;
      }

      // Check if group is locally muted
      try {
        const mutedRaw = localStorage.getItem(`muted_group_${groupId}`);
        if (mutedRaw) {
          const mutedData = JSON.parse(mutedRaw);
          if (mutedData.isMuted && (!mutedData.until || new Date(mutedData.until) > new Date())) {
            return;
          }
        }
      } catch {}

      // Play WhatsApp notification chime
      playNotificationSound("message");

      // 1. Resolve Group & Sender Info
      const groupName = payload.groupName || payload.group?.name || "Group";
      const groupAvatar = payload.groupAvatar || payload.group?.avatarUrl || null;
      const senderName =
        payload.sender?.profile?.displayName ||
        payload.sender?.profile?.username ||
        payload.senderName ||
        "Member";
      const senderAvatar =
        payload.sender?.profile?.avatarUrl || payload.senderAvatar || null;

      // 2. Real-time Decryption
      const decryptedText = await decryptGroupNotification(
        payload,
        currentUserIdRef.current || ""
      );

      // 3. Format into WhatsApp media preview
      const preview = formatWhatsAppMessagePreview(
        decryptedText,
        payload.mediaType,
        payload.mediaUrl
      );

      // 4. Browser Background Native Notification
      const isWindowHidden =
        typeof document !== "undefined" &&
        (document.visibilityState === "hidden" || !document.hasFocus());

      if (
        isWindowHidden &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          const nativeNotif = new Notification(`${groupName} (${senderName})`, {
            body: preview.displayText,
            icon: groupAvatar || senderAvatar || "/call_chats_logo.png",
            tag: `group-${groupId}`,
          });

          nativeNotif.onclick = () => {
            window.focus();
            routerRef.current.push(targetRoute);
            nativeNotif.close();
          };
        } catch {}
      }

      // 5. In-App WhatsApp Notification Card Toast
      toast.custom(
        (t) => (
          <WhatsAppNotificationCard
            title={groupName}
            senderName={senderName}
            isGroup={true}
            displayText={preview.displayText}
            attachmentType={preview.attachmentType}
            avatarUrl={senderAvatar}
            groupAvatarUrl={groupAvatar}
            timestamp="Just now"
            onClick={() => {
              toast.dismiss(t);
              routerRef.current.push(targetRoute);
            }}
            onClose={(e) => {
              e.stopPropagation();
              e.preventDefault();
              toast.dismiss(t);
            }}
          />
        ),
        {
          duration: 5000,
        }
      );
    };

    socket.on("chat:receive_message", handleChatMessage);
    socket.on("group:receive_message", handleGroupMessage);

    return () => {
      socket.off("chat:receive_message", handleChatMessage);
      socket.off("group:receive_message", handleGroupMessage);
    };
  }, [socket]);
};
