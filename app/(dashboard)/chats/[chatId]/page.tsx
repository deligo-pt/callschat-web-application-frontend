"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import { Send, ArrowLeft, Loader2, Lock, MoreVertical, Phone, Video } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { chatService } from "@/services/chat.service";
import { useCallContext } from "@/components/providers/CallContext";

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
  const [inputText, setInputText] = useState("");
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

  const { messages, sendMessage, isReady } = useChat(conversationId, currentUserId, recipientId);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUserId) return;

    sendMessage(inputText, currentUserId);
    setInputText("");
  };

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
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
      <div className="flex items-center justify-between bg-white px-6 py-4 border-b border-[#E6EAFA] shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/chats"
            className="md:hidden rounded-full p-1.5 transition-colors hover:bg-[#F4F6FC]"
          >
            <ArrowLeft className="h-5 w-5 text-[#8F95B2]" strokeWidth={2.5} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E6EAFA]">
              {recipient?.avatarUrl ? (
                <img
                  src={recipient.avatarUrl}
                  alt={recipient.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="text-[#8F95B2] font-bold">
                  {recipient?.name?.charAt(0) || "U"}
                </div>
              )}
              {recipient?.isOnline && (
                <div className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#22C55E]" />
              )}
            </div>
            <div className="flex flex-col">
              <h2 className="text-[15px] font-bold text-[#1D2A54]">
                {recipient?.name || "Loading..."}
              </h2>
              <span className="flex items-center gap-1 text-[12px] font-medium text-[#8F95B2]">
                {isInitializing ? (
                  "Connecting..."
                ) : isReady ? (
                  <>
                    <Lock className="h-3 w-3 text-[#22C55E]" /> E2E Encrypted
                  </>
                ) : (
                  "Establishing secure connection..."
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => recipientId && initiateCall(recipientId, 'AUDIO')}
            disabled={!recipientId}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#8F95B2] hover:bg-[#F4F6FC] transition-colors disabled:opacity-50"
          >
            <Phone className="h-5 w-5" strokeWidth={2} />
          </button>
          <button 
            onClick={() => recipientId && initiateCall(recipientId, 'VIDEO')}
            disabled={!recipientId}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#8F95B2] hover:bg-[#F4F6FC] transition-colors disabled:opacity-50"
          >
            <Video className="h-5 w-5" strokeWidth={2} />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full text-[#8F95B2] hover:bg-[#F4F6FC] transition-colors">
            <MoreVertical className="h-5 w-5" strokeWidth={2} />
          </button>
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
            const showTail =
              index === 0 || messages[index - 1].senderId !== msg.senderId;

            return (
              <div
                key={msg.id}
                className={cn("flex w-full z-10", isMe ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "relative max-w-[75%] px-3.5 py-2 text-[14.5px] shadow-sm flex flex-col group",
                    isMe ? "bg-[#DCF8C6] text-[#111B21]" : "bg-white text-[#111B21]",
                    isMe ? "rounded-l-xl rounded-br-xl" : "rounded-r-xl rounded-bl-xl",
                    showTail && isMe ? "rounded-tr-none" : "",
                    showTail && !isMe ? "rounded-tl-none" : ""
                  )}
                >
                  {/* Message Tail SVG */}
                  {showTail && isMe && (
                    <svg
                      viewBox="0 0 8 13"
                      width="8"
                      height="13"
                      className="absolute top-0 -right-[8px] text-[#DCF8C6]"
                    >
                      <path
                        opacity="1"
                        fill="currentColor"
                        d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"
                      />
                    </svg>
                  )}
                  {showTail && !isMe && (
                    <svg
                      viewBox="0 0 8 13"
                      width="8"
                      height="13"
                      className="absolute top-0 -left-[8px] text-white"
                    >
                      <path
                        opacity="1"
                        fill="currentColor"
                        d="M1.533 3.568 8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z"
                      />
                    </svg>
                  )}

                  <span
                    className="leading-snug pr-10 whitespace-pre-wrap"
                    style={{ wordBreak: "break-word" }}
                  >
                    {msg.text}
                  </span>

                  <div className="absolute bottom-1 right-2 flex items-center gap-1">
                    <span className="text-[10px] text-gray-500">
                      {formatTime(msg.createdAt)}
                    </span>
                    {isMe && (
                      <svg
                        viewBox="0 0 16 15"
                        width="16"
                        height="15"
                        className="text-[#53bdeb]"
                      >
                        <path
                          fill="currentColor"
                          d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.199c.143.13.36.125.498-.011l5.3-6.974a.418.418 0 0 0-.106-.54z"
                        />
                        <path
                          fill="currentColor"
                          d="M11.51 3.316l-.478-.372a.365.365 0 0 0-.51.063L5.166 9.879a.32.32 0 0 1-.484.033L2.01 7.489a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l3.052 2.776c.143.13.36.125.498-.011l5.3-6.974a.418.418 0 0 0-.106-.54z"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="bg-[#F0F2F5] px-4 py-3 shrink-0">
        <form onSubmit={handleSend} className="flex items-end gap-3">
          <div className="flex-1 bg-white rounded-xl flex items-center px-4 py-2 shadow-sm min-h-[44px]">
            <textarea
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              disabled={!isReady}
              placeholder={isReady ? "Type a message" : "Setting up encryption..."}
              className="flex-1 bg-transparent text-[15px] text-[#111B21] placeholder-[#8F95B2] focus:outline-none resize-none overflow-y-auto min-h-[24px] py-1"
              rows={1}
              style={{ maxHeight: "120px" }}
            />
          </div>
          <button
            type="submit"
            disabled={!isReady || !inputText.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00A884] text-white transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-sm"
          >
            <Send className="h-5 w-5 ml-1" strokeWidth={2} />
          </button>
        </form>
      </div>
    </div>
  );
}
