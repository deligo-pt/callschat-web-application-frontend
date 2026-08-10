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

  // Remove business-specific channel UI override; channels should use /business/channels
  // Universal initial UI matching Figma node 1247-2566 ("Sign up home page")
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-6 sm:p-12 text-center bg-[#F8FAFC] relative overflow-y-auto">
      <div className="mb-6 flex justify-center w-full max-w-[340px] sm:max-w-[380px]">
        <img 
          src="/welcome-illustration.png" 
          alt="Welcome Illustration" 
          className="w-full h-auto object-contain transition-transform duration-500 hover:scale-[1.02] drop-shadow-xs"
        />
      </div>
      
      <h1 className="text-3xl sm:text-[34px] font-extrabold text-[#0F172A] mb-2 tracking-tight leading-tight">
        Welcome to CallsChat.
      </h1>
      <h2 className="text-xl sm:text-[22px] font-bold text-[#2563EB] mb-3 tracking-tight">
        You&apos;re all set.
      </h2>
      <p className="text-sm sm:text-[15px] font-medium text-[#64748B] max-w-[440px] mx-auto leading-relaxed">
        Start a conversation, make a call, or create a group to connect with your friends and team.
      </p>

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
