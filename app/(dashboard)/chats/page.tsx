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
import { getOptimizedImageUrl, getRawMediaUrl } from "@/utils/image";

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

  // Universal initial standby UI matching WhatsApp Web / Modern Desktop Messenger standard
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-6 sm:p-12 text-center bg-[#F0F2F5] dark:bg-[#111B21] relative overflow-y-auto border-l border-[#E2E8F0] dark:border-[#222D34]">
      {/* Central Hero Container */}
      <div className="flex flex-col items-center max-w-[460px] mx-auto animate-in fade-in zoom-in-95 duration-300">
        <div className="relative mb-6">
          <div className="h-24 w-24 rounded-3xl bg-gradient-to-tr from-[#00A884]/20 via-[#25D366]/15 to-emerald-100 dark:from-[#00A884]/30 dark:to-[#111B21] flex items-center justify-center shadow-inner border border-[#00A884]/20">
            <MessageSquare className="h-12 w-12 text-[#00A884]" strokeWidth={1.75} />
          </div>
        </div>

        <h1 className="text-[28px] sm:text-[32px] font-light text-[#41525D] dark:text-[#E9EDEF] mb-2 tracking-tight">
          CallsChat Web
        </h1>
        
        <p className="text-[14px] leading-relaxed text-[#667781] dark:text-[#8696A0] mb-8 font-normal max-w-[380px]">
          Send and receive messages, make voice & video calls, and connect with your contacts with end-to-end encryption.
        </p>

        {/* E2EE Lock Banner at the bottom */}
        <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/70 dark:bg-[#202C33]/70 backdrop-blur-xs border border-[#E2E8F0] dark:border-[#2A3942] shadow-2xs text-[#667781] dark:text-[#8696A0] text-[12px] font-medium">
          <span className="text-[11px]">🔒</span>
          <span>End-to-end encrypted</span>
        </div>
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
