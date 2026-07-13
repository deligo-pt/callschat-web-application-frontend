"use client";

import React, { useEffect, useState } from "react";
import { 
  Globe, 
  Users, 
  Megaphone, 
  Hash, 
  Plus, 
  Settings, 
  Share2, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Trash2, 
  Loader2, 
  Search, 
  Check, 
  FileText
} from "lucide-react";
import { CommunityItem } from "./CreateCommunitiesUI";
import { cn } from "@/lib/utils";
import { communityService, CommunityDetailGroup } from "@/services/community.service";
import { toast } from "sonner";
import { CommunityGroupChatView } from "./CommunityGroupChatView";

interface CommunityDetailViewProps {
  community: CommunityItem;
  onCreateNewClick: () => void;
  onCommunityDeleted?: (deletedId: string) => void;
}

// Helper to assign icons/emojis based on group name
function getGroupIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("announcement")) return "📢";
  if (n.includes("manage") || n.includes("leader") || n.includes("exec")) return "👥";
  if (n.includes("market") || n.includes("growth") || n.includes("campaign")) return "📈";
  if (n.includes("sale") || n.includes("deal") || n.includes("revenue")) return "💼";
  if (n.includes("support") || n.includes("ticket") || n.includes("query") || n.includes("customer")) return "🎧";
  if (n.includes("dev") || n.includes("eng") || n.includes("code") || n.includes("sprint")) return "💻";
  if (n.includes("product") || n.includes("roadmap") || n.includes("release")) return "📦";
  if (n.includes("event") || n.includes("meet") || n.includes("party")) return "🎉";
  if (n.includes("design") || n.includes("ui") || n.includes("ux")) return "🎨";
  if (n.includes("general") || n.includes("chat")) return "💬";
  return "🏛️";
}

// Helper for realistic mockup metadata
function getGroupMeta(name: string, index: number, memberCount: number) {
  const n = name.toLowerCase();
  if (n.includes("announcement")) {
    return { desc: "Company-wide updates (Admin only)", time: "2m ago", badge: "3", join: false };
  }
  if (n.includes("manage")) {
    return { desc: "Leadership & management decisions", time: "15m ago", badge: null, join: false };
  }
  if (n.includes("market")) {
    return { desc: "Campaigns, content & growth", time: "2h ago", badge: null, join: true };
  }
  if (n.includes("sale")) {
    return { desc: "Pipeline, deals & client relations", time: "1h ago", badge: "5", join: false };
  }
  if (n.includes("support")) {
    return { desc: "Tickets & customer queries", time: "30m ago", badge: "9+", join: false };
  }
  if (n.includes("dev")) {
    return { desc: "Engineering & architecture", time: "5m ago", badge: "8", join: false };
  }
  if (n.includes("product")) {
    return { desc: "Roadmap & release notes", time: "1d ago", badge: "1", join: false };
  }
  if (n.includes("event")) {
    return { desc: "Schedule & upcoming events", time: "3h ago", badge: null, join: true };
  }
  return { 
    desc: `Official ${name} discussions and updates`, 
    time: `${(index % 5) + 1}h ago`, 
    badge: index % 2 === 0 ? String((index % 4) + 1) : null, 
    join: index % 3 === 0 
  };
}

export function CommunityDetailView({ community, onCreateNewClick, onCommunityDeleted }: CommunityDetailViewProps) {
  const [groups, setGroups] = useState<CommunityDetailGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [joinedGroupIds, setJoinedGroupIds] = useState<Record<string, boolean>>({});
  
  // Selected group state for exact chat interface rendering matching input_file_0.png and input_file_1.png
  const [selectedGroup, setSelectedGroup] = useState<CommunityDetailGroup | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadDetails() {
      setIsLoadingGroups(true);
      const res = await communityService.fetchCommunityDetails(community.id);
      if (isMounted) {
        setIsLoadingGroups(false);
        if (res.success && res.data && Array.isArray(res.data.groups)) {
          setGroups(res.data.groups);
        } else {
          setGroups([]);
        }
      }
    }
    loadDetails();
    return () => {
      isMounted = false;
    };
  }, [community.id, community.memberCount]);

  const handleDeleteCommunity = async () => {
    if (!window.confirm(`Are you sure you want to delete "${community.name}" and all its connected groups?`)) {
      return;
    }
    setIsDeleting(true);
    try {
      const res = await communityService.deleteCommunity(community.id);
      if (res.success) {
        toast.success(`Community "${community.name}" deleted successfully.`);
        onCommunityDeleted?.(community.id);
      } else {
        toast.error(res.error || "Failed to delete community");
      }
    } catch (err) {
      toast.error("Failed to delete community");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const res = await communityService.addGroupToCommunity(community.id, {
        name: newGroupName.trim(),
        description: newGroupDesc.trim() || `Official ${newGroupName.trim()} discussions`,
      });
      if (res.success && res.data) {
        toast.success(`🎉 Group "${res.data.name}" added to community!`);
        setGroups((prev) => [
          ...prev,
          {
            id: res.data.id,
            name: res.data.name,
            description: res.data.description,
            avatarUrl: res.data.avatarUrl,
            memberCount: 1,
            createdAt: res.data.createdAt,
          },
        ]);
        setNewGroupName("");
        setNewGroupDesc("");
        setIsAddingGroup(false);
      } else {
        toast.error(res.error || "Failed to add group");
      }
    } catch (err) {
      toast.error("Failed to add group");
    }
  };

  const toggleJoin = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setJoinedGroupIds((prev) => {
      const nextState = !prev[groupId];
      if (nextState) {
        toast.success("Joined group successfully!");
      } else {
        toast.info("Left group");
      }
      return { ...prev, [groupId]: nextState };
    });
  };

  // If a group is selected, render the exact Group Chat view matching input_file_0.png and input_file_1.png!
  if (selectedGroup) {
    return (
      <CommunityGroupChatView
        group={selectedGroup}
        community={community}
        onBack={() => setSelectedGroup(null)}
      />
    );
  }

  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const announcementsGroup = filteredGroups.find((g) => g.name.toLowerCase().includes("announcement"));
  const regularGroups = filteredGroups.filter((g) => !g.name.toLowerCase().includes("announcement"));

  const initialChar = community.name ? community.name.charAt(0).toUpperCase() : "C";

  return (
    <div className="flex flex-1 flex-col h-full w-full bg-white overflow-y-auto relative select-none animate-in fade-in-50 duration-200">
      {/* 1. Top Soft Blue Gradient Banner */}
      <div className="h-[136px] sm:h-[148px] w-full bg-gradient-to-r from-[#CADBFF] via-[#E2EEFF] to-[#EFF6FF] relative px-6 pt-5 pb-4 shrink-0 flex flex-col justify-between">
        {/* Top Action Buttons Right */}
        <div className="flex items-center justify-end gap-2.5 w-full">
          {(!community.myRole || community.myRole === "OWNER") && (
            <button
              onClick={handleDeleteCommunity}
              disabled={isDeleting}
              className="h-9 w-9 rounded-full bg-black/10 hover:bg-red-500 hover:text-white text-slate-700 transition-colors flex items-center justify-center shadow-xs"
              title="Delete Community"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          )}
          <button
            onClick={() => toast.info("Share community link copied!")}
            className="h-9 w-9 rounded-full bg-black/10 hover:bg-black/15 text-slate-700 transition-colors flex items-center justify-center shadow-xs"
            title="Share Community"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => toast.info("Community settings")}
            className="h-9 w-9 rounded-full bg-black/10 hover:bg-black/15 text-slate-700 transition-colors flex items-center justify-center shadow-xs"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* Overlapping Community Avatar Square */}
        <div className="absolute -bottom-7 left-6 h-[56px] w-[56px] sm:h-[60px] sm:w-[60px] rounded-[16px] bg-[#2563EB] text-white flex items-center justify-center text-2xl font-bold shadow-md border-[3.5px] border-white z-10">
          <span>{initialChar}</span>
        </div>
      </div>

      {/* 2. Community Profile Header Info Section */}
      <div className="pt-9 px-6 pb-5 bg-white border-b border-[#F1F5F9] shrink-0">
        <h1 className="text-[18px] sm:text-[20px] font-bold tracking-tight text-[#0F172A]">
          {community.name}
        </h1>
        <p className="text-[13px] font-medium text-[#64748B] mt-0.5">
          {community.description || "Latest product news & releases"}
        </p>
        
        {/* Followers & Posts Count */}
        <div className="flex items-center gap-5 mt-3 text-[12px] font-semibold text-[#64748B]">
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-[#3B82F6]" />
            <strong className="text-[#0F172A] font-bold">{community.memberCount.toLocaleString()}</strong> followers
          </span>
          <span className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-[#3B82F6]" />
            <strong className="text-[#0F172A] font-bold">{groups.length || community.groupCount || 4}</strong> posts
          </span>
        </div>
      </div>

      {/* 3. Main Scrollable Groups Feed Section */}
      <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 flex flex-col items-center w-full bg-white">
        <div className="w-full max-w-[620px] space-y-7">
          
          {/* Search Groups Bar */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 sm:h-12 w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC]/70 pl-11 pr-4 text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 transition-all shadow-2xs"
            />
          </div>

          {/* ANNOUNCEMENTS Channel Section */}
          {(announcementsGroup || !searchQuery) && (
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#2563EB] mb-2.5">
                <Megaphone className="h-3.5 w-3.5 fill-[#2563EB]" />
                <span>ANNOUNCEMENTS</span>
              </div>

              <div
                onClick={() => setSelectedGroup(announcementsGroup || { id: "announcements", name: "Announcements", description: "Company-wide updates (Admin only)", memberCount: community.memberCount, avatarUrl: null, createdAt: new Date().toISOString() })}
                className="rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] p-4 flex items-center justify-between shadow-2xs cursor-pointer hover:bg-[#E2EFFE] transition-colors group"
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-3">
                  <div className="h-12 w-12 rounded-2xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center text-xl shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <span>📢</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-bold text-[#0F172A] truncate">
                        {announcementsGroup?.name || "Announcements"}
                      </span>
                      <span className="text-[12px]">📢</span>
                    </div>
                    <span className="text-[12px] text-[#64748B] font-medium mt-0.5 truncate">
                      {announcementsGroup?.description || "Company-wide updates (Admin only)"}
                    </span>
                    <span className="text-[11px] font-semibold text-[#94A3B8] mt-1">
                      {announcementsGroup?.memberCount || community.memberCount} members · 2m ago
                    </span>
                  </div>
                </div>

                <div className="flex items-center shrink-0">
                  <div className="h-6 w-6 rounded-full bg-[#2563EB] text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                    3
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ALL GROUPS Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                <Hash className="h-3.5 w-3.5" />
                <span>ALL GROUPS</span>
              </div>
              <span className="text-[11px] font-bold text-[#64748B]">
                {regularGroups.length} {regularGroups.length === 1 ? "Group" : "Groups"}
              </span>
            </div>

            {isLoadingGroups ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400 font-semibold text-sm">
                <Loader2 className="h-6 w-6 animate-spin text-[#2563EB]" />
                <span>Loading groups inside community...</span>
              </div>
            ) : regularGroups.length === 0 ? (
              <div className="py-8 text-center text-sm font-medium text-slate-400 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                No matching groups found. Click "+ Add New Group" to create one.
              </div>
            ) : (
              <div className="space-y-1.5">
                {regularGroups.map((grp, idx) => {
                  const icon = getGroupIcon(grp.name);
                  const meta = getGroupMeta(grp.name, idx, grp.memberCount);
                  const isJoined = joinedGroupIds[grp.id];

                  return (
                    <div
                      key={grp.id}
                      onClick={() => setSelectedGroup(grp)}
                      className="flex items-center justify-between py-3.5 px-3 rounded-2xl hover:bg-[#F8FAFC] transition-colors cursor-pointer group border-b border-slate-100/70 last:border-b-0"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 pr-3 flex-1">
                        <div className="h-12 w-12 rounded-2xl bg-[#F1F5F9] flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                          <span>{icon}</span>
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-[14px] font-bold text-[#0F172A] truncate">
                            {grp.name}
                          </span>
                          <span className="text-[12px] text-[#64748B] font-medium mt-0.5 truncate">
                            {grp.description || meta.desc}
                          </span>
                          <span className="text-[11px] font-semibold text-[#94A3B8] mt-1">
                            {grp.memberCount} members · {meta.time}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center shrink-0 ml-2">
                        {meta.join && !isJoined ? (
                          <button
                            type="button"
                            onClick={(e) => toggleJoin(grp.id, e)}
                            className="rounded-full bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] px-4 py-1.5 text-[12px] font-bold transition-all shrink-0 shadow-2xs active:scale-95"
                          >
                            Join
                          </button>
                        ) : isJoined ? (
                          <button
                            type="button"
                            onClick={(e) => toggleJoin(grp.id, e)}
                            className="rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3.5 py-1.5 text-[12px] font-bold transition-all shrink-0 flex items-center gap-1 active:scale-95"
                          >
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                            <span>Joined</span>
                          </button>
                        ) : meta.badge ? (
                          <div className="h-6 w-6 rounded-full bg-[#2563EB] text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                            {meta.badge}
                          </div>
                        ) : (
                          <ArrowRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* + Add New Group Inline Modal / Action Button */}
          <div className="pt-2 pb-10">
            {!isAddingGroup ? (
              <button
                type="button"
                onClick={() => setIsAddingGroup(true)}
                className="w-full rounded-2xl border-2 border-dashed border-[#BFDBFE] bg-[#EFF6FF]/30 hover:bg-[#EFF6FF]/80 hover:border-[#2563EB] text-[#2563EB] py-3.5 flex items-center justify-center gap-2 font-bold text-[13px] transition-all cursor-pointer shadow-2xs group active:scale-[0.99]"
              >
                <Plus className="h-4 w-4 stroke-[2.5] group-hover:scale-110 transition-transform" />
                <span>Add New Group</span>
              </button>
            ) : (
              <div className="rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] p-5 shadow-sm animate-in fade-in-50 duration-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                    <Plus className="h-4 w-4 text-[#2563EB]" />
                    Create New Group inside {community.name}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddingGroup(false)}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleAddGroup} className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 mb-1">
                      Group Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Design Sync, QA Engineering"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-medium text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 mb-1">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="What is discussed in this group?"
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                      className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-medium text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingGroup(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Group</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
