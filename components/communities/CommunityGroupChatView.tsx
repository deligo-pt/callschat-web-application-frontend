"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { 
  ArrowLeft, 
  MoreVertical, 
  Smile, 
  Paperclip, 
  Image as ImageIcon, 
  Mic, 
  Send, 
  Megaphone, 
  ShieldAlert, 
  ShieldCheck, 
  Loader2,
  MessageSquare
} from "lucide-react";
import { CommunityDetailGroup } from "@/services/community.service";
import { CommunityItem } from "./CreateCommunitiesUI";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useGroupChat, GroupMessage } from "@/hooks/useGroupChat";

interface CommunityGroupChatViewProps {
  group: CommunityDetailGroup;
  community: CommunityItem;
  onBack: () => void;
}

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return null;
  }
}

export function CommunityGroupChatView({ group, community, onBack }: CommunityGroupChatViewProps) {
  const isAnnouncements = group.name.toLowerCase().includes("announcement");

  // Determine current user ID from JWT token
  const [currentUserId, setCurrentUserId] = useState<string>("");
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      const decoded = parseJwt(token);
      if (decoded) {
        setCurrentUserId(decoded.sub || decoded.id || "");
      }
    }
  }, []);

  // Real group chat hook fetching messages from database and subscribing via Socket.io
  const { messages: rawMessages, sendMessage, isReady, error } = useGroupChat(group.id, currentUserId);

  // Check user role from community / group attributes
  const isRealAdmin = useMemo(() => {
    return (
      community.myRole === "OWNER" || 
      community.myRole === "ADMIN" || 
      (group as any).myRole === "ADMIN"
    );
  }, [community.myRole, group]);

  // Allow toggling between Admin vs Member simulation if desired for testing (defaulting to real role or admin for announcements)
  const [isAdminRole, setIsAdminRole] = useState<boolean>(isRealAdmin || true);

  useEffect(() => {
    setIsAdminRole(isRealAdmin || true);
  }, [isRealAdmin]);

  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [rawMessages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    if (isAnnouncements && !isAdminRole) {
      toast.error("Only community admins can post in Announcements.");
      return;
    }

    const textToSend = inputText.trim();
    setInputText("");
    await sendMessage(textToSend);
  };

  return (
    <div className="flex flex-1 flex-col h-full w-full bg-white relative overflow-hidden select-none animate-in fade-in-50 duration-200">
      {/* 1. Top Blue Header matching exact mockup */}
      <div className="h-[64px] sm:h-[70px] w-full bg-[#2563EB] px-4 sm:px-6 flex items-center justify-between text-white shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3.5 min-w-0 pr-2">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 -ml-1 rounded-full hover:bg-white/10 transition-colors shrink-0"
            title="Back to Community Groups"
          >
            <ArrowLeft className="h-5 w-5 stroke-[2.2]" />
          </button>
          
          <div className="flex flex-col min-w-0">
            <h2 className="text-[17px] sm:text-[18px] font-bold tracking-tight leading-tight truncate">
              {group.name}
            </h2>
            <span className="text-[11px] sm:text-[12px] font-medium text-white/80 truncate">
              {community.name} · {group.memberCount} members
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Admin vs Member simulation toggle pill so user can verify permissions rules in real time! */}
          {isAnnouncements && (
            <button
              type="button"
              onClick={() => {
                const next = !isAdminRole;
                setIsAdminRole(next);
                toast.success(next ? "Switched to Admin Role (Can Post)" : "Switched to Member Role (Read Only)");
              }}
              className={cn(
                "hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border shadow-xs cursor-pointer",
                isAdminRole 
                  ? "bg-white text-[#2563EB] border-white" 
                  : "bg-blue-800 text-blue-100 border-blue-400 hover:bg-blue-700"
              )}
              title="Click to toggle your simulated permissions for testing"
            >
              {isAdminRole ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
              <span>{isAdminRole ? "Role: Admin (Post)" : "Role: Member (Read Only)"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => toast.info(`${group.name} settings`)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 2. Main Chat Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 flex flex-col bg-[#F8FAFC]/50">
        <div className="w-full max-w-[680px] mx-auto flex-1 flex flex-col">
          
          {/* Announcements Top Banner matching input_file_0.png exactly */}
          {isAnnouncements && (
            <div className="my-4 flex items-center justify-center">
              <div className="flex items-center gap-2 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] px-4 py-2.5 text-xs font-semibold shadow-2xs">
                <Megaphone className="h-4 w-4 fill-[#2563EB] shrink-0" />
                <span>Only admins can post in this group</span>
              </div>
            </div>
          )}

          {/* Real Database Messages Feed */}
          <div className="flex-1 space-y-5 pt-2 pb-6 flex flex-col justify-end min-h-[300px]">
            {!isReady ? (
              <div className="my-auto flex flex-col items-center justify-center gap-2 text-slate-400 py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#2563EB]" />
                <span className="text-xs font-semibold">Connecting and decrypting messages...</span>
              </div>
            ) : rawMessages.length === 0 ? (
              <div className="my-auto flex flex-col items-center justify-center gap-2 text-slate-400 py-12 text-center">
                <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <span className="text-sm font-bold text-slate-600">No messages yet</span>
                <span className="text-xs font-medium max-w-sm">
                  {isAnnouncements 
                    ? "No announcements have been posted to this channel yet."
                    : "Be the first to start the conversation with your team!"}
                </span>
              </div>
            ) : (
              rawMessages.map((msg: GroupMessage) => {
                const isMe = msg.senderId === currentUserId || msg.id.startsWith("optimistic-");
                const senderName = isMe 
                  ? (isAnnouncements && isAdminRole ? "You (Admin)" : "You")
                  : (msg.sender?.profile?.displayName || "Team Member");
                const timeString = new Date(msg.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

                if (isMe && !isAnnouncements) {
                  // Right aligned blue bubble (self in normal group like input_file_1.png)
                  return (
                    <div key={msg.id} className="flex flex-col items-end ml-auto max-w-[85%] sm:max-w-[70%]">
                      <div className="rounded-2xl rounded-tr-sm bg-[#2563EB] text-white p-4 shadow-sm w-full text-[13px] sm:text-[14px] leading-relaxed font-medium">
                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium mt-1.5 mr-1">
                        {timeString}
                      </span>
                    </div>
                  );
                }

                // Left aligned white bubble (Announcements or other members in normal group)
                return (
                  <div key={msg.id} className="flex flex-col items-start mr-auto max-w-[85%] sm:max-w-[70%] w-full">
                    {/* Sender Name above box */}
                    <span className={cn("text-[12px] font-bold mb-1 pl-1", isAnnouncements ? "text-[#2563EB]" : "text-emerald-600")}>
                      {senderName}
                    </span>
                    
                    <div className="rounded-2xl rounded-tl-sm bg-white border border-slate-200/80 p-4 shadow-sm w-full text-[13px] sm:text-[14px] text-[#0F172A] leading-relaxed font-medium">
                      <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      <span className="text-[11px] text-[#94A3B8] mt-2 block">
                        {timeString}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

        </div>
      </div>

      {/* 3. Bottom Chat Input Area */}
      <div className="bg-white border-t border-slate-200 px-4 sm:px-6 py-3.5 shrink-0 shadow-sm">
        <div className="w-full max-w-[680px] mx-auto">
          {isAnnouncements && !isAdminRole ? (
            /* Disabled / Read-Only Bar for Members inside Announcements */
            <div className="flex items-center justify-between rounded-2xl bg-slate-100/80 border border-slate-200 px-4 py-3 text-center">
              <div className="flex items-center gap-2.5 mx-auto text-xs font-bold text-slate-500">
                <ShieldAlert className="h-4 w-4 text-[#2563EB] shrink-0" />
                <span>Only community admins can send messages in this channel.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAdminRole(true);
                  toast.success("Switched to Admin Role to test posting!");
                }}
                className="text-[11px] font-extrabold text-[#2563EB] underline hover:text-blue-700 ml-2 shrink-0"
              >
                Switch to Admin
              </button>
            </div>
          ) : (
            /* Active Input Bar matching exact mockup */
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1 text-slate-400">
                <button
                  type="button"
                  onClick={() => toast.info("Emoji picker")}
                  className="p-2 rounded-full hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  title="Emoji"
                >
                  <Smile className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => toast.info("Attach document")}
                  className="p-2 rounded-full hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  title="Attach file"
                >
                  <Paperclip className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => toast.info("Attach image")}
                  className="p-2 rounded-full hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  title="Attach image"
                >
                  <ImageIcon className="h-5 w-5" />
                </button>
              </div>

              <input
                type="text"
                placeholder={isAnnouncements ? "Post an announcement to all members..." : "Type a message..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 h-10 sm:h-11 rounded-full bg-[#F8FAFC] border border-slate-200 px-4 sm:px-5 text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#2563EB]/15 transition-all shadow-2xs"
              />

              <button
                type="submit"
                onClick={(e) => {
                  if (!inputText.trim()) {
                    e.preventDefault();
                    toast.info("Voice note / Mic clip");
                  }
                }}
                className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-[#2563EB] hover:bg-blue-700 text-white flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0"
                title={inputText.trim() ? "Send message" : "Voice message"}
              >
                {inputText.trim() ? (
                  <Send className="h-4 w-4 sm:h-5 sm:w-5 -mr-0.5" />
                ) : (
                  <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
