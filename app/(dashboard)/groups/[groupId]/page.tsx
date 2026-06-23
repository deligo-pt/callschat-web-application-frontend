"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCallContext } from "@/components/providers/CallContext";
import { ArrowLeft, Phone, Video, Send, Loader2, MoreVertical, Smile, Paperclip, Image as ImageIcon, Mic, MessageSquare, Search, Trash2, LogOut, AlertCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import apiClient from "@/services/api.client";
import { useGroupChat } from "@/hooks/useGroupChat";

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

export default function GroupChatPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  
  const { startGroupCall, joinGroupCall, activeGroupCalls } = useCallContext();
  
  const [groupDetails, setGroupDetails] = useState<any>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const { messages, sendMessage, isReady, error } = useGroupChat(groupId, currentUserId);

  const isCallActive = activeGroupCalls.includes(groupId);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const [detailsRes, membersRes] = await Promise.all([
          apiClient.get(`/groups/${groupId}`),
          apiClient.get(`/groups/${groupId}/members`),
        ]);

        if (detailsRes.data?.success) {
          setGroupDetails(detailsRes.data.data);
        }
        if (membersRes.data?.success) {
          setGroupMembers(membersRes.data.data.members || []);
        }
      } catch (error) {
        console.error("Failed to fetch group data", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (groupId) {
      fetchGroupData();
    }
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !isReady) return;
    sendMessage(inputText);
    setInputText("");
  };

  const handleLeaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this group?")) return;
    try {
      if (!currentUserId) return;
      await apiClient.delete(`/groups/${groupId}/members/${currentUserId}`);
      router.push("/groups");
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#EEF2FF]">
        <Loader2 className="h-8 w-8 animate-spin text-[#3B58F5]" />
      </div>
    );
  }

  const groupName = groupDetails?.name || "Group Chat";
  const avatarImage = groupDetails?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName)}&background=3B58F5&color=fff&size=256`;
  const memberCount = groupDetails?.memberCount || groupMembers.length || 0;

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#EEF2FF]">
      
      {/* Main Chat Area */}
      <div className={cn("flex flex-col h-full transition-all duration-300", showGroupInfo ? "w-0 lg:flex-1 hidden lg:flex" : "flex-1")}>
        
        {/* Header */}
        <div className="flex items-center justify-between bg-[#3B58F5] px-4 py-4 z-10 shrink-0 text-white shadow-md cursor-pointer transition-colors hover:bg-[#344EDD]" onClick={() => setShowGroupInfo(true)}>
          <div className="flex items-center gap-3">
            <Link
              href="/groups"
              className="rounded-full p-1 transition-colors hover:bg-white/10"
              onClick={(e) => e.stopPropagation()}
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
                  {memberCount > 0 ? `Group · ${memberCount} Members` : "Online"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
            <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors" onClick={() => setShowGroupInfo(true)}>
              <MoreVertical className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6 relative">
          {!isReady && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full z-10 text-[#8F95B2] gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#3B58F5]" />
              <p className="text-sm font-medium">Unlocking Group Keys...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full z-10 text-[#8F95B2]">
              <p className="bg-white px-4 py-2 rounded-lg text-sm shadow-sm text-center">
                This is the start of the <strong>{groupName}</strong> group.<br/>
                Messages will appear here.
              </p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.senderId === currentUserId;
              const showAvatar = !isMe && (index === messages.length - 1 || messages[index + 1]?.senderId !== msg.senderId);
              const isNextSameSender = index < messages.length - 1 && messages[index + 1]?.senderId === msg.senderId;
              
              const senderName = msg.sender?.profile?.displayName || "Unknown";
              const senderInitials = senderName.charAt(0).toUpperCase();
              
              const formatTime = (dateString: string) => {
                const d = new Date(dateString);
                return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              };

              return (
                <div key={msg.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                  {!isMe && (
                    <div className="w-8 shrink-0 mr-3 flex items-end pb-5">
                      {showAvatar && (
                        <div className="h-8 w-8 rounded-full flex items-center justify-center bg-[#3B58F5] text-white text-xs font-bold shadow-sm">
                          {msg.sender?.profile?.avatarUrl ? (
                            <img src={msg.sender.profile.avatarUrl} className="h-full w-full rounded-full object-cover" alt={senderName} />
                          ) : (
                            senderInitials
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className={cn("flex flex-col max-w-[75%]", isMe ? "items-end" : "items-start")}>
                    {!isMe && (index === 0 || messages[index - 1]?.senderId !== msg.senderId) && (
                      <span className="text-[12px] font-semibold text-[#3B58F5] ml-1 mb-1">
                        {senderName}
                      </span>
                    )}

                    <div
                      className={cn(
                        "px-4 py-3 text-[14.5px] shadow-sm leading-relaxed",
                        isMe 
                          ? "bg-[#3B58F5] text-white rounded-[20px] rounded-br-sm" 
                          : "bg-white text-[#11142D] rounded-[20px] rounded-bl-sm"
                      )}
                      style={{ wordBreak: "break-word" }}
                    >
                      {msg.text}
                    </div>

                    {(!isNextSameSender || isMe) && (
                      <div className={cn("flex flex-col mt-1", isMe ? "items-end mr-1" : "ml-1")}>
                        <span className="text-[11px] font-medium text-[#8F95B2]">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="bg-white px-4 py-3 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
          <form onSubmit={handleSend} className="flex items-center gap-3 w-full max-w-4xl mx-auto">
            <button type="button" className="text-[#8F95B2] hover:text-[#3B58F5] transition-colors shrink-0 hidden sm:block">
              <Smile className="h-6 w-6" strokeWidth={1.5} />
            </button>
            <button type="button" className="text-[#8F95B2] hover:text-[#3B58F5] transition-colors shrink-0">
              <Paperclip className="h-[22px] w-[22px]" strokeWidth={1.5} />
            </button>
            <button type="button" className="text-[#8F95B2] hover:text-[#3B58F5] transition-colors shrink-0 hidden sm:block">
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
              type={inputText.trim() && isReady ? "submit" : "button"}
              disabled={!isReady}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#3B58F5] text-white transition-transform hover:scale-105 active:scale-95 shadow-md disabled:opacity-50 disabled:hover:scale-100"
            >
              {inputText.trim() && isReady ? (
                <Send className="h-5 w-5 ml-0.5" strokeWidth={2} />
              ) : (
                <Mic className="h-5 w-5" strokeWidth={2} />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Sidebar - Group Info */}
      {showGroupInfo && (
        <div className="w-full lg:w-[400px] h-full flex flex-col bg-white border-l border-[#EEF2FF] shadow-xl animate-in slide-in-from-right duration-300 z-50 shrink-0">
          
          {/* Sidebar Header */}
          <div className="flex items-center gap-4 bg-[#3B58F5] px-4 py-4 shrink-0 text-white shadow-sm">
            <button
              onClick={() => setShowGroupInfo(false)}
              className="rounded-full p-1 transition-colors hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2} />
            </button>
            <h2 className="text-[16px] font-semibold">Group info</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Avatar & Name Section */}
            <div className="flex flex-col items-center pt-8 pb-6 bg-white">
              <img
                src={avatarImage}
                alt={groupName}
                className="w-32 h-32 rounded-full object-cover border border-[#EEF2FF] shadow-sm mb-4"
              />
              <h2 className="text-[24px] font-bold text-[#11142D]">{groupName}</h2>
              <p className="text-[13px] font-medium text-[#8F95B2] mt-1">
                Group · {memberCount} Members
              </p>

              {/* Action Buttons Row */}
              <div className="flex gap-4 mt-6">
                <button className="flex flex-col items-center gap-1.5 group" onClick={() => setShowGroupInfo(false)}>
                  <div className="w-12 h-12 rounded-[16px] bg-[#EEF2FF] flex items-center justify-center text-[#3B58F5] transition-colors group-hover:bg-[#E0E7FF]">
                    <MessageSquare className="w-5 h-5" fill="currentColor" strokeWidth={0} />
                  </div>
                  <span className="text-[11px] font-semibold text-[#3B58F5]">Message</span>
                </button>
                <button className="flex flex-col items-center gap-1.5 group" onClick={() => startGroupCall(groupId, 'AUDIO')}>
                  <div className="w-12 h-12 rounded-[16px] bg-[#EEF2FF] flex items-center justify-center text-[#3B58F5] transition-colors group-hover:bg-[#E0E7FF]">
                    <Phone className="w-5 h-5" fill="currentColor" strokeWidth={0} />
                  </div>
                  <span className="text-[11px] font-semibold text-[#3B58F5]">Audio</span>
                </button>
                <button className="flex flex-col items-center gap-1.5 group" onClick={() => startGroupCall(groupId, 'VIDEO')}>
                  <div className="w-12 h-12 rounded-[16px] bg-[#EEF2FF] flex items-center justify-center text-[#3B58F5] transition-colors group-hover:bg-[#E0E7FF]">
                    <Video className="w-6 h-6" fill="currentColor" strokeWidth={0} />
                  </div>
                  <span className="text-[11px] font-semibold text-[#3B58F5]">Video</span>
                </button>
                <button className="flex flex-col items-center gap-1.5 group">
                  <div className="w-12 h-12 rounded-[16px] bg-[#EEF2FF] flex items-center justify-center text-[#3B58F5] transition-colors group-hover:bg-[#E0E7FF]">
                    <Search className="w-5 h-5" strokeWidth={2.5} />
                  </div>
                  <span className="text-[11px] font-semibold text-[#3B58F5]">Search</span>
                </button>
              </div>
            </div>

            <div className="h-2 bg-[#F4F6FC] w-full" />

            {/* Media Section */}
            <div className="py-5 px-6 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-bold text-[#11142D]">Media, links, and docs</h3>
                <button className="flex items-center text-[12px] font-semibold text-[#3B58F5]">
                  67 <ChevronRight className="w-4 h-4 ml-0.5" />
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <div className="w-20 h-20 shrink-0 rounded-xl bg-[#F4F6FC] overflow-hidden border border-[#EEF2FF]">
                  <img src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=150&h=150&fit=crop" className="w-full h-full object-cover" alt="Media" />
                </div>
                <div className="w-20 h-20 shrink-0 rounded-xl bg-[#F4F6FC] overflow-hidden border border-[#EEF2FF]">
                  <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=150&h=150&fit=crop" className="w-full h-full object-cover" alt="Media" />
                </div>
                <div className="w-20 h-20 shrink-0 rounded-xl bg-[#F4F6FC] overflow-hidden border border-[#EEF2FF]">
                  <img src="https://images.unsplash.com/photo-1556761175-4b46a572b786?w=150&h=150&fit=crop" className="w-full h-full object-cover" alt="Media" />
                </div>
                <div className="w-20 h-20 shrink-0 rounded-xl bg-[#F4F6FC] overflow-hidden border border-[#EEF2FF]">
                  <img src="https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=150&h=150&fit=crop" className="w-full h-full object-cover" alt="Media" />
                </div>
              </div>
            </div>

            <div className="h-2 bg-[#F4F6FC] w-full" />

            {/* Members Section */}
            <div className="py-5 bg-white">
              <div className="px-6 mb-3">
                <h3 className="text-[13px] font-bold text-[#8F95B2] uppercase tracking-wider">{memberCount} Members</h3>
              </div>
              <div className="flex flex-col">
                {groupMembers.map((member, index) => {
                  const mName = member.profile?.name || member.user?.profile?.displayName || "Unknown Member";
                  const mRole = member.role || "Member";
                  const mAvatar = member.profile?.avatarUrl || member.user?.profile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(mName)}&background=random`;
                  
                  return (
                    <div key={member.id || index} className="flex items-center justify-between px-6 py-3 hover:bg-[#F4F6FC] transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <img src={mAvatar} alt={mName} className="w-10 h-10 rounded-full object-cover" />
                        <span className="text-[14px] font-semibold text-[#11142D]">{mName}</span>
                      </div>
                      <span className="text-[11px] font-bold text-[#3B58F5] bg-[#EEF2FF] px-2 py-0.5 rounded uppercase tracking-wider">
                        {mRole}
                      </span>
                    </div>
                  );
                })}
                {groupMembers.length === 0 && (
                  <div className="px-6 py-4 text-center text-sm text-[#8F95B2]">
                    No members to display.
                  </div>
                )}
              </div>
            </div>

            <div className="h-2 bg-[#F4F6FC] w-full" />

            {/* Destructive Actions */}
            <div className="py-4 bg-white flex flex-col mb-8">
              <button className="flex items-center gap-4 px-6 py-3.5 hover:bg-red-50 transition-colors w-full text-left">
                <Trash2 className="w-5 h-5 text-red-500" strokeWidth={2} />
                <span className="text-[14.5px] font-semibold text-red-500">Clear Chat</span>
              </button>
              <button onClick={handleLeaveGroup} className="flex items-center gap-4 px-6 py-3.5 hover:bg-red-50 transition-colors w-full text-left">
                <LogOut className="w-5 h-5 text-red-500" strokeWidth={2} />
                <span className="text-[14.5px] font-semibold text-red-500">Leave Group</span>
              </button>
              <button className="flex items-center gap-4 px-6 py-3.5 hover:bg-red-50 transition-colors w-full text-left">
                <AlertCircle className="w-5 h-5 text-red-500" strokeWidth={2} />
                <span className="text-[14.5px] font-semibold text-red-500">Report Group</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
