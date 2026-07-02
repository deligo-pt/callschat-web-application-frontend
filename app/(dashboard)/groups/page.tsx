"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Search, Lock, Users, Plus, Loader2, MessageSquare, MoreVertical, Trash2, Star } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { groupService, GroupItem } from "@/services/group.service";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

const COLORS = ["bg-pink-500", "bg-orange-500", "bg-emerald-500", "bg-blue-500", "bg-purple-500"];

export default function GroupsPage() {
  const { currentMode } = useUser();
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpenForId, setMenuOpenForId] = useState<string | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // Tracks the last time user read each group conversation (from localStorage)
  const [lastReadMap, setLastReadMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await groupService.fetchMyGroups();
        if (res.success && Array.isArray(res.data)) {
          setGroups(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch groups", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();

    const handleWorkspaceChange = () => {
      setIsLoading(true);
      fetchGroups();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("workspaceModeChanged", handleWorkspaceChange);
      return () => window.removeEventListener("workspaceModeChanged", handleWorkspaceChange);
    }
  }, [currentMode]);

  // Load the last-read map from localStorage for unread badge calculation
  useEffect(() => {
    try {
      const raw = localStorage.getItem("lastReadMap");
      if (raw) setLastReadMap(JSON.parse(raw));
    } catch {
      // ignore parse errors
    }
  }, []);

  /**
   * Returns true if the group has had activity (updatedAt) more recent than the
   * user's last read timestamp — meaning there are likely unread messages.
   */
  const hasUnreadGroup = (group: GroupItem): boolean => {
    const lastReadAt = lastReadMap[group.id];
    if (!lastReadAt) return false; // never opened = unknown, don't show badge for new groups
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
        setGroups(prev => prev.filter(g => g.id !== groupId));
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
    // Optimistic UI update
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, isFavourite: !currentStatus } : g));
    
    // API Call
    const res = await groupService.toggleFavourite(groupId, !currentStatus);
    if (!res.success) {
      toast.error(`Failed to ${!currentStatus ? 'add to' : 'remove from'} favorites`);
      // Rollback
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, isFavourite: currentStatus } : g));
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
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-full w-full bg-[#F8FAFC]">
      {/* Left Panel (List) */}
      <div className="flex h-full w-full flex-col border-r border-[#E6EAFA] bg-white md:w-[350px] shrink-0">
        
        {/* Header */}
        <div className="flex flex-col px-6 pt-8 pb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-[24px] font-bold tracking-tight text-[#2563EB]">Groups</h1>
            <div className="flex items-center gap-2">
              <Link href="/chats/favorites" className="relative flex items-center justify-center p-2 transition-colors hover:bg-slate-50 rounded-full">
                <Star className="h-5 w-5 fill-[#F59E0B] text-[#F59E0B]" />
              </Link>
              <NotificationDropdown />
            </div>
          </div>
          
          <div className="mt-4 relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-full bg-[#EEF2FF] pl-10 pr-4 text-[13px] font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-transparent focus:border-blue-200 transition-all"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide pb-4">
          {isLoading ? (
            <div className="flex w-full items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#3B58F5]" />
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-8 text-center pb-20">
              <p className="text-[12px] font-bold text-[#1E293B] mb-8 leading-relaxed max-w-[200px]">
                Create a new group to start chatting and collaboration.
              </p>
              <Link 
                href="/groups/create"
                className="flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white px-8 py-2.5 rounded-full transition-colors font-bold text-[13px] shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Create Group
              </Link>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="flex w-full justify-center py-10">
              <p className="text-[13px] text-slate-500 font-medium">No groups match your search.</p>
            </div>
          ) : (
            <div className="flex flex-col mt-2">
              {filteredGroups.map((group, index) => {
                const color = COLORS[index % COLORS.length];
                
                return (
                  <div
                    key={group.id}
                    className="relative group px-2"
                    onMouseLeave={() => setMenuOpenForId(null)}
                  >
                    <Link 
                      href={`/groups/${group.id}`} 
                      className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-[#F8FAFC] transition-colors cursor-pointer group/item"
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {group.avatarUrl ? (
                          <img 
                            src={group.avatarUrl} 
                            alt={group.name} 
                            className="h-[52px] w-[52px] rounded-full object-cover bg-slate-100"
                          />
                        ) : (
                          <div className={cn("h-[52px] w-[52px] rounded-full flex items-center justify-center text-white font-bold text-[16px] shadow-sm", color)}>
                            {getInitials(group.name)}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center overflow-hidden">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[15px] font-bold text-[#1D2A54] truncate pr-2">
                            {group.name}
                          </h3>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-semibold text-[#8F95B2]">
                              {formatTime(group.createdAt)}
                            </span>
                            {hasUnreadGroup(group) && (
                              <div className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#2563EB] px-1 text-[10px] font-bold text-white shadow-sm">
                                ●
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between gap-4 mt-0.5">
                          <div className="flex flex-col gap-0.5 truncate min-w-0">
                            <p className="text-[13px] font-medium text-slate-500 truncate flex items-center gap-1.5">
                              <Users className="h-3 w-3 shrink-0" />
                              {group.memberCount || 1} members
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>

                    {/* Context Menu Button */}
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setMenuOpenForId(menuOpenForId === group.id ? null : group.id);
                        }}
                        className="p-1.5 rounded-full hover:bg-black/5 text-[#8F95B2] hover:text-[#1D2A54]"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>

                      {/* Dropdown Menu */}
                      {menuOpenForId === group.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-[#E6EAFA] py-1 z-50">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleToggleFavourite(group.id, !!group.isFavourite);
                              setMenuOpenForId(null);
                            }}
                            className="w-full px-4 py-2 text-left text-[13px] font-semibold text-[#1D2A54] hover:bg-[#F4F6FC] flex items-center gap-2"
                          >
                            <Star className={cn("h-4 w-4", group.isFavourite ? "fill-[#FFA500] text-[#FFA500]" : "text-[#8F95B2]")} />
                            {group.isFavourite ? "Remove from Favorites" : "Add to Favorites"}
                          </button>

                          {group.myRole === 'ADMIN' && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setGroupToDelete(group.id);
                                setMenuOpenForId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-[13px] font-semibold text-red-500 hover:bg-red-50 flex items-center gap-2 border-t border-[#F4F6FC]"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Group
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
      </div>
      
      {/* Right Content Area (Empty State) */}
      <div className="hidden flex-1 flex-col items-center justify-center bg-white md:flex w-full">
         <div className="flex flex-col items-center text-center max-w-sm">
            <div className="relative mb-8">
              <div className="h-[120px] w-[120px] rounded-full bg-[#EEF2FF] flex items-center justify-center border border-[#E0E7FF] shadow-2xl shadow-blue-500/10">
                <Users className="h-16 w-16 text-[#2563EB]" strokeWidth={1.5} />
              </div>
            </div>
            
            <h2 className="text-[22px] font-bold text-[#0F172A] mb-3">No Groups Yet</h2>
            <p className="text-[13px] font-semibold text-[#1E293B] leading-relaxed max-w-[240px]">
              You haven't joined or created any<br />groups yet.
            </p>
         </div>
      </div>

      {/* Delete Confirmation Modal */}
      {groupToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1D2A54]/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-[18px] font-bold text-[#1D2A54] mb-2">Delete Group</h2>
            <p className="text-[14px] font-medium text-[#8F95B2] mb-6">
              Are you sure you want to delete this group? This action cannot be undone and will permanently remove all messages and members.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setGroupToDelete(null)}
                className="flex-1 rounded-xl bg-[#F8FAFC] py-3 text-[14px] font-bold text-[#1D2A54] transition-colors hover:bg-[#E6EAFA]"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={() => handleDeleteGroup(groupToDelete)}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-[14px] font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-70"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  "Delete Group"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
