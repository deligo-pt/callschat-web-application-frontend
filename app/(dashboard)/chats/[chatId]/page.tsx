"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import { Send, ArrowLeft, Loader2, Lock, MoreVertical, Phone, Video } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { chatService } from "@/services/chat.service";
import { useCallContext } from "@/components/providers/CallContext";
import { ChatOptionsMenu } from "@/components/chat/ChatOptionsMenu";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

interface UserProfile {
  id: string;
  name: string;
  avatarUrl: string;
  isOnline: boolean;
}

export default function ChatRoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { initiateCall } = useCallContext();

  // The route param is now the CONVERSATION ID
  const conversationId = params.chatId as string;
  // The recipient user ID is passed as a query param
  const recipientIdFromQuery = searchParams.get("recipientId") || "";

  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [recipientId, setRecipientId] = useState<string>(recipientIdFromQuery);
  const [isInitializing, setIsInitializing] = useState(true);
  const [recipient, setRecipient] = useState<UserProfile | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!conversationId) return;

    const init = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (token) {
          const decoded = parseJwt(token);
          if (decoded) {
            setCurrentUserId(decoded.sub || decoded.id || "");
          }
        }

        // If we don't have a recipientId from query params, try to get it
        // from the conversation list
        let finalRecipientId = recipientIdFromQuery;

        if (!finalRecipientId) {
          try {
            const convsRes = await chatService.fetchMyConversations();
            if (convsRes?.success && Array.isArray(convsRes?.data)) {
              const conv = convsRes.data.find((c: any) => c.id === conversationId);
              if (conv?.otherUserId) {
                finalRecipientId = conv.otherUserId;
                setRecipientId(finalRecipientId);

                // Set recipient profile from conv data
                setRecipient({
                  id: conv.otherUserId,
                  name: conv.otherUserName || "Unknown",
                  avatarUrl:
                    conv.otherUserAvatar ||
                    `https://ui-avatars.com/api/?name=U&background=F4F6FC&color=3B58F5`,
                  isOnline: conv.otherUserOnline || false,
                });
                setIsInitializing(false);
                return;
              }
            }
          } catch {
            // fall through to contacts fetch
          }
        }

        if (finalRecipientId) {
          setRecipientId(finalRecipientId);

          // Fetch recipient's profile from contacts
          const baseUrl =
            process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1";
          const token = localStorage.getItem("accessToken");
          const contactsRes = await fetch(`${baseUrl}/contacts`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const contactsData = await contactsRes.json();

          const usersArray =
            contactsData.data?.contacts ||
            (Array.isArray(contactsData.data) ? contactsData.data : []) ||
            (Array.isArray(contactsData) ? contactsData : []);

          const match = usersArray.find(
            (u: any) =>
              (u.addressee?.id || u.contact?.id || u.id) === finalRecipientId
          );

          if (match) {
            const userProfile =
              match.addressee?.profile ||
              match.contact?.profile ||
              match.profile ||
              {};
            const displayName =
              match.customName ||
              userProfile.displayName ||
              userProfile.username ||
              "Unknown";

            setRecipient({
              id: finalRecipientId,
              name: displayName,
              avatarUrl:
                userProfile.avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=F4F6FC&color=3B58F5`,
              isOnline: userProfile.isOnline || false,
            });
          } else {
            setRecipient({
              id: finalRecipientId,
              name: "Unknown User",
              avatarUrl: `https://ui-avatars.com/api/?name=U&background=F4F6FC&color=3B58F5`,
              isOnline: false,
            });
          }
        }
      } catch (err) {
        console.error("Failed to initialize chat room", err);
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, [conversationId, recipientIdFromQuery]);

  const { messages, sendMessage, isReady, isUploading } = useChat(conversationId, currentUserId, recipientId);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (text: string, file: File | null) => {
    if (!currentUserId) return;
    sendMessage(text, currentUserId, file);
  };

  if (!conversationId) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="h-8 w-8 animate-spin text-[#3B58F5]" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#254BCC] px-4 py-3 shadow-md z-20 shrink-0 text-white">
        <div className="flex items-center gap-3">
          <Link
            href="/chats"
            className="md:hidden rounded-full p-2 transition-colors hover:bg-white/10"
          >
            <ArrowLeft className="h-6 w-6 text-white" strokeWidth={2.5} />
          </Link>
          <div className="flex items-center gap-3">
            <div className={cn("relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E6EAFA]", recipient?.isOnline && "border-[2.5px] border-[#22C55E] p-[2px]")}>
              {recipient?.avatarUrl ? (
                <img
                  src={recipient.avatarUrl}
                  alt={recipient.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="text-[#8F95B2] font-bold">
                  {recipient?.name?.charAt(0) || "U"}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <h2 className="text-[17px] font-bold text-white tracking-tight">
                {recipient?.name || "Loading..."}
              </h2>
              <span className="flex items-center gap-1 text-[13px] font-medium text-white/80">
                {isInitializing ? (
                  "Connecting..."
                ) : isReady ? (
                  "Online"
                ) : (
                  "Establishing secure connection..."
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => recipientId && initiateCall(recipientId, 'VIDEO', recipient?.name, recipient?.avatarUrl)}
            disabled={!recipientId}
            className="flex h-11 w-11 items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <Video className="h-5 w-5" strokeWidth={2} />
          </button>
          <button 
            onClick={() => recipientId && initiateCall(recipientId, 'AUDIO', recipient?.name, recipient?.avatarUrl)}
            disabled={!recipientId}
            className="flex h-11 w-11 items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <Phone className="h-5 w-5" strokeWidth={2} />
          </button>
          {recipientId && (
            <ChatOptionsMenu conversationId={conversationId} peerId={recipientId} />
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-[#F0F2F5] relative">
        {/* Chat Background Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              'url("https://www.transparenttextures.com/patterns/cubes.png")',
          }}
        />

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full z-10 text-[#8F95B2]">
            {isReady ? (
              <div className="bg-[#FFF8C6] text-[#665D1E] text-xs px-4 py-2 rounded-lg text-center shadow-sm max-w-sm">
                <Lock className="inline-block h-3 w-3 mr-1 mb-0.5" />
                Messages are end-to-end encrypted. No one outside of this chat,
                not even CallsChat, can read or listen to them.
              </div>
            ) : (
              <Loader2 className="h-8 w-8 animate-spin text-[#3B58F5]" />
            )}
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === currentUserId;
            const showTail = index === 0 || messages[index - 1].senderId !== msg.senderId;

            return (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isMe={isMe}
                showTail={showTail}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <ChatInput onSend={handleSend} isReady={isReady} isUploading={isUploading} />
    </div>
  );
}
