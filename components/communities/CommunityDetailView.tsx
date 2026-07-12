"use client";

import React from "react";
import { Globe, Users, Megaphone, Hash, Plus, Settings, Share2, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { CommunityItem } from "./CreateCommunitiesUI";
import { cn } from "@/lib/utils";

interface CommunityDetailViewProps {
  community: CommunityItem;
  onCreateNewClick: () => void;
}

export function CommunityDetailView({ community, onCreateNewClick }: CommunityDetailViewProps) {
  return (
    <div className="flex flex-1 flex-col h-full w-full bg-[#F8FAFC]/50 overflow-y-auto relative select-none">
      {/* Top Banner Header */}
      <div className="h-44 w-full bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] relative p-8 flex items-end justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-3xl bg-white text-[#2563EB] shadow-xl flex items-center justify-center border-4 border-white/20">
            <Globe className="h-10 w-10 stroke-[2.2]" />
          </div>
          <div className="text-white">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold tracking-tight">
                {community.name}
              </h1>
              <span className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-xs font-bold border border-white/30">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified Community
              </span>
            </div>
            <p className="text-xs font-medium text-blue-100 mt-1 max-w-xl">
              {community.description || "Official collaborative workspace and communication hub."}
            </p>
          </div>
        </div>

        <button
          onClick={onCreateNewClick}
          className="hidden sm:flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-[#2563EB] shadow-lg hover:bg-blue-50 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Create Another Community</span>
        </button>
      </div>

      {/* Main Body */}
      <div className="p-6 sm:p-8 space-y-6 max-w-5xl mx-auto w-full">
        {/* Quick Stats Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Total Members
              </span>
              <span className="text-xl font-extrabold text-[#0F172A]">
                {community.memberCount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Hash className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Connected Groups
              </span>
              <span className="text-xl font-extrabold text-[#0F172A]">
                {community.groupCount || 4} Groups
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Category
              </span>
              <span className="text-xl font-extrabold text-[#0F172A]">
                {community.category || "Technology"}
              </span>
            </div>
          </div>
        </div>

        {/* Announcement Feed Box */}
        <div className="rounded-2xl border border-[#DBEAFE] bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shadow-xs">
                <Megaphone className="h-5 w-5 fill-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">📢 Announcements Channel</h3>
                <p className="text-xs font-medium text-slate-400">Broadcast updates to all {community.memberCount} members</p>
              </div>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#2563EB]">
              Admin Feed
            </span>
          </div>

          <div className="rounded-xl bg-[#F8FAFC] border border-slate-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                AD
              </div>
              <p className="text-xs font-semibold text-slate-700">
                Welcome to <span className="font-bold text-[#2563EB]">{community.name}</span>! All official team groups and channels are synced here.
              </p>
            </div>
            <span className="text-[11px] font-medium text-slate-400">Just now</span>
          </div>
        </div>

        {/* Connected Groups Section */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">
              Connected Groups in this Hub
            </h3>
            <span className="text-xs font-bold text-[#2563EB] cursor-pointer hover:underline flex items-center gap-1">
              <span>Manage Groups</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: "📢 Announcements", desc: "Official updates", count: community.memberCount, req: true },
              { name: "👥 Management Team", desc: "Executive sync", count: Math.min(24, community.memberCount), req: false },
              { name: "💼 Sales Team", desc: "Pipeline & deals", count: Math.min(85, community.memberCount), req: false },
              { name: "💻 Dev Team", desc: "Engineering sprints", count: Math.min(140, community.memberCount), req: false },
            ].map((grp, i) => (
              <div key={i} className="rounded-xl border border-slate-100 bg-[#F8FAFC] p-4 flex items-center justify-between hover:border-blue-200 hover:bg-blue-50/20 transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[#0F172A]">{grp.name}</span>
                  <span className="text-xs text-slate-500 font-medium mt-0.5">{grp.desc}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">👥 {grp.count}</span>
                  {grp.req && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">Required</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
