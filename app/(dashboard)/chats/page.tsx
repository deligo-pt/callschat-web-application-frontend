"use client";

import React, { Suspense, useState, useEffect, useRef } from "react";
import { MessageSquare, Hash, Send, Paperclip, Smile, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChannelHeader } from "@/components/chat/ChannelHeader";
import { useUser } from "@/context/UserContext";
import { useSocket } from "@/components/providers/SocketProvider";
import { ChannelService, type ChannelMessageData } from "@/services/channel.service";
import { toast } from "sonner";
import { CollaborationService } from "@/services/collaboration.service";
import { ProductivitySidebar } from "@/components/business/ProductivitySidebar";
import { ScheduleSendPopover } from "@/components/business/ScheduleSendPopover";

function ChatsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentMode, user, workspace } = useUser();
  const { socket, isConnected } = useSocket();
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Array<{ id: string; sender: string; text: string; time: string; avatar?: string | null }>>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
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
          },
        ];
      });
    };

    socket.on("channel:receive_message", handleReceiveMessage);

    return () => {
      socket.off("channel:receive_message", handleReceiveMessage);
    };
  }, [socket, isConnected, currentMode, channelId, workspace?.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !channelId || !workspace?.id) return;

    const content = messageText.trim();
    setMessageText("");

    if (socket && isConnected) {
      socket.emit("channel:send_message", {
        channelId,
        workspaceId: workspace.id,
        content,
      });
    } else {
      const senderName = user?.profile?.displayName || user?.profile?.username || "You";
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: senderName,
          text: content,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  };

  const handleScheduleMessage = async (scheduledForIso: string) => {
    if (!messageText.trim() || !channelId || !workspace?.id) {
      toast.error("Please enter message text to schedule");
      return false;
    }
    try {
      const res = await CollaborationService.scheduleMessage({
        content: messageText.trim(),
        scheduledFor: scheduledForIso,
        channelId,
        workspaceId: workspace.id,
      });
      if (res.success) {
        toast.success("Message scheduled successfully");
        setMessageText("");
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
        <div className="flex flex-1 flex-col h-full overflow-hidden">
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
                    {m.text}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Slack-style Input Box */}
        <div className="p-4 bg-white border-t border-[#E6EAFA]">
          <form onSubmit={handleSend} className="flex items-center gap-2 rounded-2xl border border-[#E6EAFA] bg-[#F8FAFC] px-4 py-2 focus-within:border-purple-600 focus-within:ring-3 focus-within:ring-purple-600/15 transition-all">
            <button type="button" className="text-[#8F95B2] hover:text-[#11142D] transition-colors">
              <Paperclip className="h-4 w-4" />
            </button>
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={`Message #${channelName}`}
              className="flex-1 bg-transparent text-sm font-medium text-[#11142D] placeholder-[#8F95B2] outline-none py-1"
            />
            <button type="button" className="text-[#8F95B2] hover:text-[#11142D] transition-colors">
              <Smile className="h-4 w-4" />
            </button>
            <ScheduleSendPopover
              disabled={!messageText.trim()}
              onSchedule={handleScheduleMessage}
            />
            <button
              type="submit"
              disabled={!messageText.trim()}
              className="p-2 rounded-xl bg-purple-600 text-white font-bold shadow-md shadow-purple-500/20 hover:bg-purple-700 disabled:opacity-50 disabled:shadow-none transition-all cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
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
      <button 
        onClick={() => router.push("/contacts")}
        className="mt-8 rounded-2xl bg-[#3B58F5] px-8 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-[#3B58F5]/25 transition-all hover:bg-[#2C48B8] active:scale-95 cursor-pointer"
      >
        Start a New Conversation
      </button>
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
