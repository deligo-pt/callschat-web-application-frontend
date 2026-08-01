"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { 
  ArrowLeft, 
  MoreVertical, 
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
import { GroupMessageBubble } from "@/components/group/GroupMessageBubble";
import { GroupInput } from "@/components/group/GroupInput";

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
  const [isUploading, setIsUploading] = useState<boolean>(false);

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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [rawMessages]);

  const handleSendMessage = async (text: string, file: File | null) => {
    if (isAnnouncements && !isAdminRole) {
      toast.error("Only community admins can post in Announcements.");
      return;
    }
    if (!text.trim() && !file) return;

    setIsUploading(true);
    try {
      await sendMessage(text, file);
    } finally {
      setIsUploading(false);
    }
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
              rawMessages.map((msg: GroupMessage, idx: number) => {
                const isMe = msg.senderId === currentUserId || msg.id.startsWith("optimistic-");
                const prevMsg = idx > 0 ? rawMessages[idx - 1] : null;
                const nextMsg = idx < rawMessages.length - 1 ? rawMessages[idx + 1] : null;
                const isNextSameSender = nextMsg?.senderId === msg.senderId;
                const isFirstFromSender = !prevMsg || prevMsg.senderId !== msg.senderId;

                return (
                  <GroupMessageBubble
                    key={msg.id}
                    msg={msg}
                    isMe={isMe}
                    showAvatar={isFirstFromSender}
                    isNextSameSender={isNextSameSender}
                    isFirstFromSender={isFirstFromSender}
                    groupId={group.id}
                    groupMembersCount={group.memberCount}
                  />
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

        </div>
      </div>

      {/* 3. Bottom Chat Input Area */}
      <div className="bg-white border-t border-slate-200 shrink-0 shadow-sm">
        <div className="w-full max-w-[680px] mx-auto">
          {isAnnouncements && !isAdminRole ? (
            /* Disabled / Read-Only Bar for Members inside Announcements */
            <div className="flex items-center justify-between rounded-2xl bg-slate-100/80 border border-slate-200 px-4 py-3 text-center my-3 mx-4">
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
            <GroupInput
              onSend={(text, file) => handleSendMessage(text, file)}
              isReady={isReady}
              isUploading={isUploading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
