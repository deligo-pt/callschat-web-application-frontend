"use client";

import React, { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Bell, MessageSquare, Search, Star, Lock } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { chatService } from "@/services/chat.service";
import { motion } from "framer-motion";

interface Conversation {
  id: string;
  updatedAt: string;
  otherUserId: string | null;
  otherUserName: string;
  otherUserAvatar: string | null;
  otherUserOnline: boolean;
  lastMessage: {
    id: string;
    senderId: string;
    ciphertext: string | null;
    nonce: string | null;
    mediaType: string | null;
    createdAt: string;
  } | null;
}

interface ActiveUser {
  id: string;
  name: string;
  avatarUrl: string;
  isOnline: boolean;
  conversationId?: string;
}

export default function ChatsLayout({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const pathname = usePathname();
  const router = useRouter();

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

      // Also fetch contacts for the "Active Now" section
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1";
      const contactsRes = await fetch(`${baseUrl}/contacts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const contactsData = await contactsRes.json();
      let usersArray: any[] = [];
      if (contactsData.success && Array.isArray(contactsData.data)) {
        usersArray = contactsData.data;
      } else if (Array.isArray(contactsData)) {
        usersArray = contactsData;
      } else if (contactsData.data && Array.isArray(contactsData.data.contacts)) {
        usersArray = contactsData.data.contacts;
      }

      if (usersArray.length > 0) {
        const mappedUsers = usersArray.map((u: any) => {
          const userProfile = u.addressee?.profile || u.contact?.profile || u.profile || {};
          const userId = u.addressee?.id || u.contact?.id || u.id;
          const displayName = u.customName || userProfile.displayName || userProfile.username || "Unknown";
          return {
            id: userId,
            name: displayName,
            avatarUrl: userProfile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=F4F6FC&color=3B58F5`,
            isOnline: userProfile.isOnline || false,
          };
        });
        setActiveUsers(mappedUsers);
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

  // When a user clicks on a contact in Active Now, initiate/get conversation and navigate
  const handleContactClick = async (userId: string) => {
    try {
      const res = await chatService.initiateConversation(userId);
      const convId = res?.data?.conversationId || res?.conversationId;
      if (convId) {
        // Navigate using the conversationId as the chatId
        router.push(`/chats/${convId}?recipientId=${userId}`);
        // Refresh conversations list
        fetchData();
      }
    } catch (err) {
      console.error("Failed to initiate conversation", err);
    }
  };

  const notificationsCount = 0;

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
              <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#E6EAFA] bg-[#F4F6FC] transition-colors hover:bg-[#E6EAFA]">
                <Star className="h-5 w-5 text-[#3B58F5]" strokeWidth={2.5} />
                <div className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#FFA500]" />
              </button>

              <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#E6EAFA] bg-[#F4F6FC] transition-colors hover:bg-[#E6EAFA]">
                <Bell className="h-5 w-5 text-[#3B58F5]" strokeWidth={2.5} />
                {notificationsCount > 0 && (
                  <div className="absolute right-2 top-2 h-2 w-2 rounded-full border border-white bg-red-500" />
                )}
              </button>
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

          {/* Active Now Section */}
          {activeUsers.length > 0 && (
            <div className="mt-2 px-6">
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-bold text-[#1D2A54]">Active Now</h2>
              </div>

              <div className="mt-4 flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {isLoading ? (
                  <div className="flex w-full items-center justify-center py-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3B58F5] border-t-transparent" />
                  </div>
                ) : (
                  activeUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleContactClick(user.id)}
                      className="relative flex shrink-0 flex-col items-center"
                    >
                      <div
                        className={cn(
                          "relative rounded-full border-[2.5px] p-0.5 transition-transform hover:scale-105 cursor-pointer",
                          user.isOnline ? "border-[#22C55E]" : "border-[#E6EAFA]"
                        )}
                      >
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="h-[52px] w-[52px] rounded-full object-cover bg-white"
                        />
                      </div>
                      <span className="mt-1.5 text-[11px] font-medium text-[#8F95B2]">
                        {user.name.split(" ")[0]}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Conversations List */}
          <div className="mt-6">
            <div className="px-6 mb-2">
              <h2 className="text-[14px] font-bold text-[#1D2A54]">Recent</h2>
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
                    >
                      <Link
                        href={`/chats/${conv.id}?recipientId=${conv.otherUserId}`}
                        className={cn(
                          "group relative flex w-full items-center gap-4 px-6 py-3.5 transition-colors",
                          isActive ? "bg-[#EEF2FF]" : "hover:bg-[#F4F7FE]"
                        )}
                      >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <img
                            src={avatarUrl}
                            alt={conv.otherUserName}
                            className="h-[54px] w-[54px] rounded-full object-cover bg-[#F4F6FC]"
                          />
                          {conv.otherUserOnline && (
                            <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#22C55E]" />
                          )}
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

                        {/* Time */}
                        <div className="flex flex-col items-end justify-center gap-1.5 shrink-0">
                          <span className="text-[11px] font-semibold text-[#8F95B2]">
                            {conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : formatTime(conv.updatedAt)}
                          </span>
                        </div>
                      </Link>
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
    </div>
  );
}
