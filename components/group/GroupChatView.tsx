"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCallContext } from "@/components/providers/CallContext";
import {
  ArrowLeft,
  Phone,
  Video,
  Send,
  Loader2,
  MoreVertical,
  Smile,
  Paperclip,
  Image as ImageIcon,
  Mic,
  MessageSquare,
  Search,
  Trash2,
  LogOut,
  AlertCircle,
  ChevronRight,
  UserPlus,
  X,
  Info,
  Bell,
  BellOff,
  ShieldCheck,
  Languages,
  EyeOff,
  UserCog,
  Heart,
  Folder,
  Users,
  Mail,
  Pin,
  PinOff,
  Camera,
  Link2,
  Settings,
  BarChart2,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import apiClient from "@/services/api.client";
import { useGroupChat, QuotedMessage, GroupMessage } from "@/hooks/useGroupChat";
import { useContacts, Contact } from "@/hooks/useContacts";
import { encryptMessage, decryptMessage, generateAndStoreKeyPair } from "@/utils/crypto";
import { getUserPrivateKey, getStoredGroupKey } from "@/utils/keyStore";
import { chatService } from "@/services/chat.service";
import { groupService } from "@/services/group.service";
import { useSocket } from "@/components/providers/SocketProvider";
import { toast } from "sonner";
import { compressImage } from "@/utils/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GroupInput } from "@/components/group/GroupInput";
import { GroupMessageBubble } from "@/components/group/GroupMessageBubble";
import { MediaGallery } from "@/components/chat/MediaGallery";
import { MessageInfoModal } from "@/components/group/MessageInfoModal";
import { CreatePollModal } from "@/components/group/CreatePollModal";
import { InviteLinkModal } from "@/components/group/InviteLinkModal";
import { GroupSettingsDrawer } from "@/components/group/GroupSettingsDrawer";
import { AddMemberModal } from "@/components/group/AddMemberModal";
import { useTranslations } from "next-intl";
import { useGroupStore } from "@/hooks/useGroupStore";
import { useUser } from "@/context/UserContext";
import { getOptimizedImageUrl, getRawMediaUrl } from "@/utils/image";

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

export interface GroupChatViewProps {
  groupId: string;
  backUrl?: string;
}

export function GroupChatView({ groupId: propGroupId, backUrl = "/chats" }: GroupChatViewProps) {
  const t = useTranslations("options");
  const params = useParams();
  const router = useRouter();
  const groupId = propGroupId || (params?.groupId as string);

  const { startGroupCall, joinGroupCall, activeGroupCalls } = useCallContext();
  const { socket } = useSocket();
  const { user } = useUser();

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        const decoded = parseJwt(token);
        if (decoded?.sub || decoded?.id) return decoded.sub || decoded.id;
      }
    }
    return user?.id || "";
  });

  useEffect(() => {
    if (user?.id && user.id !== currentUserId) {
      setCurrentUserId(user.id);
    }
  }, [user?.id, currentUserId]);
  const [groupDetails, setGroupDetails] = useState<any>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [replyingTo, setReplyingTo] = useState<QuotedMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [newMessagesBelow, setNewMessagesBelow] = useState(0);
  const prevMessagesLengthRef = useRef(0);
  const prevScrollHeightRef = useRef(0);
  const isInitialScrollDoneRef = useRef(false);
  const isPaginatingRef = useRef(false);

  // In-chat search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Modals state
  const [messageInfoMsg, setMessageInfoMsg] = useState<any | null>(null);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);

  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const { contacts, fetchContacts: fetchContactsList, isLoading: isContactsLoading } = useContacts();
  const [isAddingMember, setIsAddingMember] = useState(false);

  const [isLeaveGroupDialogOpen, setIsLeaveGroupDialogOpen] = useState(false);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);

  const [isRemoveMemberDialogOpen, setIsRemoveMemberDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [recentMedia, setRecentMedia] = useState<any[]>([]);
  const [totalMedia, setTotalMedia] = useState<number>(0);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const groupAvatarInputRef = useRef<HTMLInputElement>(null);


  const {
    messages,
    sendMessage,
    isUploading,
    setIsUploading,
    isReady,
    isAdmin,
    isAnnouncementOnly,
    typingText,
    startTyping,
    stopTyping,
    pinnedMessages,
    pinMessage,
    unpinMessage,
    toggleReaction,
    votePoll,
    createPoll,
    unsendMessage,
    groupDetails: hookGroupDetails,
    loadMoreMessages,
    hasMoreMessages,
    isLoadingMore,
  } = useGroupChat(groupId, currentUserId);

  useEffect(() => {
    if (hookGroupDetails) {
      setIsFavourite(!!hookGroupDetails.isFavourite);
      setIsMuted(!!hookGroupDetails.isMuted);
    }
  }, [hookGroupDetails]);

  const scrollToMessage = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.remove("highlight-pulse");
      void el.offsetWidth;
      el.classList.add("highlight-pulse");
      setTimeout(() => el.classList.remove("highlight-pulse"), 2500);
    } else {
      toast.info("Original message is further up in history");
    }
  };

  const handleGroupAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const uploadRes = await groupService.uploadGroupMedia(groupId, file);
      if (!uploadRes.success || !uploadRes.data?.mediaUrl) {
        toast.error(uploadRes.error || "Failed to upload image");
        return;
      }

      const updateRes = await groupService.updateGroup(groupId, { avatarUrl: uploadRes.data.mediaUrl });
      if (updateRes.success) {
        toast.success("Group photo updated successfully!");
        setGroupDetails((prev: any) => (prev ? { ...prev, avatarUrl: uploadRes.data?.mediaUrl } : prev));
        useGroupStore.getState().updateGroupInStore(groupId, { avatarUrl: uploadRes.data.mediaUrl });
      } else {
        toast.error(updateRes.error || "Failed to update group photo");
      }
    } catch (err) {
      console.error("Error updating group photo:", err);
      toast.error("Error updating group photo");
    } finally {
      setIsUploadingAvatar(false);
      if (e.target) e.target.value = "";
    }
  };

  const isCallActive = activeGroupCalls.includes(groupId);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const [detailsRes, membersRes, mediaRes] = await Promise.all([
          groupService.fetchGroupDetails(groupId),
          groupService.fetchGroupMembers(groupId),
          groupService.fetchGroupMedia(groupId, 1),
        ]);

        if (detailsRes.success && detailsRes.data) {
          setGroupDetails(detailsRes.data);
          setIsFavourite(!!detailsRes.data.isFavourite);
          setIsMuted(!!detailsRes.data.isMuted);
        }
        if (membersRes.success && membersRes.data?.members) {
          setGroupMembers(membersRes.data.members);
        }
        if (mediaRes.success && mediaRes.data?.media) {
          setRecentMedia(mediaRes.data.media);
          setTotalMedia(mediaRes.data.total || mediaRes.data.media.length);
        }
      } catch (e) {
        console.error("Failed to load group details", e);
      } finally {
        setIsLoading(false);
      }
    };

    if (groupId) {
      fetchGroupData();
    }
  }, [groupId]);

  // Update last-read timestamp when opening this group
  useEffect(() => {
    if (!groupId) return;
    try {
      const raw = localStorage.getItem("lastReadMap");
      const map = raw ? JSON.parse(raw) : {};
      map[groupId] = new Date().toISOString();
      localStorage.setItem("lastReadMap", JSON.stringify(map));
    } catch {}
  }, [groupId]);

  const handleOpenAddMember = () => {
    fetchContactsList();
    setIsAddMemberModalOpen(true);
  };

  const handleAddMember = async (userId: string) => {
    setIsAddingMember(true);
    try {
      const myPrivKey = await getUserPrivateKey(currentUserId);
      if (!myPrivKey) {
        throw new Error("Private key not found. Please refresh the page.");
      }

      let gKey = await getStoredGroupKey(groupId, currentUserId);

      if (!gKey) {
        const keyRes = await groupService.fetchGroupKey(groupId);
        if (keyRes.success && keyRes.data) {
          const { encryptedGroupKey, keyNonce, senderId } = keyRes.data;
          let senderPubKey = "";
          if (senderId) {
            const senderRes = await chatService.fetchRecipientKey(senderId);
            if (senderRes?.data && Array.isArray(senderRes.data) && senderRes.data.length > 0) {
              senderPubKey = senderRes.data[0].publicKey;
            } else if (senderRes?.success && senderRes?.data?.publicKey) {
              senderPubKey = senderRes.data.publicKey;
            }
          }

          if (senderPubKey) {
            try {
              gKey = await decryptMessage(encryptedGroupKey, keyNonce, senderPubKey, myPrivKey);
            } catch (err) {
              console.warn("Failed to decrypt group key envelope", err);
            }
          }
        }
      }

      if (!gKey) {
        throw new Error("Group symmetric key is not unlocked yet. Please refresh the page.");
      }

      const resKey = await chatService.fetchRecipientKey(userId);
      let targetPubKey = "";
      if (resKey?.data && Array.isArray(resKey.data) && resKey.data.length > 0) {
        targetPubKey = resKey.data[0].publicKey;
      } else if (resKey?.success && resKey?.data?.publicKey) {
        targetPubKey = resKey.data.publicKey;
      }

      if (!targetPubKey) {
        throw new Error("Could not find public encryption key for this user.");
      }

      const { ciphertext, nonce } = await encryptMessage(gKey, targetPubKey, myPrivKey);
      const res = await groupService.addMember(groupId, userId, ciphertext, nonce);

      if (res.success) {
        setIsAddMemberModalOpen(false);
        toast.success("Member added successfully");
        const membersRes = await groupService.fetchGroupMembers(groupId);
        if (membersRes.success && membersRes.data?.members) {
          setGroupMembers(membersRes.data.members);
        }
      } else {
        toast.error(res.error || "Failed to add member");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to add member");
    } finally {
      setIsAddingMember(false);
    }
  };

  // In-chat search matches
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return messages
      .filter((m) => m.text && !m.isSystem && m.text.toLowerCase().includes(q))
      .map((m) => m.id);
  }, [messages, searchQuery]);

  const goToNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIdx);
    scrollToMessage(searchMatches[nextIdx]);
  };

  const goToPrevMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setCurrentMatchIndex(prevIdx);
    scrollToMessage(searchMatches[prevIdx]);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        goToPrevMatch();
      } else {
        goToNextMatch();
      }
    } else if (e.key === "Escape") {
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  useEffect(() => {
    if (searchMatches.length > 0) {
      setCurrentMatchIndex(0);
      scrollToMessage(searchMatches[0]);
    }
  }, [searchQuery]);

  // Smart scrolling & scroll position preservation
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    if (!isInitialScrollDoneRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      isInitialScrollDoneRef.current = true;
      prevMessagesLengthRef.current = messages.length;
      return;
    }

    if (isPaginatingRef.current) {
      if (timelineRef.current && prevScrollHeightRef.current > 0) {
        const heightDiff = timelineRef.current.scrollHeight - prevScrollHeightRef.current;
        timelineRef.current.scrollTop = heightDiff;
        prevScrollHeightRef.current = 0;
      }
      isPaginatingRef.current = false;
      prevMessagesLengthRef.current = messages.length;
      return;
    }

    if (messages.length > prevMessagesLengthRef.current) {
      const lastMsg = messages[messages.length - 1];
      const isMe = lastMsg?.senderId === currentUserId;
      const el = timelineRef.current;
      const isNearBottom = el ? el.scrollHeight - el.scrollTop - el.clientHeight < 150 : true;

      if (isMe || isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        setNewMessagesBelow(0);
      } else {
        const countAdded = messages.length - prevMessagesLengthRef.current;
        setNewMessagesBelow((prev) => prev + countAdded);
      }
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages, currentUserId]);

  const handleTimelineScroll = () => {
    const el = timelineRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNearBottom = distanceFromBottom < 120;
    setIsScrolledUp(!isNearBottom);
    if (isNearBottom) {
      setNewMessagesBelow(0);
    }

    // Cursor pagination trigger when user scrolls up
    if (el.scrollTop < 60 && hasMoreMessages && !isLoadingMore && !isPaginatingRef.current) {
      isPaginatingRef.current = true;
      prevScrollHeightRef.current = el.scrollHeight;
      loadMoreMessages().finally(() => {
        isPaginatingRef.current = false;
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setNewMessagesBelow(0);
    setIsScrolledUp(false);
  };

  const handleSend = async (text: string, file: File | null) => {
    if (!isReady) return;
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        toast.error("File size exceeds the 25MB maximum limit.");
        return;
      }
      setIsUploading(true);
      try {
        let finalFile = file;
        if (file.type.startsWith("image/") && !file.type.includes("svg")) {
          try {
            finalFile = await compressImage(file, 1920, 0.8);
          } catch (e) {
            console.warn("Image compression failed, uploading original:", e);
          }
        }

        const uploadRes = await groupService.uploadGroupMedia(groupId, finalFile);
        if (!uploadRes.success || !uploadRes.data?.mediaUrl) {
          toast.error(uploadRes.error || "File upload failed.");
          return;
        }

        let mediaType: "image" | "video" | "audio" | "document" = "document";
        if (file.type.startsWith("image/")) mediaType = "image";
        else if (file.type.startsWith("video/")) mediaType = "video";
        else if (file.type.startsWith("audio/")) mediaType = "audio";

        await sendMessage(
          text.trim(),
          replyingTo?.id,
          uploadRes.data.mediaUrl,
          mediaType
        );
        setReplyingTo(null);
      } catch (err: any) {
        console.error("Upload/Send Error:", err);
        toast.error("Failed to send attachment.");
      } finally {
        setIsUploading(false);
      }
    } else {
      if (!text.trim()) return;
      await sendMessage(text.trim(), replyingTo?.id);
      setReplyingTo(null);
    }
  };

  const handleToggleMute = async () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    const res = await groupService.toggleMute(groupId, nextMuted);
    if (res.success) {
      toast.success(nextMuted ? "Notifications muted" : "Notifications unmuted");
    }
  };

  const handleToggleFavourite = async () => {
    const nextFav = !isFavourite;
    setIsFavourite(nextFav);
    const res = await groupService.toggleFavourite(groupId, nextFav);
    if (res.success) {
      toast.success(nextFav ? "Added to favourites" : "Removed from favourites");
    }
  };

  const executeLeaveGroup = async () => {
    setIsLeavingGroup(true);
    try {
      if (!currentUserId) return;
      const res = await groupService.removeMember(groupId, currentUserId);
      if (res.success || res.data) {
        toast.success("You have left the group");
        useGroupStore.getState().removeGroupFromStore(groupId);
        router.push(backUrl);
      } else {
        toast.error(res.error || "Failed to leave group");
      }
    } catch (e: any) {
      console.error(e);
      toast.error("An error occurred while leaving the group");
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
        setGroupMembers((prev) =>
          prev.filter((m) => m.userId !== memberToRemove.id && m.user?.id !== memberToRemove.id)
        );
      } else {
        toast.error(res.error || "Failed to remove member");
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "An error occurred while removing member");
    } finally {
      setIsRemovingMember(false);
      setIsRemoveMemberDialogOpen(false);
      setMemberToRemove(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#EEF2FF] dark:bg-[#111b21]">
        <Loader2 className="h-8 w-8 animate-spin text-[#00A884]" />
      </div>
    );
  }

  const groupName = groupDetails?.name || "Group Chat";
  const avatarImage =
    groupDetails?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName)}&background=00A884&color=fff&size=256`;
  const memberCount = groupDetails?.memberCount || groupMembers.length || 0;

  const activePinned = pinnedMessages && pinnedMessages.length > 0 ? pinnedMessages[0] : null;

  return (
    <div className="flex h-full w-full relative overflow-hidden">
      {/* Main Chat Area */}
      <div
        className={cn(
          "flex flex-col h-full transition-all duration-300",
          showGroupInfo ? "w-0 lg:flex-1 hidden lg:flex" : "flex-1"
        )}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between bg-white/95 dark:bg-[#202C33]/95 backdrop-blur-md px-4 py-2.5 z-10 shrink-0 border-b border-[#E2E8F0] dark:border-[#222D34] shadow-xs cursor-pointer transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
          onClick={() => setShowGroupInfo(true)}
        >
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={backUrl}
              className="rounded-full p-1.5 text-[#54656F] dark:text-[#8696A0] transition-colors hover:bg-black/5 dark:hover:bg-white/10 md:hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2} />
            </Link>

            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={getOptimizedImageUrl(avatarImage)}
                  alt={groupName}
                  className="h-10 w-10 rounded-full object-cover bg-gray-100 dark:bg-gray-800"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <h2 className="text-[15.5px] font-semibold text-[#111B21] dark:text-[#E9EDEF] leading-tight truncate flex items-center gap-1.5">
                  <span>{groupName}</span>
                  {groupDetails?.sendMessagesScope === "ONLY_ADMINS" && (
                    <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-normal">
                      Announcement
                    </span>
                  )}
                </h2>
                {typingText ? (
                  <span className="text-[12px] font-medium text-[#00A884] dark:text-[#25D366] truncate animate-pulse">
                    {typingText}
                  </span>
                ) : (
                  <span className="text-[12px] font-normal text-[#667781] dark:text-[#8696A0] truncate">
                    {memberCount > 0 ? `Group · ${memberCount} members` : "Click for group info"}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {isCallActive ? (
              <button
                onClick={() => joinGroupCall(groupId)}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-[13px] transition-colors shadow-xs animate-pulse mr-1 cursor-pointer"
              >
                <Video className="h-4 w-4 fill-currentColor" />
                <span>Join Call</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsSearchOpen((prev) => !prev)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full transition-colors cursor-pointer",
                    isSearchOpen
                      ? "bg-[#00A884]/15 text-[#00A884]"
                      : "text-[#54656F] dark:text-[#8696A0] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#00A884] dark:hover:text-[#00A884]"
                  )}
                  title="Search messages"
                >
                  <Search className="h-[18px] w-[18px]" strokeWidth={2} />
                </button>
                <button
                  onClick={() => startGroupCall(groupId, "AUDIO")}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[#54656F] dark:text-[#8696A0] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#00A884] dark:hover:text-[#00A884] transition-colors cursor-pointer"
                  title="Group Audio Call"
                >
                  <Phone className="h-[18px] w-[18px]" strokeWidth={2} />
                </button>
                <button
                  onClick={() => startGroupCall(groupId, "VIDEO")}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[#54656F] dark:text-[#8696A0] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#00A884] dark:hover:text-[#00A884] transition-colors cursor-pointer"
                  title="Group Video Call"
                >
                  <Video className="h-[18px] w-[18px]" strokeWidth={2} />
                </button>
              </>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[#54656F] dark:text-[#8696A0] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#00A884] dark:hover:text-[#00A884] transition-colors cursor-pointer"
                  title="Menu"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-[#233138] p-1.5 rounded-2xl shadow-2xl border border-black/5 dark:border-white/10">
                <DropdownMenuItem
                  onClick={() => setShowGroupInfo(true)}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer"
                >
                  <Info className="w-4 h-4 text-gray-500" />
                  <span>Group info</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setIsInviteModalOpen(true)}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer"
                >
                  <Link2 className="w-4 h-4 text-emerald-500" />
                  <span>Invite via link</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setIsCreatePollOpen(true)}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer"
                >
                  <BarChart2 className="w-4 h-4 text-emerald-500" />
                  <span>Create poll</span>
                </DropdownMenuItem>

                {isAdmin && (
                  <DropdownMenuItem
                    onClick={() => setIsGroupSettingsOpen(true)}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-blue-500" />
                    <span>Group permissions</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  onClick={handleToggleMute}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer"
                >
                  {isMuted ? <Bell className="w-4 h-4 text-gray-500" /> : <BellOff className="w-4 h-4 text-gray-500" />}
                  <span>{isMuted ? "Unmute notifications" : "Mute notifications"}</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleToggleFavourite}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer"
                >
                  <Heart className={cn("w-4 h-4", isFavourite ? "text-red-500 fill-red-500" : "text-gray-500")} />
                  <span>{isFavourite ? "Remove from favourites" : "Add to favourites"}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 bg-gray-100 dark:bg-white/10" />

                <DropdownMenuItem
                  onClick={() => setIsLeaveGroupDialogOpen(true)}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Exit group</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Pinned Message Banner */}
        {activePinned && (
          <div
            onClick={() => scrollToMessage(activePinned.groupMessageId)}
            className="bg-[#FFF8E7] dark:bg-[#1f2c34] px-4 py-2 flex items-center justify-between border-b border-[#FFE8A3]/70 dark:border-gray-800 text-xs cursor-pointer hover:opacity-95 shadow-xs"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Pin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <div className="flex flex-col truncate">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">Pinned message</span>
                <span className="text-gray-600 dark:text-gray-300 truncate">
                  {activePinned.groupMessage?.text || "Click to jump to message"}
                </span>
              </div>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  unpinMessage(activePinned.groupMessageId);
                }}
                className="text-gray-400 hover:text-red-500 p-1"
                title="Unpin"
              >
                <PinOff className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* In-Chat Search Bar */}
        {isSearchOpen && (
          <div className="flex items-center justify-between bg-white dark:bg-[#1f2c34] px-4 py-2 border-b border-[#E2E8F0] dark:border-[#222D34] text-sm shadow-xs transition-all animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2 flex-1 max-w-md bg-gray-100 dark:bg-[#111b21] rounded-lg px-3 py-1.5 border border-transparent focus-within:border-[#00A884]">
              <Search className="h-4 w-4 text-gray-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search in chat..."
                className="bg-transparent text-sm w-full outline-hidden text-[#111B21] dark:text-[#E9EDEF] placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 pl-3">
              {searchQuery && (
                <span>
                  {searchMatches.length > 0
                    ? `${currentMatchIndex + 1} of ${searchMatches.length}`
                    : "No matches"}
                </span>
              )}
              <button
                type="button"
                disabled={searchMatches.length === 0}
                onClick={goToPrevMatch}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 cursor-pointer"
                title="Previous match (Shift+Enter)"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={searchMatches.length === 0}
                onClick={goToNextMatch}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 cursor-pointer"
                title="Next match (Enter)"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery("");
                }}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 cursor-pointer ml-1"
                title="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Message Timeline */}
        <div className="relative flex-1 min-h-0 flex flex-col">
          <div
            ref={timelineRef}
            onScroll={handleTimelineScroll}
            className="flex-1 overflow-y-auto p-4 space-y-1 bg-[#efeae2] dark:bg-[#0b141a]"
          >
            {isLoadingMore && (
              <div className="flex justify-center py-2">
                <Loader2 className="h-5 w-5 animate-spin text-[#00A884]" />
              </div>
            )}
            {messages.map((msg, index) => {
              if (msg.isSystem || msg.systemEventType) {
                return (
                  <GroupMessageBubble
                    key={msg.id}
                    msg={msg}
                    isMe={false}
                    showAvatar={false}
                    isFirstFromSender={false}
                    isNextSameSender={false}
                    groupId={groupId}
                    currentUserId={currentUserId}
                  />
                );
              }

              const isMe = msg.senderId === currentUserId;

              // Find previous non-system chat message
              let prevMsg: any = null;
              for (let i = index - 1; i >= 0; i--) {
                if (!messages[i].isSystem && !messages[i].systemEventType) {
                  prevMsg = messages[i];
                  break;
                }
              }

              // Find next non-system chat message
              let nextMsg: any = null;
              for (let i = index + 1; i < messages.length; i++) {
                if (!messages[i].isSystem && !messages[i].systemEventType) {
                  nextMsg = messages[i];
                  break;
                }
              }

              const isFirstFromSender = !prevMsg || prevMsg.senderId !== msg.senderId;
              const isNextSameSender = nextMsg?.senderId === msg.senderId;

              return (
                <GroupMessageBubble
                  key={msg.id}
                  msg={msg}
                  isMe={isMe}
                  isAdmin={isAdmin}
                  showAvatar={!isMe && isFirstFromSender}
                  isFirstFromSender={isFirstFromSender}
                  isNextSameSender={isNextSameSender}
                  members={groupMembers}
                  groupId={groupId}
                  currentUserId={currentUserId}
                  groupMembersCount={memberCount}
                  isPinned={pinnedMessages.some((p) => p.groupMessageId === msg.id)}
                  onPin={(duration) => pinMessage(msg.id, duration)}
                  onUnpin={() => unpinMessage(msg.id)}
                  onReply={(m) => setReplyingTo(m)}
                  onScrollToMessage={scrollToMessage}
                  onShowMessageInfo={(m) => setMessageInfoMsg(m)}
                  onReact={(mId, emoji) => toggleReaction(mId, emoji)}
                  onVotePoll={(optId, allowMulti) => votePoll(optId, allowMulti)}
                  onUnsend={(mId) => unsendMessage(mId)}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Floating New Messages / Scroll-to-bottom Pill */}
          {newMessagesBelow > 0 ? (
            <button
              type="button"
              onClick={scrollToBottom}
              className="absolute bottom-4 right-6 z-20 flex items-center gap-1.5 px-3.5 py-1.5 bg-[#00A884] hover:bg-[#029070] text-white text-xs font-semibold rounded-full shadow-lg transition-transform transform active:scale-95 animate-bounce cursor-pointer"
            >
              <ChevronDown className="h-4 w-4" />
              <span>{newMessagesBelow} new message{newMessagesBelow > 1 ? "s" : ""}</span>
            </button>
          ) : isScrolledUp ? (
            <button
              type="button"
              onClick={scrollToBottom}
              className="absolute bottom-4 right-6 z-20 p-2.5 bg-white dark:bg-[#202c33] text-gray-600 dark:text-gray-300 hover:text-emerald-500 rounded-full shadow-md border border-black/5 dark:border-white/10 transition-transform active:scale-95 cursor-pointer"
              title="Scroll to bottom"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {/* Input Bar */}
        <GroupInput
          onSend={handleSend}
          isReady={isReady}
          isUploading={isUploading}
          isAnnouncementOnly={isAnnouncementOnly}
          onStartTyping={startTyping}
          onStopTyping={stopTyping}
          onOpenCreatePoll={() => setIsCreatePollOpen(true)}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          members={groupMembers}
        />
      </div>

      {/* Group Info Sidebar */}
      {showGroupInfo && (
        <div className="w-full lg:w-[380px] bg-white dark:bg-[#111b21] border-l border-gray-200 dark:border-gray-800 flex flex-col h-full overflow-y-auto">
          {/* Top Bar */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="font-semibold text-base">Group Info</h3>
            <button
              onClick={() => setShowGroupInfo(false)}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Group Profile Header */}
          <div className="p-6 flex flex-col items-center border-b border-gray-100 dark:border-gray-800 text-center relative">
            <div className="relative group">
              <img
                src={getOptimizedImageUrl(avatarImage)}
                alt=""
                className="w-28 h-28 rounded-full object-cover shadow-md"
              />
              <input
                type="file"
                ref={groupAvatarInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleGroupAvatarChange}
              />
              <button
                type="button"
                onClick={() => groupAvatarInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-[10px] uppercase font-semibold">Change photo</span>
              </button>
            </div>
            <h2 className="text-lg font-bold mt-3 text-gray-900 dark:text-gray-100">{groupName}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Group · {memberCount} participants
            </p>
          </div>

          {/* Settings & Invite Actions */}
          <div className="p-4 space-y-1 border-b border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#182229] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Link2 className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium">Invite via link</p>
                  <p className="text-xs text-gray-500">Share QR code or group link</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsGroupSettingsOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#182229] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Group permissions</p>
                    <p className="text-xs text-gray-500">Edit settings, announcement mode, timers</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            )}

            <div
              onClick={handleToggleMute}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#182229] transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Mute notifications</p>
                  <p className="text-xs text-gray-500">{isMuted ? "Muted" : "Active"}</p>
                </div>
              </div>
              <Switch checked={isMuted} onCheckedChange={handleToggleMute} />
            </div>
          </div>

          {/* Members List */}
          <div className="p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                {memberCount} Participants
              </span>
              {(isAdmin || groupDetails?.addMembersScope !== "ONLY_ADMINS") && (
                <button
                  onClick={handleOpenAddMember}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add member</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              {groupMembers.map((m) => {
                const memberId = m.userId || m.user?.id || m.id;
                const isMemberMe = memberId === currentUserId;
                const mRole = m.role || "MEMBER";

                return (
                  <div
                    key={memberId}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#182229] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm overflow-hidden">
                        {m.profile?.avatarUrl ? (
                          <img
                            src={getOptimizedImageUrl(m.profile.avatarUrl)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (m.profile?.name || m.user?.displayName || "U")[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                          <span>{isMemberMe ? "You" : m.profile?.name || m.user?.displayName || "Member"}</span>
                          {mRole === "OWNER" && (
                            <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 rounded font-semibold">
                              Group Creator
                            </span>
                          )}
                          {mRole === "ADMIN" && (
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded font-semibold">
                              Admin
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {m.profile?.username ? `@${m.profile.username}` : m.role}
                        </p>
                      </div>
                    </div>

                    {isAdmin && !isMemberMe && mRole !== "OWNER" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 bg-white dark:bg-[#233138] p-1 rounded-xl shadow-xl">
                          <DropdownMenuItem
                            onClick={() =>
                              groupService.updateMemberRole(
                                groupId,
                                memberId,
                                mRole === "ADMIN" ? "MEMBER" : "ADMIN"
                              )
                            }
                            className="text-xs cursor-pointer"
                          >
                            {mRole === "ADMIN" ? "Dismiss as admin" : "Make group admin"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setMemberToRemove({ id: memberId, name: m.profile?.name || "Member" });
                              setIsRemoveMemberDialogOpen(true);
                            }}
                            className="text-xs text-red-600 cursor-pointer"
                          >
                            Remove {m.profile?.name || "member"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* All Modal Components */}
      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        contacts={contacts}
        isLoadingContacts={isContactsLoading}
        existingMemberUserIds={groupMembers.map((m) => m.userId || m.user?.id || m.id)}
        isAddingMember={isAddingMember}
        onSelectUser={handleAddMember}
      />

      <MessageInfoModal
        isOpen={!!messageInfoMsg}
        onClose={() => setMessageInfoMsg(null)}
        groupId={groupId}
        messageId={messageInfoMsg?.id}
        messageText={messageInfoMsg?.text}
        messageCreatedAt={messageInfoMsg?.createdAt}
      />

      <CreatePollModal
        isOpen={isCreatePollOpen}
        onClose={() => setIsCreatePollOpen(false)}
        onSubmit={createPoll}
      />

      <InviteLinkModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        groupId={groupId}
        groupName={groupName}
        groupAvatar={groupDetails?.avatarUrl}
        isAdmin={isAdmin}
        joinApprovalMode={groupDetails?.joinApprovalMode}
      />

      <GroupSettingsDrawer
        isOpen={isGroupSettingsOpen}
        onClose={() => setIsGroupSettingsOpen(false)}
        groupId={groupId}
        groupName={groupName}
        isAdmin={isAdmin}
        settings={{
          editGroupInfoScope: groupDetails?.editGroupInfoScope,
          sendMessagesScope: groupDetails?.sendMessagesScope,
          addMembersScope: groupDetails?.addMembersScope,
          joinApprovalMode: groupDetails?.joinApprovalMode,
          disappearAfterSeconds: groupDetails?.disappearAfterSeconds,
        }}
        onSettingsUpdated={(newSettings) => {
          setGroupDetails((prev: any) => (prev ? { ...prev, ...newSettings } : prev));
        }}
      />

      {/* Leave Group Confirmation Dialog */}
      <AlertDialog open={isLeaveGroupDialogOpen} onOpenChange={setIsLeaveGroupDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-[#111b21] border border-gray-200 dark:border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Exit &quot;{groupName}&quot; group?</AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer be able to send or receive messages in this group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLeavingGroup}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeLeaveGroup}
              disabled={isLeavingGroup}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLeavingGroup ? <Loader2 className="w-4 h-4 animate-spin" /> : "Exit Group"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={isRemoveMemberDialogOpen} onOpenChange={setIsRemoveMemberDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-[#111b21] border border-gray-200 dark:border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {memberToRemove?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This user will be removed from the group and will no longer have access to future messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovingMember}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeRemoveMember}
              disabled={isRemovingMember}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isRemovingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remove Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default GroupChatView;
