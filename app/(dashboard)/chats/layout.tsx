"use client";

import { BusinessFeaturesMenu } from "@/components/business/BusinessFeaturesMenu";
import { BusinessSidebar } from "@/components/business/BusinessSidebar";
import { ExploreBusinessesModal } from "@/components/business/ExploreBusinessesModal";
import { ActiveNowTray } from "@/components/chat/ActiveNowTray";
import { NewMessageModal } from "@/components/chat/NewMessageModal";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { useSocket } from "@/components/providers/SocketProvider";
import { usePresence } from "@/context/PresenceContext";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import { chatService } from "@/services/chat.service";
import { groupService, GroupItem } from "@/services/group.service";
import { decryptMessage } from "@/utils/crypto";
import { getUserPrivateKey, getUserPublicKey, getDecryptedMessage, storeDecryptedMessage, getStoredGroupKey } from "@/utils/keyStore";
import { getOptimizedImageUrl } from "@/utils/image";
import { motion } from "framer-motion";
import { Building2, Heart, MessageSquare, MoreVertical, Search, Trash2, UserPlus, Check, CheckCheck, Clock, MessageSquarePlus, X, Filter, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useCallback, useEffect, useState, useRef } from "react";

interface Conversation {
  id: string;
  updatedAt: string;
  otherUserId: string | null;
  otherUserName: string;
  otherUserAvatar: string | null;
  otherUserOnline: boolean;
  isGroup?: boolean;
  groupName?: string | null;
  groupAvatar?: string | null;
  memberCount?: number;
  context?: string;
  workspaceId?: string | null;
  unreadCount?: number;
  lastMessage: {
    id: string;
    senderId: string;
    senderName?: string | null;
    ciphertext: string | null;
    nonce: string | null;
    /** Set when the message belongs to a B2C support ticket (plaintext; no E2EE). */
    ticketId?: string | null;
    mediaType: string | null;
    mediaUrl?: string | null;
    isDeleted?: boolean;
    receipts?: Array<{ id?: string; userId: string; deliveredAt?: string | null; seenAt?: string | null }>;
    createdAt: string;
  } | null;
}

function ChatsLayoutContent({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [menuOpenForId, setMenuOpenForId] = useState<string | null>(null);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [decryptedPreviews, setDecryptedPreviews] = useState<Record<string, string>>({});
  const decryptedPreviewsRef = useRef<Record<string, string>>({});
  useEffect(() => {
    decryptedPreviewsRef.current = decryptedPreviews;
  }, [decryptedPreviews]);
  const failedDecryptionsRef = useRef<Set<string>>(new Set());

  // Per-conversation typing state: set of conversationIds where someone is typing
  const [typingConvIds, setTypingConvIds] = useState<Set<string>>(new Set());
  // Tracks the last time the user read each conversation (persisted to localStorage)
  const [lastReadMap, setLastReadMap] = useState<Record<string, string>>({});
  // Real-time unread counts per conversation (incremented on new messages, cleared on seen)
  const [realtimeUnreadCounts, setRealtimeUnreadCounts] = useState<Record<string, number>>({});
  const pathname = usePathname();
  const router = useRouter();
  // Read the "view" query param once (frozen) — only needed to decide which sidebar to show.
  // Using useSearchParams() is SSR-safe; useState initializer freezes the value so
  // subsequent query-param changes (e.g. ?recipientId=xxx) don't re-render this layout.
  const searchParams = useSearchParams();
  const [viewParam] = useState(() => searchParams.get("view") || "");

  // Real-time presence — comes from the global PresenceProvider.
  const { isUserOnline } = usePresence();
  const { currentMode } = useUser();
  const { socket } = useSocket();
  const currentUserIdRef = React.useRef(currentUserId);
  useEffect(() => { currentUserIdRef.current = currentUserId; }, [currentUserId]);
  const pathnameRef = React.useRef(pathname);
  useEffect(() => { pathnameRef.current = pathname; }, [pathname]);

  const basePath = pathname.startsWith("/business") ? "/business/chats" : "/chats";
  const isRootChatsPage = pathname === basePath;

  // Parse JWT to get current user ID
  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window.atob(base64).split("").map((c) =>
          "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
        ).join("")
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Get current user ID from token
      const decoded = parseJwt(token);
      const myId = decoded?.sub || decoded?.id || "";
      setCurrentUserId(myId);

      // Fetch 1v1 conversations and groups in parallel for a unified WhatsApp-style inbox
      const [convsRes, groupsRes] = await Promise.all([
        chatService.fetchMyConversations().catch(() => ({ success: false, data: [] })),
        groupService.fetchMyGroups().catch(() => ({ success: false, data: [] })),
      ]);

      const directConvs: Conversation[] = (convsRes?.success && Array.isArray(convsRes?.data)) ? convsRes.data : [];
      const groupConvs: Conversation[] = (groupsRes?.success && Array.isArray(groupsRes?.data))
        ? groupsRes.data.map((g: GroupItem) => ({
            id: g.id,
            updatedAt: g.updatedAt,
            otherUserId: null,
            otherUserName: g.name,
            otherUserAvatar: g.avatarUrl,
            otherUserOnline: false,
            isGroup: true,
            groupName: g.name,
            groupAvatar: g.avatarUrl,
            memberCount: g.memberCount,
            lastMessage: g.lastMessage
              ? {
                  id: g.lastMessage.id,
                  senderId: g.lastMessage.senderId,
                  senderName: g.lastMessage.senderName,
                  ciphertext: g.lastMessage.ciphertext,
                  nonce: g.lastMessage.nonce,
                  mediaType: g.lastMessage.mediaType,
                  mediaUrl: g.lastMessage.mediaUrl,
                  createdAt: g.lastMessage.createdAt,
                }
              : null,
          }))
        : [];

      const merged = [...directConvs, ...groupConvs].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      // ── IndexedDB Fast Seed for Decrypted Previews ──
      // Before setting conversations, check IndexedDB cache for already-decrypted
      // messages so there is ZERO flash of "Encrypted message" on initial render.
      if (myId) {
        const cachedMap: Record<string, string> = {};
        for (const c of merged) {
          const msg = c.lastMessage;
          if (!msg) continue;
          if (!msg.nonce && msg.ciphertext) {
            cachedMap[c.id] = msg.ciphertext;
            cachedMap[msg.id] = msg.ciphertext;
          } else if (msg.id) {
            const cached = await getDecryptedMessage(myId, msg.id);
            if (cached) {
              cachedMap[c.id] = cached;
              cachedMap[msg.id] = cached;
            } else if (msg.nonce) {
              const cachedNonce = await getDecryptedMessage(myId, `nonce_${msg.nonce}`);
              if (cachedNonce) {
                cachedMap[c.id] = cachedNonce;
                cachedMap[msg.id] = cachedNonce;
              }
            }
          }
        }
        if (Object.keys(cachedMap).length > 0) {
          setDecryptedPreviews((prev) => ({ ...prev, ...cachedMap }));
        }
      }

      setConversations(merged);
    } catch (error) {
      console.error("Failed to fetch chat data", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const handleWorkspaceChange = () => {
      setIsLoading(true);
      fetchData();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("workspaceModeChanged", handleWorkspaceChange);
      return () => window.removeEventListener("workspaceModeChanged", handleWorkspaceChange);
    }
  }, [fetchData, currentMode]);

  // Load the last-read timestamps from localStorage so unread badges survive page refreshes.
  const pathnameConvSegment =
    pathname.split('/chats/')[1]?.split('?')[0] ||
    pathname.split('/groups/')[1]?.split('?')[0] ||
    '';
  const prevConvSegmentRef = React.useRef('');
  useEffect(() => {
    try {
      const raw = localStorage.getItem("lastReadMap");
      if (raw) setLastReadMap(JSON.parse(raw));
    } catch {
      // ignore parse errors
    }
    // Clear the real-time badge for the currently active conversation/group
    if (pathnameConvSegment) {
      setRealtimeUnreadCounts((prev) => ({ ...prev, [pathnameConvSegment]: 0 }));
    }
    const prevSegment = prevConvSegmentRef.current;
    prevConvSegmentRef.current = pathnameConvSegment;
    if (pathnameConvSegment !== prevSegment) {
      fetchData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathnameConvSegment]);

  // Subscribe socket to all active conversation and group rooms so real-time updates reach the sidebar
  useEffect(() => {
    if (!socket || conversations.length === 0) return;
    conversations.forEach((conv) => {
      if (conv.isGroup) {
        socket.emit("group:join_room", { groupId: conv.id });
      } else {
        socket.emit("chat:join_room", { conversationId: conv.id });
      }
    });
  }, [socket, conversations]);

  // Listen for real-time incoming or sent messages to auto-update the most recent message in the sidebar
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (payload: any) => {
      // Update the last message in the conversation list in-place (no full refetch)
      const convId = payload.conversationId;
      if (!convId) {
        fetchData();
        return;
      }

      // Increment real-time unread count if not currently viewing this conversation
      const activeConvId = pathnameRef.current.split('/chats/')[1]?.split('?')[0];
      const senderId = payload.senderId || payload.sender?.id;
      if (senderId && senderId !== currentUserIdRef.current && activeConvId !== convId) {
        setRealtimeUnreadCounts((prev) => ({
          ...prev,
          [convId]: (prev[convId] || 0) + 1,
        }));
      }

      // Update the last message inline
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === convId);
        if (idx === -1) {
          // New conversation — do a full refetch
          fetchData();
          return prev;
        }
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          lastMessage: {
            id: payload.id || '',
            senderId: payload.senderId || payload.sender?.id || '',
            ciphertext: payload.ciphertext || null,
            nonce: payload.nonce || null,
            mediaType: payload.mediaType || null,
            mediaUrl: payload.mediaUrl || null,
            isDeleted: false,
            receipts: payload.receipts || [],
            createdAt: payload.createdAt || new Date().toISOString(),
          },
        };
        // Move to top (WhatsApp behaviour: most recent conversation floats up)
        const [moved] = updated.splice(idx, 1);
        return [moved, ...updated];
      });

      // ── Inline realtime preview decryption ──────────────────────────────
      // Immediately decrypt the incoming message text so the sidebar preview
      // never shows "🔒 Encrypted message" — exactly like WhatsApp Web.
      if (!payload.mediaType && payload.ciphertext) {
        (async () => {
          const myId = currentUserIdRef.current;
          if (!myId) return;
          const msgId = payload.id;
          const msgNonce = payload.nonce;

          // 1. Check IndexedDB persistent cache first (instant — no crypto)
          let plain: string | null = null;
          if (msgId) plain = await getDecryptedMessage(myId, msgId);
          if (!plain && msgNonce) plain = await getDecryptedMessage(myId, `nonce_${msgNonce}`);

          // 2. Use previewText if the sender attached one (fast fallback)
          if (!plain && payload.previewText) plain = payload.previewText;

          // 3. Full pairwise decryption (online, uses fetched peer key)
          if (!plain && msgNonce) {
            try {
              const myPrivKey = await getUserPrivateKey(myId);
              const myPubKey = await getUserPublicKey(myId);
              if (myPrivKey) {
                const senderId = payload.senderId || payload.sender?.id;
                const targetUserId =
                  senderId === myId ? null : senderId;
                if (targetUserId) {
                  const res = await chatService.fetchRecipientKey(targetUserId);
                  let peerKeys: string[] = [];
                  if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
                    peerKeys = res.data.map((d: { publicKey: string }) => d.publicKey).reverse();
                  } else if (res?.success && res?.data?.publicKey) {
                    peerKeys = [res.data.publicKey];
                  }
                  for (const k of peerKeys) {
                    try {
                      plain = await decryptMessage(payload.ciphertext, msgNonce, k, myPrivKey);
                      if (plain) break;
                    } catch {}
                  }
                  // Own-key fallback (key rotation recovery)
                  if (!plain && myPubKey) {
                    try {
                      plain = await decryptMessage(payload.ciphertext, msgNonce, myPubKey, myPrivKey);
                    } catch {}
                  }
                }
              }
            } catch {}
          }

          // 4. Persist to IndexedDB and update preview state
          if (plain) {
            if (msgId) void storeDecryptedMessage(myId, msgId, plain);
            if (msgNonce) void storeDecryptedMessage(myId, `nonce_${msgNonce}`, plain);
            setDecryptedPreviews((prev) => ({
              ...prev,
              ...(msgId ? { [msgId]: plain! } : {}),
              [convId]: plain!,
            }));
          }
        })();
      }
    };

    const handleConversationSeen = (payload: any) => {
      // If the current user is the one who saw messages, clear their unread count for that conv
      const convId = payload.conversationId;
      if (!convId) return;

      // Clear unread badge if it's the current user reading OR if we just read it
      if (payload.userId === currentUserIdRef.current) {
        setRealtimeUnreadCounts((prev) => ({ ...prev, [convId]: 0 }));
        // Also update lastReadMap so hasUnread returns false
        const now = new Date().toISOString();
        setLastReadMap((prev) => ({ ...prev, [convId]: now }));
      } else {
        // Opposing user saw our messages — update outgoing lastMessage receipts to SEEN
        setConversations((prev) => {
          const idx = prev.findIndex((c) => c.id === convId);
          if (idx === -1) return prev;

          const conv = prev[idx];
          if (!conv.lastMessage || conv.lastMessage.senderId !== currentUserIdRef.current) {
            return prev;
          }

          const now = new Date().toISOString();
          const receipts = [...(conv.lastMessage.receipts || [])];
          const rIdx = receipts.findIndex((r) => r.userId === payload.userId);
          if (rIdx !== -1) {
            receipts[rIdx] = {
              ...receipts[rIdx],
              deliveredAt: receipts[rIdx].deliveredAt || now,
              seenAt: now,
            };
          } else {
            receipts.push({
              id: Math.random().toString(),
              userId: payload.userId,
              deliveredAt: now,
              seenAt: now,
            });
          }

          const updated = [...prev];
          updated[idx] = {
            ...conv,
            lastMessage: {
              ...conv.lastMessage,
              receipts,
            },
          };
          return updated;
        });
      }
    };

    const handleStatusUpdate = (payload: any) => {
      const convId = payload.conversationId;
      if (!convId) return;

      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === convId);
        if (idx === -1) return prev;

        const conv = prev[idx];
        if (!conv.lastMessage || (payload.messageId && conv.lastMessage.id !== payload.messageId)) {
          return prev;
        }

        const newDeliveredAt =
          payload.status === "DELIVERED"
            ? payload.timestamp
            : payload.status === "SEEN" && payload.deliveredAt
            ? payload.deliveredAt
            : payload.status === "SEEN"
            ? payload.timestamp
            : null;
        const newSeenAt = payload.status === "SEEN" ? payload.timestamp : null;

        const receipts = [...(conv.lastMessage.receipts || [])];
        const rIdx = receipts.findIndex((r) => r.userId === payload.userId);
        if (rIdx !== -1) {
          receipts[rIdx] = {
            ...receipts[rIdx],
            deliveredAt: newDeliveredAt ?? receipts[rIdx].deliveredAt,
            seenAt: newSeenAt ?? receipts[rIdx].seenAt,
          };
        } else {
          receipts.push({
            id: Math.random().toString(),
            userId: payload.userId,
            deliveredAt: newDeliveredAt,
            seenAt: newSeenAt,
          });
        }

        const updated = [...prev];
        updated[idx] = {
          ...conv,
          lastMessage: {
            ...conv.lastMessage,
            receipts,
          },
        };
        return updated;
      });
    };

    // Also re-fetch when a message is unsent so the sidebar falls back
    const handleUnsent = () => { fetchData(); };

    const handleGroupMessage = (payload: any) => {
      const groupId = payload.groupId;
      if (!groupId) {
        fetchData();
        return;
      }

      // Increment real-time unread count if not currently viewing this group
      const activeGroupId = pathnameRef.current.split('/groups/')[1]?.split('?')[0];
      const senderId = payload.senderId || payload.sender?.id;
      if (senderId && senderId !== currentUserIdRef.current && activeGroupId !== groupId) {
        setRealtimeUnreadCounts((prev) => ({
          ...prev,
          [groupId]: (prev[groupId] || 0) + 1,
        }));
      }

      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === groupId);
        if (idx === -1) {
          fetchData();
          return prev;
        }
        const updated = [...prev];
        const existing = updated[idx];
        updated[idx] = {
          ...existing,
          updatedAt: payload.createdAt || new Date().toISOString(),
          lastMessage: {
            id: payload.id || '',
            senderId: senderId || '',
            senderName: payload.sender?.profile?.displayName || payload.sender?.profile?.username || null,
            ciphertext: payload.ciphertext || null,
            nonce: payload.nonce || null,
            mediaType: payload.mediaType || null,
            mediaUrl: payload.mediaUrl || null,
            isDeleted: false,
            createdAt: payload.createdAt || new Date().toISOString(),
          },
        };
        const [moved] = updated.splice(idx, 1);
        return [moved, ...updated];
      });

      if (payload.text || payload.content || payload.message) {
        const text = payload.text || payload.content || payload.message;
        setDecryptedPreviews((prev) => ({
          ...prev,
          ...(payload.id ? { [payload.id]: text } : {}),
          [groupId]: text,
        }));
      }
    };

    const handleTypingStart = (payload: { conversationId: string; userId: string }) => {
      setTypingConvIds((prev) => {
        const next = new Set(prev);
        next.add(payload.conversationId);
        return next;
      });
    };

    const handleTypingStop = (payload: { conversationId: string; userId: string }) => {
      setTypingConvIds((prev) => {
        const next = new Set(prev);
        next.delete(payload.conversationId);
        return next;
      });
    };

    socket.on("chat:receive_message", handleNewMessage);
    socket.on("group:receive_message", handleGroupMessage);
    socket.on("chat:message_unsent", handleUnsent);
    socket.on("chat:message_status_update", handleStatusUpdate);
    socket.on("chat:conversation_status_update", handleConversationSeen);
    socket.on("chat:typing_start", handleTypingStart);
    socket.on("chat:typing_stop", handleTypingStop);

    return () => {
      socket.off("chat:receive_message", handleNewMessage);
      socket.off("group:receive_message", handleGroupMessage);
      socket.off("chat:message_unsent", handleUnsent);
      socket.off("chat:message_status_update", handleStatusUpdate);
      socket.off("chat:conversation_status_update", handleConversationSeen);
      socket.off("chat:typing_start", handleTypingStart);
      socket.off("chat:typing_stop", handleTypingStop);
    };
  }, [socket, fetchData]);

  // Listen for ephemeral conversation auto-deletion so the sidebar removes
  // the dead conversation without requiring a page refresh.
  useEffect(() => {
    if (!socket) return;

    const handleAutoDeleted = (payload: { conversationId: string }) => {
      setConversations((prev) => prev.filter((c) => c.id !== payload.conversationId));
      // If the user is currently in this conversation, the child page will
      // redirect them — no action needed here.
    };

    socket.on("chat:conversation_auto_deleted", handleAutoDeleted);
    return () => {
      socket.off("chat:conversation_auto_deleted", handleAutoDeleted);
    };
  }, [socket]);

  /**
   * Returns the unread count for a conversation.
   * Uses real-time tracking first, falls back to API-provided count.
   */
  const getUnreadCount = useCallback((conv: Conversation): number => {
    if (!conv.lastMessage) return 0;
    if (conv.lastMessage.senderId === currentUserId) return 0;

    // Prefer real-time count if available
    const rtCount = realtimeUnreadCounts[conv.id];
    if (rtCount !== undefined) return rtCount;

    // Fall back to API count
    const apiCount = conv.unreadCount || 0;

    // Validate against lastReadMap: if already read, return 0
    const lastReadAt = lastReadMap[conv.id];
    if (lastReadAt && new Date(conv.lastMessage.createdAt) <= new Date(lastReadAt)) return 0;

    return apiCount;
  }, [currentUserId, lastReadMap, realtimeUnreadCounts]);

  /**
   * Returns true when the conversation has an unread last message.
   */
  const hasUnread = useCallback((conv: Conversation): boolean => {
    return getUnreadCount(conv) > 0;
  }, [getUnreadCount]);

  // Sync API unread counts into realtimeUnreadCounts on initial load
  useEffect(() => {
    if (conversations.length === 0) return;
    setRealtimeUnreadCounts((prev) => {
      const merged = { ...prev };
      for (const conv of conversations) {
        // Only initialise from API if we don't already have a real-time value
        if (merged[conv.id] === undefined && conv.unreadCount !== undefined) {
          const lastReadAt = lastReadMap[conv.id];
          if (!lastReadAt || !conv.lastMessage || new Date(conv.lastMessage.createdAt) > new Date(lastReadAt)) {
            merged[conv.id] = conv.unreadCount;
          } else {
            merged[conv.id] = 0;
          }
        }
      }
      return merged;
    });
  }, [conversations, lastReadMap]);




  const handleDeleteConversation = async (conversationId: string) => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1";
      const targetConv = conversations.find((c) => c.id === conversationId);
      const isGroup = targetConv?.isGroup;

      const endpoint = isGroup
        ? `${baseUrl}/groups/${conversationId}`
        : `${baseUrl}/conversations/${conversationId}`;

      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        if (pathname === `${basePath}/${conversationId}` || pathname === `/groups/${conversationId}`) {
          router.push(basePath);
        }
      }
    } catch (err) {
      console.error("Failed to delete conversation", err);
    } finally {
      setIsDeleting(false);
      setConversationToDelete(null);
    }
  };

  // --- Decrypt Last Messages ---
  useEffect(() => {
    const decryptPreviews = async () => {
      if (!currentUserId || conversations.length === 0) return;

      const myPrivateKey = await getUserPrivateKey(currentUserId);
      if (!myPrivateKey) return;
      const myPublicKey = await getUserPublicKey(currentUserId);

      const newPreviews = { ...decryptedPreviewsRef.current };
      let hasChanges = false;
      const pubKeyCache: Record<string, string> = {};

      for (const conv of conversations) {
        const msg = conv.lastMessage;
        if (!msg) {
          if (newPreviews[conv.id]) {
            delete newPreviews[conv.id];
            hasChanges = true;
          }
          continue;
        }
        if (newPreviews[msg.id]) {
          if (newPreviews[conv.id] !== newPreviews[msg.id]) {
            newPreviews[conv.id] = newPreviews[msg.id];
            hasChanges = true;
          }
          continue;
        }
        if (msg.mediaType) continue; // Media handled differently

        // Group message decryption
        if (conv.isGroup) {
          let cachedText: string | null = null;
          if (msg.id) cachedText = await getDecryptedMessage(currentUserId, msg.id);
          if (!cachedText && msg.nonce) cachedText = await getDecryptedMessage(currentUserId, `nonce_${msg.nonce}`);
          if (cachedText) {
            newPreviews[msg.id] = cachedText;
            newPreviews[conv.id] = cachedText;
            hasChanges = true;
            continue;
          }
          if (msg.ciphertext && !msg.nonce) {
            newPreviews[msg.id] = msg.ciphertext;
            newPreviews[conv.id] = msg.ciphertext;
            hasChanges = true;
            continue;
          }
          // Try decrypting with stored group key if present
          try {
            const storedKey = await getStoredGroupKey(conv.id, currentUserId);
            if (storedKey && msg.ciphertext && msg.nonce) {
              const text = await decryptMessage(msg.ciphertext, msg.nonce, storedKey, myPrivateKey);
              if (text) {
                void storeDecryptedMessage(currentUserId, msg.id, text);
                newPreviews[msg.id] = text;
                newPreviews[conv.id] = text;
                hasChanges = true;
                continue;
              }
            }
          } catch {
            failedDecryptionsRef.current.add(msg.id);
            failedDecryptionsRef.current.add(conv.id);
          }
          continue;
        }

        // B2C support conversations: messages are stored as plaintext.
        const isBizConv =
          !msg.nonce ||
          msg.ticketId ||
          conv.workspaceId ||
          !conv.otherUserId;

        if (isBizConv) {
          if (msg.ciphertext && !msg.nonce) {
            newPreviews[msg.id] = msg.ciphertext;
            newPreviews[conv.id] = msg.ciphertext;
            hasChanges = true;
          } else if (msg.ciphertext && msg.nonce) {
            newPreviews[msg.id] = "Message (legacy encrypted)";
            newPreviews[conv.id] = "Message (legacy encrypted)";
            hasChanges = true;
          }
          continue;
        }

        // Personal E2EE conversation — decrypt with libsodium.
        if (!msg.ciphertext) continue;

        try {
          // IndexedDB fast path
          let cachedText: string | null = null;
          if (msg.id) cachedText = await getDecryptedMessage(currentUserId, msg.id);
          if (!cachedText && msg.nonce) cachedText = await getDecryptedMessage(currentUserId, `nonce_${msg.nonce}`);
          if (cachedText) {
            newPreviews[msg.id] = cachedText;
            newPreviews[conv.id] = cachedText;
            hasChanges = true;
            continue;
          }

          const targetUserId = msg.senderId === currentUserId ? conv.otherUserId : msg.senderId;
          if (!targetUserId) continue;

          let pubKeyToUse = pubKeyCache[targetUserId];
          if (!pubKeyToUse) {
            const res = await chatService.fetchRecipientKey(targetUserId);
            if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
              pubKeyToUse = res.data[res.data.length - 1].publicKey;
            } else if (res?.success && res?.data?.publicKey) {
              pubKeyToUse = res.data.publicKey;
            }
            if (pubKeyToUse) {
              pubKeyCache[targetUserId] = pubKeyToUse;
            }
          }

          if (pubKeyToUse) {
            const text = await decryptMessage(msg.ciphertext, msg.nonce!, pubKeyToUse, myPrivateKey);
            void storeDecryptedMessage(currentUserId, msg.id, text);
            if (msg.nonce) void storeDecryptedMessage(currentUserId, `nonce_${msg.nonce}`, text);
            newPreviews[msg.id] = text;
            newPreviews[conv.id] = text;
            hasChanges = true;
          }
        } catch {
          // Decryption failed — mark as failed so placeholder is shown ONLY after attempting
          failedDecryptionsRef.current.add(msg.id);
          failedDecryptionsRef.current.add(conv.id);
        }
      }

      if (hasChanges) {
        setDecryptedPreviews(newPreviews);
      }
    };

    decryptPreviews();
  }, [conversations, currentUserId]);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getLastMessagePreview = (conv: Conversation) => {
    // ── Typing indicator takes highest priority (WhatsApp behaviour) ──
    if (typingConvIds.has(conv.id)) {
      return "typing…";
    }

    const msg = conv.lastMessage;
    if (!msg) return conv.isGroup ? "Group created" : "No messages yet";

    const isMe = msg.senderId === currentUserId;
    const youPrefix = isMe
      ? "You: "
      : conv.isGroup && msg.senderName
      ? `${msg.senderName.split(" ")[0]}: `
      : "";

    // ── Media-type previews ──────────────────────────────────────────
    if (msg.mediaType === "image" || msg.mediaType?.startsWith("image")) return `${youPrefix}📷 Photo`;
    if (msg.mediaType === "video" || msg.mediaType?.startsWith("video")) return `${youPrefix}🎥 Video`;
    if (msg.mediaType === "audio" || msg.mediaType?.startsWith("audio")) return `${youPrefix}🎤 Voice message`;
    if (
      msg.mediaType === "document" ||
      msg.mediaType === "file" ||
      msg.mediaType === "raw" ||
      (msg.mediaUrl &&
        !msg.mediaType?.startsWith("image") &&
        !msg.mediaType?.startsWith("video") &&
        !msg.mediaType?.startsWith("audio") &&
        msg.mediaType !== "link" &&
        msg.mediaType !== "call")
    ) {
      const raw = msg.mediaUrl ? decodeURIComponent(msg.mediaUrl.split("/").pop()?.split("?")[0] || "") : "";
      const clean = raw.replace(/^\d{10,14}_/, "");
      return `${youPrefix}📄 ${clean ? (clean.length > 25 ? `${clean.slice(0, 22)}...` : clean) : "Document"}`;
    }

    if (msg.mediaType === "call") {
      if (msg.mediaUrl) {
        try {
          const payload = JSON.parse(msg.mediaUrl);
          return payload.type === "VIDEO" ? `${youPrefix}📹 Video call` : `${youPrefix}📞 Audio call`;
        } catch (e) {
          // Fallback if parsing fails
        }
      }
      return `${youPrefix}📞 Call`;
    }

    // ── Text previews ────────────────────────────────────────────────
    let textToPreview = "";
    if (decryptedPreviews[conv.id]) {
      textToPreview = decryptedPreviews[conv.id];
    } else if (msg.id && decryptedPreviews[msg.id]) {
      textToPreview = decryptedPreviews[msg.id];
    } else if (msg.ciphertext && !msg.nonce) {
      textToPreview = msg.ciphertext;
    } else if (failedDecryptionsRef.current.has(msg.id) || failedDecryptionsRef.current.has(conv.id)) {
      return conv.isGroup ? `${youPrefix}🔒 Group message` : "🔒 Encrypted message";
    } else {
      // Not yet decrypted / in flight: return empty string to prevent the flash!
      return "";
    }

    if (textToPreview.startsWith("__PIN_EVENT__:")) {
      try {
        const payload = JSON.parse(textToPreview.substring("__PIN_EVENT__:".length));
        const name = isMe ? "You" : (conv.otherUserName || payload.pinnerName || "Someone");
        const action = payload.action === "pin" ? "pinned" : "unpinned";
        return `📌 ${name} ${action} a message`;
      } catch (e) {
        return "📌 Pinned a message";
      }
    }

    if (textToPreview.startsWith("__EDITED__:")) {
      textToPreview = textToPreview.substring("__EDITED__:".length);
    }

    const truncated = textToPreview.length > 50 ? textToPreview.substring(0, 50) + "..." : textToPreview;
    return `${youPrefix}${truncated}`;
  };

  const [chatFilter, setChatFilter] = useState<"all" | "unread" | "groups" | "business">("all");

  const filteredConversations = conversations.filter((c) => {
    const nameToMatch = c.isGroup ? (c.groupName || "") : c.otherUserName;
    const matchesSearch = nameToMatch.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (chatFilter === "unread") return hasUnread(c);
    if (chatFilter === "groups") return !!c.isGroup;
    if (chatFilter === "business") return !c.isGroup && (c.workspaceId || c.context === "BUSINESS" || !c.otherUserId);
    return true;
  });

  const getPreviewStatusIcon = (conv: Conversation) => {
    if (!conv.lastMessage || conv.lastMessage.senderId !== currentUserId) return null;
    if (conv.isGroup) {
      return <Check className="h-3.5 w-3.5 shrink-0 text-[#8696A0] inline-block mr-1" strokeWidth={2.2} />;
    }
    const msg = conv.lastMessage;
    if (msg.id.startsWith("optimistic-") && (!msg.receipts || msg.receipts.length === 0)) {
      return <Clock className="h-3.5 w-3.5 shrink-0 text-[#8696A0] animate-pulse inline-block mr-1" />;
    }
    const recipientReceipts = (msg.receipts || []).filter((r) => r.userId !== currentUserId);
    const targetReceipts = recipientReceipts.length > 0 ? recipientReceipts : (msg.receipts || []);
    if (targetReceipts.some((r) => r.seenAt)) {
      return <CheckCheck className="h-3.5 w-3.5 shrink-0 text-[#53BDEB] inline-block mr-1" strokeWidth={2.2} />;
    }
    if (targetReceipts.some((r) => r.deliveredAt)) {
      return <CheckCheck className="h-3.5 w-3.5 shrink-0 text-[#8696A0] inline-block mr-1" strokeWidth={2.2} />;
    }
    return <Check className="h-3.5 w-3.5 shrink-0 text-[#8696A0] inline-block mr-1" strokeWidth={2.2} />;
  };

  return (
    <div className="flex h-full w-full bg-[#F8FAFC] dark:bg-[#0C1317]">
      {/* Sidebar */}
      <div
        className={cn(
          "flex h-full w-full flex-col border-r border-[#E2E8F0] dark:border-[#222D34] bg-white dark:bg-[#111B21] md:w-[380px] lg:w-[420px] shrink-0 transition-all z-10",
          !isRootChatsPage && "hidden md:flex"
        )}
      >
        {currentMode === "BUSINESS" && viewParam === "channels" ? (
          <BusinessSidebar />
        ) : (
          <>
            {/* Header Area */}
            <div className="flex flex-col px-4 pt-5 pb-3 border-b border-[#F0F2F5] dark:border-[#202C33]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h1 className="text-[20px] font-extrabold tracking-tight text-[#111B21] dark:text-[#E9EDEF]">
                    Chats
                  </h1>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsNewMessageOpen(true)}
                    title="New conversation"
                    className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#F0F2F5] dark:hover:bg-[#202C33] text-[#54656F] dark:text-[#8696A0] hover:text-[#00A884] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00A884]"
                    aria-label="New chat"
                  >
                    <MessageSquarePlus className="h-5 w-5" />
                  </button>

                  <Link 
                    href="/chats/favorites" 
                    title="Favorites" 
                    className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#F0F2F5] dark:hover:bg-[#202C33] text-[#54656F] dark:text-[#8696A0] hover:text-red-500 transition-colors focus:outline-none"
                    aria-label="Favorites"
                  >
                    <Heart className="h-4.5 w-4.5" />
                  </Link>

                  <NotificationDropdown />
                  {currentMode === "BUSINESS" && (
                    <BusinessFeaturesMenu />
                  )}
                </div>
              </div>

              {/* Search Bar */}
              <div className="mt-3 relative flex items-center">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8696A0]" />
                <input
                  type="text"
                  placeholder="Search or start new chat"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-lg bg-[#F0F2F5] dark:bg-[#202C33] pl-9 pr-8 text-[13.5px] font-normal text-[#111B21] dark:text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:ring-1 focus:ring-[#00A884] border border-transparent transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#8696A0] hover:text-[#111B21] dark:hover:text-white rounded-full transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Filter Chips */}
              <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto scrollbar-none pb-0.5">
                <button
                  type="button"
                  onClick={() => setChatFilter("all")}
                  className={cn(
                    "rounded-full px-3 py-1 text-[12px] font-semibold transition-all shrink-0",
                    chatFilter === "all"
                      ? "bg-[#00A884]/15 text-[#008069] dark:text-[#00A884]"
                      : "bg-[#F0F2F5] dark:bg-[#202C33] text-[#54656F] dark:text-[#8696A0] hover:bg-[#E2E8F0] dark:hover:bg-[#2A3942]"
                  )}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setChatFilter("unread")}
                  className={cn(
                    "rounded-full px-3 py-1 text-[12px] font-semibold transition-all shrink-0 flex items-center gap-1",
                    chatFilter === "unread"
                      ? "bg-[#00A884]/15 text-[#008069] dark:text-[#00A884]"
                      : "bg-[#F0F2F5] dark:bg-[#202C33] text-[#54656F] dark:text-[#8696A0] hover:bg-[#E2E8F0] dark:hover:bg-[#2A3942]"
                  )}
                >
                  Unread
                </button>
                <button
                  type="button"
                  onClick={() => setChatFilter("groups")}
                  className={cn(
                    "rounded-full px-3 py-1 text-[12px] font-semibold transition-all shrink-0 flex items-center gap-1",
                    chatFilter === "groups"
                      ? "bg-[#00A884]/15 text-[#008069] dark:text-[#00A884]"
                      : "bg-[#F0F2F5] dark:bg-[#202C33] text-[#54656F] dark:text-[#8696A0] hover:bg-[#E2E8F0] dark:hover:bg-[#2A3942]"
                  )}
                >
                  <Users className="h-3 w-3" />
                  <span>Groups</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChatFilter("business")}
                  className={cn(
                    "rounded-full px-3 py-1 text-[12px] font-semibold transition-all shrink-0 flex items-center gap-1",
                    chatFilter === "business"
                      ? "bg-[#00A884]/15 text-[#008069] dark:text-[#00A884]"
                      : "bg-[#F0F2F5] dark:bg-[#202C33] text-[#54656F] dark:text-[#8696A0] hover:bg-[#E2E8F0] dark:hover:bg-[#2A3942]"
                  )}
                >
                  Businesses
                </button>
                {currentMode !== "BUSINESS" && (
                  <button
                    type="button"
                    onClick={() => setIsExploreOpen(true)}
                    className="rounded-full px-2.5 py-1 text-[12px] font-semibold text-[#00A884] hover:bg-[#00A884]/10 transition-all shrink-0 flex items-center gap-1 ml-auto"
                    title="Explore Official Businesses"
                  >
                    <Building2 className="h-3 w-3" />
                    <span>Explore</span>
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable List Area */}
            <div className="flex-1 overflow-y-auto pb-20 custom-scrollbar md:pb-4">
              {/* Active Now Section */}
              <ActiveNowTray />

              {/* Conversations List */}
              <div className="mt-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00A884] border-t-transparent" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                    <div className="h-12 w-12 rounded-full bg-[#F0F2F5] dark:bg-[#202C33] flex items-center justify-center mb-3 text-[#8696A0]">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <h3 className="text-[15px] font-bold text-[#111B21] dark:text-[#E9EDEF] mb-1">
                      {searchQuery ? "No conversations found" : chatFilter === "unread" ? "No unread messages" : chatFilter === "groups" ? "No groups found" : "No conversations yet"}
                    </h3>
                    <p className="text-[12.5px] font-normal text-[#54656F] dark:text-[#8696A0] max-w-[220px] leading-relaxed mb-5">
                      {searchQuery
                        ? "Try searching for another name or keyword"
                        : "Connect and start encrypted chatting with your friends or team."}
                    </p>
                    {!searchQuery && (
                      <button
                        onClick={() => setIsNewMessageOpen(true)}
                        className="flex items-center justify-center gap-2 rounded-full bg-[#00A884] hover:bg-[#008069] px-5 py-2 text-[12.5px] font-bold text-white transition-all shadow-xs"
                      >
                        <MessageSquarePlus className="h-4 w-4" />
                        Start a Chat
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-[#F0F2F5] dark:divide-[#202C33]">
                    {filteredConversations.map((conv, index) => {
                      const isGroup = !!conv.isGroup;
                      const chatHref = isGroup
                        ? `${basePath}/${conv.id}?type=group`
                        : `${basePath}/${conv.id}?recipientId=${conv.otherUserId}`;
                      const isActive = pathname === `${basePath}/${conv.id}`;

                      const displayName = isGroup ? (conv.groupName || "Group") : conv.otherUserName;
                      const avatarUrl = isGroup
                        ? (conv.groupAvatar ? getOptimizedImageUrl(conv.groupAvatar, 48, 48) : null)
                        : (getOptimizedImageUrl(conv.otherUserAvatar, 48, 48) ||
                           `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.otherUserName)}&background=E0F2FE&color=0284C7&bold=true`);

                      const isOnline = !isGroup && (isUserOnline(conv.otherUserId ?? "") || conv.otherUserOnline);
                      const isTyping = typingConvIds.has(conv.id);

                      return (
                        <motion.div
                          key={conv.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="relative group"
                          onMouseLeave={() => setMenuOpenForId(null)}
                        >
                          <Link
                            href={chatHref}
                            prefetch={false}
                            className={cn(
                              "flex w-full items-center gap-3.5 px-4 py-3 transition-colors relative",
                              isActive
                                ? "bg-[#F0F2F5] dark:bg-[#202C33] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r-full before:bg-[#00A884]"
                                : "hover:bg-[#F8FAFC] dark:hover:bg-[#182229]/60"
                            )}
                          >
                            {/* Avatar with subtle online dot pip or Group Icon */}
                            <div className="relative shrink-0">
                              <div className="h-12 w-12 rounded-full overflow-hidden bg-[#F0F2F5] dark:bg-[#202C33] shadow-xs flex items-center justify-center">
                                {avatarUrl ? (
                                  <img
                                    src={getOptimizedImageUrl(avatarUrl)}
                                    alt={displayName}
                                    className="h-full w-full object-cover"
                                  />
                                ) : isGroup ? (
                                  <div className="h-full w-full bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                    <Users className="h-6 w-6" />
                                  </div>
                                ) : (
                                  <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=E0F2FE&color=0284C7&bold=true`}
                                    alt={displayName}
                                    className="h-full w-full object-cover"
                                  />
                                )}
                              </div>
                              {isOnline && (
                                <span
                                  aria-hidden="true"
                                  className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-[#25D366] border-2 border-white dark:border-[#111B21] shadow-xs"
                                />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex flex-1 flex-col items-start overflow-hidden min-w-0">
                              <div className="flex w-full items-center justify-between gap-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <h3 className={cn(
                                    "text-[15px] truncate leading-snug",
                                    hasUnread(conv) && !isActive
                                      ? "font-bold text-[#111B21] dark:text-[#E9EDEF]"
                                      : "font-semibold text-[#111B21] dark:text-[#E9EDEF]"
                                  )}>
                                    {displayName}
                                  </h3>
                                  {isGroup && (
                                    <span className="shrink-0 text-[10.5px] font-medium bg-[#00A884]/10 dark:bg-[#00A884]/20 text-[#008069] dark:text-[#00A884] px-1.5 py-0.2 rounded-full">
                                      Group
                                    </span>
                                  )}
                                </div>
                                <span className={cn(
                                  "text-[11.5px] font-normal shrink-0",
                                  hasUnread(conv) && !isActive
                                    ? "font-bold text-[#25D366]"
                                    : "text-[#667781] dark:text-[#8696A0]"
                                )}>
                                  {conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : formatTime(conv.updatedAt)}
                                </span>
                              </div>

                              <div className="flex w-full items-center justify-between gap-2 mt-0.5">
                                <p className={cn(
                                  "truncate text-left text-[13px] leading-tight flex-1 min-w-0 flex items-center",
                                  hasUnread(conv) && !isActive
                                    ? "font-semibold text-[#111B21] dark:text-[#E9EDEF]"
                                    : "font-normal text-[#54656F] dark:text-[#8696A0]"
                                )}>
                                  {(() => {
                                    if (isTyping) {
                                      return (
                                        <span className="text-[#00A884] font-semibold italic flex items-center gap-1">
                                          <span>typing...</span>
                                        </span>
                                      );
                                    }
                                    const preview = getLastMessagePreview(conv);
                                    return (
                                      <span className="truncate flex items-center">
                                        {getPreviewStatusIcon(conv)}
                                        <span className="truncate">{preview}</span>
                                      </span>
                                    );
                                  })()}
                                </p>

                                {/* Unread count badge */}
                                {!isActive && hasUnread(conv) ? (
                                  <div className="flex h-[19px] min-w-[19px] shrink-0 items-center justify-center rounded-full bg-[#25D366] px-1.5 text-[11px] font-bold text-white shadow-xs">
                                    {(() => {
                                      const count = getUnreadCount(conv);
                                      return count > 99 ? "99+" : count > 0 ? count : "●";
                                    })()}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </Link>

                          {/* Context Menu Trigger */}
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setMenuOpenForId(menuOpenForId === conv.id ? null : conv.id);
                              }}
                              className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[#667781] hover:text-[#111B21] dark:hover:text-white transition-colors"
                              title="More options"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {menuOpenForId === conv.id && (
                              <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#202C33] rounded-xl shadow-xl border border-[#E2E8F0] dark:border-[#2A3942] py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setConversationToDelete(conv.id);
                                    setMenuOpenForId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-[13px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  {conv.isGroup ? "Leave group" : "Delete chat"}
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 flex-col h-full bg-[#F8FAFC]",
          isRootChatsPage ? "hidden md:flex" : "flex"
        )}
      >
        {children}
      </div>

      {/* Delete Confirmation Modal */}
      {conversationToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1D2A54]/40 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 className="text-[18px] font-bold text-[#1D2A54] mb-2">
              {conversations.find((c) => c.id === conversationToDelete)?.isGroup ? "Leave Group" : "Delete Conversation"}
            </h2>
            <p className="text-[14px] font-medium text-[#8F95B2] mb-6">
              {conversations.find((c) => c.id === conversationToDelete)?.isGroup
                ? "Are you sure you want to leave this group? You will need an invite to rejoin."
                : "Are you sure you want to delete this conversation? This action cannot be undone."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConversationToDelete(null)}
                className="flex-1 rounded-xl bg-[#F8FAFC] py-3 text-[14px] font-bold text-[#1D2A54] transition-colors hover:bg-[#E6EAFA]"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={() => handleDeleteConversation(conversationToDelete)}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-[14px] font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-70"
              >
                {isDeleting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  conversations.find((c) => c.id === conversationToDelete)?.isGroup ? "Leave" : "Delete"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <ExploreBusinessesModal isOpen={isExploreOpen} onClose={() => setIsExploreOpen(false)} />

      {/* New Message / Business Discovery Command Palette */}
      <NewMessageModal isOpen={isNewMessageOpen} onClose={() => setIsNewMessageOpen(false)} />
    </div>
  );
}

export default function ChatsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="h-full w-full bg-[#F8FAFC]"></div>}>
      <ChatsLayoutContent>{children}</ChatsLayoutContent>
    </Suspense>
  );
}
