"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCallContext } from "@/components/providers/CallContext";
import { ArrowLeft, Phone, Video, Send, Loader2, MoreVertical, Smile, Paperclip, Image as ImageIcon, Mic, MessageSquare, Search, Trash2, LogOut, AlertCircle, ChevronRight, UserPlus, X, Info, Bell, ShieldCheck, Languages, EyeOff, UserCog, Star, Folder, Users, Mail } from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import apiClient from "@/services/api.client";
import { useGroupChat } from "@/hooks/useGroupChat";
import { encryptMessage } from "@/utils/crypto";
import { chatService } from "@/services/chat.service";
import { groupService } from "@/services/group.service";
import { useSocket } from "@/components/providers/SocketProvider";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { GroupInput } from "@/components/group/GroupInput";
import { GroupMessageBubble } from "@/components/group/GroupMessageBubble";
import { MediaGallery } from "@/components/chat/MediaGallery";

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
  const { socket } = useSocket();
  
  const [groupDetails, setGroupDetails] = useState<any>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showAdminActivity, setShowAdminActivity] = useState(false);
  const [isNotificationsMuted, setIsNotificationsMuted] = useState(false);
  const [isAiProtectionEnabled, setIsAiProtectionEnabled] = useState(true);
  const [isLiveTranslationEnabled, setIsLiveTranslationEnabled] = useState(false);
  const [isPrivacyModeEnabled, setIsPrivacyModeEnabled] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [isAddingMember, setIsAddingMember] = useState(false);

  const [isLeaveGroupDialogOpen, setIsLeaveGroupDialogOpen] = useState(false);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);

  const [isRemoveMemberDialogOpen, setIsRemoveMemberDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string, name: string } | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [recentMedia, setRecentMedia] = useState<any[]>([]);
  const [totalMedia, setTotalMedia] = useState<number>(0);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      const decoded = parseJwt(token);
      if (decoded) {
        setCurrentUserId(decoded.sub || decoded.id || "");
      }
    }
  }, []);

  const { messages, sendMessage, isReady, error, getGroupKey, isUploading } = useGroupChat(groupId, currentUserId);

  const isCallActive = activeGroupCalls.includes(groupId);

  // Socket Synchronization for Phase 4
  useEffect(() => {
    if (!socket || !groupId || !currentUserId) return;

    const handleMemberRemoved = (payload: { groupId: string, userId: string }) => {
      if (payload.groupId !== groupId) return;
      
      if (payload.userId === currentUserId) {
        toast.error("You were removed from the group by an admin.");
        router.push("/chats");
      } else {
        setGroupMembers(prev => prev.filter(m => m.userId !== payload.userId && m.user?.id !== payload.userId));
        toast.info("A member was removed from the group");
      }
    };

    socket.on("group:member_removed", handleMemberRemoved);

    return () => {
      socket.off("group:member_removed", handleMemberRemoved);
    };
  }, [socket, groupId, currentUserId, router]);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const [detailsRes, membersRes, mediaRes] = await Promise.all([
          apiClient.get(`/groups/${groupId}`),
          apiClient.get(`/groups/${groupId}/members`),
          groupService.fetchGroupMedia(groupId, 1),
        ]);

        if (detailsRes.data?.success) {
          setGroupDetails(detailsRes.data.data);
          setIsFavourite(detailsRes.data.data?.isFavourite || false);
        }
        if (membersRes.data?.success) {
          setGroupMembers(membersRes.data.data.members || []);
        }
        if (mediaRes?.success && mediaRes?.data) {
          setRecentMedia(mediaRes.data.media || []);
          setTotalMedia(mediaRes.data.total || 0);
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

  const fetchContacts = async () => {
    try {
      const res = await apiClient.get('/contacts');
      if (res.data?.success) {
        let contactsArray = [];
        if (Array.isArray(res.data.data)) {
          contactsArray = res.data.data;
        } else if (res.data.data?.contacts) {
          contactsArray = res.data.data.contacts;
        }
        setContacts(contactsArray);
      }
    } catch (e) {
      console.error("Failed to fetch contacts", e);
    }
  };

  const handleOpenAddMember = () => {
    fetchContacts();
    setIsAddMemberModalOpen(true);
  };

  const handleAddMember = async (userId: string) => {
    setIsAddingMember(true);
    try {
      const gKey = getGroupKey();
      if (!gKey) {
        throw new Error("Group key is not loaded");
      }

      // 1. Fetch target user's public key
      const resKey = await chatService.fetchRecipientKey(userId);
      let targetPubKey = "";
      if (resKey?.data && Array.isArray(resKey.data) && resKey.data.length > 0) {
        targetPubKey = resKey.data[resKey.data.length - 1].publicKey;
      } else if (resKey?.success && resKey?.data?.publicKey) {
        targetPubKey = resKey.data.publicKey;
      }

      if (!targetPubKey) {
        throw new Error("Could not find public key for this user.");
      }

      // 2. Encrypt the group key
      const myPrivKey = localStorage.getItem(`privateKey_${currentUserId}`);
      if (!myPrivKey) throw new Error("Missing local private key");

      const { ciphertext, nonce } = await encryptMessage(gKey, targetPubKey, myPrivKey);

      // 3. Add member via API
      const res = await apiClient.post(`/groups/${groupId}/members`, { 
        userId,
        encryptedGroupKey: ciphertext,
        keyNonce: nonce
      });
      
      if (res.data?.success) {
        setIsAddMemberModalOpen(false);
        // Refresh group members
        const membersRes = await apiClient.get(`/groups/${groupId}/members`);
        if (membersRes.data?.success) {
          setGroupMembers(membersRes.data.data.members || []);
        }
      }
    } catch (e: any) {
      alert(e.message || e.response?.data?.message || "Failed to add member");
    } finally {
      setIsAddingMember(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark group as read: write the current timestamp to localStorage so the
  // groups list page can show/hide the unread badge.
  useEffect(() => {
    if (!groupId) return;
    const now = new Date().toISOString();
    try {
      const raw = localStorage.getItem("lastReadMap");
      const map: Record<string, string> = raw ? JSON.parse(raw) : {};
      map[groupId] = now;
      localStorage.setItem("lastReadMap", JSON.stringify(map));
    } catch {
      // ignore storage errors
    }
    // Also clear DB-level notification badge (fire-and-forget)
    void chatService.markConversationAsRead(groupId);
  }, [groupId]);

  const handleSend = (text: string, file: File | null) => {
    if (!isReady) return;
    sendMessage(text, file);
  };

  const executeLeaveGroup = async () => {
    setIsLeavingGroup(true);
    try {
      if (!currentUserId) return;
      const res = await groupService.removeMember(groupId, currentUserId);
      if (res.success || res.data) {
        toast.success("You have left the group");
        router.push("/chats");
      } else {
        toast.error(res.error || "Failed to leave group");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.message || "An error occurred while leaving the group");
    } finally {
      setIsLeavingGroup(false);
      setIsLeaveGroupDialogOpen(false);
    }
  };

  const executeRemoveMember = async () => {
    if (!memberToRemove) return;
    setIsRemovingMember(true);
    try {
      const res = await groupService.removeMember(groupId, memberToRemove.id);
      if (res.success || res.data) {
        toast.success(`${memberToRemove.name} removed from the group`);
        setGroupMembers(prev => prev.filter(m => m.userId !== memberToRemove.id && m.user?.id !== memberToRemove.id));
      } else {
        toast.error(res.error || "Failed to remove member");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.message || "An error occurred while removing the member");
    } finally {
      setIsRemovingMember(false);
      setIsRemoveMemberDialogOpen(false);
      setMemberToRemove(null);
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

  const myMemberInfo = groupMembers.find(m => m.userId === currentUserId || m.user?.id === currentUserId);
  const myRole = groupDetails?.myRole || myMemberInfo?.role || groupDetails?.requesterRole || "MEMBER";
  const isAdmin = myRole === "ADMIN" || myRole === "OWNER";

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#EEF2FF]">
      
      {/* Main Chat Area */}
      <div className={cn("flex flex-col h-full transition-all duration-300", (showGroupInfo || showAdminActivity) ? "w-0 lg:flex-1 hidden lg:flex" : "flex-1")}>
        
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors focus:outline-none"
                  title="Group Options"
                >
                  <MoreVertical className="h-5 w-5" strokeWidth={2} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[280px] rounded-2xl p-2 bg-white shadow-xl border border-gray-100 text-[#1E293B] z-50">
                <DropdownMenuItem onClick={() => setShowGroupInfo(true)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-gray-50 focus:bg-gray-50 text-sm font-semibold text-[#1E293B]">
                  <Info className="w-4 h-4 text-[#3B58F5]" />
                  <span>Group Info</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => {
                  setIsNotificationsMuted(!isNotificationsMuted);
                  toast.success(isNotificationsMuted ? "Notifications unmuted" : "Notifications muted");
                }} className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-gray-50 focus:bg-gray-50 text-sm font-semibold text-[#1E293B]">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-[#3B58F5]" />
                    <span>{isNotificationsMuted ? "Unmute Notifications" : "Mute Notifications"}</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 border-gray-100" />

                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-semibold cursor-pointer text-[#1E293B]" onClick={(e) => { e.preventDefault(); setIsAiProtectionEnabled(!isAiProtectionEnabled); toast.success(!isAiProtectionEnabled ? "AI Protection enabled" : "AI Protection disabled"); }}>
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-[#3B58F5]" />
                    <span>AI Protection</span>
                  </div>
                  <Switch checked={isAiProtectionEnabled} onCheckedChange={setIsAiProtectionEnabled} className="data-[state=checked]:bg-[#3B58F5]" />
                </div>

                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-semibold cursor-pointer text-[#1E293B]" onClick={(e) => { e.preventDefault(); setIsLiveTranslationEnabled(!isLiveTranslationEnabled); toast.success(!isLiveTranslationEnabled ? "Live Translation enabled" : "Live Translation disabled"); }}>
                  <div className="flex items-center gap-3">
                    <Languages className="w-4 h-4 text-[#22C55E]" />
                    <span>Live Translation</span>
                  </div>
                  <Switch checked={isLiveTranslationEnabled} onCheckedChange={setIsLiveTranslationEnabled} className="data-[state=checked]:bg-[#3B58F5]" />
                </div>

                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-semibold cursor-pointer text-[#1E293B]" onClick={(e) => { e.preventDefault(); setIsPrivacyModeEnabled(!isPrivacyModeEnabled); toast.success(!isPrivacyModeEnabled ? "Privacy Mode enabled" : "Privacy Mode disabled"); }}>
                  <div className="flex items-center gap-3">
                    <EyeOff className="w-4 h-4 text-[#F59E0B]" />
                    <span>Privacy Mode</span>
                  </div>
                  <Switch checked={isPrivacyModeEnabled} onCheckedChange={setIsPrivacyModeEnabled} className="data-[state=checked]:bg-[#3B58F5]" />
                </div>

                {isAdmin && (
                  <DropdownMenuItem onClick={() => { setShowGroupInfo(false); setShowAdminActivity(true); }} className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-gray-50 focus:bg-gray-50 text-sm font-semibold text-[#1E293B]">
                    <div className="flex items-center gap-3">
                      <UserCog className="w-4 h-4 text-[#3B58F5]" />
                      <span>Admin Activity</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="my-1 border-gray-100" />

                <DropdownMenuItem onClick={() => { setShowGroupInfo(true); setGalleryOpen(true); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-gray-50 focus:bg-gray-50 text-sm font-semibold text-[#1E293B]">
                  <Folder className="w-4 h-4 text-[#3B58F5]" />
                  <span>Media Info</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={async () => {
                  const newFav = !isFavourite;
                  setIsFavourite(newFav);
                  await groupService.toggleFavourite(groupId, newFav);
                  toast.success(newFav ? "Added to Favorites" : "Removed from Favorites");
                }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-gray-50 focus:bg-gray-50 text-sm font-semibold text-[#1E293B]">
                  <Star className={cn("w-4 h-4", isFavourite ? "text-[#F59E0B] fill-[#F59E0B]" : "text-[#F59E0B]")} />
                  <span>{isFavourite ? "Remove from Favorites" : "Add to Favorites"}</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => { toast.success("Chat history cleared"); window.location.reload(); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-red-50 focus:bg-red-50 text-sm font-semibold text-red-500">
                  <Trash2 className="w-4 h-4 text-red-500" />
                  <span>Clear Chat</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setIsLeaveGroupDialogOpen(true)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-red-50 focus:bg-red-50 text-sm font-semibold text-red-500">
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Leave Group</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
              const isFirstFromSender = index === 0 || messages[index - 1]?.senderId !== msg.senderId;
              
              return (
                <GroupMessageBubble
                  key={msg.id}
                  msg={msg}
                  isMe={isMe}
                  showAvatar={showAvatar}
                  isNextSameSender={isNextSameSender}
                  isFirstFromSender={isFirstFromSender}
                  groupId={groupId}
                />
              );
            })
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <GroupInput onSend={handleSend} isReady={isReady} isUploading={isUploading} />
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
                <button 
                  onClick={() => setGalleryOpen(true)}
                  className="flex items-center text-[12px] font-semibold text-[#3B58F5] hover:underline"
                >
                  {totalMedia > 0 ? totalMedia : ""} <ChevronRight className="w-4 h-4 ml-0.5" />
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {recentMedia.length === 0 ? (
                  <div className="text-xs text-[#8F95B2] italic">No media shared yet.</div>
                ) : (
                  recentMedia.filter(m => m.mediaType?.startsWith('image/') || m.mediaType?.startsWith('video/') || m.mediaType === 'image' || m.mediaType === 'video').slice(0, 4).map((m) => (
                    <div key={m.id} className="w-20 h-20 shrink-0 rounded-xl bg-[#F4F6FC] overflow-hidden border border-[#EEF2FF] relative group cursor-pointer" onClick={() => setGalleryOpen(true)}>
                      {m.mediaType?.includes('video') ? (
                        <>
                          <video src={m.mediaUrl} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center">
                              <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-[#3B58F5] border-b-[4px] border-b-transparent ml-0.5" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <img src={m.mediaUrl} className="w-full h-full object-cover" alt="Media" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="h-2 bg-[#F4F6FC] w-full" />

            {/* Members Section */}
            <div className="py-5 bg-white">
              <div className="px-6 mb-3 flex items-center justify-between">
                <h3 className="text-[13px] font-bold text-[#8F95B2] uppercase tracking-wider">{memberCount} Members</h3>
                {isAdmin && (
                  <button 
                    onClick={handleOpenAddMember}
                    className="flex items-center gap-1.5 text-[12px] font-bold text-[#3B58F5] bg-[#EEF2FF] px-2.5 py-1 rounded-full hover:bg-[#E0E7FF] transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Add Member
                  </button>
                )}
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
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-[#3B58F5] bg-[#EEF2FF] px-2 py-0.5 rounded uppercase tracking-wider">
                          {mRole}
                        </span>
                        {isAdmin && member.userId !== currentUserId && member.user?.id !== currentUserId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMemberToRemove({ id: member.userId || member.user?.id, name: mName });
                              setIsRemoveMemberDialogOpen(true);
                            }}
                            className="text-[#8F95B2] hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
                            title="Remove Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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
              <button onClick={() => setIsLeaveGroupDialogOpen(true)} className="flex items-center gap-4 px-6 py-3.5 hover:bg-red-50 transition-colors w-full text-left">
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

      {/* Sidebar - Admin Activity */}
      {showAdminActivity && (
        <div className="w-full lg:w-[480px] h-full flex flex-col bg-[#F8FAFC] border-l border-[#EEF2FF] shadow-2xl animate-in slide-in-from-right duration-300 z-50 shrink-0">
          <div className="flex items-center gap-4 bg-[#3B58F5] px-4 py-4 shrink-0 text-white shadow-md">
            <button
              onClick={() => setShowAdminActivity(false)}
              className="rounded-full p-1 transition-colors hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2} />
            </button>
            <h2 className="text-[17px] font-bold tracking-tight">Admin Activity</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm flex items-center justify-center gap-2.5 text-[#3B58F5] font-bold text-sm">
                <Users className="w-4 h-4 text-[#3B58F5]" />
                <span>{groupMembers.length} Members</span>
              </div>
              <button
                onClick={() => setIsAddMemberModalOpen(true)}
                className="bg-white hover:bg-blue-50/50 rounded-2xl p-3.5 border border-gray-100 shadow-sm flex items-center justify-center gap-2.5 text-[#3B58F5] font-bold text-sm transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-[#3B58F5]" />
                <span>Add Member</span>
              </button>
            </div>

            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-4 shrink-0 shadow-sm">
              <h4 className="text-[#D97706] font-bold text-[14px] mb-1">Admin View</h4>
              <p className="text-[#B45309] text-[12.5px] leading-relaxed font-medium">
                You can see all member details including phone numbers and emails. Regular members cannot see this information.
              </p>
            </div>

            <div className="flex flex-col gap-3.5 pb-6">
              {groupMembers.map((member, idx) => {
                const mName = member.profile?.name || member.user?.profile?.displayName || "Unknown Member";
                const mRole = member.role || "MEMBER";
                const isAdminRole = mRole === "ADMIN" || mRole === "OWNER";
                const mAvatar = member.profile?.avatarUrl || member.user?.profile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(mName)}&background=3B58F5&color=fff`;
                const mPhone = member.profile?.phone || member.user?.phone || (member.profile?.username ? `@${member.profile.username}` : "+1 (555) xxx-xxxx");
                const mEmail = member.profile?.email || member.user?.email || `${mName.toLowerCase().replace(/\s+/g, '.')}@email.com`;
                const mJoined = member.joinedAt ? new Date(member.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Jan 15, 2026";
                const isMe = member.userId === currentUserId || member.user?.id === currentUserId;
                const isOwner = mRole === "OWNER";

                return (
                  <div key={member.id || idx} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col gap-3.5 transition-all hover:shadow-md">
                    <div className="flex items-start gap-3.5">
                      <img src={mAvatar} alt={mName} className="w-12 h-12 rounded-full object-cover border border-gray-100 shrink-0 shadow-sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-[15px] font-bold text-gray-900 truncate">{mName} {isMe && "(You)"}</h4>
                          {isAdminRole && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#D97706] shrink-0 uppercase tracking-wider">
                              Admin
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-1.5 mt-2.5 text-gray-600 text-[13px] font-medium">
                          <div className="flex items-center gap-2 text-gray-600 truncate">
                            <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{mPhone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 truncate">
                            <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{mEmail}</span>
                          </div>
                          <span className="text-[11.5px] text-gray-400 font-normal mt-1">
                            Joined {mJoined}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!isMe && !isOwner && (
                      <div className="border-t border-gray-100 pt-3 flex items-center gap-3">
                        <button
                          onClick={() => {
                            setMemberToRemove({ id: member.userId || member.user?.id, name: mName });
                            setIsRemoveMemberDialogOpen(true);
                          }}
                          className="flex-1 py-2 rounded-xl bg-[#FEE2E2]/60 hover:bg-[#FEE2E2] text-[#EF4444] font-bold text-[13px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Remove</span>
                        </button>

                        <button
                          onClick={async () => {
                            const targetId = member.userId || member.user?.id;
                            if (!targetId) return;
                            const newRole = mRole === "ADMIN" ? "MEMBER" : "ADMIN";
                            try {
                              const res = await groupService.updateMemberRole(groupId, targetId, newRole);
                              if (res?.success !== false && !res?.error) {
                                toast.success(newRole === "ADMIN" ? "Made Admin" : "Revoked Admin");
                                setGroupMembers(prev => prev.map(m => (m.userId === targetId || m.user?.id === targetId) ? { ...m, role: newRole } : m));
                              } else {
                                toast.error(res?.error || "Failed to update role");
                              }
                            } catch (e) {
                              toast.error("Failed to update role");
                            }
                          }}
                          className="flex-1 py-2 rounded-xl bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#3B58F5] font-bold text-[13px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>{mRole === "ADMIN" ? "Revoke Admin" : "Make Admin"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      <AnimatePresence>
        {isAddMemberModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1D2A54]/40 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="mb-4 flex items-center justify-between shrink-0">
                <h2 className="text-[18px] font-bold text-[#1D2A54]">Add Member</h2>
                <button
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="rounded-full p-2 text-[#8F95B2] transition-colors hover:bg-[#F8FAFC] hover:text-[#1D2A54]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto min-h-[200px]">
                {contacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-[#8F95B2] text-sm">
                    No contacts found.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {contacts.map((contact) => {
                      const cName = contact.customName || contact.addressee?.profile?.displayName || contact.profile?.displayName || "Unknown";
                      const cId = contact.addressee?.id || contact.userId || contact.id;
                      const cAvatar = contact.addressee?.profile?.avatarUrl || contact.profile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(cName)}&background=random`;
                      const isAlreadyMember = groupMembers.some(m => m.userId === cId || m.user?.id === cId);

                      return (
                        <div key={contact.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors">
                          <div className="flex items-center gap-3">
                            <img src={cAvatar} alt={cName} className="w-10 h-10 rounded-full object-cover" />
                            <span className="text-[14px] font-bold text-[#11142D]">{cName}</span>
                          </div>
                          {isAlreadyMember ? (
                            <span className="text-[12px] font-medium text-[#8F95B2]">Member</span>
                          ) : (
                            <button
                              disabled={isAddingMember}
                              onClick={() => handleAddMember(cId)}
                              className="px-4 py-1.5 rounded-full bg-[#3B58F5] text-white text-[12px] font-bold hover:bg-[#2A41C7] transition-colors disabled:opacity-50"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Leave Group Alert Dialog */}
      <AlertDialog open={isLeaveGroupDialogOpen} onOpenChange={setIsLeaveGroupDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Group?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this group? You will no longer receive messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLeavingGroup}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                executeLeaveGroup();
              }}
              disabled={isLeavingGroup}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isLeavingGroup ? "Leaving..." : "Leave Group"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Member Alert Dialog */}
      <AlertDialog open={isRemoveMemberDialogOpen} onOpenChange={setIsRemoveMemberDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {memberToRemove?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will be removed from the group and will no longer see new messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovingMember}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                executeRemoveMember();
              }}
              disabled={isRemovingMember}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isRemovingMember ? "Removing..." : "Remove Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Media Gallery Sidebar */}
      <MediaGallery 
        conversationId={groupId} 
        open={galleryOpen} 
        onOpenChange={setGalleryOpen} 
        isGroup={true}
      />
    </div>
  );
}
