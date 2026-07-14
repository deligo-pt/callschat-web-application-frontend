"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
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
  ShieldCheck,
  Shield,
  ShieldOff,
  UserMinus,
  Copy,
  Link as LinkIcon,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ChannelService, type ChannelData, type ChannelMessageData, type JoinRequestData, type ChannelInvitationData } from "@/services/channel.service";
import { ContactService } from "@/services/contact.service";
import { chatService } from "@/services/chat.service";
import { cn } from "@/lib/utils";
import { uploadToCloudinary } from "@/services/business.service";
import { useSocket } from "@/components/providers/SocketProvider";
import { playNotificationSound } from "@/utils/sounds";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

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

const CONTACT_AVATAR_COLORS = [
  "bg-[#2563EB]",
  "bg-[#8B5CF6]",
  "bg-[#10B981]",
  "bg-[#EF4444]",
  "bg-[#F59E0B]",
  "bg-[#EC4899]",
  "bg-[#06B6D4]",
];

const getContactAvatarColor = (nameOrId: string, index: number) => {
  if (!nameOrId) return CONTACT_AVATAR_COLORS[index % CONTACT_AVATAR_COLORS.length];
  let hash = 0;
  for (let i = 0; i < nameOrId.length; i++) hash = nameOrId.charCodeAt(i) + ((hash << 5) - hash);
  return CONTACT_AVATAR_COLORS[Math.abs(hash) % CONTACT_AVATAR_COLORS.length];
};

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return null;
  }
}

export function BusinessChannelsModal({
  isOpen,
  onClose,
  onChannelUpdated,
  isEmbedded = false,
  initialChannelId,
}: BusinessChannelsModalProps) {
  const router = useRouter();
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState<"list" | "create" | "room" | "settings">("list");
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [myInvitations, setMyInvitations] = useState<ChannelInvitationData[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<ChannelData | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isJoiningChannel, setIsJoiningChannel] = useState(false);
  const [isLeavingChannel, setIsLeavingChannel] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (selectedChannel) {
      setIsSubscribed(Boolean(localStorage.getItem(`channel_sub_${selectedChannel.id}`)));
    }
  }, [selectedChannel?.id]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      const decoded = parseJwt(token);
      if (decoded) {
        setCurrentUserId(decoded.sub || decoded.id || "");
      }
    }
  }, []);

  // --- Real-time Socket Subscriptions for Business Channels ---
  useEffect(() => {
    if (!socket || !selectedChannel?.id || selectedChannel.id === "create") return;

    socket.emit("channel:join_room", {
      channelId: selectedChannel.id,
      workspaceId: selectedChannel.workspaceId || undefined,
    });
    console.log(`📡 Joined real-time socket room for channel #${selectedChannel.name}`);
  }, [socket, selectedChannel?.id, selectedChannel?.workspaceId, selectedChannel?.name]);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (newMsg: any) => {
      if (!newMsg || !newMsg.id) return;

      if (selectedChannel && newMsg.channelId === selectedChannel.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) {
            return prev.map((m) => (m.id === newMsg.id ? newMsg : m));
          }
          const updated = [newMsg, ...prev];
          return updated.sort((a, b) => {
            if (a.isPinned !== b.isPinned) return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
            if (a.isSent !== b.isSent) return (a.isSent === false ? -1 : 1);
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        });

        if (newMsg.senderId !== currentUserId) {
          playNotificationSound("message");
          toast.info(`New post in #${selectedChannel.name}`, {
            description: `${newMsg.senderName}: ${newMsg.content?.slice(0, 80) || "Shared media"}`,
          });
        }
      } else {
        if (newMsg.senderId !== currentUserId) {
          playNotificationSound("message");
          const targetChannel = channels.find((c) => c.id === newMsg.channelId);
          const chName = targetChannel ? `#${targetChannel.name}` : "Business Channel";
          toast.info(`New update in ${chName}`, {
            description: `${newMsg.senderName}: ${newMsg.content?.slice(0, 60) || "Shared media"}`,
            action: targetChannel
              ? {
                  label: "View",
                  onClick: () => {
                    handleSelectChannelToRoom(targetChannel);
                  },
                }
              : undefined,
          });
        }
      }
    };

    socket.on("channel:receive_message", handleReceiveMessage);
    return () => {
      socket.off("channel:receive_message", handleReceiveMessage);
    };
  }, [socket, selectedChannel?.id, selectedChannel?.name, channels, currentUserId]);

  const canUserPostInSelectedChannel = React.useMemo(() => {
    if (!selectedChannel) return false;
    const role = selectedChannel.myRole || "ADMIN"; // Defaults to ADMIN for channel owners if role is missing
    if (role === "ADMIN") return true;
    if (selectedChannel.whoCanPost === "ADMIN_MODERATORS") {
      return role === "ADMIN" || role === "MODERATOR";
    }
    return role === "ADMIN";
  }, [selectedChannel]);

  const canUserManageSettings = React.useMemo(() => {
    if (!selectedChannel) return false;
    const role = selectedChannel.myRole || "ADMIN";
    return role === "ADMIN" || role === "OWNER";
  }, [selectedChannel]);

  const canUserManageMembers = React.useMemo(() => {
    if (!selectedChannel) return false;
    const role = selectedChannel.myRole || "ADMIN";
    return role === "ADMIN" || role === "OWNER" || selectedChannel.ownerId === currentUserId;
  }, [selectedChannel, currentUserId]);

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
  const [adminSubTab, setAdminSubTab] = useState<"posts" | "members" | "settings" | "requests">("posts");
  const [joinRequests, setJoinRequests] = useState<JoinRequestData[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isProcessingRequest, setIsProcessingRequest] = useState<string | null>(null);
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

  // --- Post Share State ---
  const [selectedSharePost, setSelectedSharePost] = useState<ChannelMessageData | null>(null);
  const [shareTab, setShareTab] = useState<"contacts" | "external">("contacts");
  const [shareContactSearch, setShareContactSearch] = useState("");
  const [selectedShareContactIds, setSelectedShareContactIds] = useState<string[]>([]);
  const [sharePhoneInput, setSharePhoneInput] = useState("");
  const [shareNote, setShareNote] = useState("");
  const [isSharingPost, setIsSharingPost] = useState(false);
  const [postShareCounts, setPostShareCounts] = useState<Record<string, number>>({});
  const viewedMessageIdsRef = useRef<Set<string>>(new Set());

  // --- Member Actions State ---
  const [openMemberMenuId, setOpenMemberMenuId] = useState<string | null>(null);
  const [isUpdatingMember, setIsUpdatingMember] = useState(false);
  const [showInviteMembers, setShowInviteMembers] = useState(false);
  const [inviteContactSearch, setInviteContactSearch] = useState("");
  const [inviteSelectedMemberIds, setInviteSelectedMemberIds] = useState<string[]>([]);
  const [inviteSelectedPhones, setInviteSelectedPhones] = useState<string[]>([]);
  const [inviteRole, setInviteRole] = useState<"MEMBER" | "MODERATOR" | "ADMIN">("MEMBER");
  const [manualPhoneInput, setManualPhoneInput] = useState("");
  const [inviteManualPhone, setInviteManualPhone] = useState("");

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const fetchMyInvitations = useCallback(async () => {
    try {
      setIsLoadingInvitations(true);
      const res = await ChannelService.getMyChannelInvitations();
      if (res?.success) {
        setMyInvitations(res.data);
      }
    } catch (err) {
      console.error("Failed to load channel invitations", err);
    } finally {
      setIsLoadingInvitations(false);
    }
  }, []);

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await ChannelService.acceptChannelInvitation(invitationId);
      toast.success("Joined channel successfully!");
      fetchMyInvitations();
      fetchChannels();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Failed to accept invitation");
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    try {
      await ChannelService.rejectChannelInvitation(invitationId);
      toast.success("Invitation declined");
      fetchMyInvitations();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Failed to decline invitation");
    }
  };

  const fetchContactsForInvite = useCallback(async () => {
    try {
      const [contactsRes, unregRes] = await Promise.all([
        ContactService.fetchContacts().catch(() => ({ data: { contacts: [] } })),
        ContactService.listUnregisteredContacts({ limit: 100 }).catch(() => ({ data: { contacts: [] } })),
      ]);

      const map = new Map<string, any>();

      let contactList: any[] = [];
      if (Array.isArray(contactsRes)) {
        contactList = contactsRes;
      } else if (contactsRes && Array.isArray(contactsRes.data)) {
        contactList = contactsRes.data;
      } else if (contactsRes && contactsRes.data && Array.isArray(contactsRes.data.contacts)) {
        contactList = contactsRes.data.contacts;
      } else if (contactsRes && contactsRes.data && Array.isArray(contactsRes.data.items)) {
        contactList = contactsRes.data.items;
      } else if (contactsRes && Array.isArray(contactsRes.contacts)) {
        contactList = contactsRes.contacts;
      } else if (contactsRes && Array.isArray(contactsRes.items)) {
        contactList = contactsRes.items;
      }

      const getFullName = (profile: any) => {
        if (!profile) return "";
        if (profile.firstName || profile.lastName) {
          return `${profile.firstName || ""} ${profile.lastName || ""}`.trim();
        }
        return profile.displayName || profile.username || "";
      };

      if (Array.isArray(contactList)) {
        contactList.forEach((c: any, idx: number) => {
          const userId =
            c.contact?.id ||
            c.addressee?.id ||
            c.addresseeId ||
            c.userId ||
            c.user?.id ||
            c.contactId ||
            c.id ||
            `contact-${idx}`;
          if (!userId) return;
          const name =
            c.customName ||
            c.nickname ||
            c.name ||
            getFullName(c.contact?.profile) ||
            getFullName(c.addressee?.profile) ||
            getFullName(c.profile) ||
            getFullName(c.user?.profile) ||
            "Contact";
          const phone =
            c.contact?.phone ||
            c.phoneNumber ||
            c.phone ||
            c.user?.phone ||
            c.addressee?.phone ||
            c.contactPhone ||
            "";
          const avatarUrl =
            c.avatarUrl ||
            c.contact?.profile?.avatarUrl ||
            c.addressee?.profile?.avatarUrl ||
            c.profile?.avatarUrl ||
            c.user?.profile?.avatarUrl ||
            null;

          map.set(userId, {
            id: userId,
            name,
            phone,
            avatarUrl,
            isPhoneOnly: false,
          });
        });
      }

      let unregList: any[] = [];
      if (Array.isArray(unregRes)) {
        unregList = unregRes;
      } else if (unregRes && Array.isArray(unregRes.data)) {
        unregList = unregRes.data;
      } else if (unregRes && unregRes.data && Array.isArray(unregRes.data.contacts)) {
        unregList = unregRes.data.contacts;
      } else if (unregRes && Array.isArray((unregRes as any).contacts)) {
        unregList = (unregRes as any).contacts;
      }

      if (Array.isArray(unregList)) {
        unregList.forEach((c: any) => {
          const phone = c.phoneNumber || c.phone;
          if (phone && !map.has(phone)) {
            map.set(phone, {
              id: phone,
              name: c.name || phone,
              phone: phone,
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
    if (isOpen || isEmbedded || step === 3 || showInviteMembers) {
      fetchChannels();
      fetchMyInvitations();
      fetchContactsForInvite();
    }
  }, [isOpen, isEmbedded, step, showInviteMembers, fetchChannels, fetchMyInvitations, fetchContactsForInvite]);

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

  const deletedChannelIds = useRef<Set<string>>(new Set());
  const hasInitializedCreate = useRef(false);

  useEffect(() => {
    if (!initialChannelId) return;
    if (initialChannelId === "create") {
      if (!hasInitializedCreate.current) {
        setActiveTab("create");
        setSelectedChannel(null);
        hasInitializedCreate.current = true;
      }
      return;
    }
    if (deletedChannelIds.current.has(initialChannelId)) return;

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

  useEffect(() => {
    if (selectedChannel && messages.length > 0) {
      messages.forEach((msg) => {
        if (!viewedMessageIdsRef.current.has(msg.id)) {
          viewedMessageIdsRef.current.add(msg.id);
          ChannelService.incrementMessageViews(msg.channelId, msg.id)
            .then((res) => {
              if (res?.success && res.data?.viewsCount !== undefined) {
                setMessages((prev) =>
                  prev.map((m) => (m.id === msg.id ? { ...m, viewsCount: res.data.viewsCount } : m))
                );
              }
            })
            .catch(() => {});
        }
      });
    }
  }, [step, selectedChannel, messages]);

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

  const handleLikePost = async (msg: ChannelMessageData) => {
    try {
      // Optimistic update
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== msg.id) return m;
          const currentLiked = m.isLikedByMe ?? false;
          const currentCount = m.likesCount ?? 0;
          return {
            ...m,
            isLikedByMe: !currentLiked,
            likesCount: !currentLiked ? currentCount + 1 : Math.max(0, currentCount - 1),
          };
        })
      );

      const res = await ChannelService.toggleMessageReaction(msg.channelId, msg.id);
      if (res?.success && res.data) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msg.id
              ? { ...m, isLikedByMe: res.data.isLikedByMe, likesCount: res.data.likesCount }
              : m
          )
        );
      }
    } catch (err) {
      toast.error("Failed to update reaction");
      fetchChannelMessages(msg.channelId);
    }
  };

  const handleIncrementView = async (msg: ChannelMessageData) => {
    try {
      const res = await ChannelService.incrementMessageViews(msg.channelId, msg.id);
      if (res?.success && res.data?.viewsCount !== undefined) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, viewsCount: res.data.viewsCount } : m))
        );
      }
    } catch (err) {
      // ignore errors on manual view increment
    }
  };

  const handleOpenShareModal = (msg: ChannelMessageData) => {
    setSelectedSharePost(msg);
    setShareTab("contacts");
    setShareContactSearch("");
    setSelectedShareContactIds([]);
    setSharePhoneInput("");
    setShareNote("");
    if (contacts.length === 0) {
      fetchContactsForInvite();
    }
  };

  const handleSharePostToContacts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSharePost || !selectedChannel) return;
    const cleanPhones = sharePhoneInput
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (selectedShareContactIds.length === 0 && cleanPhones.length === 0) {
      toast.error("Please select at least one contact or enter a phone number to share.");
      return;
    }

    setIsSharingPost(true);
    try {
      const channelUrl = `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/business/channels/${selectedChannel.id}`;
      const shareMessageContent = `📢 Shared Post from #${selectedChannel.name}\n\n"${selectedSharePost.content}"\n\n${selectedSharePost.mediaUrl ? `🔗 Attached Media: ${selectedSharePost.mediaUrl}\n\n` : ""}${shareNote.trim() ? `💬 Note: ${shareNote.trim()}\n\n` : ""}👉 View Channel: ${channelUrl}`;

      let successCount = 0;

      // 1. Share to selected contacts from the list
      for (const contactId of selectedShareContactIds) {
        try {
          const res = await chatService.initiateConversation(contactId);
          const convId = res?.data?.conversationId ?? res?.conversationId ?? res?.data?.id;
          if (convId) {
            await chatService.sendMessage({
              conversationId: convId,
              ciphertext: shareMessageContent,
              nonce: "shared_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
              mediaUrl: selectedSharePost.mediaUrl || null,
              mediaType: selectedSharePost.mediaType || null,
            });
            successCount++;
          }
        } catch (err) {
          console.error("Error sharing post to contact:", contactId, err);
        }
      }

      // 2. Share to manual phone numbers entered
      for (const phone of cleanPhones) {
        try {
          const res = await chatService.initiateConversation(phone);
          const convId = res?.data?.conversationId ?? res?.conversationId ?? res?.data?.id;
          if (convId) {
            await chatService.sendMessage({
              conversationId: convId,
              ciphertext: shareMessageContent,
              nonce: "shared_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
              mediaUrl: selectedSharePost.mediaUrl || null,
              mediaType: selectedSharePost.mediaType || null,
            });
            successCount++;
          }
        } catch (err) {
          console.error("Error sharing post to phone:", phone, err);
        }
      }

      setPostShareCounts((prev) => ({
        ...prev,
        [selectedSharePost.id]: (prev[selectedSharePost.id] || 0) + (successCount || 1),
      }));

      toast.success(`Post successfully shared to ${successCount || (selectedShareContactIds.length + cleanPhones.length)} recipient(s)!`);
      setSelectedSharePost(null);
    } catch (err: any) {
      toast.error("Failed to share post. Please try again.");
    } finally {
      setIsSharingPost(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, role: "MEMBER" | "MODERATOR" | "ADMIN") => {
    if (!selectedChannel) return;
    try {
      setIsUpdatingMember(true);
      const res = await ChannelService.updateChannelMemberRole(selectedChannel.id, memberId, role);
      if (res?.success) {
        setChannelMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role } : m)));
        toast.success(`Role updated to ${role === "MODERATOR" ? "Moderator" : "Member"}`);
        fetchChannelMembers(selectedChannel.id);
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
        fetchChannelMembers(selectedChannel.id);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to remove member");
    } finally {
      setIsUpdatingMember(false);
      setOpenMemberMenuId(null);
    }
  };

  const handleToggleSubscribe = async () => {
    if (!selectedChannel) return;
    setIsSubscribing(true);
    try {
      const nextState = !isSubscribed;
      setIsSubscribed(nextState);
      if (nextState) {
        localStorage.setItem(`channel_sub_${selectedChannel.id}`, "true");
        toast.success(`Subscribed to notifications for #${selectedChannel.name}`);
      } else {
        localStorage.removeItem(`channel_sub_${selectedChannel.id}`);
        toast.info(`Unsubscribed from notifications for #${selectedChannel.name}`);
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleJoinChannel = async () => {
    if (!selectedChannel) return;
    try {
      setIsJoiningChannel(true);
      const res = await ChannelService.joinChannel(selectedChannel.id, selectedChannel.workspaceId);
      if (res?.success) {
        if (res.data?.status === "pending") {
          toast.success("Join request submitted. Awaiting admin approval.");
        } else {
          toast.success(`Joined #${selectedChannel.name} successfully`);
          setSelectedChannel((prev) =>
            prev
              ? {
                  ...prev,
                  isMember: true,
                  memberCount: (prev.memberCount || 0) + 1,
                }
              : null
          );
          fetchChannelMembers(selectedChannel.id);
          fetchChannels();
        }
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to join channel");
    } finally {
      setIsJoiningChannel(false);
    }
  };

  const handleLeaveChannel = async () => {
    if (!selectedChannel) return;
    if (selectedChannel.ownerId === currentUserId) {
      toast.error("Channel owners cannot leave their own channel. You can delete the channel in Settings instead.");
      return;
    }
    if (!confirm(`Are you sure you want to leave #${selectedChannel.name}?`)) return;
    try {
      setIsLeavingChannel(true);
      const res = await ChannelService.leaveChannel(selectedChannel.id, selectedChannel.workspaceId);
      if (res?.success) {
        toast.success(`Left #${selectedChannel.name}`);
        setSelectedChannel((prev) =>
          prev
            ? {
                ...prev,
                isMember: false,
                memberCount: Math.max(0, (prev.memberCount || 1) - 1),
              }
            : null
        );
        fetchChannelMembers(selectedChannel.id);
        fetchChannels();
        setActiveTab("list");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to leave channel");
    } finally {
      setIsLeavingChannel(false);
    }
  };

  const handleInviteMembersToExistingChannel = async () => {
    if (!selectedChannel || (inviteSelectedMemberIds.length === 0 && inviteSelectedPhones.length === 0)) return;
    try {
      setIsUpdatingMember(true);
      const res = await ChannelService.addChannelMembers(selectedChannel.id, inviteSelectedMemberIds, inviteSelectedPhones, inviteRole);
      if (res?.success) {
        toast.success("Members invited successfully");
        fetchChannelMembers(selectedChannel.id);
        setShowInviteMembers(false);
        setInviteSelectedMemberIds([]);
        setInviteSelectedPhones([]);
        setInviteContactSearch("");
        setInviteRole("MEMBER");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Failed to invite members");
    } finally {
      setIsUpdatingMember(false);
    }
  };

  const fetchJoinRequests = useCallback(async (channelId: string) => {
    try {
      setIsLoadingRequests(true);
      const res = await ChannelService.getJoinRequests(channelId);
      if (res?.success && Array.isArray(res.data)) {
        setJoinRequests(res.data);
      }
    } catch (e) {
      console.error("Failed to fetch join requests", e);
    } finally {
      setIsLoadingRequests(false);
    }
  }, []);

  const handleApproveRequest = async (requestId: string) => {
    if (!selectedChannel) return;
    try {
      setIsProcessingRequest(requestId);
      await ChannelService.approveJoinRequest(selectedChannel.id, requestId);
      setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
      fetchChannelMembers(selectedChannel.id);
      toast.success("Join request approved");
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Failed to approve request");
    } finally {
      setIsProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!selectedChannel) return;
    try {
      setIsProcessingRequest(requestId);
      await ChannelService.rejectJoinRequest(selectedChannel.id, requestId);
      setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast.success("Join request rejected");
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Failed to reject request");
    } finally {
      setIsProcessingRequest(null);
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
    try {
      setIsDeleting(true);
      await ChannelService.deleteChannel(selectedChannel.id);
      deletedChannelIds.current.add(selectedChannel.id);
      setChannels((prev) => prev.filter((c) => c.id !== selectedChannel.id));
      toast.success("Channel deleted successfully");
      setSelectedChannel(null);
      setActiveTab("list");
      if (onChannelUpdated) onChannelUpdated();
      if (onClose) onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Failed to delete channel.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredContacts = contacts.filter((c) =>
    c.name?.toLowerCase().includes(contactSearch.toLowerCase()) ||
    (c.phone && c.phone.toLowerCase().includes(contactSearch.toLowerCase())) ||
    (c.id && typeof c.id === 'string' && c.id.toLowerCase().includes(contactSearch.toLowerCase()))
  );

  const inviteFilteredContacts = contacts.filter(
    (c) =>
      (c.name?.toLowerCase().includes(inviteContactSearch.toLowerCase()) ||
        (c.phone && c.phone.toLowerCase().includes(inviteContactSearch.toLowerCase())) ||
        (c.id && typeof c.id === 'string' && c.id.toLowerCase().includes(inviteContactSearch.toLowerCase()))) &&
      !channelMembers.some((m) => m.id === c.id || (m as any).userId === c.id)
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
        {(!isEmbedded || (activeTab !== "room" && activeTab !== "settings")) && (
          <div className={cn(
            "flex items-center justify-between border-b px-7 py-5 shrink-0 transition-colors",
            activeTab === "create" ? "border-[#2563EB] bg-[#2563EB] text-white shadow-sm" : "border-[#F0F4FF] bg-white text-[#11142D]"
          )}>
            <div className="flex items-center gap-3.5">
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
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                    activeTab === "create" ? "hover:bg-blue-700/50 text-white" : "hover:bg-slate-100 text-[#3B58F5]"
                  )}
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
                <h2 className={cn("text-lg font-bold tracking-tight", activeTab === "create" ? "text-white text-xl" : "text-[#11142D]")}>
                  {activeTab === "list" && "Business Channels"}
                  {activeTab === "create" && step === 1 && "Channel Information"}
                  {activeTab === "create" && step === 2 && "Channel Settings"}
                  {activeTab === "create" && step === 3 && "Channels"}
                  {activeTab === "create" && step === 4 && "Channels"}
                  {activeTab === "room" && selectedChannel && `#${selectedChannel.name}`}
                  {activeTab === "settings" && "Channel Settings"}
                </h2>
                {activeTab === "list" && (
                  <p className="text-xs font-medium text-slate-400">Broadcast to your followers</p>
                )}
              </div>
            </div>

            {!isEmbedded && (
              <button
                onClick={onClose}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                  activeTab === "create"
                    ? "bg-blue-700/60 text-white hover:bg-blue-700 hover:text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                )}
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div
          className={cn(
            "flex-1 overflow-y-auto flex flex-col",
            activeTab !== "room" && activeTab !== "settings" ? "p-4 sm:p-7" : isEmbedded ? "p-0" : "p-4 sm:p-7"
          )}
        >
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
                    onClick={() => {
                      fetchChannels();
                      fetchMyInvitations();
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#3B58F5] transition-colors"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${(isLoadingChannels || isLoadingInvitations) ? "animate-spin" : ""}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {myInvitations.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-extrabold text-[#3B58F5] tracking-wide mb-3 flex items-center gap-2">
                      <Bell className="h-4 w-4" /> Pending Invitations ({myInvitations.length})
                    </h3>
                    <div className="space-y-3">
                      {myInvitations.map((inv) => (
                        <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-[#EEF2FF] border border-[#C7D2FE] shadow-sm gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                              {inv.channelAvatarUrl ? (
                                <img src={inv.channelAvatarUrl} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-sm font-bold text-indigo-700">#{inv.channelName.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[#11142D]"><span className="text-indigo-600">{inv.inviterName}</span> invited you to join <span className="text-indigo-600">{inv.channelName}</span></p>
                              <p className="text-[10px] font-semibold text-slate-500 mt-0.5">As {inv.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleAcceptInvitation(inv.id)} className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors">Join</button>
                            <button onClick={() => handleRejectInvitation(inv.id)} className="flex-1 sm:flex-none px-4 py-2 bg-white text-slate-600 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">Decline</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                    {/* Dedicated CallsChat Number / Phone Number Input Field */}
                    <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <label className="block text-xs font-bold text-[#11142D]">
                        Invite by CallsChat Number / Phone Number
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Enter CallsChat number (e.g., +1234567890)"
                            value={manualPhoneInput}
                            onChange={(e) => setManualPhoneInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && manualPhoneInput.trim()) {
                                e.preventDefault();
                                if (!selectedPhones.includes(manualPhoneInput.trim())) {
                                  setSelectedPhones((prev) => [...prev, manualPhoneInput.trim()]);
                                }
                                setManualPhoneInput("");
                              }
                            }}
                            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-xs font-semibold text-[#11142D] focus:border-[#3B58F5] focus:outline-none bg-white shadow-2xs"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (manualPhoneInput.trim()) {
                              if (!selectedPhones.includes(manualPhoneInput.trim())) {
                                setSelectedPhones((prev) => [...prev, manualPhoneInput.trim()]);
                              }
                              setManualPhoneInput("");
                            }
                          }}
                          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
                        >
                          Add Number
                        </button>
                      </div>

                      {/* Selected CallsChat Numbers Chips */}
                      {selectedPhones.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {selectedPhones.map((phone) => (
                            <div
                              key={phone}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[#3B58F5] text-xs font-bold"
                            >
                              <Phone className="h-3 w-3" />
                              <span>{phone}</span>
                              <button
                                type="button"
                                onClick={() => setSelectedPhones((prev) => prev.filter((p) => p !== phone))}
                                className="hover:bg-blue-200 rounded p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Search box */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-[#11142D]">
                        Or select from your Contacts list
                      </label>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search contacts by name or number..."
                          value={contactSearch}
                          onChange={(e) => setContactSearch(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-3.5 text-sm font-semibold text-[#11142D] placeholder-slate-400 focus:border-[#3B58F5] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Contacts List with Round Circles */}
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
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
                          {contacts.length === 0
                            ? "No contacts found. Use the input above to invite directly by CallsChat number."
                            : "No contacts match your search."}
                        </div>
                      ) : (
                        filteredContacts.map((c, idx) => {
                          const isSelected = c.isPhoneOnly
                            ? selectedPhones.includes(c.id)
                            : selectedMemberIds.includes(c.id);
                          return (
                            <div
                              key={c.id}
                              onClick={() => {
                                if (c.isPhoneOnly) {
                                  if (isSelected) {
                                    setSelectedPhones((prev) => prev.filter((phone) => phone !== c.id));
                                  } else {
                                    setSelectedPhones((prev) => [...prev, c.id]);
                                  }
                                } else {
                                  if (isSelected) {
                                    setSelectedMemberIds((prev) => prev.filter((id) => id !== c.id));
                                  } else {
                                    setSelectedMemberIds((prev) => [...prev, c.id]);
                                  }
                                }
                              }}
                              className={cn(
                                "flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer shadow-2xs group",
                                isSelected ? "border-blue-300 bg-blue-50/20" : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                              )}
                            >
                              <div className="flex items-center gap-3.5">
                                <div className={cn(
                                  "h-10 w-10 rounded-full text-white font-bold flex items-center justify-center overflow-hidden shrink-0 shadow-2xs text-sm",
                                  getContactAvatarColor(c.name || c.id, idx)
                                )}>
                                  {c.avatarUrl ? (
                                    <img src={c.avatarUrl} alt={c.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <span>{c.name.charAt(0).toUpperCase()}</span>
                                  )}
                                </div>
                                <div>
                                  <span className="block text-sm font-bold text-[#11142D]">{c.name}</span>
                                  {c.phone && <span className="block text-[10px] text-slate-500">{c.phone}</span>}
                                </div>
                              </div>

                              <div className="shrink-0">
                                {isSelected ? (
                                  <div className="h-6 w-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-xs border-2 border-[#2563EB]">
                                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                                  </div>
                                ) : (
                                  <div className="h-6 w-6 rounded-full border border-slate-300 bg-white" />
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
                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#2563EB] py-4 text-sm font-bold text-white shadow-lg shadow-[#2563EB]/25 hover:bg-blue-700 disabled:opacity-60 transition-all"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : selectedMemberIds.length === 0 && selectedPhones.length === 0 ? (
                          <span className="flex items-center gap-2">Continue <ArrowRight className="h-4 w-4 stroke-[2.5]" /></span>
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
                    className="flex flex-col items-center justify-center py-16 text-center space-y-7 my-auto max-w-md mx-auto"
                  >
                    <div className="relative flex items-center justify-center pt-6 pb-2">
                      <div className="absolute w-36 h-36 rounded-full bg-blue-100/60 animate-pulse" />
                      <div className="absolute w-28 h-28 rounded-full bg-blue-200/70" />
                      <div className="relative z-10 w-20 h-20 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-xl shadow-blue-500/35">
                        <Check className="h-10 w-10 stroke-[3]" />
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <h3 className="text-xl sm:text-2xl font-black text-[#11142D] tracking-tight max-w-sm mx-auto leading-snug">
                        Your channel has been created successfully!
                      </h3>
                      <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto">
                        Start sharing content with your audience
                      </p>
                    </div>

                    <div className="w-full pt-4 max-w-xs mx-auto">
                      <button
                        onClick={() => {
                          handleResetWizard();
                          if (isEmbedded && onClose) {
                            onClose();
                          } else {
                            setActiveTab("list");
                            fetchChannels();
                          }
                        }}
                        className="w-full rounded-2xl bg-[#2563EB] py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all"
                      >
                        Go to My Channels
                      </button>
                    </div>
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
                className={cn("flex flex-col flex-1", !isEmbedded && "-m-7")}
              >
                {/* Top Banner Gradient (Matches input_file_0.png exactly) */}
                <div className="bg-gradient-to-r from-[#88B2FF] via-[#5C8DFF] to-[#8A79FF] h-32 sm:h-36 relative flex items-start justify-between p-4 sm:p-5 shrink-0 overflow-hidden">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl opacity-30 pointer-events-none" />
                  <div>
                    {!isEmbedded && (
                      <button
                        onClick={() => {
                          setActiveTab("list");
                        }}
                        className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/20 hover:bg-slate-900/35 text-white transition-all shadow-xs backdrop-blur-md"
                        title="Back to Channels"
                      >
                        <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
                      </button>
                    )}
                  </div>

                  <div className="relative z-10 flex items-center gap-2.5">
                    {!selectedChannel.isMember && selectedChannel.ownerId !== currentUserId ? (
                      <button
                        type="button"
                        onClick={handleJoinChannel}
                        disabled={isJoiningChannel}
                        className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
                      >
                        {isJoiningChannel ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <span>Join</span>
                        )}
                      </button>
                    ) : (
                      <>
                        {canUserPostInSelectedChannel && (
                          <button
                            onClick={() => {
                              setActiveTab("room");
                              setAdminSubTab("posts");
                              setShowPostForm(!showPostForm);
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/20 hover:bg-black/30 text-white font-bold transition-all shadow-xs backdrop-blur-md"
                            title="New Post"
                          >
                            <Plus className="h-5 w-5 stroke-[2.5]" />
                          </button>
                        )}
                        <NotificationDropdown
                          channelId={selectedChannel.id}
                          customTrigger={(unread) => (
                            <button
                              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-black/20 hover:bg-black/30 text-white transition-all shadow-xs backdrop-blur-md"
                              title="Channel Notifications"
                            >
                              <Bell className="h-4 w-4" />
                              {unread > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-xs">
                                  {unread}
                                </span>
                              )}
                            </button>
                          )}
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Channel Profile Info Header (Exact match to input_file_0.png) */}
                <div className="px-5 sm:px-8 pb-5 border-b border-slate-100 bg-white shrink-0">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-8 sm:-mt-10 relative z-10">
                    {/* Left: Avatar & Title info */}
                    <div className="flex flex-col items-start">
                      <div className="h-16 w-16 sm:h-[68px] sm:w-[68px] rounded-2xl bg-[#2563EB] text-white font-extrabold text-2xl sm:text-3xl border-4 border-white shadow-md flex items-center justify-center overflow-hidden shrink-0">
                        {selectedChannel.avatarUrl ? (
                          <img src={selectedChannel.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span>{selectedChannel.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>

                      <div className="mt-3">
                        <h3 className="text-xl sm:text-2xl font-black text-[#11142D] tracking-tight">{selectedChannel.name}</h3>
                        <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
                          {selectedChannel.description || "Latest product news & releases"}
                        </p>
                      </div>

                      <div className="mt-3 pt-1 flex items-center gap-6 text-xs sm:text-[13px] font-semibold text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-[#2563EB]" />
                          <strong className="text-[#11142D] font-bold">
                            {(selectedChannel.memberCount || 1240).toLocaleString()}
                          </strong>{" "}
                          followers
                        </span>
                        <span className="flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-[#2563EB]" />
                          <strong className="text-[#11142D] font-bold">
                            {messages.length.toLocaleString()}
                          </strong>{" "}
                          posts
                        </span>
                      </div>
                    </div>

                    {/* Right: Subscribe Box (matches input_file_0.png and input_file_1.png) */}
                    {selectedChannel.ownerId !== currentUserId && (
                      <div className="bg-[#F0F5FF] border border-[#DCE8FF] rounded-2xl p-2.5 sm:px-4 sm:py-3 flex items-center justify-between sm:justify-start gap-3 shadow-xs shrink-0 max-w-md w-full sm:w-auto self-start sm:self-center mt-2 sm:mt-0">
                        <div className="h-10 w-10 rounded-xl bg-[#5850EC] flex items-center justify-center text-white shrink-0 shadow-sm">
                          <Bell className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col flex-1 mr-2">
                          <span className="text-xs sm:text-sm font-bold text-[#11142D] leading-tight">
                            {isSubscribed ? "Subscribed to updates" : "Subscribe to stay updated"}
                          </span>
                          <span className="text-[11px] sm:text-xs text-[#3B82F6] font-medium leading-tight mt-0.5">
                            {isSubscribed ? "You will receive post notifications" : "Get notified when new posts are shared"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleToggleSubscribe}
                          disabled={isSubscribing}
                          className={cn(
                            "px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all shrink-0 flex items-center gap-1.5",
                            isSubscribed
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : "bg-[#4F46E5] hover:bg-[#4338CA] text-white"
                          )}
                        >
                          {isSubscribing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : isSubscribed ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              <span>Subscribed</span>
                            </>
                          ) : (
                            <span>Subscribe</span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3 Tabs Navigation Bar (Posts | Members | Settings) */}
                <div className="flex items-center justify-around border-b border-slate-200/80 bg-white px-4 shrink-0 overflow-x-auto no-scrollbar max-w-2xl mx-auto w-full">
                  <button
                    onClick={() => {
                      setActiveTab("room");
                      setAdminSubTab("posts");
                    }}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 pt-3.5 pb-2.5 text-xs font-bold border-b-2 transition-all ${
                      activeTab === "room" && adminSubTab === "posts"
                        ? "border-[#2563EB] text-[#2563EB]"
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
                    className={`flex-1 flex flex-col items-center justify-center gap-1 pt-3.5 pb-2.5 text-xs font-bold border-b-2 transition-all ${
                      activeTab === "room" && adminSubTab === "members"
                        ? "border-[#2563EB] text-[#2563EB]"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    <span>Members</span>
                  </button>

                  {selectedChannel?.whoCanJoin === "REQUIRES_APPROVAL" && (
                    <button
                      onClick={() => {
                        setActiveTab("room");
                        setAdminSubTab("requests");
                        fetchJoinRequests(selectedChannel.id);
                      }}
                      className={`relative flex-1 flex flex-col items-center justify-center gap-1 pt-3.5 pb-2.5 text-xs font-bold border-b-2 transition-all ${
                        activeTab === "room" && adminSubTab === "requests"
                          ? "border-amber-500 text-amber-600"
                          : "border-transparent text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      <Bell className="h-4 w-4" />
                      <span>Requests</span>
                      {joinRequests.length > 0 && (
                        <span className="absolute top-1.5 right-6 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                          {joinRequests.length}
                        </span>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setActiveTab("settings");
                      setAdminSubTab("settings");
                      handleOpenSettings(selectedChannel);
                    }}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 pt-3.5 pb-2.5 text-xs font-bold border-b-2 transition-all ${
                      activeTab === "settings"
                        ? "border-[#2563EB] text-[#2563EB]"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </button>
                </div>

                {/* TAB CONTENT */}
                <div className={cn("p-4 sm:p-7 overflow-y-auto bg-[#F8FAFC]/50 flex-1", !isEmbedded && "max-h-[500px]")}>
                  {/* 1. POSTS SUB-TAB */}
                  {activeTab === "room" && adminSubTab === "posts" && (
                    <div className={cn("space-y-4 mx-auto transition-all", isEmbedded ? "max-w-3xl" : "max-w-xl")}>
                      {canUserPostInSelectedChannel ? (
                        <>
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
                        </>
                      ) : (
                        <div className="border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between bg-white shadow-2xs text-slate-500">
                          <div className="flex items-center gap-3.5">
                            <div className="h-10 w-10 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold shrink-0 shadow-xs">
                              <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-[#11142D]">Broadcast Channel Policy</h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Only {selectedChannel?.whoCanPost === "ADMIN_MODERATORS" ? "Admins and Moderators" : "Channel Admins"} are permitted to post updates in this channel.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

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
                                  ? "border-2 border-amber-300 rounded-[20px] p-5 bg-amber-50/20 shadow-xs space-y-3 relative transition-all"
                                  : "border border-slate-200/80 rounded-[20px] p-5 bg-white shadow-xs hover:shadow-sm space-y-3 transition-all"
                              }
                            >
                              {msg.isSent === false ? (
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 tracking-wide bg-amber-100/70 px-2.5 py-1 rounded-full border border-amber-300 shadow-2xs">
                                    <Calendar className="h-3.5 w-3.5" />
                                    SCHEDULED FOR {msg.scheduledFor ? new Date(msg.scheduledFor).toLocaleString() : "LATER"}
                                  </span>
                                </div>
                              ) : msg.isPinned ? (
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#2563EB] tracking-wider uppercase">
                                    <Pin className="h-3.5 w-3.5 fill-current" />
                                    PINNED POST
                                  </span>
                                </div>
                              ) : null}

                              {editingPostId === msg.id ? (
                                <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                                  <textarea
                                    value={editPostContent}
                                    onChange={(e) => setEditPostContent(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium text-[#11142D] focus:border-[#2563EB] focus:outline-none resize-none"
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
                                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
                                    >
                                      {isUpdatingPost && <Loader2 className="h-3 w-3 animate-spin" />}
                                      <span>Save Changes</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[14px] font-medium text-[#1E293B] whitespace-pre-wrap leading-relaxed">
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
                                          className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-[#2563EB] hover:text-white text-[#11142D] text-xs font-bold transition-all shadow-2xs group"
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
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#2563EB] mt-2 bg-blue-50 px-3 py-1.5 rounded-xl w-fit">
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

                              {/* Meta Info & Action Menu across from each other (Figma / Image match) */}
                              <div className="flex items-center justify-between text-xs text-slate-400 font-medium pt-3 mt-1">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleIncrementView(msg)}
                                    className="flex items-center gap-1 hover:text-slate-600 transition-colors"
                                    title="Views count"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    <span>{(msg.viewsCount ?? 1240).toLocaleString()}</span>
                                  </button>
                                  <span>·</span>
                                  <span>
                                    {new Date(msg.createdAt).toLocaleDateString([], {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>

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
                                              <Pin className="h-3.5 w-3.5 text-[#2563EB]" />
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

                              {/* Card Bottom Action Bar (Like & Share) */}
                              <div className="border-t border-slate-100 pt-3.5 mt-3.5 grid grid-cols-2 text-xs font-bold text-slate-500">
                                <button
                                  onClick={() => handleLikePost(msg)}
                                  className={`flex items-center justify-center gap-1.5 transition-colors py-1 ${
                                    msg.isLikedByMe ? "text-red-500 font-extrabold" : "hover:text-red-500"
                                  }`}
                                >
                                  <Heart className={`h-4 w-4 ${msg.isLikedByMe ? "fill-red-500 text-red-500 scale-110 transition-transform" : ""}`} />
                                  <span>{(msg.likesCount ?? 0) > 0 ? (msg.likesCount ?? 0).toLocaleString() : "Like"}</span>
                                </button>
                                <button
                                  onClick={() => handleOpenShareModal(msg)}
                                  className="flex items-center justify-center gap-1.5 hover:text-[#2563EB] transition-colors py-1"
                                >
                                  <Share2 className="h-4 w-4" />
                                  <span>{(postShareCounts[msg.id] || 0) > 0 ? `Share (${postShareCounts[msg.id]})` : "Share"}</span>
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Authentic Empty State when no messages exist yet */}
                          {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 rounded-[20px] border border-slate-200/80 bg-white p-8 shadow-xs">
                              <div className="h-16 w-16 bg-blue-50/80 rounded-full flex items-center justify-center text-[#2563EB]">
                                <MessageSquare className="h-8 w-8 stroke-[2]" />
                              </div>
                              <div>
                                <h3 className="text-base font-extrabold text-[#11142D]">No posts right now</h3>
                                <p className="text-xs font-medium text-slate-400 mt-1 max-w-[280px] mx-auto leading-relaxed">
                                  {selectedChannel.myRole === 'ADMIN' || selectedChannel.myRole === 'OWNER' || selectedChannel.myRole === 'MODERATOR' 
                                    ? "Create the first post to share announcements, news, or updates with your audience."
                                    : "There are no posts published in this channel yet. Check back soon for updates!"}
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
                    <div className={cn("space-y-4 mx-auto transition-all", isEmbedded ? "max-w-3xl" : "max-w-xl")}>
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
                          <h4 className="text-sm font-bold text-[#11142D]">Invite Contacts & Members</h4>

                          {/* Dedicated CallsChat Number / Phone Number Input Field */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#11142D]">
                              Invite by CallsChat Number / Phone Number
                            </label>
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                  type="text"
                                  placeholder="Enter CallsChat number (e.g., +1234567890)"
                                  value={inviteManualPhone}
                                  onChange={(e) => setInviteManualPhone(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && inviteManualPhone.trim()) {
                                      e.preventDefault();
                                      if (!inviteSelectedPhones.includes(inviteManualPhone.trim())) {
                                        setInviteSelectedPhones((prev) => [...prev, inviteManualPhone.trim()]);
                                      }
                                      setInviteManualPhone("");
                                    }
                                  }}
                                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-xs font-semibold text-[#11142D] focus:border-indigo-600 focus:outline-none bg-white shadow-2xs"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (inviteManualPhone.trim()) {
                                    if (!inviteSelectedPhones.includes(inviteManualPhone.trim())) {
                                      setInviteSelectedPhones((prev) => [...prev, inviteManualPhone.trim()]);
                                    }
                                    setInviteManualPhone("");
                                  }
                                }}
                                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
                              >
                                Add Number
                              </button>
                            </div>
                          </div>

                          {/* Selected CallsChat Numbers Chips */}
                          {inviteSelectedPhones.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {inviteSelectedPhones.map((phone) => (
                                <div
                                  key={phone}
                                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold"
                                >
                                  <Phone className="h-3 w-3" />
                                  <span>{phone}</span>
                                  <button
                                    type="button"
                                    onClick={() => setInviteSelectedPhones((prev) => prev.filter((p) => p !== phone))}
                                    className="hover:bg-indigo-200 rounded p-0.5"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Contact Search and List */}
                          <div className="space-y-2 pt-2 border-t border-slate-200/80">
                            <label className="text-xs font-bold text-[#11142D]">
                              Or select from your Contacts list
                            </label>
                            <div className="relative">
                              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Search contacts by name or number..."
                                value={inviteContactSearch}
                                onChange={(e) => setInviteContactSearch(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs font-semibold text-[#11142D] focus:border-indigo-600 focus:outline-none bg-white"
                              />
                            </div>

                            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 pt-1">
                              {inviteFilteredContacts.length === 0 ? (
                                <div className="py-4 text-center text-xs font-semibold text-slate-400">
                                  {contacts.length === 0
                                    ? "No contacts found. Use the input above to invite directly by CallsChat number."
                                    : "No contacts match your search."}
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
                                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors bg-white border border-slate-100 shadow-2xs"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center overflow-hidden shrink-0 text-xs">
                                          {c.avatarUrl ? (
                                            <img src={c.avatarUrl} alt={c.name} className="h-full w-full object-cover" />
                                          ) : (
                                            <span>{c.name.charAt(0).toUpperCase()}</span>
                                          )}
                                        </div>
                                        <div>
                                          <span className="block text-xs font-bold text-[#11142D]">{c.name}</span>
                                          {c.phone && <span className="block text-[10px] text-slate-500">{c.phone}</span>}
                                        </div>
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
                          </div>

                          <div className="space-y-3 pt-2">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-bold text-[#11142D]">Invited as (Role)</label>
                              <select
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value as any)}
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-semibold text-[#11142D] focus:border-indigo-600 focus:outline-none bg-white"
                              >
                                <option value="MEMBER">Member</option>
                                <option value="MODERATOR">Moderator</option>
                                <option value="ADMIN">Admin</option>
                              </select>
                            </div>
                            <button
                              onClick={handleInviteMembersToExistingChannel}
                              disabled={isUpdatingMember || (inviteSelectedMemberIds.length === 0 && inviteSelectedPhones.length === 0)}
                              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-md"
                            >
                              {isUpdatingMember ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 stroke-[3]" />
                                  Send Invitations ({inviteSelectedMemberIds.length + inviteSelectedPhones.length})
                                </>
                              )}
                            </button>
                          </div>
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

                              {canUserManageMembers && selectedChannel.ownerId !== m.id && m.id !== currentUserId && (
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => setOpenMemberMenuId(openMemberMenuId === m.id ? null : m.id)}
                                    className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </button>

                                  <AnimatePresence>
                                    {openMemberMenuId === m.id && (
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                        className="absolute right-0 top-9 z-50 w-52 bg-white rounded-2xl border border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.12)] p-2 space-y-1 text-xs font-bold"
                                      >
                                        {m.role !== "MODERATOR" ? (
                                          <button
                                            type="button"
                                            disabled={isUpdatingMember}
                                            onClick={() => handleUpdateMemberRole(m.id, "MODERATOR")}
                                            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 text-[#11142D] transition-all text-left text-[13px] font-bold"
                                          >
                                            <Shield className="h-4.5 w-4.5 text-[#2563EB] shrink-0 stroke-[2]" />
                                            <span>Make Moderator</span>
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            disabled={isUpdatingMember}
                                            onClick={() => handleUpdateMemberRole(m.id, "MEMBER")}
                                            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 text-[#11142D] transition-all text-left text-[13px] font-bold"
                                          >
                                            <ShieldOff className="h-4.5 w-4.5 text-slate-500 shrink-0 stroke-[2]" />
                                            <span>Remove Moderator</span>
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          disabled={isUpdatingMember}
                                          onClick={() => handleRemoveMember(m.id)}
                                          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-red-50 text-red-600 transition-all text-left text-[13px] font-bold"
                                        >
                                          {isUpdatingMember ? (
                                            <Loader2 className="h-4.5 w-4.5 animate-spin shrink-0 text-red-600" />
                                          ) : (
                                            <UserMinus className="h-4.5 w-4.5 text-red-600 shrink-0 stroke-[2]" />
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

                      {/* Leave Channel Button (Exact match to Screenshot 2) */}
                      {selectedChannel.isMember && selectedChannel.ownerId !== currentUserId && (
                        <div className="pt-8 pb-4 flex justify-center">
                          <button
                            type="button"
                            onClick={handleLeaveChannel}
                            disabled={isLeavingChannel}
                            className="bg-[#D9531E] hover:bg-[#C2410C] text-white font-bold py-3 px-8 rounded-2xl shadow-md transition-all text-sm block w-fit min-w-[200px] text-center flex items-center justify-center gap-2"
                          >
                            {isLeavingChannel ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <span>Leave Channel</span>
                            )}
                          </button>
                        </div>
                      )}
                        </>
                      )}
                    </div>
                  )}

                  {/* JOIN REQUESTS SUB-TAB */}
                  {activeTab === "room" && adminSubTab === "requests" && (
                    <div className={cn("space-y-3 mx-auto transition-all", isEmbedded ? "max-w-3xl" : "max-w-xl")}>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-extrabold text-amber-600">Pending Join Requests</h4>
                        <button
                          onClick={() => fetchJoinRequests(selectedChannel.id)}
                          className="text-xs font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${isLoadingRequests ? "animate-spin" : ""}`} />
                          Refresh
                        </button>
                      </div>

                      {isLoadingRequests ? (
                        <div className="flex justify-center py-10">
                          <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
                        </div>
                      ) : joinRequests.length === 0 ? (
                        <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 bg-slate-50">
                          <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm font-bold text-slate-500">No pending requests</p>
                          <p className="text-xs text-slate-400 mt-1">All join requests have been handled.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {joinRequests.map((req) => (
                            <div key={req.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-amber-100 shadow-sm">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-sm shrink-0 overflow-hidden">
                                  {req.avatarUrl ? (
                                    <img src={req.avatarUrl} alt={req.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <span>{req.name.charAt(0).toUpperCase()}</span>
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-[#11142D]">{req.name}</p>
                                  <p className="text-xs text-slate-400">
                                    Requested {new Date(req.requestedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => handleRejectRequest(req.id)}
                                  disabled={isProcessingRequest === req.id}
                                  className="h-8 w-8 rounded-full flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                  title="Reject"
                                >
                                  {isProcessingRequest === req.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <X className="h-4 w-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleApproveRequest(req.id)}
                                  disabled={isProcessingRequest === req.id}
                                  className="h-8 w-8 rounded-full flex items-center justify-center bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                  title="Approve"
                                >
                                  {isProcessingRequest === req.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4 stroke-[2.5]" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. SETTINGS SUB-TAB (Inside Admin View) */}
                  {(activeTab === "settings" || (activeTab === "room" && adminSubTab === "settings")) && (
                    <form onSubmit={handleSaveSettings} className={cn("mx-auto space-y-6 pt-2 pb-12 transition-all", isEmbedded ? "max-w-2xl" : "max-w-xl")}>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2">Name</label>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            required
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            disabled={!canUserManageSettings}
                            className="w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 pr-12 text-sm font-semibold text-[#11142D] focus:border-[#2563EB] focus:outline-none shadow-2xs transition-all disabled:bg-slate-50 disabled:text-slate-500"
                          />
                          {canUserManageSettings && (
                            <button
                              type="button"
                              onClick={(e) => {
                                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                if (input) input.focus();
                              }}
                              className="absolute right-4 text-[#2563EB] hover:text-blue-700 p-1 transition-colors"
                              title="Edit Name"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2">Description</label>
                        <div className="relative flex items-start">
                          <textarea
                            rows={3}
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            disabled={!canUserManageSettings}
                            className="w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 pr-12 text-sm font-semibold text-[#11142D] focus:border-[#2563EB] focus:outline-none shadow-2xs resize-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                          />
                          {canUserManageSettings && (
                            <button
                              type="button"
                              onClick={(e) => {
                                const textarea = e.currentTarget.previousElementSibling as HTMLTextAreaElement;
                                if (textarea) textarea.focus();
                              }}
                              className="absolute right-4 top-3.5 text-[#2563EB] hover:text-blue-700 p-1 transition-colors"
                              title="Edit Description"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="block text-xs font-bold text-slate-400 mb-2.5">Privacy & Interactions</span>
                        <div className="rounded-3xl border border-slate-200/80 bg-white shadow-2xs divide-y divide-slate-100/80 overflow-hidden">
                          <div className="flex items-center justify-between p-4.5 sm:px-6 py-4">
                            <div>
                              <span className="block text-sm font-bold text-[#11142D]">Public Channel</span>
                              <span className="block text-xs text-slate-400 mt-0.5 font-medium">Anyone can find and join</span>
                            </div>
                            <button
                              type="button"
                              disabled={!canUserManageSettings}
                              onClick={() => setEditWhoCanJoin(editWhoCanJoin === "ANYONE" ? "INVITE_ONLY" : "ANYONE")}
                              className={cn(
                                "w-12 h-7 rounded-full transition-colors flex items-center p-1 shrink-0",
                                editWhoCanJoin === "ANYONE" ? "bg-[#2563EB]" : "bg-slate-200",
                                !canUserManageSettings && "opacity-60 cursor-not-allowed"
                              )}
                            >
                              <div
                                className={cn(
                                  "w-5 h-5 rounded-full bg-white shadow-sm transition-transform",
                                  editWhoCanJoin === "ANYONE" ? "translate-x-5" : "translate-x-0"
                                )}
                              />
                            </button>
                          </div>

                          <div className="flex items-center justify-between p-4.5 sm:px-6 py-4">
                            <div>
                              <span className="block text-sm font-bold text-[#11142D]">Enable Reactions</span>
                              <span className="block text-xs text-slate-400 mt-0.5 font-medium">Members can react with emoji</span>
                            </div>
                            <button
                              type="button"
                              disabled={!canUserManageSettings}
                              onClick={() => setEditEnableReactions(!editEnableReactions)}
                              className={cn(
                                "w-12 h-7 rounded-full transition-colors flex items-center p-1 shrink-0",
                                editEnableReactions ? "bg-[#2563EB]" : "bg-slate-200",
                                !canUserManageSettings && "opacity-60 cursor-not-allowed"
                              )}
                            >
                              <div
                                className={cn(
                                  "w-5 h-5 rounded-full bg-white shadow-sm transition-transform",
                                  editEnableReactions ? "translate-x-5" : "translate-x-0"
                                )}
                              />
                            </button>
                          </div>

                          <div className="flex items-center justify-between p-4.5 sm:px-6 py-4">
                            <div>
                              <span className="block text-sm font-bold text-[#11142D]">Notifications</span>
                              <span className="block text-xs text-slate-400 mt-0.5 font-medium">Notify for every new post</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => toast.success("Notification preferences updated!")}
                              className="w-12 h-7 rounded-full transition-colors flex items-center p-1 bg-[#2563EB] shrink-0"
                            >
                              <div className="w-5 h-5 rounded-full bg-white shadow-sm transition-transform translate-x-5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <details className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                          <summary className="flex items-center justify-between text-xs font-bold text-slate-500 cursor-pointer list-none select-none">
                            <span>Advanced Configuration (Website, Category & Posting Permissions)</span>
                            <span className="text-[#2563EB] group-open:rotate-180 transition-transform">▼</span>
                          </summary>
                          <div className="space-y-4 pt-4 mt-2 border-t border-slate-100">
                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1.5">Website URL</label>
                              <input
                                type="text"
                                placeholder="https://yourbusiness.com"
                                value={editWebsite}
                                onChange={(e) => setEditWebsite(e.target.value)}
                                disabled={!canUserManageSettings}
                                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-[#11142D] focus:border-[#2563EB] focus:outline-none"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1.5">Category</label>
                                <select
                                  value={editCategory}
                                  onChange={(e) => setEditCategory(e.target.value)}
                                  disabled={!canUserManageSettings}
                                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-[#11142D] focus:border-[#2563EB] focus:outline-none"
                                >
                                  {CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                      {cat}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1.5">Who can post</label>
                                <select
                                  value={editWhoCanPost}
                                  onChange={(e) => setEditWhoCanPost(e.target.value)}
                                  disabled={!canUserManageSettings}
                                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-[#11142D] focus:border-[#2563EB] focus:outline-none"
                                >
                                  <option value="ADMIN_ONLY">Admin Only</option>
                                  <option value="ADMIN_MODERATORS">Admin + Moderators</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </details>
                      </div>

                      {canUserManageSettings && (
                        <div className="flex items-center justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedChannel) {
                                setEditName(selectedChannel.name);
                                setEditDescription(selectedChannel.description || "");
                                setEditWebsite(selectedChannel.website || "");
                                setEditCategory(selectedChannel.category || "General");
                                setEditWhoCanJoin(selectedChannel.whoCanJoin || "ANYONE");
                                setEditWhoCanPost(selectedChannel.whoCanPost || "ADMIN_ONLY");
                                setEditEnableReactions(selectedChannel.enableReactions !== false);
                              }
                            }}
                            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                          >
                            Reset
                          </button>
                          <button
                            type="submit"
                            disabled={isSavingSettings}
                            className="flex items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition-all"
                          >
                            {isSavingSettings && <Loader2 className="h-4 w-4 animate-spin" />}
                            <span>Save Changes</span>
                          </button>
                        </div>
                      )}

                      {canUserManageSettings && (
                        <div
                          onClick={() => !isDeleting && setShowDeleteConfirm(true)}
                          className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:px-6 shadow-2xs flex items-center justify-between cursor-pointer hover:border-red-200 hover:bg-red-50/30 transition-all group mt-6"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0 border border-red-100 group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                              <AlertTriangle className="h-5 w-5 stroke-[2.2]" />
                            </div>
                            <div>
                              <span className="block text-sm font-bold text-red-600">Delete Channel</span>
                              <span className="block text-xs text-slate-400 mt-0.5 font-medium">Permanently remove all data</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </form>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {showDeleteConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[100] flex items-center justify-center bg-[#0F172A]/40 backdrop-blur-sm p-4"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
                >
                  <div className="p-6 text-center space-y-4">
                    <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                      <Trash2 className="h-7 w-7 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#11142D]">Delete Channel?</h3>
                      <p className="text-sm font-medium text-slate-500 mt-2">
                        Are you sure you want to delete <span className="font-bold text-slate-700">#{selectedChannel?.name}</span>? This action is permanent and cannot be undone.
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-50 border-t border-slate-100 p-4 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => setShowDeleteConfirm(false)}
                      className="w-full rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={handleDeleteChannel}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 text-xs font-bold shadow-md transition-all"
                    >
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, Delete"}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* POST SHARE MODAL */}
          <AnimatePresence>
            {selectedSharePost && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
                onClick={() => !isSharingPost && setSelectedSharePost(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]"
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 text-white shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                        <Share2 className="h-5 w-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold tracking-tight">Share Channel Post</h3>
                        <p className="text-[11px] font-medium text-purple-100">Broadcast or forward to contacts & apps</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => !isSharingPost && setSelectedSharePost(null)}
                      className="rounded-full p-1.5 hover:bg-white/20 text-white transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Post Preview Card */}
                  <div className="bg-slate-50 border-b border-slate-100 px-6 py-3.5 shrink-0">
                    <div className="rounded-2xl bg-white border border-slate-200/80 p-3 shadow-xs flex gap-3.5 items-center">
                      {selectedSharePost.mediaUrl ? (
                        <div className="h-14 w-14 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-900">
                          <img src={selectedSharePost.mediaUrl} alt="" className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0 text-sm">
                          #{selectedChannel?.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-indigo-600">
                          <span>#{selectedChannel?.name}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-400 font-medium">Post Preview</span>
                        </div>
                        <p className="text-xs font-bold text-[#11142D] line-clamp-2 mt-0.5">
                          {selectedSharePost.content || "Attached Media Post"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tab Selector */}
                  <div className="grid grid-cols-2 border-b border-slate-100 bg-white p-1.5 gap-1.5 shrink-0 px-6 pt-3">
                    <button
                      type="button"
                      onClick={() => setShareTab("contacts")}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-extrabold transition-all",
                        shareTab === "contacts"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      )}
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>CallsChat & Contacts</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShareTab("external")}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-extrabold transition-all",
                        shareTab === "external"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      )}
                    >
                      <Globe className="h-3.5 w-3.5" />
                      <span>Socials & Link</span>
                    </button>
                  </div>

                  {/* Tab 1 Content: Internal Contacts & Phone */}
                  {shareTab === "contacts" && (
                    <form onSubmit={handleSharePostToContacts} className="flex flex-col flex-1 overflow-hidden">
                      <div className="p-6 overflow-y-auto space-y-4 flex-1">
                        {/* Search Box */}
                        <div>
                          <label className="block text-xs font-extrabold text-[#11142D] mb-1.5">
                            Search Contacts
                          </label>
                          <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Search by contact name or phone number..."
                              value={shareContactSearch}
                              onChange={(e) => setShareContactSearch(e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 pl-10 pr-4 py-2.5 text-xs font-bold text-[#11142D] focus:border-indigo-600 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Contacts Checkbox List */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-extrabold text-slate-500">
                            Select Recipients ({selectedShareContactIds.length} selected)
                          </label>
                          <div className="max-h-44 overflow-y-auto rounded-2xl border border-slate-100 p-2 divide-y divide-slate-50 bg-slate-50/50">
                            {contacts
                              .filter(
                                (c) =>
                                  !shareContactSearch ||
                                  c.name.toLowerCase().includes(shareContactSearch.toLowerCase()) ||
                                  (c.phone && c.phone.includes(shareContactSearch))
                              )
                              .map((c) => {
                                const isChecked = selectedShareContactIds.includes(c.id);
                                return (
                                  <div
                                    key={c.id}
                                    onClick={() => {
                                      setSelectedShareContactIds((prev) =>
                                        isChecked ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                                      );
                                    }}
                                    className={cn(
                                      "flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors",
                                      isChecked ? "bg-indigo-50/80 border border-indigo-200/60" : "hover:bg-white"
                                    )}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                                        {c.avatarUrl ? (
                                          <img src={c.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                                        ) : (
                                          c.name.charAt(0).toUpperCase()
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-[#11142D] truncate">{c.name}</p>
                                        <p className="text-[10px] font-medium text-slate-400 truncate">{c.phone || "CallsChat User"}</p>
                                      </div>
                                    </div>
                                    <div
                                      className={cn(
                                        "h-5 w-5 rounded-lg flex items-center justify-center transition-all shrink-0",
                                        isChecked ? "bg-indigo-600 text-white" : "border border-slate-300 bg-white"
                                      )}
                                    >
                                      {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                                    </div>
                                  </div>
                                );
                              })}
                            {contacts.length === 0 && (
                              <p className="text-center py-4 text-xs font-medium text-slate-400">
                                No contacts loaded or found.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Manual Phone Input Box */}
                        <div>
                          <label className="block text-xs font-extrabold text-[#11142D] mb-1.5">
                            Or enter CallsChat phone numbers / IDs (comma-separated)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. +1234567890, +9876543210"
                            value={sharePhoneInput}
                            onChange={(e) => setSharePhoneInput(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-[#11142D] focus:border-indigo-600 focus:outline-none"
                          />
                        </div>

                        {/* Note Box */}
                        <div>
                          <label className="block text-xs font-extrabold text-[#11142D] mb-1">
                            Add a personal note (optional)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Add your thoughts or why you're sharing this..."
                            value={shareNote}
                            onChange={(e) => setShareNote(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-medium text-[#11142D] focus:border-indigo-600 focus:outline-none resize-none"
                          />
                        </div>
                      </div>

                      {/* Submit Footer */}
                      <div className="border-t border-slate-100 bg-slate-50 px-6 py-3.5 flex items-center justify-end gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedSharePost(null)}
                          disabled={isSharingPost}
                          className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-200/60 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSharingPost}
                          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 text-xs font-extrabold shadow-md transition-all"
                        >
                          {isSharingPost ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Sharing...</span>
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              <span>Share Post</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Tab 2 Content: External Link & Socials */}
                  {shareTab === "external" && (
                    <div className="p-6 space-y-5 flex-1 overflow-y-auto">
                      {/* Copy Link Section */}
                      <div>
                        <label className="block text-xs font-extrabold text-[#11142D] mb-1.5">
                          Direct Post URL
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 rounded-2xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs font-mono text-slate-600 truncate select-all">
                            {typeof window !== "undefined"
                              ? `${window.location.origin}/business/channels/${selectedChannel?.id}?postId=${selectedSharePost.id}`
                              : `http://localhost:3000/business/channels/${selectedChannel?.id}?postId=${selectedSharePost.id}`}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const url = typeof window !== "undefined"
                                ? `${window.location.origin}/business/channels/${selectedChannel?.id}?postId=${selectedSharePost.id}`
                                : `http://localhost:3000/business/channels/${selectedChannel?.id}?postId=${selectedSharePost.id}`;
                              navigator.clipboard.writeText(url);
                              toast.success("Post link copied to clipboard!");
                            }}
                            className="flex items-center gap-1.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2.5 text-xs font-extrabold shrink-0 transition-colors border border-indigo-200/60 shadow-2xs"
                          >
                            <Copy className="h-4 w-4" />
                            <span>Copy</span>
                          </button>
                        </div>
                      </div>

                      {/* Native OS Share (If available) */}
                      {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              const url = `${window.location.origin}/business/channels/${selectedChannel?.id}?postId=${selectedSharePost.id}`;
                              navigator.share({
                                title: `${selectedChannel?.name} Post`,
                                text: selectedSharePost.content || "Check out this channel post",
                                url: url,
                              }).catch(() => {});
                            }}
                            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white py-3 text-xs font-extrabold shadow-md transition-all"
                          >
                            <Share2 className="h-4 w-4" />
                            <span>Share via Device Menu...</span>
                          </button>
                        </div>
                      )}

                      {/* Social Networks Grid */}
                      <div>
                        <label className="block text-xs font-extrabold text-[#11142D] mb-2.5">
                          Share to Social Networks
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                          <a
                            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this post on #${selectedChannel?.name}: "${selectedSharePost.content || ""}"\n\n👉 ${typeof window !== "undefined" ? window.location.origin : ""}/business/channels/${selectedChannel?.id}?postId=${selectedSharePost.id}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 px-3.5 py-3 text-xs font-bold text-[#128C7E] transition-all"
                          >
                            <MessageSquare className="h-4 w-4 shrink-0 text-[#25D366]" />
                            <span>WhatsApp</span>
                          </a>

                          <a
                            href={`https://t.me/share/url?url=${encodeURIComponent(`${typeof window !== "undefined" ? window.location.origin : ""}/business/channels/${selectedChannel?.id}?postId=${selectedSharePost.id}`)}&text=${encodeURIComponent(`Check out this post on #${selectedChannel?.name}: "${selectedSharePost.content || ""}"`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 rounded-2xl bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/30 px-3.5 py-3 text-xs font-bold text-[#0088cc] transition-all"
                          >
                            <Send className="h-4 w-4 shrink-0 text-[#0088cc]" />
                            <span>Telegram</span>
                          </a>

                          <a
                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this post on #${selectedChannel?.name}: "${selectedSharePost.content || ""}"`)}&url=${encodeURIComponent(`${typeof window !== "undefined" ? window.location.origin : ""}/business/channels/${selectedChannel?.id}?postId=${selectedSharePost.id}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 rounded-2xl bg-slate-900/10 hover:bg-slate-900/20 border border-slate-900/20 px-3.5 py-3 text-xs font-bold text-slate-900 transition-all"
                          >
                            <ExternalLink className="h-4 w-4 shrink-0 text-slate-800" />
                            <span>Twitter (X)</span>
                          </a>

                          <a
                            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${typeof window !== "undefined" ? window.location.origin : ""}/business/channels/${selectedChannel?.id}?postId=${selectedSharePost.id}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 rounded-2xl bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 border border-[#0A66C2]/30 px-3.5 py-3 text-xs font-bold text-[#0A66C2] transition-all"
                          >
                            <Globe className="h-4 w-4 shrink-0 text-[#0A66C2]" />
                            <span>LinkedIn</span>
                          </a>
                        </div>
                      </div>

                      {/* Close Footer for Tab 2 */}
                      <div className="pt-3 flex justify-end border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setSelectedSharePost(null)}
                          className="rounded-xl bg-slate-100 hover:bg-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
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
