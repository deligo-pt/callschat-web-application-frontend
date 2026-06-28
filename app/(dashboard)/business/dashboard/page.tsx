"use client";

import React from "react";
import { Briefcase, Users, MessageSquare, TrendingUp, Zap, Clock, ShieldCheck, ArrowRight, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { VerificationStatus } from "@/components/business/VerificationStatus";

export default function BusinessDashboardPage() {
  const router = useRouter();

  const stats = [
    { title: "Active Client Threads", value: "24", change: "+12% this week", icon: MessageSquare, color: "bg-purple-500", text: "text-purple-600", bg: "bg-purple-50" },
    { title: "Avg. Response Time", value: "4.2m", change: "Faster than target", icon: Clock, color: "bg-blue-500", text: "text-blue-600", bg: "bg-blue-50" },
    { title: "Team Members", value: "8", change: "2 online now", icon: Users, color: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Resolution Rate", value: "98.4%", change: "+0.8% vs last month", icon: TrendingUp, color: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50" },
  ];

  const quickActions = [
    { title: "Open Client Chats", desc: "View all business customer threads", icon: MessageSquare, href: "/chats", color: "from-purple-600 to-indigo-600" },
    { title: "Manage Team Groups", desc: "Collaborate securely with internal staff", icon: Users, href: "/groups", color: "from-blue-600 to-cyan-600" },
    { title: "Quick Replies", desc: "Edit automated message responses", icon: Zap, href: "/business/quick-replies", color: "from-emerald-600 to-teal-600" },
    { title: "Identity & Verification", desc: "Upload compliance docs & settings", icon: Settings, href: "/business/settings", color: "from-amber-600 to-orange-600" },
  ];

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-[#F8FAFC] p-6 md:p-10">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1E1B4B] via-[#2E1065] to-[#4C1D95] p-8 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-400/20 px-3 py-1 text-xs font-bold text-purple-200 border border-purple-400/30">
                <ShieldCheck className="h-3.5 w-3.5 text-purple-300" />
                Verified Business Workspace
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Welcome to Business Mode</h1>
            <p className="mt-2 text-sm md:text-base text-purple-200 max-w-xl leading-relaxed">
              Your professional communication hub. Client messages, team groups, and data strictly separated from your personal chats.
            </p>
          </div>
          <button
            onClick={() => router.push("/chats")}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-[#2E1065] shadow-lg transition-all hover:bg-purple-50 active:scale-95 shrink-0"
          >
            Go to Business Chats
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="rounded-2xl bg-white p-6 shadow-xs border border-[#E6EAFA] transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8F95B2]">{stat.title}</span>
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", stat.bg)}>
                  <Icon className={cn("h-5 w-5", stat.text)} strokeWidth={2.5} />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-[#1D2A54]">{stat.value}</span>
              </div>
              <p className="mt-1 text-xs font-semibold text-emerald-600">{stat.change}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-[#1D2A54] mb-4">Workspace Navigation</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-xs border border-[#E6EAFA] transition-all hover:border-purple-300 hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md mb-4 group-hover:scale-110 transition-transform", action.color)}>
                    <Icon className="h-6 w-6" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-base font-bold text-[#1D2A54] group-hover:text-purple-600 transition-colors">{action.title}</h3>
                  <p className="mt-1 text-xs text-[#8F95B2] leading-relaxed">{action.desc}</p>
                </div>
                <div className="mt-6 flex items-center gap-1 text-xs font-bold text-purple-600 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                  Access <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Verification Overview Section */}
      <div className="mt-10">
        <h2 className="text-lg font-bold text-[#1D2A54] mb-4">Compliance & Identity Status</h2>
        <VerificationStatus />
      </div>
    </div>
  );
}
