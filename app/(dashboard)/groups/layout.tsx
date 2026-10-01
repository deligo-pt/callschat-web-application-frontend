"use client";

import React, { useEffect, useState, useRef } from "react";
import { Search, Users, Plus, Loader2, MoreVertical, Trash2, Star, Heart, X, QrCode, Check, CheckCheck, Clock, Camera, Video, Mic, FileText, BarChart2, Phone, Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { groupService, GroupItem } from "@/services/group.service";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { useTranslations } from "next-intl";
import { useGroupStore } from "@/hooks/useGroupStore";
import { useSocket } from "@/components/providers/SocketProvider";
import { getOptimizedImageUrl } from "@/utils/image";
import { GroupQrScannerModal } from "@/components/group/GroupQrScannerModal";
import { formatGroupPreviewText } from "@/lib/group-preview";
import { getDecryptedMessage, storeDecryptedMessage, getStoredGroupKey } from "@/utils/keyStore";
import { decryptGroupMessage } from "@/utils/crypto";
import { decryptGroupNotification } from "@/utils/notificationPreview";

const COLORS = ["bg-pink-500", "bg-orange-500", "bg-emerald-500", "bg-blue-500", "bg-purple-500"];

export default function GroupsLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("options");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const tNotif = useTranslations("notifications");
  const pathname = usePathname();
  const { currentMode } = useUser();
  const { socket } = useSocket();
  
  const { groups, isLoading, fetchGroups, removeGroupFromStore, toggleFavouriteInStore, updateGroupMessageTimestamp } = useGroupStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpenForId, setMenuOpenForId] = useState<string | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastReadMap, setLastReadMap] = useState<Record<string, string>>({});
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [decryptedPreviews, setDecryptedPreviews] = useState<Record<string, string>>({});
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUserId(localStorage.getItem("userId") || "");
    }
  }, []);

  // Fetch groups logic
  useEffect(() => {
    fetchGroups();

    const handleWorkspaceChange = () => {
      fetchGroups(true);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("workspaceModeChanged", handleWorkspaceChange);
      return () => window.removeEventListener("workspaceModeChanged", handleWorkspaceChange);
    }
  }, [currentMode, fetchGroups]);

  // Seed decrypted previews from IndexedDB cache for instant render
  useEffect(() => {
    if (!currentUserId || groups.length === 0) return;

    let isMounted = true;
    (async () => {
      const cachedMap: Record<string, string> = {};
      for (const g of groups) {
        const msg = g.lastMessage;
        if (!msg) continue;
        let plain: string | null = null;
        if (msg.id) {
          plain = await getDecryptedMessage(currentUserId, msg.id);
        }
        if (!plain && msg.nonce) {
          plain = await getDecryptedMessage(currentUserId, `nonce_${msg.nonce}`);
        }
        if (plain) {
          cachedMap[g.id] = plain;
          if (msg.id) cachedMap[msg.id] = plain;
        } else if (msg.ciphertext && msg.nonce) {
          try {
            const storedKey = await getStoredGroupKey(g.id, currentUserId);
            if (storedKey) {
              const text = await decryptGroupMessage(msg.ciphertext, msg.nonce, storedKey);
              if (text) {
                void storeDecryptedMessage(currentUserId, msg.id, text);
                cachedMap[g.id] = text;
                if (msg.id) cachedMap[msg.id] = text;
              }
            } else {
              const text = await decryptGroupNotification({ ...msg, groupId: g.id }, currentUserId);
              if (text && !text.startsWith("🔒")) {
                void storeDecryptedMessage(currentUserId, msg.id, text);
                cachedMap[g.id] = text;
                if (msg.id) cachedMap[msg.id] = text;
              }
            }
          } catch {}
        }
      }

      if (isMounted && Object.keys(cachedMap).length > 0) {
        setDecryptedPreviews((prev) => ({ ...prev, ...cachedMap }));
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [groups, currentUserId]);

  // Subscribe socket to group rooms
  useEffect(() => {
    if (!socket || groups.length === 0) return;
    groups.forEach((g) => {
      socket.emit("group:join_room", { groupId: g.id });
    });
  }, [socket, groups]);

  // Real-time group updates
  useEffect(() => {
    if (!socket) return;
    const handleGroupMessage = (data: any) => {
      if (data && data.groupId) {
        const myId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
        
        // Update group store with full message metadata and sort to top
        updateGroupMessageTimestamp(data.groupId, data.content || data.message || data.text, data);

        // Instant text resolution
        if (data.text || data.content || data.message) {
          const text = data.text || data.content || data.message;
          setDecryptedPreviews((prev) => ({
            ...prev,
            ...(data.id ? { [data.id]: text } : {}),
            [data.groupId]: text,
          }));
        } else if (!data.mediaType && data.ciphertext && myId) {
          (async () => {
            try {
              const plain = await decryptGroupNotification(data, myId);
              if (plain && !plain.startsWith("🔒")) {
                setDecryptedPreviews((prev) => ({
                  ...prev,
                  ...(data.id ? { [data.id]: plain } : {}),
                  [data.groupId]: plain,
                }));
              }
            } catch {}
          })();
        }

        if (socket && data.id && data.senderId && data.senderId !== myId) {
          socket.emit("group:mark_delivered", {
            groupId: data.groupId,
            messageId: data.id,
          });
        }
      } else {
        fetchGroups(true);
      }
    };
    socket.on("group:receive_message", handleGroupMessage);
    return () => {
      socket.off("group:receive_message", handleGroupMessage);
    };
  }, [socket, updateGroupMessageTimestamp, fetchGroups]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lastReadMap");
      if (raw) setLastReadMap(JSON.parse(raw));
    } catch {
      // ignore parse errors
    }
  }, []);

  const hasUnreadGroup = (group: GroupItem): boolean => {
    const lastReadAt = lastReadMap[group.id];
    if (!lastReadAt) return false;
    return new Date(group.updatedAt) > new Date(lastReadAt);
  };

  const handleDeleteGroup = async (groupId: string) => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${baseUrl}/groups/${groupId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        removeGroupFromStore(groupId);
        if (pathname === `/groups/${groupId}`) {
          window.location.href = '/groups';
        }
      } else {
        console.error("Failed to delete group", data);
      }
    } catch (error) {
      console.error("Failed to delete group", error);
    } finally {
      setIsDeleting(false);
      setGroupToDelete(null);
    }
  };

  const handleToggleFavourite = async (groupId: string, currentStatus: boolean) => {
    toggleFavouriteInStore(groupId, !currentStatus);
    const res = await groupService.toggleFavourite(groupId, !currentStatus);
    if (!res.success) {
      toast.error(`Failed to ${!currentStatus ? 'add to' : 'remove from'} favorites`);
      toggleFavouriteInStore(groupId, currentStatus);
    } else {
      toast.success(`Group ${!currentStatus ? 'added to' : 'removed from'} favorites`);
    }
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  const renderStatusIcon = (group: GroupItem) => {
    const msg = group.lastMessage;
    if (!msg || msg.senderId !== currentUserId) return null;
    if (msg.isSystem || msg.systemEventType) return null;

    if (msg.id.startsWith("optimistic-") && (!msg.receipts || msg.receipts.length === 0)) {
      return <Clock className="h-3.5 w-3.5 shrink-0 text-[#8696A0] animate-pulse inline-block mr-1" />;
    }
    const receipts = msg.receipts || [];
    const others = receipts.filter((r) => r.userId !== currentUserId);
    const target = others.length > 0 ? others : receipts;
    if (target.some((r) => r.seenAt)) {
      return <CheckCheck className="h-3.5 w-3.5 shrink-0 text-[#53BDEB] inline-block mr-1" strokeWidth={2.2} />;
    }
    if (target.some((r) => r.deliveredAt)) {
      return <CheckCheck className="h-3.5 w-3.5 shrink-0 text-[#8696A0] inline-block mr-1" strokeWidth={2.2} />;
    }
    return <Check className="h-3.5 w-3.5 shrink-0 text-[#8696A0] inline-block mr-1" strokeWidth={2.2} />;
  };

  const renderMediaIcon = (icon?: string) => {
    switch (icon) {
      case "photo":
        return <Camera className="h-3.5 w-3.5 shrink-0 text-[#8696A0] inline-block mr-1" />;
      case "video":
        return <Video className="h-3.5 w-3.5 shrink-0 text-[#8696A0] inline-block mr-1" />;
      case "audio":
        return <Mic className="h-3.5 w-3.5 shrink-0 text-[#8696A0] inline-block mr-1" />;
      case "document":
        return <FileText className="h-3.5 w-3.5 shrink-0 text-[#8696A0] inline-block mr-1" />;
      case "poll":
        return <BarChart2 className="h-3.5 w-3.5 shrink-0 text-[#8696A0] inline-block mr-1" />;
      case "call":
        return <Phone className="h-3.5 w-3.5 shrink-0 text-[#8696A0] inline-block mr-1" />;
      case "lock":
        return <Lock className="h-3.5 w-3.5 shrink-0 text-[#8696A0] inline-block mr-1" />;
      default:
        return null;
    }
  };

  // If we are on the create page, bypass the layout
  if (pathname.includes('/create')) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-full w-full bg-white dark:bg-[#111B21] overflow-hidden">
      {/* Left Panel (List) */}
      <div className="hidden md:flex h-full w-full flex-col border-r border-[#E2E8F0] dark:border-[#222D34] bg-white dark:bg-[#111B21] md:w-[380px] lg:w-[400px] shrink-0 relative">
        
        {/* Header */}
        <div className="flex flex-col px-4 pt-5 pb-3 border-b border-[#E2E8F0]/60 dark:border-[#222D34]">
          <div className="flex items-center justify-between">
            <h1 className="text-[22px] font-bold tracking-tight text-[#111B21] dark:text-[#E9EDEF]">{tNav("group")}</h1>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#54656F] dark:text-[#8696A0] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#00A884] dark:hover:text-[#00A884] transition-colors cursor-pointer"
                title="Scan QR Code to Join Group"
              >
                <QrCode className="h-5 w-5" />
              </button>
              <Link 
                href="/groups/create" 
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#54656F] dark:text-[#8696A0] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#00A884] dark:hover:text-[#00A884] transition-colors"
                title="New Group"
              >
                <Plus className="h-5 w-5" />
              </Link>
              <Link 
                href="/chats/favorites" 
                title="Favorites" 
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#F0F2F5] dark:hover:bg-[#202C33] text-[#54656F] dark:text-[#8696A0] hover:text-red-500 transition-colors focus:outline-none"
                aria-label="Favorites"
              >
                <Heart className="h-4.5 w-4.5" />
              </Link>
              <NotificationDropdown />
            </div>
          </div>
          
          <div className="mt-3 relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-[#8696A0] pointer-events-none" />
            <input
              type="text"
              placeholder={tCommon("search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-[38px] w-full rounded-xl bg-[#F0F2F5] dark:bg-[#202C33] pl-10 pr-9 text-[14px] font-normal text-[#111B21] dark:text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 text-[#8696A0] hover:text-[#111B21] dark:hover:text-[#E9EDEF] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 mt-3">
            <button className="px-4 py-1 bg-[#00A884] text-white rounded-full text-[13px] font-semibold shadow-xs">
              {tNotif("all")}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-24 md:pb-4">
          {isLoading ? (
            <div className="flex w-full items-center justify-center py-20">
              <Loader2 className="h-7 w-7 animate-spin text-[#00A884]" />
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-8 text-center pb-20">
              <div className="h-12 w-12 rounded-full bg-[#F0F2F5] dark:bg-[#202C33] flex items-center justify-center text-[#8696A0] mb-3">
                <Users className="h-6 w-6" />
              </div>
              <p className="text-[13px] font-semibold text-[#111B21] dark:text-[#E9EDEF] mb-2">
                {t("create_group_prompt")}
              </p>
              <Link 
                href="/groups/create"
                className="mt-3 px-4 py-2 bg-[#00A884] hover:bg-[#008069] text-white text-xs font-semibold rounded-full shadow-xs transition-all"
              >
                Create Group
              </Link>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="flex w-full justify-center py-10">
              <p className="text-[13px] text-[#8696A0] font-medium">{t("no_groups_match")}</p>
            </div>
          ) : (
            <div className="flex flex-col mt-1">
              {filteredGroups.map((group, index) => {
                const color = COLORS[index % COLORS.length];
                const isActive = pathname === `/groups/${group.id}`;
                const cached = decryptedPreviews[group.id] || (group.lastMessage?.id ? decryptedPreviews[group.lastMessage.id] : null);
                const previewInfo = formatGroupPreviewText(group.lastMessage, currentUserId, cached);
                const lastMsgTime = group.lastMessage?.createdAt || group.updatedAt || group.createdAt;
                
                return (
                  <div
                    key={group.id}
                    className="relative group px-2 mb-0.5"
                    onMouseLeave={() => setMenuOpenForId(null)}
                  >
                    <Link 
                      href={`/groups/${group.id}`} 
                      className={cn(
                        "flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-colors cursor-pointer group/item",
                        isActive 
                          ? "bg-[#F0F2F5] dark:bg-[#202C33]" 
                          : "hover:bg-[#F0F2F5]/70 dark:hover:bg-[#202C33]/70"
                      )}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {group.avatarUrl ? (
                          <img 
                            src={getOptimizedImageUrl(group.avatarUrl)} 
                            alt={group.name} 
                            className="h-[46px] w-[46px] rounded-full object-cover bg-slate-100 dark:bg-slate-800"
                          />
                        ) : (
                          <div className={cn("h-[46px] w-[46px] rounded-full flex items-center justify-center text-white font-bold text-[15px] shadow-xs", color)}>
                            {getInitials(group.name)}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center overflow-hidden">
                        <div className="flex items-center justify-between">
                          <h3 className={cn(
                            "text-[14.5px] truncate pr-2 leading-snug",
                            hasUnreadGroup(group) && !isActive ? "font-bold text-[#111B21] dark:text-[#E9EDEF]" : "font-semibold text-[#111B21] dark:text-[#E9EDEF]"
                          )}>
                            {group.name}
                          </h3>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={cn(
                              "text-[11.5px] font-normal shrink-0",
                              hasUnreadGroup(group) && !isActive ? "font-bold text-[#25D366]" : "text-[#667781] dark:text-[#8696A0]"
                            )}>
                              {formatTime(lastMsgTime)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex w-full items-center justify-between gap-2 mt-0.5">
                          <p className={cn(
                            "truncate text-left text-[12.5px] leading-tight flex-1 min-w-0 flex items-center",
                            hasUnreadGroup(group) && !isActive ? "font-semibold text-[#111B21] dark:text-[#E9EDEF]" : "font-normal text-[#667781] dark:text-[#8696A0]"
                          )}>
                            <span className="truncate flex items-center">
                              {renderStatusIcon(group)}
                              {renderMediaIcon(previewInfo.mediaIcon)}
                              {!previewInfo.isSystemEvent && previewInfo.senderPrefix && (
                                <span className="font-medium mr-1 text-[#111B21] dark:text-[#D1D7DB]">{previewInfo.senderPrefix}</span>
                              )}
                              <span className="truncate">{previewInfo.previewText}</span>
                            </span>
                          </p>
                          {hasUnreadGroup(group) && (
                            <div className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#25D366] px-1 text-[10px] font-bold text-white shadow-xs shrink-0">
                              1
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>

                    {/* Context Menu Button */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setMenuOpenForId(menuOpenForId === group.id ? null : group.id);
                        }}
                        className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#8696A0] hover:text-[#111B21] dark:hover:text-[#E9EDEF] cursor-pointer"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {menuOpenForId === group.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#202C33] rounded-xl shadow-xl border border-[#E2E8F0] dark:border-[#2A3942] py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleToggleFavourite(group.id, !!group.isFavourite);
                              setMenuOpenForId(null);
                            }}
                            className="w-full px-3.5 py-2 text-left text-[13px] font-medium text-[#111B21] dark:text-[#E9EDEF] hover:bg-[#F0F2F5] dark:hover:bg-[#182229] flex items-center gap-2 cursor-pointer"
                          >
                            <Heart className={cn("h-4 w-4", group.isFavourite ? "fill-red-500 text-red-500" : "text-[#8696A0]")} />
                            <span>{group.isFavourite ? t("remove_from_favorites") : t("add_to_favorites")}</span>
                          </button>

                          {group.myRole === 'ADMIN' && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setGroupToDelete(group.id);
                                setMenuOpenForId(null);
                              }}
                              className="w-full px-3.5 py-2 text-left text-[13px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 border-t border-[#E2E8F0] dark:border-[#2A3942] cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>{t("delete_group")}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        <Link 
          href="/groups/create" 
          className="absolute bottom-6 right-6 h-12 w-12 bg-[#00A884] hover:bg-[#008069] rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95 z-10 cursor-pointer"
          title="Create New Group"
        >
          <Plus className="h-6 w-6" />
        </Link>
      </div>

      {/* Main Content Area */}
      {children}

      {/* Delete Confirmation Modal */}
      {groupToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#111B21] border border-[#E2E8F0] dark:border-[#2A3942] p-6 shadow-2xl">
            <h2 className="text-[17px] font-bold text-[#111B21] dark:text-[#E9EDEF] mb-1.5">{t("delete_group")}</h2>
            <p className="text-[13px] font-normal text-[#667781] dark:text-[#8696A0] mb-6">
              {t("delete_conversation_desc")}
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setGroupToDelete(null)}
                className="flex-1 rounded-xl bg-[#F0F2F5] dark:bg-[#202C33] py-2.5 text-[13px] font-semibold text-[#111B21] dark:text-[#E9EDEF] transition-colors hover:bg-[#E5E9EC] dark:hover:bg-[#2A3942] cursor-pointer"
              >
                {tCommon("cancel")}
              </button>
              <button
                disabled={isDeleting}
                onClick={() => handleDeleteGroup(groupToDelete)}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-70 cursor-pointer shadow-xs"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  t("delete_group")
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Group QR Scanner Modal */}
      <GroupQrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
}
