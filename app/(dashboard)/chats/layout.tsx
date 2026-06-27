"use client";

import React, { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Bell, MessageSquare, Search, Star, Lock, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { chatService } from "@/services/chat.service";
import { motion } from "framer-motion";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { decryptMessage } from "@/utils/crypto";
import { ActiveNowTray } from "@/components/chat/ActiveNowTray";
import { usePresence } from "@/context/PresenceContext";

interface Conversation {
  id: string;
  updatedAt: string;
  otherUserId: string | null;
  otherUserName: string;
  otherUserAvatar: string | null;
  otherUserOnline: boolean;
  unreadCount?: number;
  lastMessage: {
    id: string;
    senderId: string;
    ciphertext: string | null;
    nonce: string | null;
    mediaType: string | null;
    createdAt: string;
  } | null;
}

export default function ChatsLayout({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [menuOpenForId, setMenuOpenForId] = useState<string | null>(null);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [decryptedPreviews, setDecryptedPreviews] = useState<Record<string, string>>({});
  // Tracks the last time the user read each conversation (persisted to localStorage)
  const [lastReadMap, setLastReadMap] = useState<Record<string, string>>({});
  const pathname = usePathname();
  const router = useRouter();

  // Real-time presence — comes from the global PresenceProvider.
  const { isUserOnline } = usePresence();

  const isRootChatsPage = pathname === "/chats";

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
  }, [fetchData]);

  // Load the last-read timestamps from localStorage so unread badges survive page refreshes.
  // Re-runs when pathname changes so the sidebar picks up writes made by the child page.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("lastReadMap");
      if (raw) setLastReadMap(JSON.parse(raw));
    } catch {
      // ignore parse errors
    }
  }, [pathname]);

  /**
   * Returns true when the conversation has an unread last message.
   * A message is considered unread when:
   *   - its senderId is NOT the current user (we never count our own messages), AND
   *   - its createdAt is AFTER the lastRead timestamp stored in localStorage (or no
   *     lastRead record exists at all, meaning the conversation has never been opened).
   */
  const hasUnread = useCallback((conv: Conversation): boolean => {
    if (!conv.lastMessage) return false;
    if (conv.lastMessage.senderId === currentUserId) return false;
    const lastReadAt = lastReadMap[conv.id];
    if (!lastReadAt) return true; // never opened → treat as unread
    return new Date(conv.lastMessage.createdAt) > new Date(lastReadAt);
  }, [currentUserId, lastReadMap]);




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
        if (pathname === `/chats/${conversationId}`) {
          router.push('/chats');
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
      
      const privKeyName = `privateKey_${currentUserId}`;
      let myPrivateKey = localStorage.getItem(privKeyName);
      if (!myPrivateKey) {
        myPrivateKey = localStorage.getItem("privateKey"); // fallback
      }
      if (!myPrivateKey) return;

      const newPreviews = { ...decryptedPreviews };
      let hasChanges = false;
      const pubKeyCache: Record<string, string> = {};

      for (const conv of conversations) {
        const msg = conv.lastMessage;
        if (!msg || !msg.ciphertext || !msg.nonce) continue;
        if (newPreviews[conv.id]) continue; // Already decrypted
        if (msg.mediaType) continue; // Media handled differently

        try {
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
            const text = await decryptMessage(msg.ciphertext, msg.nonce, pubKeyToUse, myPrivateKey);
            newPreviews[conv.id] = text;
            hasChanges = true;
          }
        } catch (err) {
          console.error(`Failed to decrypt preview for conv ${conv.id}`, err);
          newPreviews[conv.id] = "🔒 Decryption Failed";
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
    const msg = conv.lastMessage;
    if (!msg) return "No messages yet";
    if (msg.mediaType === "image") return "📷 Photo";
    if (msg.mediaType === "video") return "🎥 Video";
    if (msg.mediaType === "audio") return "🎤 Voice message";
    if (msg.mediaType === "document") return "📄 Document";
    
    if (decryptedPreviews[conv.id]) {
      return decryptedPreviews[conv.id];
    }
    
    return "🔒 Encrypted message";
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
        {/* Header Area */}
        <div className="flex flex-col px-6 pt-8 pb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-[28px] font-extrabold tracking-tight text-[#11142D]">
              Chats
            </h1>
            <div className="flex items-center gap-3">
              <Link href="/chats/favorites" className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#E6EAFA] bg-[#F4F6FC] transition-colors hover:bg-[#E6EAFA]">
                <Star className="h-5 w-5 text-[#3B58F5]" strokeWidth={2.5} />
                <div className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#FFA500]" />
              </Link>

              <NotificationDropdown />
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-6 relative">
            <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8F95B2]" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-[48px] w-full rounded-2xl bg-[#F4F6FC] pl-11 pr-4 text-[14px] font-medium text-[#11142D] placeholder-[#8F95B2] focus:outline-none focus:ring-1 focus:ring-[#3B58F5]/50"
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
            <div className="px-6 mb-2">
              <h2 className="text-[14px] font-bold text-[#3B58F5]">Message</h2>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3B58F5] border-t-transparent" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                <MessageSquare className="h-10 w-10 text-[#E6EAFA] mb-3" />
                <p className="text-[13px] font-medium text-[#8F95B2]">
                  No conversations yet. Tap an active contact above to start chatting securely.
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {filteredConversations.map((conv, index) => {
                  const isActive = pathname === `/chats/${conv.id}`;
                  const avatarUrl =
                    conv.otherUserAvatar ||
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
                        href={`/chats/${conv.id}?recipientId=${conv.otherUserId}`}
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
                              src={avatarUrl}
                              alt={conv.otherUserName}
                              className="h-[52px] w-[52px] rounded-full object-cover bg-[#F4F6FC]"
                            />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex flex-1 flex-col items-start overflow-hidden">
                          <h3 className="text-[15px] font-bold text-[#1D2A54]">
                            {conv.otherUserName}
                          </h3>
                          <p className="mt-0.5 w-full truncate text-left text-[13px] font-medium text-[#8F95B2] flex items-center gap-1">
                            <Lock className="h-3 w-3 shrink-0 text-[#8F95B2]" />
                            {getLastMessagePreview(conv)}
                          </p>
                        </div>

                        {/* Time & Unread Count */}
                        <div className="flex flex-col items-end justify-center gap-1.5 shrink-0">
                          <span className="text-[11px] font-semibold text-[#8F95B2]">
                            {conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : formatTime(conv.updatedAt)}
                          </span>
                          {/* Show badge only when not currently viewing this conversation */}
                          {!isActive && hasUnread(conv) ? (
                            <div className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#3B58F5] px-1 text-[10px] font-bold text-white shadow-sm">
                              {conv.unreadCount && conv.unreadCount > 0 ? conv.unreadCount : "●"}
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
    </div>
  );
}
