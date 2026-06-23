"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useCallContext } from "@/components/providers/CallContext";
import { ArrowLeft, Phone, Video, Send, Loader2, MoreVertical, Smile, Paperclip, Image as ImageIcon, Mic } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import apiClient from "@/services/api.client";

// Dummy data mirroring the Figma design
const DUMMY_MESSAGES = [
  {
    id: "1",
    sender: { name: "Sarah", initials: "SJ", color: "bg-purple-500" },
    text: "Hey team! The new mockups are ready for review 🎨",
    time: "10:28 AM",
    isMe: false,
  },
  {
    id: "2",
    sender: { name: "Alex", initials: "AK", color: "bg-[#0ea5e9]" },
    text: "Awesome! Checking them now...",
    time: "10:29 AM",
    isMe: false,
  },
  {
    id: "3",
    sender: null,
    text: "Let me know what you think about the color palette!",
    time: "10:30 AM",
    isMe: true,
    seen: true,
  },
  {
    id: "4",
    sender: { name: "Jordan", initials: "JR", color: "bg-amber-500" },
    text: "The violet theme looks stunning btw, great choice",
    time: "10:31 AM",
    isMe: false,
  },
  {
    id: "5",
    sender: { name: "Sarah", initials: "SJ", color: "bg-purple-500" },
    text: "Agreed! The gradients really pop 🔥",
    time: "10:31 AM",
    isMe: false,
  },
];

export default function GroupChatPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  
  const { startGroupCall, joinGroupCall, activeGroupCalls } = useCallContext();
  
  const [groupDetails, setGroupDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isCallActive = activeGroupCalls.includes(groupId);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await apiClient.get('/groups');
        if (res.data?.success && Array.isArray(res.data.data)) {
          const match = res.data.data.find((g: any) => g.id === groupId);
          if (match) {
            setGroupDetails(match);
          }
        }
      } catch (error) {
        console.error("Failed to fetch group", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (groupId) {
      fetchGroup();
    }
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setInputText("");
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#EEF2FF]">
        <Loader2 className="h-8 w-8 animate-spin text-[#3B58F5]" />
      </div>
    );
  }

  // Fallback to "Design System" if backend didn't return a specific name for demo purposes
  const groupName = groupDetails?.name || "Design System";
  const avatarImage = groupDetails?.avatarUrl || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&h=100&fit=crop&q=80";

  return (
    <div className="flex h-full w-full flex-col bg-[#EEF2FF]">
      
      {/* Header - Styled like the mobile design */}
      <div className="flex items-center justify-between bg-[#3B58F5] px-4 py-4 z-10 shrink-0 text-white shadow-md">
        <div className="flex items-center gap-3">
          <Link
            href="/groups"
            className="rounded-full p-1 transition-colors hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5 text-white" strokeWidth={2} />
          </Link>
          
          <div className="flex items-center gap-3">
            <img
              src={avatarImage}
              alt={groupName}
              className="h-10 w-10 rounded-full object-cover border border-white/20"
            />
            <div className="flex flex-col">
              <h2 className="text-[16px] font-bold leading-tight">
                {groupName}
              </h2>
              <span className="text-[12px] font-medium text-white/80">
                Online
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isCallActive ? (
            <button
              onClick={() => joinGroupCall(groupId)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold text-[13px] transition-colors shadow-md animate-pulse mr-2"
            >
              <Video className="h-4 w-4" fill="currentColor" />
              Join
            </button>
          ) : (
            <>
              <button 
                onClick={() => startGroupCall(groupId, 'VIDEO')}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              >
                <Video className="h-5 w-5" strokeWidth={2} />
              </button>
              <button 
                onClick={() => startGroupCall(groupId, 'AUDIO')}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              >
                <Phone className="h-5 w-5" strokeWidth={2} />
              </button>
            </>
          )}
          <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
            <MoreVertical className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6 relative">
        {DUMMY_MESSAGES.map((msg, index) => {
          const showAvatar = !msg.isMe && (index === DUMMY_MESSAGES.length - 1 || DUMMY_MESSAGES[index + 1]?.sender?.name !== msg.sender?.name);
          const isNextSameSender = index < DUMMY_MESSAGES.length - 1 && DUMMY_MESSAGES[index + 1]?.sender?.name === msg.sender?.name;

          return (
            <div key={msg.id} className={cn("flex w-full", msg.isMe ? "justify-end" : "justify-start")}>
              
              {!msg.isMe && (
                <div className="w-8 shrink-0 mr-3 flex items-end pb-5">
                  {showAvatar && msg.sender && (
                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm", msg.sender.color)}>
                      {msg.sender.initials}
                    </div>
                  )}
                </div>
              )}

              <div className={cn("flex flex-col max-w-[75%]", msg.isMe ? "items-end" : "items-start")}>
                
                {/* Sender Name (Only for others, only on first message of a block) */}
                {!msg.isMe && (index === 0 || DUMMY_MESSAGES[index - 1]?.sender?.name !== msg.sender?.name) && (
                  <span className="text-[12px] font-semibold text-[#3B58F5] ml-1 mb-1">
                    {msg.sender?.name}
                  </span>
                )}

                {/* Message Bubble */}
                <div
                  className={cn(
                    "px-4 py-3 text-[14.5px] shadow-sm leading-relaxed",
                    msg.isMe 
                      ? "bg-[#3B58F5] text-white rounded-[20px] rounded-br-sm" 
                      : "bg-white text-[#11142D] rounded-[20px] rounded-bl-sm"
                  )}
                  style={{ wordBreak: "break-word" }}
                >
                  {msg.text}
                </div>

                {/* Time and Seen Status */}
                {(!isNextSameSender || msg.isMe) && (
                  <div className={cn("flex flex-col mt-1", msg.isMe ? "items-end mr-1" : "ml-1")}>
                    <span className="text-[11px] font-medium text-[#8F95B2]">
                      {msg.time}
                    </span>
                    {msg.isMe && msg.seen && (
                      <span className="text-[11px] text-[#8F95B2]">Seen</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        <div className="flex w-full justify-start mt-2">
          <div className="w-8 shrink-0 mr-3 flex items-end">
            <div className="h-8 w-8 rounded-full bg-[#0ea5e9] flex items-center justify-center text-white text-xs font-bold shadow-sm">
              AK
            </div>
          </div>
          <div className="flex flex-col max-w-[75%] items-start">
            <div className="px-4 py-3 bg-white text-[#11142D] rounded-[20px] rounded-bl-sm shadow-sm flex items-center gap-1 w-16 h-[44px]">
              <div className="w-2 h-2 bg-[#8F95B2] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-[#8F95B2] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-[#8F95B2] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="bg-white px-4 py-3 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <form onSubmit={handleSend} className="flex items-center gap-3 w-full max-w-4xl mx-auto">
          
          <button type="button" className="text-[#8F95B2] hover:text-[#3B58F5] transition-colors shrink-0">
            <Smile className="h-6 w-6" strokeWidth={1.5} />
          </button>
          
          <button type="button" className="text-[#8F95B2] hover:text-[#3B58F5] transition-colors shrink-0">
            <Paperclip className="h-[22px] w-[22px]" strokeWidth={1.5} />
          </button>
          
          <button type="button" className="text-[#8F95B2] hover:text-[#3B58F5] transition-colors shrink-0">
            <ImageIcon className="h-6 w-6" strokeWidth={1.5} />
          </button>

          <div className="flex-1 bg-[#F4F6FC] rounded-full flex items-center px-4 py-1.5 h-[44px]">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-[15px] text-[#11142D] placeholder-[#8F95B2] focus:outline-none"
            />
          </div>
          
          <button
            type={inputText.trim() ? "submit" : "button"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#3B58F5] text-white transition-transform hover:scale-105 active:scale-95 shadow-md"
          >
            {inputText.trim() ? (
              <Send className="h-5 w-5 ml-0.5" strokeWidth={2} />
            ) : (
              <Mic className="h-5 w-5" strokeWidth={2} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
