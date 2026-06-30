"use client";

import React, { Suspense, useState, useEffect, useRef } from "react";
import { MessageSquare, Hash, Send, Paperclip, Smile, Loader2, Building2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChannelHeader } from "@/components/chat/ChannelHeader";
import { useUser } from "@/context/UserContext";
import { useSocket } from "@/components/providers/SocketProvider";
import { ChannelService, type ChannelMessageData } from "@/services/channel.service";
import { toast } from "sonner";
import { CollaborationService } from "@/services/collaboration.service";
import { ProductivitySidebar } from "@/components/business/ProductivitySidebar";
import { ScheduleSendPopover } from "@/components/business/ScheduleSendPopover";
import { VoiceMessagePlayer } from "@/components/chat/VoiceMessagePlayer";
import { ChannelInput } from "@/components/business/ChannelInput";
import { ExploreBusinessesModal } from "@/components/business/ExploreBusinessesModal";
import { HuddleOverlay } from "@/components/business/HuddleOverlay";

function ChatsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentMode, user, workspace } = useUser();
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<Array<{ id: string; sender: string; text: string; time: string; avatar?: string | null; mediaUrl?: string | null; mediaType?: string | null }>>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const channelId = searchParams.get("channelId");
  const channelName = searchParams.get("channelName") || "general";
  const channelDesc = searchParams.get("channelDesc") || "";
  const isPrivate = searchParams.get("isPrivate") === "true";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (currentMode !== "BUSINESS" || !channelId || !workspace?.id) return;

    let isMounted = true;
    setIsLoadingMessages(true);

    ChannelService.getChannelMessages(workspace.id, channelId)
      .then((res) => {
        if (isMounted && res?.success && res.data?.messages) {
          const formatted = res.data.messages.map((m) => ({
            id: m.id,
            sender: m.senderName,
            text: m.content,
            time: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            avatar: m.senderAvatar,
            mediaUrl: m.mediaUrl,
            mediaType: m.mediaType,
          }));
          setMessages(formatted);
        }
      })
      .catch((err) => {
        console.error("Failed to load channel messages:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingMessages(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentMode, channelId, workspace?.id]);

  useEffect(() => {
    if (!socket || !isConnected || currentMode !== "BUSINESS" || !channelId) return;

    socket.emit("channel:join_room", {
      channelId,
      workspaceId: workspace?.id,
    });

    const handleReceiveMessage = (newMsg: ChannelMessageData) => {
      if (newMsg.channelId !== channelId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [
          ...prev,
          {
            id: newMsg.id,
            sender: newMsg.senderName,
            text: newMsg.content,
            time: new Date(newMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            avatar: newMsg.senderAvatar,
            mediaUrl: newMsg.mediaUrl,
            mediaType: newMsg.mediaType,
          },
        ];
      });
    };

    socket.on("channel:receive_message", handleReceiveMessage);

    return () => {
      socket.off("channel:receive_message", handleReceiveMessage);
    };
  }, [socket, isConnected, currentMode, channelId, workspace?.id]);

  const getMediaTypeFromMime = (mime: string = "") => {
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    if (mime.startsWith("audio/")) return "audio";
    return "document";
  };

  const handleSend = async (content: string, file: File | null) => {
    if (!channelId || !workspace?.id) return;

    let mediaUrl: string | null = null;
    let mediaType: string | null = null;

    if (file) {
      try {
        const uploadRes = await CollaborationService.uploadFile(file, channelId, null, workspace.id);
        if (uploadRes.success && uploadRes.data) {
          mediaUrl = uploadRes.data.fileUrl;
          mediaType = getMediaTypeFromMime(file.type || uploadRes.data.fileType);
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.error?.message || "Failed to upload file");
        return;
      }
    }

    if (socket && isConnected) {
      socket.emit("channel:send_message", {
        channelId,
        workspaceId: workspace.id,
        content: content || "",
        mediaUrl,
        mediaType,
      });
    } else {
      const senderName = user?.profile?.displayName || user?.profile?.username || "You";
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: senderName,
          text: content || "",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          mediaUrl,
          mediaType,
        },
      ]);
    }
  };

  const handleScheduleMessage = async (content: string, file: File | null, scheduledForIso: string) => {
    if (!channelId || !workspace?.id) return false;

    let mediaUrl: string | null = null;
    let mediaType: string | null = null;

    if (file) {
      try {
        const uploadRes = await CollaborationService.uploadFile(file, channelId, null, workspace.id);
        if (uploadRes.success && uploadRes.data) {
          mediaUrl = uploadRes.data.fileUrl;
          mediaType = getMediaTypeFromMime(file.type || uploadRes.data.fileType);
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.error?.message || "Failed to upload file");
        return false;
      }
    }

    try {
      const res = await CollaborationService.scheduleMessage({
        content: content || "",
        scheduledFor: scheduledForIso,
        channelId,
        workspaceId: workspace.id,
        mediaUrl,
        mediaType,
      });
      if (res.success) {
        toast.success("Message scheduled successfully");
        return true;
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Failed to schedule message");
    }
    return false;
  };

  if (currentMode === "BUSINESS" && channelId) {
    return (
      <div className="flex h-full w-full overflow-hidden bg-[#F8FAFC]">
        <div className="flex flex-1 flex-col h-full overflow-hidden relative">
          <HuddleOverlay />
          <ChannelHeader
          channelId={channelId}
          channelName={channelName}
          channelDescription={channelDesc}
          isPrivate={isPrivate}
        />
        
        {/* Channel Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {/* Welcome Banner */}
          <div className="flex flex-col items-start justify-center p-6 bg-white border border-[#E6EAFA] rounded-2xl shadow-xs mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 mb-3 font-extrabold">
              <Hash className="h-6 w-6 stroke-[2.5]" />
            </div>
            <h3 className="text-xl font-extrabold text-[#11142D]">Welcome to #{channelName}!</h3>
            <p className="text-xs font-medium text-[#6B7280] max-w-lg mt-1">
              {channelDesc || `This is the start of the #${channelName} channel. Connect, collaborate, and share updates with your enterprise workspace team here.`}
            </p>
          </div>

          {isLoadingMessages ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="flex items-start gap-3 group">
                {m.avatar ? (
                  <img src={m.avatar} alt={m.sender} className="h-9 w-9 shrink-0 rounded-full object-cover shadow-sm bg-purple-100" />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white font-bold text-xs shadow-sm">
                    {m.sender.charAt(0)}
                  </div>
                )}
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-[#11142D]">{m.sender}</span>
                    <span className="text-[10px] font-semibold text-[#8F95B2]">{m.time}</span>
                  </div>
                  <div className="mt-1 rounded-xl bg-white px-3.5 py-2.5 text-sm text-[#1D2A54] border border-[#E6EAFA] shadow-2xs">
                    {m.mediaUrl && (
                      <div className="mb-1.5">
                        {m.mediaType?.startsWith("audio") || m.mediaType === "audio" ? (
                          <VoiceMessagePlayer
                            src={m.mediaUrl}
                            messageId={m.id}
                            isMe={m.sender === (user?.profile?.displayName || user?.profile?.username || "You")}
                          />
                        ) : m.mediaType?.startsWith("image") || m.mediaType === "image" ? (
                          <a href={m.mediaUrl} target="_blank" rel="noopener noreferrer">
                            <img src={m.mediaUrl} alt="Attached Image" className="rounded-lg max-w-sm w-full object-cover max-h-[300px]" />
                          </a>
                        ) : m.mediaType?.startsWith("video") || m.mediaType === "video" ? (
                          <video src={m.mediaUrl} controls className="rounded-lg max-w-sm w-full max-h-[300px]" />
                        ) : (
                          <a href={m.mediaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg text-xs transition-colors">
                            📎 Download Attachment
                          </a>
                        )}
                      </div>
                    )}
                    {m.text && <div className="leading-snug whitespace-pre-wrap">{m.text}</div>}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Slack-style Input Box */}
        <ChannelInput
          channelName={channelName}
          onSend={handleSend}
          onSchedule={handleScheduleMessage}
        />
      </div>
      {workspace?.id && (
        <ProductivitySidebar workspaceId={workspace.id} channelId={channelId} />
      )}
    </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl shadow-blue-500/5 mb-6">
        <MessageSquare className="h-10 w-10 text-[#3B58F5]" strokeWidth={1.5} />
      </div>
      <h2 className="text-[24px] font-bold text-[#1D2A54]">Your Messages</h2>
      <p className="mt-2 text-[15px] font-medium text-[#8F95B2] max-w-sm">
        Select a conversation from the sidebar or start a new chat to begin messaging securely.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button 
          onClick={() => router.push("/contacts")}
          className="rounded-2xl bg-[#3B58F5] px-7 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-[#3B58F5]/25 transition-all hover:bg-[#2C48B8] active:scale-95 cursor-pointer"
        >
          Start a New Conversation
        </button>
        <button 
          onClick={() => setIsExploreOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-white border border-[#E6EAFA] px-6 py-3.5 text-[15px] font-bold text-[#1D2A54] shadow-sm transition-all hover:bg-[#F8FAFC] hover:border-[#3B58F5]/40 active:scale-95 cursor-pointer"
        >
          <Building2 className="h-5 w-5 text-[#3B58F5]" />
          <span>Explore Businesses</span>
        </button>
      </div>

      <ExploreBusinessesModal isOpen={isExploreOpen} onClose={() => setIsExploreOpen(false)} />
    </div>
  );
}

export default function ChatsEmptyStatePage() {
  return (
    <Suspense fallback={null}>
      <ChatsContent />
    </Suspense>
  );
}
