"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBusinessChannelsStore } from "@/store/useBusinessChannelsStore";
import { ChannelService } from "@/services/channel.service";
import { useUser } from "@/context/UserContext";
import { Loader2, RefreshCw, ChevronRight, Plus, Lock, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BusinessChannelsExplorePage() {
  const router = useRouter();
  const { workspace } = useUser();
  const { channels, isLoadingChannels, setChannels, setIsLoadingChannels } = useBusinessChannelsStore();

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

  const handleSelectChannel = (channel: any) => {
    router.push(`/business/channels/${channel.id}`);
  };

  return (
    <div className="flex h-full w-full flex-col bg-slate-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 shadow-sm shrink-0">
        <h1 className="text-2xl font-bold text-[#11142D] tracking-tight">Business Channels</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Broadcast to your followers and manage communities.</p>
      </div>

      {/* Content Body */}
      <div className="flex-1 p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#3B58F5] tracking-wide uppercase">Your Channels</h3>
            <button
              onClick={fetchChannels}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#3B58F5] transition-colors"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoadingChannels && "animate-spin")} />
              <span>Refresh</span>
            </button>
          </div>

          {isLoadingChannels ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#3B58F5]" />
              <p className="text-sm font-semibold text-slate-400">Loading your channels...</p>
            </div>
          ) : channels.length === 0 ? (
            <div className="text-center py-16 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="h-16 w-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Hash className="h-8 w-8" />
              </div>
              <p className="text-base font-bold text-slate-700">No channels yet</p>
              <p className="text-sm text-slate-400 mt-1">Create your first channel to start broadcasting to your audience.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {channels.map((ch) => {
                const subs = ch.memberCount ?? 0;
                return (
                  <div
                    key={ch.id}
                    onClick={() => handleSelectChannel(ch)}
                    className="flex flex-col justify-between p-5 rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group h-full"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-14 w-14 shrink-0 rounded-2xl overflow-hidden bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center shadow-md">
                        {ch.avatarUrl ? (
                          <img src={ch.avatarUrl} alt={ch.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-2xl">#{ch.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-[#3B58F5] group-hover:translate-x-1 transition-all shrink-0" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {ch.isPrivate ? (
                          <Lock className="h-3.5 w-3.5 text-slate-400" />
                        ) : (
                          <Hash className="h-3.5 w-3.5 text-slate-400" />
                        )}
                        <h4 className="text-lg font-bold text-[#11142D] truncate">{ch.name}</h4>
                      </div>
                      
                      <p className="text-sm text-slate-500 font-medium line-clamp-2 mt-1 mb-4 h-10">
                        {ch.description || `Latest ${ch.category?.toLowerCase() || "channel"} news & releases`}
                      </p>
                      
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                        <span className="rounded-full bg-blue-50 border border-blue-100 px-2.5 py-1 text-[10px] font-extrabold text-[#3B58F5]">
                          {ch.myRole === 'OWNER' ? 'Owner' : ch.myRole === 'ADMIN' ? 'Admin' : 'Member'}
                        </span>
                        <p className="text-xs font-bold text-slate-500">
                          {subs} {subs === 1 ? "subscriber" : "subscribers"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-6">
            <button
              onClick={() => router.push("/business/channels/create")}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-[#3B58F5]/60 bg-blue-50/30 hover:bg-blue-50/80 text-[#3B58F5] font-bold text-sm transition-all group"
            >
              <Plus className="h-5 w-5 stroke-[2.5] group-hover:scale-110 transition-transform" />
              <span>Create New Channel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
