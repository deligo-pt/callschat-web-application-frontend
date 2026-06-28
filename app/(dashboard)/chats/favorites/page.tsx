"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useContacts } from "@/hooks/useContacts";
import { cn } from "@/lib/utils";

import { groupService, GroupItem } from "@/services/group.service";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";

export default function FavoritesPage() {
  const router = useRouter();
  const { currentMode } = useUser();
  const { contacts, handleToggleFavourite } = useContacts();

  // Filter only favourite contacts
  const favoriteContacts = contacts.filter((c) => c.isFavourite);

  const [favoriteGroups, setFavoriteGroups] = useState<GroupItem[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);

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

  const handleToggleFavouriteGroup = async (group: GroupItem) => {
    // Optimistic UI update
    setFavoriteGroups(prev => prev.filter(g => g.id !== group.id));
    
    // API Call
    const res = await groupService.toggleFavourite(group.id, false);
    if (!res.success) {
      toast.error("Failed to remove group from favorites");
      // Rollback
      setFavoriteGroups(prev => [...prev, group]);
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const getRandomColor = (name: string) => {
    const colors = [
      "bg-blue-500", "bg-indigo-500", "bg-purple-500", "bg-pink-500"
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="flex h-full w-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-4 bg-[#3B58F5] px-6 py-5 text-white shadow-sm shrink-0">
        <button
          onClick={() => router.push("/chats")}
          className="rounded-full p-1.5 transition-colors hover:bg-white/20"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
        </button>
        <h1 className="text-[18px] font-semibold">Favorites</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-10">
        {/* Favorite Contacts Section */}
        <div className="mt-6 px-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 fill-[#FFA500] text-[#FFA500]" />
            <h2 className="text-[15px] font-bold text-[#1D2A54]">Favorite Contacts</h2>
          </div>

          <div className="flex flex-col gap-1">
            {favoriteContacts.length === 0 ? (
              <p className="text-[13px] text-[#8F95B2] py-4">No favorite contacts yet.</p>
            ) : (
              favoriteContacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between py-3 border-b border-[#F4F6FC] last:border-0">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {contact.avatarUrl ? (
                        <img
                          src={contact.avatarUrl}
                          alt={contact.name}
                          className="h-[46px] w-[46px] rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={cn(
                            "flex h-[46px] w-[46px] items-center justify-center rounded-full text-[15px] font-bold text-white shadow-sm",
                            getRandomColor(contact.name)
                          )}
                        >
                          {getInitials(contact.name)}
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex flex-col">
                      <h3 className="text-[15px] font-bold text-[#1D2A54]">{contact.name}</h3>
                      <p className="text-[13px] font-medium text-[#8F95B2]">{contact.phone}</p>
                    </div>
                  </div>
                  {/* Remove Button */}
                  <button
                    onClick={() => handleToggleFavourite(contact.id, true)}
                    className="text-[14px] font-semibold text-[#3B58F5] hover:text-[#2A41C7] transition-colors px-2 py-1"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Favorite Groups Section */}
        <div className="mt-8 px-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 fill-[#FFA500] text-[#FFA500]" />
            <h2 className="text-[15px] font-bold text-[#1D2A54]">Favorite Groups</h2>
          </div>

          <div className="flex flex-col gap-1">
            {isLoadingGroups ? (
              <p className="text-[13px] text-[#8F95B2] py-4">Loading favorite groups...</p>
            ) : favoriteGroups.length === 0 ? (
              <p className="text-[13px] text-[#8F95B2] py-4">No favorite groups yet.</p>
            ) : (
              favoriteGroups.map((group) => {
                const color = getRandomColor(group.name);
                return (
                  <div key={group.id} className="flex items-center justify-between py-3 border-b border-[#F4F6FC] last:border-0">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {group.avatarUrl ? (
                          <img
                            src={group.avatarUrl}
                            alt={group.name}
                            className="h-[46px] w-[46px] rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className={cn(
                              "flex h-[46px] w-[46px] items-center justify-center rounded-full text-[15px] font-bold text-white shadow-md",
                              color
                            )}
                          >
                            {getInitials(group.name)}
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex flex-col">
                        <h3 className="text-[15px] font-bold text-[#1D2A54]">{group.name}</h3>
                        <p className="text-[13px] font-medium text-[#8F95B2] flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                          {group.memberCount} members
                        </p>
                      </div>
                    </div>
                    {/* Remove Button */}
                    <button
                      onClick={() => handleToggleFavouriteGroup(group)}
                      className="text-[14px] font-semibold text-[#3B58F5] hover:text-[#2A41C7] transition-colors px-2 py-1"
                    >
                      Remove
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
