"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronRight,
  Globe,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  Share2,
  Smile,
  ThumbsUp,
  Trash2,
  Users,
  X,
  Image as ImageIcon,
  FileText,
  Heart,
  Eye,
  MoreHorizontal,
  Bell,
  Pin,
  Video,
  BarChart2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Play,
  Edit2,
  PinOff,
  Phone,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ChannelService, type ChannelData, type ChannelMessageData } from "@/services/channel.service";
import { ContactService } from "@/services/contact.service";
import { chatService } from "@/services/chat.service";
import { uploadToCloudinary } from "@/services/business.service";

interface BusinessChannelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChannelUpdated?: () => void;
  isEmbedded?: boolean;
  initialChannelId?: string;
}

const CATEGORIES = [
  "Technology",
  "Business",
  "Education",
  "News",
  "Marketing",
  "Product Updates",
  "Community",
];

export function BusinessChannelsModal({
  isOpen,
  onClose,
  onChannelUpdated,
  isEmbedded = false,
  initialChannelId,
}: BusinessChannelsModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"list" | "create" | "room" | "settings">("list");
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<ChannelData | null>(null);

  // --- Create Wizard State (Steps 1 to 4) ---
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [category, setCategory] = useState("Technology");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaFileInputRef = useRef<HTMLInputElement | null>(null);

  // Step 2 Settings
  const [whoCanJoin, setWhoCanJoin] = useState<"ANYONE" | "INVITE_ONLY" | "REQUIRES_APPROVAL">("ANYONE");
  const [whoCanPost, setWhoCanPost] = useState<"ADMIN_ONLY" | "ADMIN_MODERATORS">("ADMIN_ONLY");
  const [enableReactions, setEnableReactions] = useState(true);
  const [defaultNotification, setDefaultNotification] = useState("ALL_MESSAGES");

  // Step 3 Invite Members
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedPhones, setSelectedPhones] = useState<string[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Live Room State ---
  const [messages, setMessages] = useState<ChannelMessageData[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [channelMembers, setChannelMembers] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [blastMessage, setBlastMessage] = useState("");
  const [mediaUrlInput, setMediaUrlInput] = useState("");
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [adminSubTab, setAdminSubTab] = useState<"posts" | "members" | "settings">("posts");
  const [showPostForm, setShowPostForm] = useState(false);
  const [postType, setPostType] = useState<"image" | "video" | "poll">("image");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // --- Post Actions State ---
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostContent, setEditPostContent] = useState("");
  const [isUpdatingPost, setIsUpdatingPost] = useState(false);
  const [isDeletingPostId, setIsDeletingPostId] = useState<string | null>(null);

  // --- Member Actions State ---
  const [openMemberMenuId, setOpenMemberMenuId] = useState<string | null>(null);
  const [isUpdatingMember, setIsUpdatingMember] = useState(false);
  const [showInviteMembers, setShowInviteMembers] = useState(false);
  const [inviteContactSearch, setInviteContactSearch] = useState("");
  const [inviteSelectedMemberIds, setInviteSelectedMemberIds] = useState<string[]>([]);
  const [inviteSelectedPhones, setInviteSelectedPhones] = useState<string[]>([]);

  // --- Edit Settings State ---
  const [editName, setEditName] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editWhoCanJoin, setEditWhoCanJoin] = useState("ANYONE");
  const [editWhoCanPost, setEditWhoCanPost] = useState("ADMIN_ONLY");
  const [editEnableReactions, setEditEnableReactions] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchChannels = useCallback(async () => {
    try {
      setIsLoadingChannels(true);
      const res = await ChannelService.getChannels();
      if (res?.success && Array.isArray(res.data)) {
        setChannels(res.data);
      }
    } catch (err) {
      console.error("Failed to load business channels", err);
    } finally {
      setIsLoadingChannels(false);
    }
  }, []);

  const fetchContactsForInvite = useCallback(async () => {
    try {
      const [contactsRes, convsRes, unregRes] = await Promise.all([
        ContactService.fetchContacts().catch(() => ({ data: [] })),
        chatService.fetchMyConversations().catch(() => ({ data: [] })),
        ContactService.listUnregisteredContacts({ limit: 100 }).catch(() => ({ data: { items: [] } })),
      ]);

      const map = new Map<string, any>();
      if (Array.isArray(contactsRes?.data)) {
        contactsRes.data.forEach((c: any) => {
          if (c.contactUserId || c.userId || c.id) {
            const id = c.contactUserId || c.userId || c.id;
            map.set(id, {
              id,
              name: c.customName || c.name || c.contactUser?.profile?.displayName || "Contact",
              avatarUrl: c.avatarUrl || c.contactUser?.profile?.avatarUrl || null,
            });
          }
        });
      }
      if (Array.isArray(convsRes?.data)) {
        convsRes.data.forEach((c: any) => {
          if (c.otherUserId) {
            map.set(c.otherUserId, {
              id: c.otherUserId,
              name: c.otherUserName || "Conversation User",
              avatarUrl: c.otherUserAvatar || null,
            });
          }
        });
      }
      if (Array.isArray(unregRes?.data?.items)) {
        unregRes.data.items.forEach((c: any) => {
          if (c.phoneNumber) {
            map.set(c.phoneNumber, {
              id: c.phoneNumber, // Use phone number as ID to distinguish
              name: c.name || c.phoneNumber,
              avatarUrl: null,
              isPhoneOnly: true,
            });
          }
        });
      }
      setContacts(Array.from(map.values()));
    } catch (e) {
      console.error("Failed to load contacts for invite", e);
    }
  }, []);

  useEffect(() => {
    if (isOpen || isEmbedded) {
      fetchChannels();
      fetchContactsForInvite();
    }
  }, [isOpen, isEmbedded, fetchChannels, fetchContactsForInvite]);

  const fetchChannelMessages = useCallback(async (channelId: string) => {
    try {
      setIsLoadingMessages(true);
      const res = await ChannelService.getChannelMessages(channelId);
      if (res?.success && Array.isArray(res.data?.messages)) {
        const sorted = [...res.data.messages].sort((a, b) => {
          if (a.isPinned !== b.isPinned) return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
          if (a.isSent !== b.isSent) return (a.isSent === false ? -1 : 1);
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setMessages(sorted);
      }
    } catch (e) {
      console.error("Failed to fetch messages", e);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const fetchChannelMembers = useCallback(async (channelId: string) => {
    try {
      setIsLoadingMembers(true);
      const res = await ChannelService.getChannelMembers(channelId);
      if (res?.success && Array.isArray(res.data)) {
        setChannelMembers(res.data);
      }
    } catch (e) {
      console.error("Failed to fetch channel members", e);
    } finally {
      setIsLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    if (!initialChannelId) return;
    const initChannelById = async () => {
      const found = channels.find((c) => c.id === initialChannelId);
      if (found) {
        if (selectedChannel?.id !== found.id) {
          setSelectedChannel(found);
          setActiveTab("room");
          setAdminSubTab("posts");
          setShowPostForm(false);
          setEditName(found.name);
          setEditWebsite(found.website || "");
          setEditDescription(found.description || "");
          setEditCategory(found.category || "Technology");
          setEditWhoCanJoin((found.whoCanJoin as any) || "ANYONE");
          setEditWhoCanPost((found.whoCanPost as any) || "ADMIN_ONLY");
          setEditEnableReactions(found.enableReactions ?? true);
          fetchChannelMessages(found.id);
          fetchChannelMembers(found.id);
        }
      } else if (!isLoadingChannels) {
        try {
          const res = await ChannelService.getChannel(initialChannelId);
          if (res?.success && res.data) {
            const ch = res.data;
            setSelectedChannel(ch);
            setActiveTab("room");
            setAdminSubTab("posts");
            setShowPostForm(false);
            setEditName(ch.name);
            setEditWebsite(ch.website || "");
            setEditDescription(ch.description || "");
            setEditCategory(ch.category || "Technology");
            setEditWhoCanJoin((ch.whoCanJoin as any) || "ANYONE");
            setEditWhoCanPost((ch.whoCanPost as any) || "ADMIN_ONLY");
            setEditEnableReactions(ch.enableReactions ?? true);
            fetchChannelMessages(ch.id);
            fetchChannelMembers(ch.id);
          }
        } catch (err) {
          console.error("Failed to fetch initial channel by ID", err);
        }
      }
    };
    initChannelById();
  }, [initialChannelId, channels, isLoadingChannels, selectedChannel?.id, fetchChannelMessages]);

  if (!isOpen && !isEmbedded) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingPhoto(true);
      const url = await uploadToCloudinary(file);
      setAvatarUrl(url);
      toast.success("Channel photo uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload photo to Cloudinary");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleMediaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingMedia(true);
      const url = await uploadToCloudinary(file);
      setMediaUrlInput(url);
      toast.success(postType === "video" ? "Video uploaded successfully!" : "Image uploaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload file to Cloudinary");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a Channel Name");
      return;
    }
    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const executeCreateChannel = async () => {
    try {
      setIsSubmitting(true);
      const res = await ChannelService.createChannel({
        name: name.trim(),
        website: website.trim() || null,
        description: description.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
        category,
        whoCanJoin,
        whoCanPost,
        enableReactions,
        defaultNotification,
        memberIds: selectedMemberIds,
        phones: selectedPhones,
        isPrivate: whoCanJoin === "INVITE_ONLY",
      });

      if (res?.success && res.data) {
        setChannels((prev) => [res.data, ...prev]);
        setSelectedChannel(res.data);
        setStep(4);
        toast.success(`Channel #${name} created successfully!`);
        if (onChannelUpdated) onChannelUpdated();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || "Failed to create channel. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetWizard = () => {
    setStep(1);
    setName("");
    setWebsite("");
    setDescription("");
    setAvatarUrl("");
    setCategory("Technology");
    setWhoCanJoin("ANYONE");
    setWhoCanPost("ADMIN_ONLY");
    setEnableReactions(true);
    setDefaultNotification("ALL_MESSAGES");
    setSelectedMemberIds([]);
    setSelectedPhones([]);
    setContactSearch("");
  };

  const handleSelectChannelToRoom = (ch: ChannelData) => {
    if (isEmbedded && !initialChannelId) {
      router.push(`/business/channels/${ch.id}`);
      return;
    }
    setSelectedChannel(ch);
    setActiveTab("room");
    setAdminSubTab("posts");
    setShowPostForm(false);
    setEditName(ch.name);
    setEditWebsite(ch.website || "");
    setEditDescription(ch.description || "");
    setEditCategory(ch.category || "Technology");
    setEditWhoCanJoin((ch.whoCanJoin as any) || "ANYONE");
    setEditWhoCanPost((ch.whoCanPost as any) || "ADMIN_ONLY");
    setEditEnableReactions(ch.enableReactions ?? true);
    fetchChannelMessages(ch.id);
    fetchChannelMembers(ch.id);
  };

  const handleSendBlast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannel) return;

    let finalContent = blastMessage.trim();
    let finalMediaUrl = mediaUrlInput.trim() || null;
    let finalMediaType: string | null = postType;

    if (postType === "poll") {
      const validOptions = pollOptions.filter((o) => o.trim().length > 0);
      if (!finalContent) {
        toast.error("Please enter your poll question");
        return;
      }
      if (validOptions.length < 2) {
        toast.error("Please provide at least 2 poll options");
        return;
      }
      finalMediaUrl = JSON.stringify({
        options: validOptions,
        votes: {},
        scheduledFor: showSchedule && scheduleDate ? scheduleDate : null,
      });
      finalMediaType = "poll";
    } else {
      if (!finalContent && !finalMediaUrl) {
        toast.error("Please write something or attach media");
        return;
      }
    }

    try {
      setIsSending(true);
      const res = await ChannelService.sendChannelMessage(
        selectedChannel.id,
        finalContent || (postType === "video" ? "Attached video" : "Attached image"),
        finalMediaUrl,
        finalMediaType,
        undefined,
        showSchedule && scheduleDate ? scheduleDate : null
      );

      if (res?.success && res.data) {
        setMessages((prev) => {
          const updated = [res.data, ...prev];
          return updated.sort((a, b) => {
            if (a.isPinned !== b.isPinned) return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
            if (a.isSent !== b.isSent) return (a.isSent === false ? -1 : 1);
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        });
        setBlastMessage("");
        setMediaUrlInput("");
        setPollOptions(["", ""]);
        setShowSchedule(false);
        setScheduleDate("");
        setShowPostForm(false);
        toast.success(showSchedule && scheduleDate ? "Post scheduled successfully!" : "Post published to channel!");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Failed to post message.");
    } finally {
      setIsSending(false);
    }
  };

  const handleTogglePinPost = async (msg: ChannelMessageData) => {
    if (!selectedChannel) return;
    try {
      const newPinStatus = !msg.isPinned;
      const res = await ChannelService.updateChannelMessage(selectedChannel.id, msg.id, {
        isPinned: newPinStatus,
      });
      if (res?.success && res.data) {
        setMessages((prev) => {
          const updated = prev.map((m) => (m.id === msg.id ? { ...m, isPinned: newPinStatus } : m));
          return updated.sort((a, b) => {
            if (a.isPinned !== b.isPinned) return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        });
        toast.success(newPinStatus ? "Post pinned to top!" : "Post unpinned!");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Failed to update pin status.");
    } finally {
      setOpenActionMenuId(null);
    }
  };

  const handleDeletePost = async (msgId: string) => {
    if (!selectedChannel) return;
    try {
      setIsDeletingPostId(msgId);
      const res = await ChannelService.deleteChannelMessage(selectedChannel.id, msgId);
      if (res?.success) {
        setMessages((prev) => prev.filter((m) => m.id !== msgId));
        toast.success("Post deleted successfully!");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Failed to delete post.");
    } finally {
      setIsDeletingPostId(null);
      setOpenActionMenuId(null);
    }
  };

  const handleUpdatePostContent = async (msgId: string) => {
    if (!selectedChannel || !editPostContent.trim()) return;
    try {
      setIsUpdatingPost(true);
      const res = await ChannelService.updateChannelMessage(selectedChannel.id, msgId, {
        content: editPostContent.trim(),
      });
      if (res?.success && res.data) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, content: res.data.content } : m))
        );
        setEditingPostId(null);
        toast.success("Post updated successfully!");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Failed to update post.");
    } finally {
      setIsUpdatingPost(false);
      setOpenActionMenuId(null);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, role: "MEMBER" | "MODERATOR" | "ADMIN") => {
    if (!selectedChannel) return;
    try {
      setIsUpdatingMember(true);
      const res = await ChannelService.updateChannelMemberRole(selectedChannel.id, memberId, role);
      if (res?.success) {
        setChannelMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role } : m)));
        toast.success(`Role updated to ${role}`);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to update role");
    } finally {
      setIsUpdatingMember(false);
      setOpenMemberMenuId(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedChannel) return;
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      setIsUpdatingMember(true);
      const res = await ChannelService.removeChannelMember(selectedChannel.id, memberId);
      if (res?.success) {
        setChannelMembers((prev) => prev.filter((m) => m.id !== memberId));
        toast.success("Member removed successfully");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to remove member");
    } finally {
      setIsUpdatingMember(false);
      setOpenMemberMenuId(null);
    }
  };

  const handleInviteMembersToExistingChannel = async () => {
    if (!selectedChannel || (inviteSelectedMemberIds.length === 0 && inviteSelectedPhones.length === 0)) return;
    try {
      setIsUpdatingMember(true);
      const res = await ChannelService.addChannelMembers(selectedChannel.id, inviteSelectedMemberIds, inviteSelectedPhones);
      if (res?.success) {
        toast.success("Members invited successfully");
        fetchChannelMembers(selectedChannel.id);
        setShowInviteMembers(false);
        setInviteSelectedMemberIds([]);
        setInviteSelectedPhones([]);
        setInviteContactSearch("");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Failed to invite members");
    } finally {
      setIsUpdatingMember(false);
    }
  };

  const handleOpenSettings = (ch: ChannelData) => {
    setSelectedChannel(ch);
    setEditName(ch.name);
    setEditWebsite(ch.website || "");
    setEditDescription(ch.description || "");
    setEditCategory(ch.category || "Technology");
    setEditWhoCanJoin((ch.whoCanJoin as any) || "ANYONE");
    setEditWhoCanPost((ch.whoCanPost as any) || "ADMIN_ONLY");
    setEditEnableReactions(ch.enableReactions ?? true);
    setActiveTab("settings");
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannel) return;
    try {
      setIsSavingSettings(true);
      const res = await ChannelService.updateChannel(selectedChannel.id, {
        name: editName.trim(),
        website: editWebsite.trim() || null,
        description: editDescription.trim() || null,
        category: editCategory,
        whoCanJoin: editWhoCanJoin,
        whoCanPost: editWhoCanPost,
        enableReactions: editEnableReactions,
        isPrivate: editWhoCanJoin === "INVITE_ONLY",
      });

      if (res?.success && res.data) {
        setSelectedChannel(res.data);
        setChannels((prev) => prev.map((c) => (c.id === res.data.id ? res.data : c)));
        toast.success("Channel settings saved!");
        setActiveTab("room");
        if (onChannelUpdated) onChannelUpdated();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Failed to update channel.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleDeleteChannel = async () => {
    if (!selectedChannel) return;
    if (!confirm(`Are you sure you want to delete #${selectedChannel.name}?`)) return;
    try {
      setIsDeleting(true);
      await ChannelService.deleteChannel(selectedChannel.id);
      setChannels((prev) => prev.filter((c) => c.id !== selectedChannel.id));
      toast.success("Channel deleted successfully");
      setSelectedChannel(null);
      setActiveTab("list");
      if (onChannelUpdated) onChannelUpdated();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Failed to delete channel.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const inviteFilteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(inviteContactSearch.toLowerCase()) &&
      !channelMembers.some((m) => m.id === c.id)
  );

  const modalContent = (
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className={
          isEmbedded
            ? "flex h-full w-full flex-col overflow-hidden bg-white"
            : "flex h-[88vh] max-h-[820px] w-full max-w-2xl flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-2xl border border-[#E6EAFA]"
        }
      >
        {/* Top Bar Header (Matches mobile Figma design headers) */}
        <div className="flex items-center justify-between border-b border-[#F0F4FF] bg-white px-7 py-5 shrink-0">
          <div className="flex items-center gap-3">
            {activeTab !== "list" ? (
              <button
                onClick={() => {
                  if (activeTab === "create" && step > 1) {
                    setStep((step - 1) as any);
                  } else if (initialChannelId && isEmbedded) {
                    router.push("/business/channels");
                  } else {
                    setActiveTab("list");
                  }
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 text-[#3B58F5] transition-colors"
              >
                <ArrowLeft className="h-5 w-5 stroke-[2.5]" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 text-[#3B58F5] transition-colors"
              >
                <ArrowLeft className="h-5 w-5 stroke-[2.5]" />
              </button>
            )}

            <div>
              <h2 className="text-lg font-bold text-[#11142D] tracking-tight">
                {activeTab === "list" && "Business Channels"}
                {activeTab === "create" && step === 1 && "Channel Information"}
                {activeTab === "create" && step === 2 && "Channel Settings"}
                {activeTab === "create" && step === 3 && "Channel Settings"}
                {activeTab === "create" && step === 4 && "Business Channels"}
                {activeTab === "room" && selectedChannel && `#${selectedChannel.name}`}
                {activeTab === "settings" && "Channel Settings"}
              </h2>
              {activeTab === "list" && (
                <p className="text-xs font-medium text-slate-400">Broadcast to your followers</p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-7">
          <AnimatePresence mode="wait">
            {/* 1. CHANNELS LIST (Figma Image 1) */}
            {activeTab === "list" && (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 max-w-xl mx-auto"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-[#3B58F5] tracking-wide">Your Channels</h3>
                  <button
                    onClick={fetchChannels}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#3B58F5] transition-colors"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoadingChannels ? "animate-spin" : ""}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {isLoadingChannels ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-[#3B58F5]" />
                    <p className="text-xs font-semibold text-slate-400">Loading your channels...</p>
                  </div>
                ) : channels.length === 0 ? (
                  <div className="text-center py-12 rounded-3xl border border-slate-100 bg-[#F8FAFC] p-6">
                    <p className="text-sm font-bold text-slate-700">No channels yet</p>
                    <p className="text-xs text-slate-400 mt-1">Create your first channel below to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {channels.map((ch) => {
                      const subs = ch.memberCount ?? 0;
                      return (
                        <div
                          key={ch.id}
                          onClick={() => handleSelectChannelToRoom(ch)}
                          className="flex items-center justify-between p-4 rounded-2xl border border-[#F0F4FF] bg-white shadow-2xs hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="h-14 w-14 shrink-0 rounded-full overflow-hidden bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center shadow-sm">
                              {ch.avatarUrl ? (
                                <img src={ch.avatarUrl} alt={ch.name} className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-lg">#{ch.name.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-base font-bold text-[#11142D] truncate">{ch.name}</h4>
                                <span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-[10px] font-extrabold text-[#3B58F5]">
                                  Admin
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                                {ch.description || `Latest ${ch.category?.toLowerCase() || "channel"} news & releases`}
                              </p>
                              <p className="text-[11px] font-bold text-[#3B58F5] mt-1">
                                {subs} {subs === 1 ? "subscriber" : "subscribers"}
                              </p>
                            </div>
                          </div>

                          <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-[#3B58F5] group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* + Create New Channel Dashed Button (Figma Image 1 exact match) */}
                <button
                  onClick={() => {
                    handleResetWizard();
                    setActiveTab("create");
                  }}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-[#3B58F5]/60 bg-blue-50/20 hover:bg-blue-50/50 text-[#3B58F5] font-bold text-sm transition-all"
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                  <span>Create New Channel</span>
                </button>
              </motion.div>
            )}

            {/* 2. CREATE WIZARD (Figma Images 2, 3, 4, 5) */}
            {activeTab === "create" && (
              <motion.div
                key="create"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-md mx-auto"
              >
                {/* STEP 1: Channel Information (Figma Image 2) */}
                {step === 1 && (
                  <form onSubmit={handleStep1Submit} className="space-y-6">
                    {/* Cloudinary Circular Avatar Upload */}
                    <div className="flex flex-col items-center justify-center py-2">
                      <div
                        onClick={() => !isUploadingPhoto && fileInputRef.current?.click()}
                        className="relative h-28 w-28 rounded-full bg-blue-50/60 border border-blue-200 flex items-center justify-center cursor-pointer hover:border-[#3B58F5] transition-all shadow-inner overflow-hidden group"
                      >
                        {isUploadingPhoto ? (
                          <Loader2 className="h-8 w-8 animate-spin text-[#3B58F5]" />
                        ) : avatarUrl ? (
                          <img src={avatarUrl} alt="Channel Logo" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-10 w-10 text-slate-300 group-hover:text-[#3B58F5] transition-colors" />
                        )}

                        <div className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-[#3B58F5] text-white flex items-center justify-center shadow-md border-2 border-white">
                          <Camera className="h-4 w-4" />
                        </div>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </div>

                    {/* Channel Name */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#11142D]">
                        Channel Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Product Updates"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-[#11142D] placeholder-slate-400 focus:border-[#3B58F5] focus:outline-none focus:ring-2 focus:ring-[#3B58F5]/15"
                      />
                    </div>

                    {/* Website */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#11142D]">Website</label>
                      <input
                        type="text"
                        placeholder="Product website"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-[#11142D] placeholder-slate-400 focus:border-[#3B58F5] focus:outline-none focus:ring-2 focus:ring-[#3B58F5]/15"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-[#11142D]">Description</label>
                        <span className="text-[11px] text-slate-400">
                          {description.length}/300 · Optional
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        maxLength={300}
                        placeholder="Tell people what your channel is about..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-[#11142D] placeholder-slate-400 focus:border-[#3B58F5] focus:outline-none focus:ring-2 focus:ring-[#3B58F5]/15 resize-none"
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-[#11142D]">Category</label>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setCategory(cat)}
                            className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                              category === cat
                                ? "bg-[#3B58F5] text-white shadow-md shadow-[#3B58F5]/25"
                                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#3B58F5] py-4 text-sm font-bold text-white shadow-lg shadow-[#3B58F5]/25 hover:bg-[#2C48B8] transition-all"
                      >
                        <span>Continue</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 2: Channel Settings (Figma Image 3) */}
                {step === 2 && (
                  <form onSubmit={handleStep2Submit} className="space-y-6">
                    {/* Who can join */}
                    <div className="space-y-2.5">
                      <label className="block text-xs font-bold text-[#11142D]">Who can join</label>
                      <div className="space-y-2.5">
                        {[
                          { val: "ANYONE", title: "Anyone", desc: "Open to all platform users" },
                          { val: "INVITE_ONLY", title: "Invite Only", desc: "Members must receive an invite" },
                          { val: "REQUIRES_APPROVAL", title: "Requires Approval", desc: "Admin reviews each join request" },
                        ].map((opt) => (
                          <label
                            key={opt.val}
                            onClick={() => setWhoCanJoin(opt.val as any)}
                            className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                              whoCanJoin === opt.val
                                ? "border-[#3B58F5] bg-blue-50/40 shadow-2xs"
                                : "border-slate-200 bg-white hover:bg-slate-50"
                            }`}
                          >
                            <div className="mt-0.5">
                              {whoCanJoin === opt.val ? (
                                <div className="h-5 w-5 rounded-full bg-[#3B58F5] text-white flex items-center justify-center">
                                  <Check className="h-3 w-3 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                              )}
                            </div>
                            <div>
                              <span className="block text-sm font-bold text-[#3B58F5]">{opt.title}</span>
                              <span className="block text-xs font-medium text-slate-400 mt-0.5">{opt.desc}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Who can post */}
                    <div className="space-y-2.5">
                      <label className="block text-xs font-bold text-[#11142D]">Who can post</label>
                      <div className="space-y-2.5">
                        {[
                          { val: "ADMIN_ONLY", title: "Admin Only", desc: "Only channel admins can post" },
                          { val: "ADMIN_MODERATORS", title: "Admin + Moderators", desc: "Both admins and moderators can post" },
                        ].map((opt) => (
                          <label
                            key={opt.val}
                            onClick={() => setWhoCanPost(opt.val as any)}
                            className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                              whoCanPost === opt.val
                                ? "border-[#3B58F5] bg-blue-50/40 shadow-2xs"
                                : "border-slate-200 bg-white hover:bg-slate-50"
                            }`}
                          >
                            <div className="mt-0.5">
                              {whoCanPost === opt.val ? (
                                <div className="h-5 w-5 rounded-full bg-[#3B58F5] text-white flex items-center justify-center">
                                  <Check className="h-3 w-3 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                              )}
                            </div>
                            <div>
                              <span className="block text-sm font-bold text-[#3B58F5]">{opt.title}</span>
                              <span className="block text-xs font-medium text-slate-400 mt-0.5">{opt.desc}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Interactions */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-[#11142D]">Interactions</label>
                      <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white">
                        <div>
                          <span className="block text-sm font-bold text-[#11142D]">Enable Reactions</span>
                          <span className="block text-xs text-slate-400">Members can react with emoji</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={enableReactions}
                          onChange={(e) => setEnableReactions(e.target.checked)}
                          className="h-6 w-11 rounded-full text-[#3B58F5] focus:ring-[#3B58F5] cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Default Notifications for Members */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-[#11142D]">
                        Default Notifications for Members
                      </label>
                      <div className="flex items-start gap-3.5 p-4 rounded-2xl border border-[#3B58F5] bg-blue-50/40">
                        <div className="h-5 w-5 rounded-full bg-[#3B58F5] text-white flex items-center justify-center mt-0.5">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                        <div>
                          <span className="block text-sm font-bold text-[#3B58F5]">All Messages</span>
                          <span className="block text-xs font-medium text-slate-400 mt-0.5">
                            Notify for every new post
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#3B58F5] py-4 text-sm font-bold text-white shadow-lg shadow-[#3B58F5]/25 hover:bg-[#2C48B8] transition-all"
                      >
                        <span>Continue</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 3: Invite Members (Figma Image 4) */}
                {step === 3 && (
                  <div className="space-y-6">
                    {/* Search box */}
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search contacts to invite..."
                        value={contactSearch}
                        onChange={(e) => setContactSearch(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-3.5 text-sm font-semibold text-[#11142D] placeholder-slate-400 focus:border-[#3B58F5] focus:outline-none"
                      />
                    </div>

                    {/* Contacts List with Round Circles */}
                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                      {contactSearch.match(/^\+?[1-9]\d{1,14}$/) && (
                        <div
                          onClick={() => {
                            if (selectedPhones.includes(contactSearch)) {
                              setSelectedPhones((prev) => prev.filter((p) => p !== contactSearch));
                            } else {
                              setSelectedPhones((prev) => [...prev, contactSearch]);
                            }
                          }}
                          className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                              <Phone className="h-4 w-4" />
                            </div>
                            <div>
                              <span className="block text-sm font-bold text-[#11142D]">{contactSearch}</span>
                              <span className="block text-[10px] text-slate-500">Invite by phone number</span>
                            </div>
                          </div>
                          <div className="shrink-0">
                            {selectedPhones.includes(contactSearch) ? (
                              <div className="h-6 w-6 rounded-full bg-[#3B58F5] text-white flex items-center justify-center shadow-xs">
                                <Check className="h-3.5 w-3.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="h-6 w-6 rounded-full border-2 border-slate-300" />
                            )}
                          </div>
                        </div>
                      )}

                      {selectedPhones.map((p) => {
                        if (p === contactSearch) return null;
                        return (
                          <div
                            key={p}
                            onClick={() => setSelectedPhones((prev) => prev.filter((phone) => phone !== p))}
                            className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                                <Phone className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="block text-sm font-bold text-[#11142D]">{p}</span>
                                <span className="block text-[10px] text-slate-500">Invite by phone number</span>
                              </div>
                            </div>
                            <div className="shrink-0">
                              <div className="h-6 w-6 rounded-full bg-[#3B58F5] text-white flex items-center justify-center shadow-xs">
                                <Check className="h-3.5 w-3.5 stroke-[3]" />
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {filteredContacts.length === 0 && !contactSearch.match(/^\+?[1-9]\d{1,14}$/) && selectedPhones.length === 0 ? (
                        <div className="py-12 text-center text-xs font-semibold text-slate-400">
                          No contacts found. Type a phone number to invite by phone.
                        </div>
                      ) : (
                        filteredContacts.map((c) => {
                          const isSelected = selectedMemberIds.includes(c.id);
                          return (
                            <div
                              key={c.id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedMemberIds((prev) => prev.filter((id) => id !== c.id));
                                } else {
                                  setSelectedMemberIds((prev) => [...prev, c.id]);
                                }
                              }}
                              className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-3.5">
                                <div className="h-10 w-10 rounded-full bg-[#3B58F5] text-white font-bold flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                                  {c.avatarUrl ? (
                                    <img src={c.avatarUrl} alt={c.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <span>{c.name.charAt(0).toUpperCase()}</span>
                                  )}
                                </div>
                                <span className="text-sm font-bold text-[#11142D]">{c.name}</span>
                              </div>

                              <div className="shrink-0">
                                {isSelected ? (
                                  <div className="h-6 w-6 rounded-full bg-[#3B58F5] text-white flex items-center justify-center shadow-xs">
                                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                                  </div>
                                ) : (
                                  <div className="h-6 w-6 rounded-full border-2 border-slate-300" />
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Bottom Buttons */}
                    <div className="space-y-3 pt-4">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={executeCreateChannel}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#3B58F5] py-4 text-sm font-bold text-white shadow-lg shadow-[#3B58F5]/25 hover:bg-[#2C48B8] disabled:opacity-60 transition-all"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <span>Create Channel</span>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={executeCreateChannel}
                        className="w-full py-2 text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        Skip — invite members later
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: Success Screen (Figma Image 5) */}
                {step === 4 && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center justify-center py-12 text-center space-y-6"
                  >
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-[#3B58F5] shadow-xl shadow-blue-500/20 p-3">
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-[#3B58F5] text-white">
                        <Check className="h-10 w-10 stroke-[3]" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-extrabold text-[#11142D] max-w-xs mx-auto leading-snug">
                        Your channel has been created successfully!
                      </h3>
                      <p className="text-xs font-medium text-slate-500 max-w-sm mx-auto">
                        Start sharing content with your audience with your audience
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        handleResetWizard();
                        setActiveTab("list");
                        fetchChannels();
                      }}
                      className="w-full rounded-2xl bg-[#3B58F5] py-4 text-sm font-bold text-white shadow-lg shadow-[#3B58F5]/25 hover:bg-[#2C48B8] transition-all mt-4"
                    >
                      Go to My Channels
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* 3 & 4. LIVE CHANNEL ROOM & ADMIN VIEW (Figma Admin View exact match) */}
            {(activeTab === "room" || activeTab === "settings") && selectedChannel && (
              <motion.div
                key="admin-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col -m-7"
              >
                {/* Top Banner Gradient (Matches Figma design header) */}
                <div className="bg-gradient-to-r from-purple-500/25 via-indigo-500/15 to-blue-500/25 h-32 relative flex items-start justify-between p-5">
                  <button
                    onClick={() => setActiveTab("list")}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/15 hover:bg-slate-900/25 text-white transition-all shadow-xs"
                  >
                    <ArrowLeft className="h-5 w-5 stroke-[2.5]" />
                  </button>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => {
                        setActiveTab("room");
                        setAdminSubTab("posts");
                        setShowPostForm(!showPostForm);
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/15 hover:bg-slate-900/25 text-white transition-all shadow-xs"
                      title="New Post"
                    >
                      <Plus className="h-5 w-5 stroke-[2.5]" />
                    </button>
                    <button
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/15 hover:bg-slate-900/25 text-white transition-all shadow-xs"
                      title="Notifications"
                    >
                      <Bell className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Channel Profile Info Header */}
                <div className="px-7 pb-4 border-b border-slate-100 bg-white">
                  <div className="flex items-end justify-between -mt-10">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-extrabold text-3xl border-4 border-white shadow-md flex items-center justify-center overflow-hidden shrink-0">
                      {selectedChannel.avatarUrl ? (
                        <img src={selectedChannel.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span>{selectedChannel.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-[11px] font-extrabold text-indigo-600 shadow-2xs">
                      Admin Mode
                    </span>
                  </div>

                  <div className="mt-3">
                    <h3 className="text-xl font-bold text-[#11142D] tracking-tight">{selectedChannel.name}</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {selectedChannel.description || "Latest product news & releases"}
                    </p>
                  </div>

                  <div className="mt-3.5 flex items-center gap-6 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-indigo-600" />
                      <strong className="text-[#11142D] font-bold">
                        {(selectedChannel.memberCount || 1240).toLocaleString()}
                      </strong>{" "}
                      followers
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-indigo-600" />
                      <strong className="text-[#11142D] font-bold">
                        {messages.length > 0 ? messages.length : 4}
                      </strong>{" "}
                      posts
                    </span>
                  </div>
                </div>

                {/* 3 Tabs Navigation Bar (Posts | Members | Settings) */}
                <div className="flex items-center border-b border-slate-100 bg-white px-2 shrink-0">
                  <button
                    onClick={() => {
                      setActiveTab("room");
                      setAdminSubTab("posts");
                    }}
                    className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3.5 text-xs font-bold border-b-2 transition-all ${
                      activeTab === "room" && adminSubTab === "posts"
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    <span>Posts</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("room");
                      setAdminSubTab("members");
                    }}
                    className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3.5 text-xs font-bold border-b-2 transition-all ${
                      activeTab === "room" && adminSubTab === "members"
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    <span>Members</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("settings");
                      setAdminSubTab("settings");
                      handleOpenSettings(selectedChannel);
                    }}
                    className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3.5 text-xs font-bold border-b-2 transition-all ${
                      activeTab === "settings"
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </button>
                </div>

                {/* TAB CONTENT */}
                <div className="p-7 max-h-[480px] overflow-y-auto bg-[#F8FAFC]/50">
                  {/* 1. POSTS SUB-TAB */}
                  {activeTab === "room" && adminSubTab === "posts" && (
                    <div className="space-y-4 max-w-xl mx-auto">
                      {/* Create Post Prompt Box (Figma match) */}
                      <div
                        onClick={() => setShowPostForm(!showPostForm)}
                        className="border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3.5 shadow-2xs hover:border-indigo-300 transition-all cursor-pointer bg-white"
                      >
                        <div className="h-11 w-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                          <Plus className="h-6 w-6 stroke-[3]" />
                        </div>
                        <span className="text-sm font-semibold text-slate-400">Create a new post...</span>
                      </div>

                      {/* Expandable Compose Post Box (Exact match to Figma Image 1, 2, 3) */}
                      <AnimatePresence>
                        {showPostForm && (
                          <motion.form
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            onSubmit={handleSendBlast}
                            className="overflow-hidden border border-slate-200 rounded-3xl bg-white p-5 shadow-lg space-y-4"
                          >
                            {/* Hidden File Input for Cloudinary Upload */}
                            <input
                              type="file"
                              ref={mediaFileInputRef}
                              onChange={handleMediaFileUpload}
                              accept={postType === "video" ? "video/*" : "image/*"}
                              className="hidden"
                            />

                            {/* Top Header: X | Create Post | Publish */}
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                              <button
                                type="button"
                                onClick={() => setShowPostForm(false)}
                                className="text-slate-400 hover:text-slate-600 p-1"
                              >
                                <X className="h-5 w-5" />
                              </button>
                              <span className="text-base font-bold text-[#11142D]">Create Post</span>
                              <button
                                type="submit"
                                disabled={isSending || isUploadingMedia}
                                className="rounded-xl bg-[#4F46E5] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#4338CA] disabled:opacity-50 transition-all flex items-center gap-1.5"
                              >
                                {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                <span>Publish</span>
                              </button>
                            </div>

                            {/* Post Type Pills Row: Image | Video | Poll */}
                            <div className="flex items-center gap-2.5 pt-1">
                              <button
                                type="button"
                                onClick={() => setPostType("image")}
                                className={`px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all ${
                                  postType === "image"
                                    ? "bg-[#4F46E5] text-white shadow-md"
                                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                <ImageIcon className="h-4 w-4" />
                                <span>Image</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setPostType("video")}
                                className={`px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all ${
                                  postType === "video"
                                    ? "bg-[#4F46E5] text-white shadow-md"
                                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                <Video className="h-4 w-4" />
                                <span>Video</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setPostType("poll")}
                                className={`px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all ${
                                  postType === "poll"
                                    ? "bg-[#4F46E5] text-white shadow-md"
                                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                <BarChart2 className="h-4 w-4" />
                                <span>Poll</span>
                              </button>
                            </div>

                            {/* Main Textarea Input */}
                            <div className="pt-1">
                              <textarea
                                rows={postType === "poll" ? 3 : 4}
                                placeholder={
                                  postType === "poll"
                                    ? "Ask your audience a question..."
                                    : "Write something to share with your followers..."
                                }
                                value={blastMessage}
                                onChange={(e) => setBlastMessage(e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-medium text-[#11142D] focus:border-[#4F46E5] focus:outline-none resize-none bg-white min-h-[100px]"
                              />
                            </div>

                            {/* TYPE 1 & 2: Image / Video Upload Box */}
                            {postType !== "poll" && (
                              <div>
                                {mediaUrlInput ? (
                                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 max-h-64 flex items-center justify-center">
                                    {postType === "video" ? (
                                      <video src={mediaUrlInput} controls className="w-full max-h-64 object-cover" />
                                    ) : (
                                      <img src={mediaUrlInput} alt="Preview" className="w-full max-h-64 object-cover" />
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setMediaUrlInput("")}
                                      className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    onClick={() => mediaFileInputRef.current?.click()}
                                    className="border-2 border-dashed border-slate-200 hover:border-[#4F46E5]/60 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all text-slate-400"
                                  >
                                    {isUploadingMedia ? (
                                      <Loader2 className="h-7 w-7 animate-spin text-[#4F46E5]" />
                                    ) : postType === "video" ? (
                                      <Play className="h-7 w-7 text-slate-400 stroke-[1.5]" />
                                    ) : (
                                      <ImageIcon className="h-7 w-7 text-slate-400 stroke-[1.5]" />
                                    )}
                                    <span className="text-xs font-bold text-slate-400">
                                      {isUploadingMedia
                                        ? "Uploading to Cloudinary..."
                                        : postType === "video"
                                        ? "Tap to add video"
                                        : "Tap to add photo"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* TYPE 3: Poll Options Section */}
                            {postType === "poll" && (
                              <div className="space-y-3 pt-1">
                                <span className="block text-[11px] font-extrabold text-slate-400 tracking-wider">
                                  POLL OPTIONS
                                </span>

                                <div className="space-y-2.5">
                                  {pollOptions.map((opt, idx) => (
                                    <div key={idx} className="flex items-center gap-2.5">
                                      <div className="h-7 w-7 rounded-full border-2 border-slate-200 text-slate-400 font-bold flex items-center justify-center text-xs shrink-0">
                                        {idx + 1}
                                      </div>
                                      <div className="relative flex-1">
                                        <input
                                          type="text"
                                          placeholder={`Option ${idx + 1}`}
                                          value={opt}
                                          onChange={(e) => {
                                            const updated = [...pollOptions];
                                            updated[idx] = e.target.value;
                                            setPollOptions(updated);
                                          }}
                                          className="w-full rounded-2xl border border-slate-200 p-3 pr-9 text-sm font-semibold text-[#11142D] focus:border-[#4F46E5] focus:outline-none"
                                        />
                                        {pollOptions.length > 2 && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setPollOptions(pollOptions.filter((_, i) => i !== idx));
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                                          >
                                            <X className="h-4 w-4" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setPollOptions([...pollOptions, ""])}
                                  className="flex items-center gap-1.5 text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] transition-colors py-1"
                                >
                                  <Plus className="h-4 w-4 stroke-[3]" />
                                  <span>Add option</span>
                                </button>
                              </div>
                            )}

                            {/* Schedule Post Collapsible Card */}
                            <div className="pt-2">
                              <div
                                onClick={() => setShowSchedule(!showSchedule)}
                                className="border border-slate-100 bg-[#F8FAFC] rounded-2xl p-3.5 flex items-center justify-between cursor-pointer hover:border-slate-200 transition-all"
                              >
                                <div className="flex items-center gap-2.5 text-xs font-bold text-[#11142D]">
                                  <Calendar className="h-4 w-4 text-[#4F46E5]" />
                                  <span>Schedule Post</span>
                                </div>
                                {showSchedule ? (
                                  <ChevronUp className="h-4 w-4 text-slate-400" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-slate-400" />
                                )}
                              </div>

                              {showSchedule && (
                                <div className="mt-2.5 rounded-2xl border border-slate-200 p-3.5 bg-white shadow-2xs space-y-2">
                                  <label className="block text-[11px] font-extrabold text-slate-400 tracking-wider">
                                    PUBLISH DATE & TIME
                                  </label>
                                  <input
                                    type="datetime-local"
                                    value={scheduleDate}
                                    onChange={(e) => setScheduleDate(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-[#11142D] focus:border-[#4F46E5] focus:outline-none bg-white"
                                  />
                                </div>
                              )}
                            </div>
                          </motion.form>
                        )}
                      </AnimatePresence>

                      {/* Posts Timeline */}
                      {isLoadingMessages ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                          <p className="text-xs font-semibold text-slate-400">Loading channel posts...</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Real messages if any exist */}
                          {messages.map((msg, index) => (
                            <div
                              key={msg.id}
                              className={
                                msg.isSent === false
                                  ? "border-2 border-amber-300 rounded-2xl p-5 bg-amber-50/20 shadow-2xs space-y-3 relative"
                                  : "border border-slate-200 rounded-2xl p-5 bg-white shadow-2xs space-y-3"
                              }
                            >
                              <div className="flex items-center justify-between relative">
                                {msg.isSent === false ? (
                                  <span className="flex items-center gap-1.5 text-xs font-extrabold text-amber-600 tracking-wide bg-amber-100/70 px-2.5 py-1 rounded-full border border-amber-300 shadow-2xs">
                                    <Calendar className="h-3.5 w-3.5" />
                                    SCHEDULED FOR {msg.scheduledFor ? new Date(msg.scheduledFor).toLocaleString() : "LATER"}
                                  </span>
                                ) : msg.isPinned ? (
                                  <span className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-600 tracking-wide">
                                    <Pin className="h-3.5 w-3.5 fill-current" />
                                    PINNED POST
                                  </span>
                                ) : (
                                  <span className="text-xs font-bold text-slate-500">ANNOUNCEMENT</span>
                                )}
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => setOpenActionMenuId(openActionMenuId === msg.id ? null : msg.id)}
                                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </button>

                                  <AnimatePresence>
                                    {openActionMenuId === msg.id && (
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                        className="absolute right-0 top-8 z-50 w-44 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 text-xs font-bold text-[#11142D]"
                                      >
                                        <button
                                          type="button"
                                          onClick={() => handleTogglePinPost(msg)}
                                          className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 transition-colors text-left"
                                        >
                                          {msg.isPinned ? (
                                            <>
                                              <PinOff className="h-3.5 w-3.5 text-slate-500" />
                                              <span>Unpin Post</span>
                                            </>
                                          ) : (
                                            <>
                                              <Pin className="h-3.5 w-3.5 text-indigo-600" />
                                              <span>Pin to Top</span>
                                            </>
                                          )}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingPostId(msg.id);
                                            setEditPostContent(msg.content);
                                            setOpenActionMenuId(null);
                                          }}
                                          className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 transition-colors text-left"
                                        >
                                          <Edit2 className="h-3.5 w-3.5 text-blue-500" />
                                          <span>Edit Post</span>
                                        </button>
                                        <div className="border-t border-slate-100 my-1" />
                                        <button
                                          type="button"
                                          disabled={isDeletingPostId === msg.id}
                                          onClick={() => handleDeletePost(msg.id)}
                                          className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-red-50 text-red-600 transition-colors text-left"
                                        >
                                          {isDeletingPostId === msg.id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                          ) : (
                                            <Trash2 className="h-3.5 w-3.5" />
                                          )}
                                          <span>Delete Post</span>
                                        </button>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>

                              {editingPostId === msg.id ? (
                                <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                                  <textarea
                                    value={editPostContent}
                                    onChange={(e) => setEditPostContent(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium text-[#11142D] focus:border-indigo-600 focus:outline-none resize-none"
                                    rows={3}
                                  />
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setEditingPostId(null)}
                                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200/60 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isUpdatingPost}
                                      onClick={() => handleUpdatePostContent(msg.id)}
                                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs"
                                    >
                                      {isUpdatingPost && <Loader2 className="h-3 w-3 animate-spin" />}
                                      <span>Save Changes</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm font-medium text-[#11142D] whitespace-pre-wrap leading-relaxed">
                                  {msg.content}
                                </p>
                              )}

                              {msg.mediaUrl && msg.mediaType === "video" ? (
                                <div className="mt-3 rounded-xl overflow-hidden border border-slate-100 max-h-72 bg-black">
                                  <video src={msg.mediaUrl} controls className="w-full h-auto max-h-72 object-cover" />
                                </div>
                              ) : msg.mediaUrl && msg.mediaType === "poll" ? (
                                (() => {
                                  let pollData: any = null;
                                  try {
                                    pollData = JSON.parse(msg.mediaUrl || "{}");
                                  } catch (e) {}
                                  return pollData?.options ? (
                                    <div className="space-y-2 mt-3 pt-1">
                                      {pollData.options.map((opt: string, idx: number) => (
                                        <button
                                          key={idx}
                                          type="button"
                                          onClick={() => toast.success(`Voted for: ${opt}`)}
                                          className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-[#4F46E5] hover:text-white text-[#11142D] text-xs font-bold transition-all shadow-2xs group"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="h-6 w-6 rounded-full border-2 border-current flex items-center justify-center text-[11px] font-extrabold shrink-0">
                                              {idx + 1}
                                            </div>
                                            <span>{opt}</span>
                                          </div>
                                          <span className="text-[10px] opacity-75 group-hover:opacity-100 font-extrabold">
                                            Vote
                                          </span>
                                        </button>
                                      ))}
                                      {pollData.scheduledFor && (
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 mt-2 bg-indigo-50 px-3 py-1.5 rounded-xl w-fit">
                                          <Calendar className="h-3.5 w-3.5" />
                                          <span>
                                            Scheduled for: {new Date(pollData.scheduledFor).toLocaleString()}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  ) : null;
                                })()
                              ) : msg.mediaUrl ? (
                                <div className="mt-3 rounded-xl overflow-hidden border border-slate-100 max-h-72">
                                  <img src={msg.mediaUrl} alt="" className="w-full h-auto object-cover" />
                                </div>
                              ) : null}

                              <div className="flex items-center justify-between text-xs text-slate-400 font-medium pt-1">
                                <span>👁️ 1,240</span>
                                <span>
                                  {new Date(msg.createdAt).toLocaleDateString([], {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>

                              <div className="border-t border-slate-100 pt-3 grid grid-cols-2 text-xs font-bold text-slate-500">
                                <button className="flex items-center justify-center gap-1.5 hover:text-red-500 transition-colors py-1">
                                  <Heart className="h-4 w-4" />
                                  <span>89</span>
                                </button>
                                <button className="flex items-center justify-center gap-1.5 hover:text-indigo-600 transition-colors py-1">
                                  <Share2 className="h-4 w-4" />
                                  <span>Share</span>
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Empty State */}
                          {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
                                <MessageSquare className="h-8 w-8 text-slate-300" />
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-[#11142D]">No posts yet</h3>
                                <p className="text-xs font-medium text-slate-400 mt-1 max-w-[250px]">
                                  {selectedChannel.myRole === 'ADMIN' || selectedChannel.myRole === 'MODERATOR' 
                                    ? "Create the first post to welcome your members to this channel."
                                    : "There are no posts in this channel yet."}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. MEMBERS SUB-TAB */}
                  {activeTab === "room" && adminSubTab === "members" && (
                    <div className="space-y-4 max-w-xl mx-auto">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#11142D]">
                          Subscribers & Moderators ({(channelMembers.length || 1).toLocaleString()})
                        </span>
                        {selectedChannel.myRole === 'ADMIN' && (
                          !showInviteMembers ? (
                            <button
                              onClick={() => setShowInviteMembers(true)}
                              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-all"
                            >
                              <Plus className="h-3.5 w-3.5 stroke-[3]" />
                              <span>Invite Members</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setShowInviteMembers(false)}
                              className="text-xs font-bold text-slate-500 hover:text-slate-700"
                            >
                              Cancel
                            </button>
                          )
                        )}
                      </div>

                      {showInviteMembers && (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                          <h4 className="text-sm font-bold text-[#11142D]">Invite Contacts</h4>
                          <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Search contacts..."
                              value={inviteContactSearch}
                              onChange={(e) => setInviteContactSearch(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-xs font-semibold text-[#11142D] focus:border-indigo-600 focus:outline-none bg-white"
                            />
                          </div>

                          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                            {inviteContactSearch.match(/^\+?[1-9]\d{1,14}$/) && (
                              <div
                                onClick={() => {
                                  if (inviteSelectedPhones.includes(inviteContactSearch)) {
                                    setInviteSelectedPhones((prev) => prev.filter((p) => p !== inviteContactSearch));
                                  } else {
                                    setInviteSelectedPhones((prev) => [...prev, inviteContactSearch]);
                                  }
                                }}
                                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors bg-white border border-slate-100 shadow-2xs"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center overflow-hidden shrink-0 text-xs">
                                    <Phone className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <span className="block text-xs font-bold text-[#11142D]">{inviteContactSearch}</span>
                                    <span className="block text-[10px] text-slate-500">Invite by phone number</span>
                                  </div>
                                </div>
                                <div className="shrink-0">
                                  {inviteSelectedPhones.includes(inviteContactSearch) ? (
                                    <div className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                                      <Check className="h-3 w-3 stroke-[3]" />
                                    </div>
                                  ) : (
                                    <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {inviteSelectedPhones.map((p) => {
                              if (p === inviteContactSearch) return null;
                              return (
                                <div
                                  key={p}
                                  onClick={() => setInviteSelectedPhones((prev) => prev.filter((phone) => phone !== p))}
                                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors bg-white border border-slate-100 shadow-2xs"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center overflow-hidden shrink-0 text-xs">
                                      <Phone className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <span className="block text-xs font-bold text-[#11142D]">{p}</span>
                                      <span className="block text-[10px] text-slate-500">Invite by phone number</span>
                                    </div>
                                  </div>
                                  <div className="shrink-0">
                                    <div className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                                      <Check className="h-3 w-3 stroke-[3]" />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {inviteFilteredContacts.length === 0 && !inviteContactSearch.match(/^\+?[1-9]\d{1,14}$/) && inviteSelectedPhones.length === 0 ? (
                              <div className="py-4 text-center text-xs font-semibold text-slate-400">
                                No new contacts found to invite. Type a valid phone number to invite by phone.
                              </div>
                            ) : (
                              inviteFilteredContacts.map((c) => {
                                const isSelected = c.isPhoneOnly 
                                  ? inviteSelectedPhones.includes(c.id) 
                                  : inviteSelectedMemberIds.includes(c.id);
                                return (
                                  <div
                                    key={c.id}
                                    onClick={() => {
                                      if (c.isPhoneOnly) {
                                        if (isSelected) {
                                          setInviteSelectedPhones((prev) => prev.filter((p) => p !== c.id));
                                        } else {
                                          setInviteSelectedPhones((prev) => [...prev, c.id]);
                                        }
                                      } else {
                                        if (isSelected) {
                                          setInviteSelectedMemberIds((prev) => prev.filter((id) => id !== c.id));
                                        } else {
                                          setInviteSelectedMemberIds((prev) => [...prev, c.id]);
                                        }
                                      }
                                    }}
                                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors bg-white border border-slate-100 shadow-2xs"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="h-8 w-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center overflow-hidden shrink-0 text-xs">
                                        {c.avatarUrl ? (
                                          <img src={c.avatarUrl} alt={c.name} className="h-full w-full object-cover" />
                                        ) : (
                                          <span>{c.name.charAt(0).toUpperCase()}</span>
                                        )}
                                      </div>
                                      <span className="text-xs font-bold text-[#11142D]">{c.name}</span>
                                    </div>
                                    <div className="shrink-0">
                                      {isSelected ? (
                                        <div className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                                          <Check className="h-3 w-3 stroke-[3]" />
                                        </div>
                                      ) : (
                                        <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {(inviteSelectedMemberIds.length > 0 || inviteSelectedPhones.length > 0) && (
                            <button
                              onClick={handleInviteMembersToExistingChannel}
                              disabled={isUpdatingMember}
                              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-md"
                            >
                              {isUpdatingMember ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 stroke-[3]" />
                                  Invite {inviteSelectedMemberIds.length + inviteSelectedPhones.length} Members
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}

                      {!showInviteMembers && (
                        <>
                          <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search members by name or role..."
                          className="w-full rounded-2xl border border-slate-200 pl-10 pr-4 py-3 text-xs font-semibold text-[#11142D] focus:border-indigo-600 focus:outline-none bg-white"
                        />
                      </div>

                      <div className="space-y-2">
                        {isLoadingMembers ? (
                          <div className="flex justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                          </div>
                        ) : (
                          channelMembers.map((m) => (
                            <div
                              key={m.id}
                              className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs relative"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden">
                                  {m.avatarUrl ? (
                                    <img src={m.avatarUrl} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <span>{m.name.charAt(0)}</span>
                                  )}
                                </div>
                                <div>
                                  <span className="block text-xs font-bold text-[#11142D]">{m.name} {selectedChannel.ownerId === m.id ? "(Owner)" : ""}</span>
                                  <span className="block text-[10px] font-extrabold text-indigo-600 mt-0.5">{m.role}</span>
                                </div>
                              </div>

                              {selectedChannel.ownerId !== m.id && selectedChannel.myRole === 'ADMIN' && (
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => setOpenMemberMenuId(openMemberMenuId === m.id ? null : m.id)}
                                    className="text-slate-400 hover:text-slate-700 p-1"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </button>

                                  <AnimatePresence>
                                    {openMemberMenuId === m.id && (
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                        className="absolute right-0 top-8 z-50 w-44 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 text-xs font-bold text-[#11142D]"
                                      >
                                        {m.role === "MEMBER" && (
                                          <button
                                            type="button"
                                            disabled={isUpdatingMember}
                                            onClick={() => handleUpdateMemberRole(m.id, "MODERATOR")}
                                            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 transition-colors text-left"
                                          >
                                            <span>Make Moderator</span>
                                          </button>
                                        )}
                                        {m.role === "MODERATOR" && (
                                          <button
                                            type="button"
                                            disabled={isUpdatingMember}
                                            onClick={() => handleUpdateMemberRole(m.id, "MEMBER")}
                                            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 transition-colors text-left"
                                          >
                                            <span>Remove Moderator</span>
                                          </button>
                                        )}
                                        <div className="border-t border-slate-100 my-1" />
                                        <button
                                          type="button"
                                          disabled={isUpdatingMember}
                                          onClick={() => handleRemoveMember(m.id)}
                                          className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-red-50 text-red-600 transition-colors text-left"
                                        >
                                          {isUpdatingMember ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                          ) : (
                                            <Trash2 className="h-3.5 w-3.5" />
                                          )}
                                          <span>Remove Member</span>
                                        </button>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* 3. SETTINGS SUB-TAB (Inside Admin View) */}
                  {activeTab === "settings" && (
                    <form onSubmit={handleSaveSettings} className="max-w-md mx-auto space-y-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                      <div>
                        <label className="block text-xs font-bold text-[#11142D] mb-1">Channel Name</label>
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-[#11142D] focus:border-indigo-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#11142D] mb-1">Website URL</label>
                        <input
                          type="text"
                          placeholder="https://yourbusiness.com"
                          value={editWebsite}
                          onChange={(e) => setEditWebsite(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-[#11142D] focus:border-indigo-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#11142D] mb-1">Category</label>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-[#11142D] focus:border-indigo-600 focus:outline-none"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#11142D] mb-1">Description</label>
                        <textarea
                          rows={3}
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 p-3 text-sm font-medium text-[#11142D] focus:border-indigo-600 focus:outline-none resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#11142D] mb-1">Who can join</label>
                          <select
                            value={editWhoCanJoin}
                            onChange={(e) => setEditWhoCanJoin(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-[#11142D] focus:border-indigo-600 focus:outline-none"
                          >
                            <option value="ANYONE">Anyone</option>
                            <option value="INVITE_ONLY">Invite Only</option>
                            <option value="REQUIRES_APPROVAL">Requires Approval</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#11142D] mb-1">Who can post</label>
                          <select
                            value={editWhoCanPost}
                            onChange={(e) => setEditWhoCanPost(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-[#11142D] focus:border-indigo-600 focus:outline-none"
                          >
                            <option value="ADMIN_ONLY">Admin Only</option>
                            <option value="ADMIN_MODERATORS">Admin + Moderators</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50">
                        <span className="text-sm font-bold text-[#11142D]">Enable Reactions</span>
                        <input
                          type="checkbox"
                          checked={editEnableReactions}
                          onChange={(e) => setEditEnableReactions(e.target.checked)}
                          className="h-6 w-11 rounded-full text-indigo-600 focus:ring-indigo-600"
                        />
                      </div>

                      <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={handleDeleteChannel}
                          className="flex items-center gap-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2.5 text-xs font-bold transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete Channel</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab("room");
                              setAdminSubTab("posts");
                            }}
                            className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSavingSettings}
                            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-all"
                          >
                            {isSavingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Save</span>}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
  );

  if (isEmbedded) {
    return (
      <div className="flex flex-1 h-full w-full bg-white overflow-hidden">
        {modalContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0F172A]/70 p-4 backdrop-blur-md">
      {modalContent}
    </div>
  );
}
