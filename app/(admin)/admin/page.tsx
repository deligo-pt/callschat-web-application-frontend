"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Briefcase, 
  ShieldAlert, 
  Activity, 
  TrendingUp, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileText,
  UserCheck,
  RefreshCw
} from "lucide-react";
import Link from "next/link";

export default function AdminOverviewPage() {
  const recentActivities = [
    {
      id: "ACT-9942",
      type: "VERIFICATION_SUBMITTED",
      title: "New Business Verification",
      description: "User #8821 ('TechNova Solutions') submitted verification documents.",
      time: "2 minutes ago",
      icon: Briefcase,
      badge: "Urgent Review",
      badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    },
    {
      id: "ACT-9941",
      type: "MODERATION_REPORT",
      title: "Spam Report Filed",
      description: "User #4419 reported account @crypto_king for automated mass spam.",
      time: "14 minutes ago",
      icon: AlertTriangle,
      badge: "Flagged",
      badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    },
    {
      id: "ACT-9940",
      type: "ACCOUNT_CREATED",
      title: "Enterprise Profile Onboarded",
      description: "Global Logistics Corp upgraded to tier-3 Business Account.",
      time: "1 hour ago",
      icon: UserCheck,
      badge: "Verified",
      badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    },
    {
      id: "ACT-9939",
      type: "SYSTEM_ALERT",
      title: "Automated Rate-Limit Triggered",
      description: "IP Range 192.168.4.x temporarily blocked due to excessive auth requests.",
      time: "3 hours ago",
      icon: Activity,
      badge: "System Auto",
      badgeColor: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    },
    {
      id: "ACT-9938",
      type: "VERIFICATION_APPROVED",
      title: "Verification Approved",
      description: "Admin ID #ADM-01 approved business credentials for 'Apex Financial'.",
      time: "5 hours ago",
      icon: CheckCircle2,
      badge: "Completed",
      badgeColor: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Page Title & Quick Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Real-time telemetry, system metrics, and operational audit stream.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin-once" /> Refresh Metrics
          </Button>
          <Link href="/admin/verifications">
            <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20">
              Process Queue (18)
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Users */}
        <Card className="border-slate-800 bg-[#111827] text-slate-100 shadow-lg transition-all hover:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Users
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold tracking-tight text-white">142,893</div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+12.4%</span>
              <span className="text-slate-500">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Active Business Profiles */}
        <Card className="border-slate-800 bg-[#111827] text-slate-100 shadow-lg transition-all hover:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Business Profiles
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
              <Briefcase className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold tracking-tight text-white">3,410</div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+8.1%</span>
              <span className="text-slate-500">verified growth</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Pending Verifications (Highlighted requiring urgent action) */}
        <Card className="relative overflow-hidden border-amber-500/40 bg-gradient-to-br from-[#1E1B18] to-[#111827] text-slate-100 shadow-xl ring-1 ring-amber-500/20">
          <div className="absolute top-0 right-0 h-1.5 w-full bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              Pending Verifications
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-extrabold tracking-tight text-white">18</div>
              <Link href="/admin/verifications">
                <span className="inline-flex items-center text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors underline underline-offset-4">
                  Review Queue <ArrowUpRight className="ml-0.5 h-3 w-3" />
                </span>
              </Link>
            </div>
            <div className="mt-2 text-xs text-amber-300/80 font-medium">
              Action Required · 4 submissions &gt; 24h old
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Server Latency / System Status */}
        <Card className="border-slate-800 bg-[#111827] text-slate-100 shadow-lg transition-all hover:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              System Health & Latency
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Activity className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold tracking-tight text-white flex items-baseline gap-1.5">
              24<span className="text-base font-medium text-slate-400">ms</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>99.98% Uptime</span>
              <span className="text-slate-500">· All pods nominal</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Stream Section */}
      <div className="mt-8 rounded-xl border border-slate-800 bg-[#111827] overflow-hidden shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Recent Activity Stream</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Live Telemetry Feed</span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {recentActivities.map((act) => {
            const IconComponent = act.icon;
            return (
              <div 
                key={act.id}
                className="flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-slate-800/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-300 border border-slate-700/60 shadow-inner">
                    <IconComponent className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-semibold text-sm text-slate-100">{act.title}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${act.badgeColor}`}>
                        {act.badge}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed max-w-2xl">
                      {act.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pl-14 sm:pl-0">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
                    <Clock className="h-3 w-3" />
                    <span>{act.time}</span>
                  </div>
                  <Button variant="ghost" size="xs" className="text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10">
                    Inspect
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-800 bg-slate-900/40 px-6 py-3 text-center">
          <Link href="/admin/logs" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
            View All Audit Logs →
          </Link>
        </div>
      </div>
    </div>
  );
}
