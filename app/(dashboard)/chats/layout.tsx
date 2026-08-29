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
import { Building2, Heart, MessageSquare, MoreVertical, Search, Trash2, UserPlus, Check, CheckCheck, Clock, MessageSquarePlus, X, Filter, Sparkles } from "lucide-react";
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

  const [chatFilter, setChatFilter] = useState<"all" | "unread" | "business">("all");

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch = c.otherUserName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (chatFilter === "unread") return hasUnread(c);
    if (chatFilter === "business") return c.workspaceId || c.context === "BUSINESS" || !c.otherUserId;
    return true;
  });

  const getPreviewStatusIcon = (conv: Conversation) => {
    if (!conv.lastMessage || conv.lastMessage.senderId !== currentUserId) return null;
    // Real checkmarks icon for outgoing message preview
    return <CheckCheck className="h-3.5 w-3.5 shrink-0 text-[#8696A0] inline-block mr-1" />;
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
        {currentMode === "BUSINESS" && searchParams.get("view") === "channels" ? (
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
                      {searchQuery ? "No conversations found" : chatFilter === "unread" ? "No unread messages" : "No conversations yet"}
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
                      const isActive = pathname === `${basePath}/${conv.id}`;
                      const avatarUrl =
                        getOptimizedImageUrl(conv.otherUserAvatar, 48, 48) ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.otherUserName)}&background=E0F2FE&color=0284C7&bold=true`;

                      const isOnline = isUserOnline(conv.otherUserId ?? "") || conv.otherUserOnline;
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
                            href={`${basePath}/${conv.id}?recipientId=${conv.otherUserId}`}
                            className={cn(
                              "flex w-full items-center gap-3.5 px-4 py-3 transition-colors relative",
                              isActive
                                ? "bg-[#F0F2F5] dark:bg-[#202C33] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r-full before:bg-[#00A884]"
                                : "hover:bg-[#F8FAFC] dark:hover:bg-[#182229]/60"
                            )}
                          >
                            {/* Avatar with subtle online dot pip */}
                            <div className="relative shrink-0">
                              <div className="h-12 w-12 rounded-full overflow-hidden bg-[#F0F2F5] dark:bg-[#202C33] shadow-xs">
                                <img
                                  src={getOptimizedImageUrl(avatarUrl)}
                                  alt={conv.otherUserName}
                                  className="h-full w-full object-cover"
                                />
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
                                <h3 className={cn(
                                  "text-[15px] truncate leading-snug",
                                  hasUnread(conv) && !isActive
                                    ? "font-bold text-[#111B21] dark:text-[#E9EDEF]"
                                    : "font-semibold text-[#111B21] dark:text-[#E9EDEF]"
                                )}>
                                  {conv.otherUserName}
                                </h3>
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
                                  Delete chat
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
