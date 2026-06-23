"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Search, Lock, Users, Plus, Loader2, MessageSquare } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { groupService, GroupItem } from "@/services/group.service";

const COLORS = ["bg-pink-500", "bg-orange-500", "bg-emerald-500", "bg-blue-500", "bg-purple-500"];

export default function GroupsPage() {
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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
  }, []);

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
    <div className="flex h-full w-full flex-col items-center bg-[#F8FAFC] overflow-y-auto">
      {/* Container simulating the mobile view but suitable for web */}
      <div className="w-full max-w-2xl my-8 bg-white rounded-3xl shadow-sm border border-[#E6EAFA] overflow-hidden flex flex-col min-h-[700px] relative">
        
        {/* Header Area */}
        <div className="bg-[#3B58F5] text-white px-6 pt-6 pb-8 flex flex-col shrink-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/chats" className="rounded-full p-2 hover:bg-white/10 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-[22px] font-bold">Groups</h1>
            </div>
            
            <Link 
              href="/groups/create" 
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full transition-colors font-medium text-sm border border-white/10"
            >
              <Plus className="h-4 w-4" />
              Create Group
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[48px] rounded-xl border border-white/20 bg-white/10 pl-12 pr-4 text-[14px] text-white placeholder-white/60 focus:border-white/50 focus:bg-white/20 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto p-4 scrollbar-hide">
          
          {/* Privacy Notice Card */}
          <div className="bg-[#F4F6FC] rounded-2xl p-4 mb-4 border border-[#E6EAFA] flex items-start gap-4">
            <div className="h-10 w-10 bg-[#3B58F5] rounded-xl flex items-center justify-center shrink-0 shadow-sm">
              <Lock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#1D2A54]">Privacy-First Groups</h3>
              <p className="text-[13px] text-[#8F95B2] mt-0.5 leading-snug">
                Only admins can see member phone numbers.
              </p>
            </div>
          </div>

          {/* Groups List */}
          {isLoading ? (
            <div className="flex w-full items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#3B58F5]" />
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="h-20 w-20 bg-[#F4F6FC] rounded-full flex items-center justify-center mb-6">
                <Users className="h-10 w-10 text-[#3B58F5]/50" />
              </div>
              <h2 className="text-[18px] font-bold text-[#1D2A54] mb-2">No groups yet</h2>
              <p className="text-[14px] text-[#8F95B2] mb-8 max-w-xs">
                You haven't joined any groups. Create one to start collaborating with your team or family securely!
              </p>
              <Link 
                href="/groups/create"
                className="flex items-center gap-2 bg-[#3B58F5] hover:bg-[#2542E5] text-white px-8 py-3.5 rounded-full transition-colors font-bold text-[15px] shadow-lg shadow-blue-500/30"
              >
                <Plus className="h-5 w-5" />
                Create New Group
              </Link>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="flex w-full justify-center py-10">
              <p className="text-[14px] text-[#8F95B2]">No groups match your search.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredGroups.map((group, index) => {
                const color = COLORS[index % COLORS.length];
                
                return (
                  <Link 
                    href={`/groups/${group.id}`} 
                    key={group.id}
                    className="flex items-center gap-4 p-4 rounded-2xl hover:bg-[#F8FAFC] transition-colors cursor-pointer group/item border border-transparent hover:border-[#E6EAFA]"
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {group.avatarUrl ? (
                        <img 
                          src={group.avatarUrl} 
                          alt={group.name} 
                          className="h-[52px] w-[52px] rounded-full object-cover border border-[#E6EAFA]"
                        />
                      ) : (
                        <div className={cn("h-[52px] w-[52px] rounded-full flex items-center justify-center text-white font-bold text-[16px] shadow-sm", color)}>
                          {getInitials(group.name)}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[16px] font-bold text-[#1D2A54] truncate pr-2">
                          {group.name}
                        </h3>
                        <span className="text-[11px] font-semibold text-[#8F95B2] shrink-0">
                          {formatTime(group.createdAt)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-0.5 truncate min-w-0">
                          <div className="flex items-center gap-1.5 text-[#8F95B2]">
                            <Users className="h-3.5 w-3.5 shrink-0" />
                            <span className="text-[12px] font-medium">{group.memberCount || 1} members</span>
                          </div>
                          <p className="text-[13px] text-[#8F95B2] truncate">
                            {group.description || "No description provided"}
                          </p>
                        </div>
                        
                        {/* Optional unread badge placeholder - can be wired to real data later */}
                        {/* <div className="h-5 w-5 rounded-full bg-[#3B58F5] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          3
                        </div> */}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
