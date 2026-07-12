"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, Star, Bell, Plus, ChevronRight, Loader2 } from "lucide-react";
import { useBusinessChannelsStore } from "@/store/useBusinessChannelsStore";
import { ChannelService } from "@/services/channel.service";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";

export default function BusinessChannelsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { workspace } = useUser();
  const { channels, isLoadingChannels, setChannels, setIsLoadingChannels } = useBusinessChannelsStore();
  const [searchQuery, setSearchQuery] = useState("");

  const fetchChannels = async () => {
    try {
      setIsLoadingChannels(true);
      const res = await ChannelService.getChannels(workspace?.id || null);
      if (res?.success && Array.isArray(res.data)) {
        setChannels(res.data);
      }
    } catch (err) {
      console.error("Failed to load business channels", err);
    } finally {
      setIsLoadingChannels(false);
    }
  };

  useEffect(() => {
    fetchChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id]);

  const isRootPage = pathname === "/business/channels";

  if (isRootPage) {
    return <>{children}</>;
  }

  const filteredChannels = channels.filter(ch =>
    ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ch.description && ch.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex h-full w-full bg-[#F8FAFC] overflow-hidden">
      {/* Left Panel - Matches Figma Sidebar (Groups / Your Channels) */}
      <div className="hidden md:flex h-full w-full flex-col border-r border-[#E6EAFA] bg-white md:w-[350px] shrink-0 relative overflow-hidden">
        {/* Header */}
        <div className="flex flex-col px-6 pt-7 pb-4 shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-[24px] font-bold tracking-tight text-[#2563EB]">Groups</h1>
            <div className="flex items-center gap-2.5">
              <button className="p-1.5 hover:bg-slate-50 rounded-full text-[#F59E0B] transition-colors">
                <Star className="h-5 w-5 fill-[#F59E0B]" />
              </button>
              <button className="p-1.5 hover:bg-slate-50 rounded-full text-slate-500 transition-colors">
                <Bell className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-2xl bg-[#F0F4F8] pl-10 pr-4 text-[13px] font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all border border-transparent"
            />
          </div>

          <div className="mt-5">
            <h3 className="text-[12px] font-extrabold text-[#2563EB] tracking-wide uppercase">Your Channels</h3>
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-4 scrollbar-hide">
          {isLoadingChannels ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#2563EB]" />
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="text-center py-8 text-xs font-medium text-slate-400">
              {channels.length === 0 ? "No channels created yet." : "No channels match your search."}
            </div>
          ) : (
            filteredChannels.map((ch, idx) => {
              const subs = ch.memberCount ?? 0;
              const isSelected = pathname === `/business/channels/${ch.id}`;
              const colors = ["bg-[#2563EB]", "bg-[#8B5CF6]", "bg-[#10B981]", "bg-[#EF4444]", "bg-[#F59E0B]"];
              const colorClass = colors[idx % colors.length];

              return (
                <div
                  key={ch.id}
                  onClick={() => router.push(`/business/channels/${ch.id}`)}
                  className={cn(
                    "flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer group",
                    isSelected
                      ? "bg-[#EEF2FF] border-[#C7D2FE] shadow-2xs"
                      : "bg-white border-slate-100 hover:border-blue-200 hover:shadow-2xs"
                  )}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={cn("h-11 w-11 shrink-0 rounded-full overflow-hidden text-white font-bold flex items-center justify-center shadow-xs text-base", colorClass)}>
                      {ch.avatarUrl ? (
                        <img src={ch.avatarUrl} alt={ch.name} className="h-full w-full object-cover" />
                      ) : (
                        <span>{ch.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-[14px] font-bold text-[#11142D] truncate">{ch.name}</h4>
                        {ch.myRole === "ADMIN" || ch.myRole === "OWNER" ? (
                          <span className="rounded-md bg-blue-50 border border-blue-100 px-1.5 py-0.5 text-[9px] font-extrabold text-[#2563EB]">
                            Admin
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                        {ch.description || `Latest ${ch.category?.toLowerCase() || "channel"} updates & news`}
                      </p>
                      <p className="text-[11px] font-bold text-[#2563EB] mt-1">
                        {subs} {subs === 1 ? "subscriber" : "subscribers"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#2563EB] transition-colors shrink-0" />
                </div>
              );
            })
          )}
        </div>

        {/* Create New Channel Dashed Button at Bottom of Left Sidebar */}
        <div className="p-4 border-t border-slate-100 bg-white shrink-0">
          <button
            onClick={() => router.push("/business/channels/create")}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-[#2563EB]/60 bg-blue-50/20 hover:bg-blue-50/50 text-[#2563EB] font-bold text-xs sm:text-sm transition-all shadow-2xs group"
          >
            <Plus className="h-4 w-4 stroke-[2.5] group-hover:scale-110 transition-transform" />
            <span>Create New Channel</span>
          </button>
        </div>
      </div>

      {/* Main Content Area (Right Panel) */}
      <div className="flex-1 h-full overflow-hidden relative bg-white flex flex-col">
        {children}
      </div>
    </div>
  );
}
