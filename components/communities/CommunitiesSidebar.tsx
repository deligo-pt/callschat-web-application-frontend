"use client";

import React, { useState } from "react";
import { Search, Plus, Star, Bell, ChevronRight, Globe, UsersRound , Heart} from "lucide-react";
import { cn } from "@/lib/utils";
import { CommunityItem } from "./CreateCommunitiesUI";
import Link from "next/link";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

interface CommunitiesSidebarProps {
  communities: CommunityItem[];
  activeView: string; // "create" or a communityId
  onSelectCommunity: (community: CommunityItem) => void;
  onSelectCreate: () => void;
}

export function CommunitiesSidebar({
  communities,
  activeView,
  onSelectCommunity,
  onSelectCreate,
}: CommunitiesSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCommunities = communities.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="hidden md:flex h-full w-full flex-col border-r border-[#E6EAFA] bg-white md:w-[350px] shrink-0 relative select-none">
      {/* Header matching Groups sidebar */}
      <div className="flex flex-col px-6 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-[24px] font-bold tracking-tight text-[#2563EB]">
            Groups
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href="/chats/favorites"
              className="relative flex items-center justify-center p-2 transition-colors hover:bg-slate-50 rounded-full"
              title="Favorites"
            >
              <Heart className="h-5 w-5 fill-red-500 text-red-500" />
            </Link>
            <NotificationDropdown />
          </div>
        </div>

        {/* Search input */}
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
      </div>

      {/* Section Header: YOUR COMMUNITIES */}
      <div className="px-6 pt-3 pb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold text-[#2563EB] tracking-wider uppercase">
          YOUR COMMUNITIES
        </span>
      </div>

      {/* Communities List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-3 pb-6 space-y-1">
        {filteredCommunities.map((comm) => {
          const isSelected = activeView === comm.id;
          return (
            <div
              key={comm.id}
              onClick={() => onSelectCommunity(comm)}
              className={cn(
                "flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl transition-all cursor-pointer group",
                isSelected
                  ? "bg-[#EEF2FF] text-[#2563EB] shadow-2xs border border-[#E0E7FF]"
                  : "hover:bg-[#F8FAFC] text-[#0F172A] border border-transparent"
              )}
            >
              {/* Left Icon Box */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div
                  className={cn(
                    "h-[44px] w-[44px] rounded-2xl flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105",
                    comm.iconBg || "bg-blue-100",
                    comm.iconColor || "text-blue-600"
                  )}
                >
                  <Globe className="h-5 w-5 stroke-[2.2]" />
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[14px] font-bold truncate">
                    {comm.name}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 truncate mt-0.5">
                    <span className="flex items-center gap-1">
                      👥 {comm.memberCount} {comm.memberCount === 1 ? "member" : "members"}
                    </span>
                    {comm.groupCount && (
                      <span># {comm.groupCount} groups</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Arrow */}
              <ChevronRight
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5",
                  isSelected ? "text-[#2563EB]" : "text-slate-300"
                )}
              />
            </div>
          );
        })}

        {/* Create New Community Dashed Card */}
        <div className="pt-3">
          <div
            onClick={onSelectCreate}
            className={cn(
              "rounded-2xl border-2 border-dashed border-[#BFDBFE] bg-[#EFF6FF]/30 p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#EFF6FF]/70 hover:border-[#2563EB] transition-all group",
              activeView === "create" ? "border-[#2563EB] bg-[#EFF6FF]" : ""
            )}
          >
            <div className="h-9 w-9 rounded-full bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center mb-2 shadow-2xs group-hover:scale-105 transition-transform">
              <Plus className="h-5 w-5 stroke-[2.5]" />
            </div>
            <span className="text-[13px] font-bold text-[#2563EB]">
              Create New Community
            </span>
            <span className="text-[11px] font-medium text-[#64748B] mt-0.5">
              Organize your teams under one hub
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
