"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import { useChat, QuotedMessage } from "@/hooks/useChat";
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
  Pin,
  PinOff,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { chatService } from "@/services/chat.service";
import { CustomerService } from "@/services/customer-support.service";
import { ContactService } from "@/services/contact.service";
import { useCallContext } from "@/components/providers/CallContext";
import { ChatOptionsMenu } from "@/components/chat/ChatOptionsMenu";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { MediaGallery } from "@/components/chat/MediaGallery";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { ContactProfileModal } from "@/components/chat/ContactProfileModal";
import { Images } from "lucide-react";
import { usePresence } from "@/context/PresenceContext";
import { toast } from "sonner";
import { useSocket } from "@/components/providers/SocketProvider";
import { isMessageExpired } from "@/components/chat/DisappearingMessagesModal";
import { getOptimizedImageUrl } from "@/utils/image";

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
        .join(""),
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
  phone?: string;
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
  recipientId,
  recipient,
  initiateCall,
  blockStatus,
}: {
  bizName: string;
  bizHandle: string;
  bizVerified: boolean;
  onBack: () => void;
  recipientId?: string;
  recipient?: UserProfile | null;
  initiateCall?: any;
  blockStatus?: any;
}) {
  return (
    <div className="flex items-center justify-between bg-white/95 dark:bg-[#202C33]/95 backdrop-blur-md px-4 py-2.5 border-b border-[#E2E8F0] dark:border-[#222D34] shadow-xs z-20 shrink-0 text-[#111B21] dark:text-[#E9EDEF]">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="md:hidden rounded-full p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10 text-[#54656F] dark:text-[#8696A0]"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} />
        </button>

        {/* Business Avatar */}
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00A884]/15 dark:bg-[#00A884]/20 border border-[#00A884]/20">
          <Building2 className="h-5 w-5 text-[#00A884]" strokeWidth={2} />
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <h2 className="text-[16px] font-semibold text-[#111B21] dark:text-[#E9EDEF] tracking-tight">
              {bizName}
            </h2>
            {bizVerified && (
              <span
                title="Verified Business"
                className="flex items-center gap-0.5 bg-[#00A884]/15 text-[#008069] dark:text-[#00A884] px-1.5 py-0.5 rounded-full text-[10px] font-bold"
              >
                <ShieldCheck className="h-2.5 w-2.5 fill-current" />
                Verified
              </span>
            )}
          </div>
          <span className="text-[11.5px] font-medium text-[#667781] dark:text-[#8696A0]">
            @{bizHandle} · Official Business
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {recipientId && initiateCall && (
          <>
            <button
              onClick={() =>
                initiateCall(
                  recipientId,
                  "VIDEO",
                  bizName || recipient?.name,
                  recipient?.avatarUrl,
                )
              }
              disabled={blockStatus?.isBlocked}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#54656F] dark:text-[#8696A0] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#00A884] dark:hover:text-[#00A884] transition-colors disabled:opacity-50"
              title="Video call"
            >
              <Video className="h-4.5 w-4.5" strokeWidth={1.8} />
            </button>
            <button
              onClick={() =>
                initiateCall(
                  recipientId,
                  "AUDIO",
                  bizName || recipient?.name,
                  recipient?.avatarUrl,
                )
              }
              disabled={blockStatus?.isBlocked}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#54656F] dark:text-[#8696A0] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#00A884] dark:hover:text-[#00A884] transition-colors disabled:opacity-50"
              title="Audio call"
            >
              <Phone className="h-4.5 w-4.5" strokeWidth={1.8} />
            </button>
          </>
        )}
        <div className="flex items-center gap-1 rounded-full bg-[#00A884]/10 dark:bg-[#00A884]/15 px-2.5 py-1 ml-1 text-[#008069] dark:text-[#00A884]">
          <Lock className="h-3 w-3" />
          <span className="text-[11px] font-semibold">
            Secure
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat Room Page
// ---------------------------------------------------------------------------

export default function ChatRoomPage() {
  return (
    <React.Suspense fallback={<div className="flex h-full w-full items-center justify-center bg-[#F8FAFC]"><Loader2 className="h-8 w-8 animate-spin text-[#3B58F5]" /></div>}>
      <ChatRoomPageContent />
    </React.Suspense>
  );
}

function ChatRoomPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const basePath = pathname.startsWith("/business") ? "/business/chats" : "/chats";
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
  const [isBizChat, setIsBizChat] = useState<boolean>(!!bizHandle);

  // ── State ──────────────────────────────────────────────────────────────────
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [recipientId, setRecipientId] = useState<string>(recipientIdFromQuery);
  const [isInitializing, setIsInitializing] = useState(true);
  const [recipient, setRecipient] = useState<UserProfile | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [isContactProfileOpen, setIsContactProfileOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isRecipientInContacts, setIsRecipientInContacts] = useState(true);
  const [isAddingContact, setIsAddingContact] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // B2C: track whether we know the bizHandle for this conversation
  // (needed to route ALL subsequent messages through contactBusiness REST API).
  const [resolvedBizHandle, setResolvedBizHandle] = useState<string>(bizHandle);
  const bizHandleRef = useRef<string>(bizHandle);
  const [isSendingFirstBizMessage, setIsSendingFirstBizMessage] =
    useState(false);
  // bizTicketCreated is kept for the welcome-banner hide logic
  const [bizTicketCreated, setBizTicketCreated] = useState(false);
  const [blockStatus, setBlockStatus] = useState<{
    isBlocked: boolean;
    isBlockedByMe: boolean;
    hasBlockedMe: boolean;
  } | null>(null);

  // ── Disappearing Messages ──────────────────────────────────────────────────
  // Stored as seconds (null = off). Loaded from the conversation metadata and
  // kept in sync with the other participant via socket events.
  const [disappearAfterSeconds, setDisappearAfterSeconds] = useState<number | null>(null);
  // Ticker: forces a re-render every second so expired messages vanish in real-time.
  const [tick, setTick] = useState(0);

  const [isMuted, setIsMuted] = useState(false);
  const [replyingTo, setReplyingTo] = useState<QuotedMessage | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToMessage = useCallback((messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.remove("highlight-pulse");
      void el.offsetWidth; // trigger reflow
      el.classList.add("highlight-pulse");
      setTimeout(() => el.classList.remove("highlight-pulse"), 2500);
    } else {
      toast.info("Original message is further up in history");
    }
  }, []);

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

        try {
          const convsRes = await chatService.fetchMyConversations();
          if (convsRes?.success && Array.isArray(convsRes?.data)) {
            const conv = convsRes.data.find(
              (c: any) => c.id === conversationId,
            );
            
            // Load the disappear setting unconditionally if the conversation is found
            if (conv) {
              setIsMuted(conv.isMuted || false);
              let timer = conv.disappearAfterSeconds !== undefined ? conv.disappearAfterSeconds : null;
              if (!conv.workspaceId && !conv.groupId && typeof window !== "undefined") {
                const stored = localStorage.getItem("callschat_default_disappear_seconds");
                if (stored && stored !== "null" && stored !== "0") {
                  const parsed = parseInt(stored, 10);
                  if (!isNaN(parsed) && parsed > 0 && timer !== parsed) {
                    timer = parsed;
                    void chatService.setDisappearSettings(conv.id, parsed).catch(() => {});
                  }
                }
              }
              setDisappearAfterSeconds(timer);
            }

            if (
              conv?.workspaceId ||
              conv?.lastMessage?.ticketId ||
              (conv && !conv.otherUserId) // B2C where I am the business
            ) {
              setIsBizChat(true);
              const handle =
                conv?.businessHandle || conv?.otherUserHandle || "";
              if (handle) {
                setResolvedBizHandle(handle);
                bizHandleRef.current = handle;
              }
              setBizTicketCreated(true);
            }
            
            if (conv?.otherUserId) {
              finalRecipientId = conv.otherUserId;
              setRecipientId(finalRecipientId);
              setRecipient({
                id: conv.otherUserId,
                name: conv.otherUserName || "Unknown",
                avatarUrl:
                  conv.otherUserAvatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.otherUserName || "U")}&background=F4F6FC&color=3B58F5`,
                isOnline: conv.otherUserOnline || false,
                phone: undefined, // Will be updated when we fetch from /contacts below or you can just leave it since the name shows
              });
              setIsInitializing(false);
              return;
            }
          }
        } catch {
          // fall through to fallback contact lookup if fetchMyConversations fails
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
              (u.addressee?.id || u.contact?.id || u.id) === finalRecipientId,
          );

          setIsRecipientInContacts(!!match);

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
              phone: match.contact?.phone || match.phoneNumber || match.addressee?.phone || undefined,
            });
          } else {
            setRecipient({
              id: finalRecipientId,
              name: "Unknown User",
              avatarUrl: `https://ui-avatars.com/api/?name=U&background=F4F6FC&color=3B58F5`,
              isOnline: false,
            });
          }

          // Fetch block status
          try {
            const blockRes = await fetch(
              `${baseUrl}/user/block/${finalRecipientId}/status`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            const blockData = await blockRes.json();
            if (blockData.success) {
              setBlockStatus(blockData.data);
            }
          } catch (e) {
            console.error("Failed to fetch block status", e);
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

  const { messages, sendMessage, editMessage, pinnedMessages, pinMessage, clearMessages, isReady, isUploading, unsendMessage, typingUsers, handleTyping } =
    useChat(conversationId, currentUserId, recipientId, isBizChat);

  // ── Disappear ticker ─────────────────────────────────────────────────────
  // Always runs every second so BOTH conversation-level AND per-message timers
  // are re-evaluated. Without this, messages sent under a now-disabled
  // conversation timer would never get re-filtered out of the list.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Socket: listen for real-time disappear setting changes ───────────────
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;
    const handler = (payload: { conversationId: string; disappearAfterSeconds: number | null }) => {
      if (payload.conversationId === conversationId) {
        setDisappearAfterSeconds(payload.disappearAfterSeconds);
      }
    };
    socket.on("chat:disappear_updated", handler);
    return () => { socket.off("chat:disappear_updated", handler); };
  }, [socket, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      setBizTicketCreated(true);
    }
  }, [messages.length]);

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

  const handleAddContact = async () => {
    if (!recipientId) return;
    try {
      setIsAddingContact(true);
      await ContactService.addMutualContact(recipientId);
      setIsRecipientInContacts(true);
      toast.success("Added to contacts");
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setIsRecipientInContacts(true);
        toast.info("User is already in your contacts");
      } else {
        toast.error("Failed to add contact");
      }
    } finally {
      setIsAddingContact(false);
    }
  };

  // ── Send Handler ──────────────────────────────────────────────────────────
  /**
   * For B2C chats, ALL messages go through CustomerService.contactBusiness
   * (which correctly links ticketId, stores plaintext, and emits NEW_TICKET_MESSAGE
   * so the business inbox receives them in real-time).
   *
   * The generic chat:send_message WebSocket path MUST NOT be used for B2C
   * because it creates messages without ticketId, which are invisible to the
   * business inbox and may inadvertently encrypt the payload.
   */
  const handleSend = async (text: string, file: File | null) => {
    if (!currentUserId) return;

    const effectiveBizHandle = resolvedBizHandle || bizHandleRef.current;

    if (
      isBizChat &&
      effectiveBizHandle &&
      effectiveBizHandle.length >= 2 &&
      text.trim()
    ) {
      // B2C path: always use the REST API, regardless of whether the ticket
      // was already created. contactBusiness handles both new and existing tickets.
      setIsSendingFirstBizMessage(true);
      try {
        const res = await CustomerService.contactBusiness(
          effectiveBizHandle,
          text.trim(),
        );
        if (res.success) {
          setBizTicketCreated(true);
        } else {
          toast.error("Failed to send message to business.");
        }
      } catch (err: any) {
        toast.error(
          err?.response?.data?.error?.message || "Failed to send message.",
        );
      } finally {
        setIsSendingFirstBizMessage(false);
      }
      return;
    }

    // Personal P2P DM path — encrypted WebSocket channel.
    const currentReply = replyingTo;
    setReplyingTo(null);
    sendMessage(text, currentUserId, file, false, currentReply);
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
          bizName={bizName || bizHandle || recipient?.name || "Unknown"}
          bizHandle={bizHandle || resolvedBizHandle}
          bizVerified={bizVerified}
          onBack={() => router.push(basePath)}
          recipientId={recipientId}
          recipient={recipient}
          initiateCall={initiateCall}
          blockStatus={blockStatus}
        />
      ) : (
        <div className="flex items-center justify-between bg-white/95 dark:bg-[#202C33]/95 backdrop-blur-md px-4 py-2.5 border-b border-[#E2E8F0] dark:border-[#222D34] shadow-xs z-20 shrink-0 text-[#111B21] dark:text-[#E9EDEF]">
          <div className="flex items-center gap-3">
            <Link
              href={basePath}
              className="md:hidden rounded-full p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10 text-[#54656F] dark:text-[#8696A0]"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2} />
            </Link>
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => setIsContactProfileOpen(true)}
            >
              <div
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F0F2F5] dark:bg-[#2A3942] overflow-hidden shadow-xs"
              >
                {recipient?.avatarUrl ? (
                  <img
                    src={getOptimizedImageUrl(recipient.avatarUrl)}
                    alt={recipient.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <div className="text-[#00A884] font-bold text-sm">
                    {recipient?.name?.charAt(0) || "U"}
                  </div>
                )}
                {(!blockStatus?.isBlocked && ((isMounted && isUserOnline(recipientId)) || recipient?.isOnline)) && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-[#202C33] bg-[#25D366]"
                  />
                )}
              </div>
              <div className="flex flex-col">
                <h2 className="text-[16px] font-semibold text-[#111B21] dark:text-[#E9EDEF] tracking-tight group-hover:text-[#00A884] transition-colors">
                  {recipient?.name || "Loading..."}
                </h2>
                {isInitializing ? (
                  <span className="text-[11.5px] font-normal text-[#667781] dark:text-[#8696A0]">
                    Connecting...
                  </span>
                ) : blockStatus?.isBlocked ? (
                  <span className="text-[11.5px] font-normal text-[#667781] dark:text-[#8696A0]">Offline</span>
                ) : (isMounted && isUserOnline(recipientId)) || recipient?.isOnline ? (
                  <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#00A884]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#25D366] animate-pulse" />
                    Active now
                  </span>
                ) : (
                  <span className="text-[11.5px] font-normal text-[#667781] dark:text-[#8696A0]">
                    Offline
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                recipientId &&
                initiateCall(
                  recipientId,
                  "VIDEO",
                  recipient?.name,
                  recipient?.avatarUrl,
                )
              }
              disabled={!recipientId || blockStatus?.isBlocked}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#54656F] dark:text-[#8696A0] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#00A884] dark:hover:text-[#00A884] transition-colors disabled:opacity-50"
              title="Video call"
            >
              <Video className="h-4.5 w-4.5" strokeWidth={1.8} />
            </button>
            <button
              onClick={() =>
                recipientId &&
                initiateCall(
                  recipientId,
                  "AUDIO",
                  recipient?.name,
                  recipient?.avatarUrl,
                )
              }
              disabled={!recipientId || blockStatus?.isBlocked}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#54656F] dark:text-[#8696A0] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#00A884] dark:hover:text-[#00A884] transition-colors disabled:opacity-50"
              title="Audio call"
            >
              <Phone className="h-4.5 w-4.5" strokeWidth={1.8} />
            </button>
            {recipientId && (
              <ChatOptionsMenu
                conversationId={conversationId}
                peerId={recipientId}
                onMediaInfoClick={() => setGalleryOpen(true)}
                onClearSuccess={clearMessages}
                blockStatus={blockStatus}
                setBlockStatus={setBlockStatus}
                disappearAfterSeconds={disappearAfterSeconds}
                onDisappearUpdated={setDisappearAfterSeconds}
                onViewContact={() => setIsContactProfileOpen(true)}
                isMuted={isMuted}
                onMuteToggle={setIsMuted}
              />
            )}
          </div>
        </div>
      )}

      {/* ── B2C Welcome Banner ────────────────────────────────────────────── */}
      {isBizChat && !bizTicketCreated && messages.length === 0 && (
        <div className="shrink-0 border-b border-[#E2E8F0] dark:border-[#222D34] bg-white dark:bg-[#182229] px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#00A884]/15 border border-[#00A884]/20">
              <Building2 className="h-4.5 w-4.5 text-[#00A884]" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#111B21] dark:text-[#E9EDEF]">
                You're chatting with {bizName || bizHandle}
              </p>
              <p className="text-[12px] text-[#667781] dark:text-[#8696A0] mt-0.5">
                Send your first message to open a support ticket. A team member will reply soon.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Ephemeral Banner ──────────────────────────────────────────────── */}
      {!isBizChat && (disappearAfterSeconds || messages.some((m) => (m as any).disappearAfterSeconds)) && (
        <div className="shrink-0 border-b border-purple-200/60 dark:border-purple-900/40 bg-purple-50/80 dark:bg-purple-950/20 px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[14px]" role="img" aria-label="timer">⏱️</span>
            <span className="text-[12px] font-bold text-purple-700 dark:text-purple-300">
              Disappearing messages
            </span>
            {disappearAfterSeconds && (
              <>
                <span className="text-[11px] font-medium text-purple-400">·</span>
                <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                  {disappearAfterSeconds === 86400
                    ? "24 hours"
                    : disappearAfterSeconds === 604800
                      ? "7 days"
                      : disappearAfterSeconds === 2592000
                        ? "90 days"
                        : `${disappearAfterSeconds}s`}
                </span>
              </>
            )}
          </div>
          <span className="text-[11px] font-medium text-purple-500">
            Auto-delete active
          </span>
        </div>
      )}

      {/* ── Add to Contact Banner ──────────────────────────────────────────── */}
      {!isBizChat && !isRecipientInContacts && !isInitializing && !blockStatus?.isBlocked && (
        <div className="shrink-0 border-b border-[#E2E8F0] dark:border-[#222D34] bg-white dark:bg-[#182229] px-4 py-2.5 flex items-center justify-between gap-3 shadow-2xs z-10">
          <div className="flex flex-col">
            <span className="text-[12.5px] font-semibold text-[#111B21] dark:text-[#E9EDEF]">
              Know {recipient?.name || "this user"}? Add to contacts.
            </span>
            <span className="text-[11px] text-[#667781] dark:text-[#8696A0]">
              Save this contact to find them easily in chats and calls.
            </span>
          </div>
          <button
            onClick={handleAddContact}
            disabled={isAddingContact}
            className="shrink-0 rounded-full bg-[#00A884] hover:bg-[#008069] px-3.5 py-1 text-xs font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            {isAddingContact ? (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Adding...
              </span>
            ) : (
              "Add Contact"
            )}
          </button>
        </div>
      )}

      {/* Pinned Messages Banner */}
      {pinnedMessages && pinnedMessages.length > 0 && (
        <div className="bg-[#FFF8E7] dark:bg-[#202C33] border-b border-[#FFE8A3]/70 dark:border-[#2A3942] px-4 py-2 flex items-center justify-between shrink-0 shadow-2xs transition-all duration-200 z-10">
          <div 
            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group/pin"
            onClick={() => {
              const targetId = pinnedMessages[0]?.messageId;
              if (targetId) {
                const el = document.getElementById(`msg-${targetId}`);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                  el.classList.add("bg-yellow-100/60", "transition-colors", "duration-500");
                  setTimeout(() => el.classList.remove("bg-yellow-100/60"), 2000);
                } else {
                  toast.info("Pinned message is further up in chat history");
                }
              }
            }}
          >
            <div className="w-7 h-7 rounded-full bg-[#00A884]/15 flex items-center justify-center shrink-0 text-[#00A884] group-hover/pin:bg-[#00A884]/25 transition-colors">
              <Pin className="w-3.5 h-3.5 rotate-45" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#008069] dark:text-[#00A884] tracking-wide uppercase">
                  Pinned Message {pinnedMessages.length > 1 ? `(1 of ${pinnedMessages.length})` : ""}
                </span>
                {pinnedMessages[0]?.pinnedUntil && (
                  <span className="text-[10px] font-medium text-[#8696A0]">
                    · Expires {new Date(pinnedMessages[0].pinnedUntil).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="text-[13px] font-medium text-[#111B21] dark:text-[#E9EDEF] truncate">
                {pinnedMessages[0]?.previewText || pinnedMessages[0]?.originalMessage?.text || (
                  pinnedMessages[0]?.previewMedia ? `📷 ${pinnedMessages[0].previewMedia}` : "Pinned attachment"
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              type="button"
              onClick={() => pinMessage(pinnedMessages[0].messageId, "unpin", undefined, undefined, undefined, "You")}
              className="p-1 rounded-full hover:bg-red-100/80 dark:hover:bg-red-950/40 text-[#8696A0] hover:text-red-600 transition-colors cursor-pointer"
              title="Unpin message"
            >
              <PinOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Messages ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3 chat-canvas-bg custom-scrollbar relative">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full z-10 text-[#8F95B2]">
            {isReady || isBizChat ? (
              disappearAfterSeconds ? (
                <div className="flex flex-col items-center gap-3 text-center max-w-[280px]">
                  <div className="text-4xl animate-bounce">🔥</div>
                  <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 rounded-2xl px-5 py-4 text-center shadow-xs">
                    <p className="text-[13px] font-bold text-purple-700 dark:text-purple-300 mb-1">
                      Ephemeral Chat Active
                    </p>
                    <p className="text-[11px] font-medium text-purple-500 leading-relaxed">
                      Messages in this conversation disappear automatically. Send your first secret message.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#FFF8C6] dark:bg-[#182229] text-[#54656F] dark:text-[#8696A0] text-xs px-4 py-2 rounded-lg text-center shadow-2xs max-w-sm border border-[#FFE8A3]/40 dark:border-white/5 mx-auto">
                  <Lock className="inline-block h-3 w-3 mr-1 mb-0.5 text-[#00A884]" />
                  {isBizChat
                    ? "Your messages to this business are private and secure."
                    : "Messages are end-to-end encrypted. No one outside of this chat, not even CallsChat, can read or listen to them."}
                </div>
              )
            ) : (
              <Loader2 className="h-6 w-6 animate-spin text-[#00A884]" />
            )}
          </div>
        ) : (
          messages
            .filter((msg) => {
              // Use the per-message timer first (stamped at send time).
              // Fall back to the conversation-level timer for messages sent before
              // the per-message stamping was introduced.
              const timer = (msg as any).disappearAfterSeconds ?? disappearAfterSeconds;
              return !isMessageExpired(msg.createdAt, timer);
            })
            .map((msg, index, visibleMsgs) => {
              const isMe = msg.senderId === currentUserId;
              const showTail =
                index === 0 || visibleMsgs[index - 1].senderId !== msg.senderId;
              const isPinned = pinnedMessages?.some((p: any) => p.messageId === msg.id);

              return (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isMe={isMe}
                  showTail={showTail}
                  peerId={recipientId}
                  peerName={isBizChat ? bizName : recipient?.name}
                  peerAvatar={isBizChat ? undefined : recipient?.avatarUrl}
                  disappearAfterSeconds={(msg as any).disappearAfterSeconds ?? disappearAfterSeconds ?? null}
                  onEdit={(msgId, newText) => editMessage(msgId, newText)}
                  isPinned={isPinned}
                  onPin={(dur, previewText, previewMedia) =>
                    pinMessage(
                      msg.id,
                      "pin",
                      dur,
                      previewText || msg.text,
                      previewMedia || msg.mediaType || undefined,
                      "You"
                    )
                  }
                  onUnpin={() =>
                    pinMessage(
                      msg.id,
                      "unpin",
                      undefined,
                      undefined,
                      undefined,
                      "You"
                    )
                  }
                  onUnsend={unsendMessage}
                  onReply={(m) =>
                    setReplyingTo({
                      id: m.id,
                      senderId: m.senderId,
                      senderName:
                        m.senderId === currentUserId
                          ? "You"
                          : isBizChat
                          ? bizName
                          : recipient?.name || "Contact",
                      text: m.text,
                      mediaUrl: m.mediaUrl,
                      mediaType: m.mediaType,
                    })
                  }
                  onScrollToMessage={scrollToMessage}
                  currentUserId={currentUserId}
                />
              );
            })
        )}
        
        {typingUsers.size > 0 && (
          <TypingIndicator
            name={
              isBizChat
                ? bizName || bizHandle || "Support"
                : recipient?.name || "User"
            }
            avatarUrl={isBizChat ? undefined : recipient?.avatarUrl}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ────────────────────────────────────────────────────────── */}
      {blockStatus?.isBlocked ? (
        <div className="shrink-0 p-4 bg-white border-t border-[#EEF2FF] text-center text-[#6B7A99] font-medium">
          {blockStatus.isBlockedByMe
            ? "You have blocked this contact."
            : "You cannot reply to this conversation."}
        </div>
      ) : (
        <ChatInput
          onSend={handleSend}
          isReady={isBizChat ? true : isReady}
          isUploading={isUploading || isSendingFirstBizMessage}
          onTyping={handleTyping}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      )}

      {/* ── Media Gallery ─────────────────────────────────────────────────── */}
      {!isBizChat && (
        <MediaGallery
          conversationId={conversationId}
          open={galleryOpen}
          onOpenChange={setGalleryOpen}
        />
      )}

      {/* ── Contact Profile Modal ─────────────────────────────────────────── */}
      {!isBizChat && recipient && (
        <ContactProfileModal
          isOpen={isContactProfileOpen}
          onClose={() => setIsContactProfileOpen(false)}
          peerId={recipient.id}
          name={recipient.name}
          avatarUrl={recipient.avatarUrl}
          isOnline={recipient.isOnline}
          phone={recipient.phone}
          isBlocked={blockStatus?.isBlocked}
          isBlockedByMe={blockStatus?.isBlockedByMe}
          onBlockUser={async () => {
             // This leverages the logic in ChatActionModals if we wanted, but since it's separate, 
             // we'll just toggle it here, or we can use the same state.
             // But actually, ChatActionModals handles blocking via setIsBlockUserOpen.
             // We can just rely on the ChatOptionsMenu's block/unblock for now, or implement a quick toggle here:
             try {
                const token = localStorage.getItem("accessToken");
                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1";
                if (blockStatus?.isBlockedByMe) {
                  await fetch(`${baseUrl}/user/block/${recipient.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                  toast.success("Contact unblocked successfully.");
                } else {
                  await fetch(`${baseUrl}/user/block/${recipient.id}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                  toast.success("Contact blocked successfully.");
                }
                setBlockStatus(prev => prev ? { ...prev, isBlockedByMe: !prev.isBlockedByMe, isBlocked: !prev.isBlockedByMe || prev.hasBlockedMe } : { isBlocked: true, isBlockedByMe: true, hasBlockedMe: false });
             } catch (e: any) {
                toast.error("Failed to update block status.");
             }
          }}
        />
      )}
    </div>
  );
}
