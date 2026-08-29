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
import { decryptMessage } from "@/utils/crypto";
import { getUserPrivateKey, getUserPublicKey } from "@/utils/keyStore";
import { getOptimizedImageUrl } from "@/utils/image";
import { motion } from "framer-motion";
import { Building2, Heart, MessageSquare, MoreVertical, Search, Trash2, UserPlus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useCallback, useEffect, useState } from "react";

interface Conversation {
  id: string;
  updatedAt: string;
  otherUserId: string | null;
  otherUserName: string;
  otherUserAvatar: string | null;
  otherUserOnline: boolean;
  context?: string;
  workspaceId?: string | null;
  unreadCount?: number;
  lastMessage: {
    id: string;
    senderId: string;
    ciphertext: string | null;
    nonce: string | null;
    /** Set when the message belongs to a B2C support ticket (plaintext; no E2EE). */
    ticketId?: string | null;
    mediaType: string | null;
    mediaUrl?: string | null;
    isDeleted?: boolean;
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
  // Per-conversation typing state: set of conversationIds where someone is typing
  const [typingConvIds, setTypingConvIds] = useState<Set<string>>(new Set());
  // Tracks the last time the user read each conversation (persisted to localStorage)
  const [lastReadMap, setLastReadMap] = useState<Record<string, string>>({});
  // Real-time unread counts per conversation (incremented on new messages, cleared on seen)
  const [realtimeUnreadCounts, setRealtimeUnreadCounts] = useState<Record<string, number>>({});
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

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

      // Fetch real conversations from backend
      const convsRes = await chatService.fetchMyConversations();
      if (convsRes?.success && Array.isArray(convsRes?.data)) {
        setConversations(convsRes.data);
      }
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
  // Re-runs when pathname changes so the sidebar picks up writes made by the child page.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("lastReadMap");
      if (raw) setLastReadMap(JSON.parse(raw));
    } catch {
      // ignore parse errors
    }
    // Clear the real-time badge for the currently active conversation
    const activeConvId = pathname.split('/chats/')[1]?.split('?')[0];
    if (activeConvId) {
      setRealtimeUnreadCounts((prev) => ({ ...prev, [activeConvId]: 0 }));
    }
    fetchData();
  }, [pathname, fetchData]);

  // Subscribe socket to all active conversation rooms so real-time updates reach the sidebar
  useEffect(() => {
    if (!socket || conversations.length === 0) return;
    conversations.forEach((conv) => {
      socket.emit("chat:join_room", { conversationId: conv.id });
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
            createdAt: payload.createdAt || new Date().toISOString(),
          },
        };
        // Move to top (WhatsApp behaviour: most recent conversation floats up)
        const [moved] = updated.splice(idx, 1);
        return [moved, ...updated];
      });
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
      }
    };

    // Also re-fetch when a message is unsent so the sidebar falls back
    const handleUnsent = () => { fetchData(); };

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
    socket.on("chat:message_unsent", handleUnsent);
    socket.on("chat:conversation_status_update", handleConversationSeen);
    socket.on("chat:typing_start", handleTypingStart);
    socket.on("chat:typing_stop", handleTypingStop);

    return () => {
      socket.off("chat:receive_message", handleNewMessage);
      socket.off("chat:message_unsent", handleUnsent);
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
      const res = await fetch(`${baseUrl}/conversations/${conversationId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        if (pathname === `${basePath}/${conversationId}`) {
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
      
      let myPrivateKey = await getUserPrivateKey(currentUserId);
      if (!myPrivateKey) return;
      let myPublicKey = await getUserPublicKey(currentUserId);

      const newPreviews = { ...decryptedPreviews };
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

        // B2C support conversations: messages are stored as plaintext.
        // Skip libsodium when ANY of these is true — listed from cheapest to check:
        //   • nonce is null/absent        → plaintext stored directly
        //   • ticketId is set             → B2C ticket message (covers most cases)
        //   • workspaceId on conversation  → B2C context indicator
        //   • context is BUSINESS         → explicit B2C conversation
        //   • otherUserId is null         → no real peer; B2C threads have no peer
        const isBizConv =
          !msg.nonce ||
          msg.ticketId ||
          conv.workspaceId ||
          !conv.otherUserId;

        if (isBizConv) {
          if (msg.ciphertext && !msg.nonce) {
            // True plaintext — store full string in newPreviews, let getLastMessagePreview handle formatting & truncation
            newPreviews[msg.id] = msg.ciphertext;
            newPreviews[conv.id] = msg.ciphertext;
            hasChanges = true;
          } else if (msg.ciphertext && msg.nonce) {
            // Old encrypted B2C message — unrecoverable, show placeholder
            newPreviews[msg.id] = "Message (legacy encrypted)";
            newPreviews[conv.id] = "Message (legacy encrypted)";
            hasChanges = true;
          }
          continue;
        }

        // Personal E2EE conversation — decrypt with libsodium.
        if (!msg.ciphertext) continue;

        try {
          const targetUserId = msg.senderId === currentUserId ? conv.otherUserId : msg.senderId;
          if (!targetUserId) continue;

          let pubKeyToUse = pubKeyCache[targetUserId];
          if (!pubKeyToUse) {
            const res = await chatService.fetchRecipientKey(targetUserId);
            if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
              // Keys are ordered asc by createdAt — last entry is the newest/active key
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
            newPreviews[msg.id] = text;
            newPreviews[conv.id] = text;
            hasChanges = true;
          }
        } catch {
          // Decryption failed — silently fall back to a placeholder.
          // This can happen when a key has been rotated. The error is
          // intentionally NOT logged to avoid flooding the console.
          newPreviews[msg.id] = "🔒 Encrypted message";
          newPreviews[conv.id] = "🔒 Encrypted message";
          hasChanges = true;
        }
      }

      if (hasChanges) {
        setDecryptedPreviews(newPreviews);
      }
    };

    decryptPreviews();
  }, [conversations, currentUserId, decryptedPreviews]);

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
    if (!msg) return "No messages yet";

    const isMe = msg.senderId === currentUserId;
    const youPrefix = isMe ? "You: " : "";

    // ── Media-type previews ──────────────────────────────────────────
    if (msg.mediaType === "image") return `${youPrefix}📷 Photo`;
    if (msg.mediaType === "video") return `${youPrefix}🎥 Video`;
    if (msg.mediaType === "audio") return `${youPrefix}🎤 Voice message`;
    if (msg.mediaType === "document") return `${youPrefix}📄 Document`;

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
    } else if (msg.ciphertext && !msg.nonce) {
      textToPreview = msg.ciphertext;
    } else {
      return "🔒 Encrypted message";
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

  const filteredConversations = conversations.filter((c) =>
    c.otherUserName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-full bg-[#F8FAFC]">
      {/* Sidebar */}
      <div
        className={cn(
          "flex h-full w-full flex-col border-r border-[#E6EAFA] bg-white md:w-[400px] shrink-0",
          !isRootChatsPage && "hidden md:flex"
        )}
      >
        {currentMode === "BUSINESS" && searchParams.get("view") === "channels" ? (
          <BusinessSidebar />
        ) : (
          <>
            {/* Header Area */}
            <div className="flex flex-col px-6 pt-8 pb-4">
              <div className="flex items-center justify-between">
                <h1 className="text-[26px] font-bold tracking-tight text-[#3B58F5]">
                  CallsChat
                </h1>
                <div className="flex items-center gap-2">
                  <Link href="/chats/favorites" className="relative flex items-center justify-center p-2 transition-colors hover:bg-slate-50 rounded-full">
                    <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                  </Link>

                  <NotificationDropdown />
                  {currentMode === "BUSINESS" && (
                    <BusinessFeaturesMenu />
                  )}
                </div>
              </div>

              {/* Search Bar */}
              <div className="mt-4 relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-full bg-[#EEF2FF] pl-10 pr-4 text-[13px] font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-transparent focus:border-blue-200 transition-all"
                />
              </div>
            </div>

            {/* Scrollable List Area */}
            <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide md:pb-6">

              {/* Active Now Section — rendered by the PresenceProvider-backed tray.
                   It self-hides when no contacts are online, so no conditional
                   wrapper is needed here. */}
              <ActiveNowTray />

              {/* Conversations List */}
              <div className="mt-6">
                <div className="px-6 mb-2 flex items-center justify-between">
                  <h2 className="text-[14px] font-bold text-[#3B58F5]">Messages</h2>
                  {currentMode !== "BUSINESS" && (
                    <button
                      onClick={() => setIsExploreOpen(true)}
                      className="text-xs font-extrabold text-[#3B58F5] hover:underline flex items-center gap-1.5 focus:outline-none"
                      title="Explore Official Businesses"
                    >
                      <Building2 className="h-3.5 w-3.5" />
                      <span>Businesses</span>
                    </button>
                  )}
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3B58F5] border-t-transparent" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center mt-4">
                    <h3 className="text-[18px] font-bold text-[#0F172A] mb-2">No conversations yet</h3>
                    <p className="text-[12px] font-medium text-slate-500 max-w-[200px] leading-relaxed mb-8">
                      You haven't started any conversations. Message your friends or create a group to start chatting.
                    </p>
                    <div className="flex flex-col gap-3 w-full max-w-[180px]">
                      <button
                        onClick={() => setIsNewMessageOpen(true)}
                        className="flex items-center justify-center gap-2 rounded-full bg-[#2563EB] py-2.5 text-[12px] font-bold text-white transition-all hover:bg-blue-700 shadow-sm"
                      >
                        <MessageSquare className="h-4 w-4" />
                        New Message
                      </button>
                      <button
                        onClick={() => router.push("/contacts")}
                        className="flex items-center justify-center gap-2 rounded-full border border-blue-200 bg-white py-2.5 text-[12px] font-bold text-[#2563EB] transition-all hover:bg-blue-50"
                      >
                        <UserPlus className="h-4 w-4" />
                        Invite Friends
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {filteredConversations.map((conv, index) => {
                      const isActive = pathname === `${basePath}/${conv.id}`;
                      const avatarUrl =
                        getOptimizedImageUrl(conv.otherUserAvatar, 52, 52) ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.otherUserName)}&background=F4F6FC&color=3B58F5`;

                      return (
                        <motion.div
                          key={conv.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04 }}
                          className="relative group"
                          onMouseLeave={() => setMenuOpenForId(null)}
                        >
                          <Link
                            href={`${basePath}/${conv.id}?recipientId=${conv.otherUserId}`}
                            className={cn(
                              "flex w-full items-center gap-4 px-6 py-3.5 transition-colors",
                              isActive ? "bg-[#EEF2FF]" : "hover:bg-[#F4F7FE]"
                            )}
                          >
                            {/* Avatar — green ring = online, plain = offline */}
                            <div className="relative shrink-0">
                              <div
                                className={cn(
                                  "rounded-full",
                                  (isUserOnline(conv.otherUserId ?? "") || conv.otherUserOnline)
                                    ? "border-[3px] border-emerald-500 p-[2px] bg-white"
                                    : ""
                                )}
                              >
                                <img
                                  src={getOptimizedImageUrl(avatarUrl)}
                                  alt={conv.otherUserName}
                                  className="h-[52px] w-[52px] rounded-full object-cover bg-[#F4F6FC]"
                                />
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex flex-1 flex-col items-start overflow-hidden">
                              <h3 className={cn(
                                "text-[15px]",
                                hasUnread(conv) && !isActive ? "font-bold text-[#1D2A54]" : "font-semibold text-[#1D2A54]"
                              )}>
                                {conv.otherUserName}
                              </h3>
                              <p className={cn(
                                "mt-0.5 w-full truncate text-left text-[13px]",
                                hasUnread(conv) && !isActive ? "font-semibold text-[#1D2A54]" : "font-medium text-[#8F95B2]"
                              )}>
                                {(() => {
                                  const preview = getLastMessagePreview(conv);
                                  const isTyping = typingConvIds.has(conv.id);
                                  return (
                                    <span
                                      className={isTyping ? "text-[#3B58F5] font-semibold italic" : ""}
                                    >
                                      {preview}
                                    </span>
                                  );
                                })()}
                              </p>
                            </div>

                            {/* Time & Unread Count */}
                            <div className="flex flex-col items-end justify-center gap-1.5 shrink-0">
                              <span className={cn(
                                "text-[11px] font-semibold",
                                hasUnread(conv) && !isActive ? "text-[#00a884]" : "text-[#8F95B2]"
                              )}>
                                {conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : formatTime(conv.updatedAt)}
                              </span>
                              {/* Show badge with actual unread count when not currently viewing */}
                              {!isActive && hasUnread(conv) ? (
                                <div className="flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#00a884] px-1.5 text-[11px] font-bold text-white shadow-sm">
                                  {(() => {
                                    const count = getUnreadCount(conv);
                                    return count > 99 ? '99+' : count > 0 ? count : '●';
                                  })()}
                                </div>
                              ) : null}
                            </div>
                          </Link>

                          {/* Context Menu Button */}
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setMenuOpenForId(menuOpenForId === conv.id ? null : conv.id);
                              }}
                              className="p-1.5 rounded-full hover:bg-black/5 text-[#8F95B2] hover:text-[#1D2A54]"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </button>

                            {/* Dropdown Menu */}
                            {menuOpenForId === conv.id && (
                              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-[#E6EAFA] py-1 z-50">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setConversationToDelete(conv.id);
                                    setMenuOpenForId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-[13px] font-semibold text-red-500 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
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
            <h2 className="text-[18px] font-bold text-[#1D2A54] mb-2">Delete Conversation</h2>
            <p className="text-[14px] font-medium text-[#8F95B2] mb-6">
              Are you sure you want to delete this conversation? This action cannot be undone.
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
                  "Delete"
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
