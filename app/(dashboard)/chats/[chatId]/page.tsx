"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import {
  Send,
  ArrowLeft,
  Loader2,
  Lock,
  MoreVertical,
  Phone,
  Video,
  Building2,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { chatService } from "@/services/chat.service";
import { CustomerService } from "@/services/customer-support.service";
import { useCallContext } from "@/components/providers/CallContext";
import { ChatOptionsMenu } from "@/components/chat/ChatOptionsMenu";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { MediaGallery } from "@/components/chat/MediaGallery";
import { Images } from "lucide-react";
import { usePresence } from "@/context/PresenceContext";
import { toast } from "sonner";

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

// ---------------------------------------------------------------------------
// Business Header
// Shown when the chat is a B2C support thread (bizHandle param present).
// ---------------------------------------------------------------------------
function BusinessChatHeader({
  bizName,
  bizHandle,
  bizVerified,
  onBack,
}: {
  bizName: string;
  bizHandle: string;
  bizVerified: boolean;
  onBack: () => void;
}) {
  return (
    <div className="flex items-center justify-between bg-gradient-to-r from-[#1D2A8A] via-[#254BCC] to-[#3B58F5] px-4 py-3 shadow-md z-20 shrink-0 text-white">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="md:hidden rounded-full p-2 transition-colors hover:bg-white/10"
        >
          <ArrowLeft className="h-6 w-6 text-white" strokeWidth={2.5} />
        </button>

        {/* Business Avatar */}
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 border border-white/30">
          <Building2 className="h-5 w-5 text-white" strokeWidth={2} />
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <h2 className="text-[17px] font-bold text-white tracking-tight">{bizName}</h2>
            {bizVerified && (
              <span
                title="Verified Business"
                className="flex items-center gap-0.5 bg-white/20 border border-white/30 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold text-white"
              >
                <ShieldCheck className="h-2.5 w-2.5 fill-white/80" />
                Verified
              </span>
            )}
          </div>
          <span className="text-[12px] font-semibold text-white/70">
            @{bizHandle} · Support Chat
          </span>
        </div>
      </div>

      {/* Right side – no calls for business chats */}
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1.5">
          <Lock className="h-3 w-3 text-white/80" />
          <span className="text-[11px] font-semibold text-white/80">Secure</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat Room Page
// ---------------------------------------------------------------------------

export default function ChatRoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { initiateCall } = useCallContext();
  const { isUserOnline } = usePresence();

  // The route param is the CONVERSATION ID
  const conversationId = params.chatId as string;
  // Recipient user ID passed as a query param (for personal DMs)
  const recipientIdFromQuery = searchParams.get("recipientId") || "";

  // ── B2C Bridge params ──────────────────────────────────────────────────────
  // When a user clicks a business in NewMessageModal, these params are set.
  const bizHandle = searchParams.get("bizHandle") || "";
  const bizName = searchParams.get("bizName") || "";
  const bizVerified = searchParams.get("bizVerified") === "true";
  const isBizChat = !!bizHandle;

  // ── State ──────────────────────────────────────────────────────────────────
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [recipientId, setRecipientId] = useState<string>(recipientIdFromQuery);
  const [isInitializing, setIsInitializing] = useState(true);
  const [recipient, setRecipient] = useState<UserProfile | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);

  // B2C: track whether the first real message has been sent via the support API.
  // Once true, subsequent sends use the normal WebSocket path.
  const [bizTicketCreated, setBizTicketCreated] = useState(false);
  const [isSendingFirstBizMessage, setIsSendingFirstBizMessage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ── Initialization ─────────────────────────────────────────────────────────
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

        // B2C threads: no need to resolve recipient — the header handles display.
        if (isBizChat) {
          setIsInitializing(false);
          return;
        }

        let finalRecipientId = recipientIdFromQuery;

        if (!finalRecipientId) {
          try {
            const convsRes = await chatService.fetchMyConversations();
            if (convsRes?.success && Array.isArray(convsRes?.data)) {
              const conv = convsRes.data.find((c: any) => c.id === conversationId);
              if (conv?.otherUserId) {
                finalRecipientId = conv.otherUserId;
                setRecipientId(finalRecipientId);
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
            // fall through
          }
        }

        if (finalRecipientId) {
          setRecipientId(finalRecipientId);

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
  }, [conversationId, recipientIdFromQuery, isBizChat]);

  const { messages, sendMessage, clearMessages, isReady, isUploading } = useChat(
    conversationId,
    currentUserId,
    recipientId
  );

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark conversation as read
  useEffect(() => {
    if (!conversationId) return;
    const now = new Date().toISOString();
    try {
      const raw = localStorage.getItem("lastReadMap");
      const map: Record<string, string> = raw ? JSON.parse(raw) : {};
      map[conversationId] = now;
      localStorage.setItem("lastReadMap", JSON.stringify(map));
    } catch {
      // ignore
    }
    void chatService.markConversationAsRead(conversationId);
  }, [conversationId]);

  // ── Send Handler ──────────────────────────────────────────────────────────
  /**
   * For B2C chats the first message goes through CustomerService.contactBusiness
   * (which handles the Ticket lifecycle). Subsequent messages use the normal
   * WebSocket path because the conversation already exists in the DB.
   */
  const handleSend = async (text: string, file: File | null) => {
    if (!currentUserId) return;

    if (isBizChat && !bizTicketCreated && text.trim()) {
      setIsSendingFirstBizMessage(true);
      try {
        const res = await CustomerService.contactBusiness(bizHandle, text.trim());
        if (res.success) {
          setBizTicketCreated(true);
          // The conversationId in the URL is already the right one from
          // when the modal opened, so the WebSocket room is already joined.
        } else {
          toast.error("Failed to send message to business.");
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.error?.message || "Failed to send message.");
      } finally {
        setIsSendingFirstBizMessage(false);
      }
      return;
    }

    // Normal path (personal DM OR subsequent B2C messages)
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
      {/* ── Header ──────────────────────────────────────────────────────── */}
      {isBizChat ? (
        <BusinessChatHeader
          bizName={bizName || bizHandle}
          bizHandle={bizHandle}
          bizVerified={bizVerified}
          onBack={() => router.push("/chats")}
        />
      ) : (
        <div className="flex items-center justify-between bg-[#254BCC] px-4 py-3 shadow-md z-20 shrink-0 text-white">
          <div className="flex items-center gap-3">
            <Link
              href="/chats"
              className="md:hidden rounded-full p-2 transition-colors hover:bg-white/10"
            >
              <ArrowLeft className="h-6 w-6 text-white" strokeWidth={2.5} />
            </Link>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E6EAFA]",
                  (isUserOnline(recipientId) || recipient?.isOnline)
                    ? "border-[2.5px] border-emerald-400 p-[2px]"
                    : ""
                )}
              >
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
                {(isUserOnline(recipientId) || recipient?.isOnline) && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#254BCC] bg-emerald-400"
                  />
                )}
              </div>
              <div className="flex flex-col">
                <h2 className="text-[17px] font-bold text-white tracking-tight">
                  {recipient?.name || "Loading..."}
                </h2>
                {isInitializing ? (
                  <span className="text-[12px] font-medium text-white/70">Connecting...</span>
                ) : isUserOnline(recipientId) || recipient?.isOnline ? (
                  <span className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active now
                  </span>
                ) : (
                  <span className="text-[12px] font-medium text-white/50">Offline</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => recipientId && initiateCall(recipientId, "VIDEO", recipient?.name, recipient?.avatarUrl)}
              disabled={!recipientId}
              className="flex h-11 w-11 items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <Video className="h-5 w-5" strokeWidth={2} />
            </button>
            <button
              onClick={() => recipientId && initiateCall(recipientId, "AUDIO", recipient?.name, recipient?.avatarUrl)}
              disabled={!recipientId}
              className="flex h-11 w-11 items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <Phone className="h-5 w-5" strokeWidth={2} />
            </button>
            {recipientId && (
              <ChatOptionsMenu
                conversationId={conversationId}
                peerId={recipientId}
                onMediaInfoClick={() => setGalleryOpen(true)}
                onClearSuccess={clearMessages}
              />
            )}
          </div>
        </div>
      )}

      {/* ── B2C Welcome Banner ────────────────────────────────────────────── */}
      {isBizChat && !bizTicketCreated && messages.length === 0 && (
        <div className="shrink-0 border-b border-[#E6EAFA] bg-gradient-to-r from-[#EEF2FF] to-[#F0F9FF] px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3B58F5]/10 border border-[#3B58F5]/20">
              <Building2 className="h-5 w-5 text-[#3B58F5]" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#1D2A54]">
                You're chatting with {bizName || bizHandle}
              </p>
              <p className="text-[12px] text-[#6B7A99] mt-0.5">
                Send your first message to open a support ticket. A team member will reply soon.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Messages ─────────────────────────────────────────────────────── */}
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
            {isReady || isBizChat ? (
              <div className="bg-[#FFF8C6] text-[#665D1E] text-xs px-4 py-2 rounded-lg text-center shadow-sm max-w-sm">
                <Lock className="inline-block h-3 w-3 mr-1 mb-0.5" />
                {isBizChat
                  ? "Your messages to this business are private and secure."
                  : "Messages are end-to-end encrypted. No one outside of this chat, not even CallsChat, can read or listen to them."}
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
                peerId={recipientId}
                peerName={isBizChat ? bizName : recipient?.name}
                peerAvatar={isBizChat ? undefined : recipient?.avatarUrl}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ────────────────────────────────────────────────────────── */}
      <ChatInput
        onSend={handleSend}
        isReady={isBizChat ? true : isReady}
        isUploading={isUploading || isSendingFirstBizMessage}
      />

      {/* ── Media Gallery ─────────────────────────────────────────────────── */}
      {!isBizChat && (
        <MediaGallery
          conversationId={conversationId}
          open={galleryOpen}
          onOpenChange={setGalleryOpen}
        />
      )}
    </div>
  );
}
