"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Heart, Users, MessageSquare, HeartOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useContacts } from "@/hooks/useContacts";
import { cn } from "@/lib/utils";
import { groupService, GroupItem } from "@/services/group.service";
import { chatService } from "@/services/chat.service";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";
import { useGroupStore } from "@/hooks/useGroupStore";
import { getOptimizedImageUrl } from "@/utils/image";

export default function FavoritesPage() {
  const router = useRouter();
  const { currentMode } = useUser();
  const { contacts, handleToggleFavourite } = useContacts();

  // Filter only favourite contacts
  const favoriteContacts = contacts.filter((c) => c.isFavourite);

  const [favoriteGroups, setFavoriteGroups] = useState<GroupItem[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [openingChatId, setOpeningChatId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFavoriteGroups = async () => {
      try {
        const res = await groupService.fetchMyGroups(true);
        if (res.success && Array.isArray(res.data)) {
          setFavoriteGroups(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch favorite groups", error);
      } finally {
        setIsLoadingGroups(false);
      }
    };
    fetchFavoriteGroups();

    const handleWorkspaceChange = () => {
      setIsLoadingGroups(true);
      fetchFavoriteGroups();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("workspaceModeChanged", handleWorkspaceChange);
      return () => window.removeEventListener("workspaceModeChanged", handleWorkspaceChange);
    }
  }, [currentMode]);

  const handleStartChat = async (targetUserId: string) => {
    setOpeningChatId(targetUserId);
    try {
      const res = await chatService.initiateConversation(targetUserId);
      const convId = res?.data?.conversationId ?? res?.conversationId;
      if (convId) {
        router.push(`/chats/${convId}?recipientId=${targetUserId}`);
      }
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast.error("Failed to start chat");
    } finally {
      setOpeningChatId(null);
    }
  };

  const handleOpenGroup = (groupId: string) => {
    router.push(`/groups/${groupId}`);
  };

  const handleToggleFavouriteGroup = async (group: GroupItem) => {
    // Optimistic UI update
    setFavoriteGroups((prev) => prev.filter((g) => g.id !== group.id));
    useGroupStore.getState().toggleFavouriteInStore(group.id, false);

    // API Call
    const res = await groupService.toggleFavourite(group.id, false);
    if (!res.success) {
      toast.error("Failed to remove group from favorites");
      // Rollback
      setFavoriteGroups((prev) => [...prev, group]);
      useGroupStore.getState().toggleFavouriteInStore(group.id, true);
    } else {
      toast.success("Removed from favorites");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getRandomColor = (name: string) => {
    const colors = ["bg-emerald-600", "bg-blue-600", "bg-indigo-600", "bg-purple-600", "bg-teal-600"];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#F8FAFC] dark:bg-[#0C1317] overflow-hidden text-[#111B21] dark:text-[#E9EDEF]">
      {/* ── CallsChat Clean Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#222D34] bg-white dark:bg-[#111B21] px-6 py-4 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/chats")}
            className="rounded-full p-2 text-[#54656F] dark:text-[#8696A0] hover:text-[#111B21] dark:hover:text-[#E9EDEF] hover:bg-[#F0F2F5] dark:hover:bg-[#202C33] transition-colors cursor-pointer"
            title="Back to chats"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500">
              <Heart className="h-4 w-4 fill-rose-500" />
            </div>
            <div>
              <h1 className="text-[17px] font-bold tracking-tight">Favorites</h1>
              <p className="text-[11.5px] text-[#667781] dark:text-[#8696A0]">
                Quick access to your starred contacts & groups
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F0F2F5] dark:bg-[#202C33] text-[#54656F] dark:text-[#8696A0]">
            {favoriteContacts.length + favoriteGroups.length} starred
          </span>
        </div>
      </div>

      {/* ── Scrollable Body ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full">
        {/* Favorite Contacts Card */}
        <section className="rounded-2xl bg-white dark:bg-[#111B21] border border-[#E2E8F0] dark:border-[#222D34] p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between pb-3.5 mb-2 border-b border-[#F0F2F5] dark:border-[#202C33]">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#00A884]" />
              <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#111B21] dark:text-[#E9EDEF]">
                Favorite Contacts
              </h2>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F0F2F5] dark:bg-[#202C33] text-[#54656F] dark:text-[#8696A0]">
              {favoriteContacts.length}
            </span>
          </div>

          <div className="flex flex-col">
            {favoriteContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                <div className="h-10 w-10 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-400">
                  <Heart className="h-5 w-5" />
                </div>
                <p className="text-[13.5px] font-semibold text-[#111B21] dark:text-[#E9EDEF]">
                  No favorite contacts yet
                </p>
                <p className="text-[12px] text-[#667781] dark:text-[#8696A0] max-w-xs">
                  Star your most frequent contacts to access them quickly here.
                </p>
              </div>
            ) : (
              favoriteContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F0F2F5]/70 dark:hover:bg-[#202C33]/60 transition-colors border-b border-[#F0F2F5] dark:border-[#202C33] last:border-0"
                >
                  <div
                    onClick={() => handleStartChat(contact.userId || contact.id)}
                    className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {contact.avatarUrl ? (
                        <img
                          src={getOptimizedImageUrl(contact.avatarUrl, 44, 44)}
                          alt={contact.name}
                          className="h-11 w-11 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={cn(
                            "flex h-11 w-11 items-center justify-center rounded-full text-[14px] font-bold text-white shadow-xs",
                            getRandomColor(contact.name)
                          )}
                        >
                          {getInitials(contact.name)}
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex flex-col min-w-0">
                      <h3 className="text-[14px] font-semibold text-[#111B21] dark:text-[#E9EDEF] group-hover:text-[#00A884] transition-colors truncate">
                        {contact.name}
                      </h3>
                      <p className="text-[12px] font-normal text-[#667781] dark:text-[#8696A0] truncate">
                        {contact.phone || "No phone registered"}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-3">
                    <button
                      type="button"
                      onClick={() => handleStartChat(contact.userId || contact.id)}
                      disabled={openingChatId === (contact.userId || contact.id)}
                      className="p-2 rounded-lg text-[#00A884] hover:bg-[#00A884]/10 transition-colors cursor-pointer disabled:opacity-50"
                      title="Open Chat"
                    >
                      {openingChatId === (contact.userId || contact.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MessageSquare className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleFavourite(contact.id, true)}
                      className="flex items-center gap-1 text-[12px] font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Remove from favorites"
                    >
                      <HeartOff className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Favorite Groups Card */}
        <section className="rounded-2xl bg-white dark:bg-[#111B21] border border-[#E2E8F0] dark:border-[#222D34] p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between pb-3.5 mb-2 border-b border-[#F0F2F5] dark:border-[#202C33]">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#00A884]" />
              <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#111B21] dark:text-[#E9EDEF]">
                Favorite Groups
              </h2>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F0F2F5] dark:bg-[#202C33] text-[#54656F] dark:text-[#8696A0]">
              {favoriteGroups.length}
            </span>
          </div>

          <div className="flex flex-col">
            {isLoadingGroups ? (
              <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#00A884]" />
                <span className="text-xs">Loading favorite groups...</span>
              </div>
            ) : favoriteGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                <div className="h-10 w-10 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-400">
                  <Heart className="h-5 w-5" />
                </div>
                <p className="text-[13.5px] font-semibold text-[#111B21] dark:text-[#E9EDEF]">
                  No favorite groups yet
                </p>
                <p className="text-[12px] text-[#667781] dark:text-[#8696A0] max-w-xs">
                  Star important groups to access them quickly from here.
                </p>
              </div>
            ) : (
              favoriteGroups.map((group) => {
                const color = getRandomColor(group.name);
                return (
                  <div
                    key={group.id}
                    className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F0F2F5]/70 dark:hover:bg-[#202C33]/60 transition-colors border-b border-[#F0F2F5] dark:border-[#202C33] last:border-0"
                  >
                    <div
                      onClick={() => handleOpenGroup(group.id)}
                      className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {group.avatarUrl ? (
                          <img
                            src={getOptimizedImageUrl(group.avatarUrl, 44, 44)}
                            alt={group.name}
                            className="h-11 w-11 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className={cn(
                              "flex h-11 w-11 items-center justify-center rounded-full text-[14px] font-bold text-white shadow-xs",
                              color
                            )}
                          >
                            {getInitials(group.name)}
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex flex-col min-w-0">
                        <h3 className="text-[14px] font-semibold text-[#111B21] dark:text-[#E9EDEF] group-hover:text-[#00A884] transition-colors truncate">
                          {group.name}
                        </h3>
                        <p className="text-[12px] font-normal text-[#667781] dark:text-[#8696A0] flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>{group.memberCount} members</span>
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                      <button
                        type="button"
                        onClick={() => handleOpenGroup(group.id)}
                        className="p-2 rounded-lg text-[#00A884] hover:bg-[#00A884]/10 transition-colors cursor-pointer"
                        title="Open Group"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleFavouriteGroup(group)}
                        className="flex items-center gap-1 text-[12px] font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Remove from favorites"
                      >
                        <HeartOff className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
