"use client";

import React, { useEffect, useState } from "react";
import { Search, Users, Plus, Loader2, MoreVertical, Trash2, Star } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { groupService, GroupItem } from "@/services/group.service";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

const COLORS = ["bg-pink-500", "bg-orange-500", "bg-emerald-500", "bg-blue-500", "bg-purple-500"];

export default function GroupsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentMode } = useUser();
  
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpenForId, setMenuOpenForId] = useState<string | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastReadMap, setLastReadMap] = useState<Record<string, string>>({});

  // Fetch groups logic
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
        setGroups(prev => prev.filter(g => g.id !== groupId));
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
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, isFavourite: !currentStatus } : g));
    const res = await groupService.toggleFavourite(groupId, !currentStatus);
    if (!res.success) {
      toast.error(`Failed to ${!currentStatus ? 'add to' : 'remove from'} favorites`);
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
    if (isToday) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  // If we are on the create page, bypass the layout
  if (pathname.includes('/create')) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-full w-full bg-[#F8FAFC]">
      {/* Left Panel (List) */}
      <div className="hidden md:flex h-full w-full flex-col border-r border-[#E6EAFA] bg-white md:w-[350px] shrink-0 relative">
        
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
              className="h-10 w-full rounded-full bg-[#EEF2FF] pl-10 pr-4 text-[13px] font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 border border-transparent transition-all"
            />
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button className="px-5 py-1.5 bg-[#2563EB] text-white rounded-full text-[12px] font-bold shadow-sm">All</button>
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
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="flex w-full justify-center py-10">
              <p className="text-[13px] text-slate-500 font-medium">No groups match your search.</p>
            </div>
          ) : (
            <div className="flex flex-col mt-2">
              {filteredGroups.map((group, index) => {
                const color = COLORS[index % COLORS.length];
                const isActive = pathname === `/groups/${group.id}`;
                
                return (
                  <div
                    key={group.id}
                    className="relative group px-3 mb-1"
                    onMouseLeave={() => setMenuOpenForId(null)}
                  >
                    <Link 
                      href={`/groups/${group.id}`} 
                      className={cn(
                        "flex items-center gap-3.5 px-3 py-3 rounded-2xl transition-colors cursor-pointer group/item",
                        isActive ? "bg-[#F1F5F9]" : "hover:bg-[#F8FAFC]"
                      )}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {group.avatarUrl ? (
                          <img 
                            src={group.avatarUrl} 
                            alt={group.name} 
                            className="h-[48px] w-[48px] rounded-full object-cover bg-slate-100"
                          />
                        ) : (
                          <div className={cn("h-[48px] w-[48px] rounded-full flex items-center justify-center text-white font-bold text-[16px] shadow-sm", color)}>
                            {getInitials(group.name)}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center overflow-hidden">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[14px] font-bold text-[#0F172A] truncate pr-2">
                            {group.name}
                          </h3>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-semibold text-slate-400">
                              {formatTime(group.createdAt)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between gap-4 mt-0.5">
                          <div className="flex flex-col gap-0.5 truncate min-w-0">
                            <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 truncate">
                              <Users className="h-[10px] w-[10px] shrink-0" />
                              {group.memberCount || 1} members
                            </p>
                            <p className="text-[12px] font-medium text-slate-500 truncate mt-0.5">
                              {group.description || "No new messages"}
                            </p>
                          </div>
                          {hasUnreadGroup(group) && (
                            <div className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2563EB] px-1 text-[10px] font-bold text-white shadow-sm shrink-0">
                              1
                            </div>
                          )}
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
                        className="p-1.5 rounded-full hover:bg-black/5 text-slate-400 hover:text-slate-700"
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

        {/* Floating Action Button */}
        <Link href="/groups/create" className="absolute bottom-6 right-6 h-[56px] w-[56px] bg-[#2563EB] rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center hover:bg-blue-700 transition-transform hover:scale-105 z-10">
          <Plus className="h-6 w-6 text-white" />
        </Link>
      </div>

      {/* Main Content Area */}
      {children}

      {/* Delete Confirmation Modal */}
      {groupToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1D2A54]/40 p-4 backdrop-blur-sm">
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
