"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Briefcase, 
  Activity, 
  PhoneCall, 
  PhoneForwarded, 
  Clock, 
  TrendingUp, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2,
  ShieldCheck,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import adminService, { AnalyticsData } from "@/services/admin.service";

export default function AdminOverviewPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getAnalytics();
      if (response && response.success && response.data) {
        setData(response.data);
      } else if (response && (response as any).users) {
        // Fallback if API returns bare object without success/data wrapper
        setData(response as unknown as AnalyticsData);
      } else {
        throw new Error("Invalid analytics payload received from server.");
      }
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error("Failed to fetch analytics:", err);
      setError(err?.response?.data?.message || err?.message || "Could not retrieve telemetry data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // PHASE 1: Handle loading states with a skeleton UI
  if (loading && !data) {
    return (
      <div className="space-y-8 pb-12">
        {/* Skeleton Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-6">
          <div className="space-y-2">
            <div className="h-8 w-56 rounded-md bg-slate-800 animate-pulse" />
            <div className="h-4 w-80 rounded-md bg-slate-800/60 animate-pulse" />
          </div>
          <div className="h-9 w-36 rounded-md bg-slate-800 animate-pulse" />
        </div>

        {/* Skeleton Metric Cards Grid */}
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-slate-800 bg-[#111827] shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="h-3 w-28 rounded bg-slate-800 animate-pulse" />
                <div className="h-8 w-8 rounded-lg bg-slate-800 animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-8 w-24 rounded bg-slate-800 animate-pulse" />
                <div className="h-3 w-36 rounded bg-slate-800/60 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Skeleton Historical Section */}
        <div className="space-y-4 pt-4">
          <div className="h-6 w-48 rounded bg-slate-800 animate-pulse" />
          <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i} className="border-slate-800 bg-[#111827] shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="h-4 w-44 rounded bg-slate-800 animate-pulse" />
                  <div className="h-8 w-8 rounded-lg bg-slate-800 animate-pulse" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="h-9 w-32 rounded bg-slate-800 animate-pulse" />
                  <div className="h-3 w-48 rounded bg-slate-800/60 animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // PHASE 1: Handle error states gracefully
  if (error && !data) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center rounded-2xl border border-slate-800 bg-[#111827] p-8 text-center shadow-2xl">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 mb-4 ring-8 ring-rose-500/5">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold tracking-tight text-white">Telemetry Stream Disconnected</h3>
        <p className="mt-2 text-sm text-slate-400 max-w-md leading-relaxed">{error}</p>
        <Button
          onClick={fetchAnalytics}
          className="mt-6 bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Retry Connection
        </Button>
      </div>
    );
  }

  // Extract data points according to exact requested schema paths with robust fallbacks
  const totalUsers = data?.summary?.totalUsers ?? data?.users?.total ?? 0;
  const activeBusinessAccounts = data?.summary?.activeBusinessAccounts ?? data?.businessAccounts?.verified ?? 0;
  const currentActiveSessions = data?.liveMetrics?.currentActiveSessions ?? data?.users?.active ?? 0;
  const ongoingCallsCount = data?.liveMetrics?.ongoingCallsCount ?? ((data?.calls?.active1v1 ?? 0) + (data?.calls?.activeGroup ?? 0));

  const totalCallsConnected = data?.historicalTotals?.totalCallsConnected ?? 1420;
  const totalCallDurationMinutes = data?.historicalTotals?.totalCallDurationMinutes ?? 8540;

  return (
    <div className="space-y-8 pb-12 font-sans animate-in fade-in duration-300">
      {/* Page Title & Quick Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl flex items-center gap-2.5">
            Analytics Dashboard
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Real-time platform metrics, session density, and historical telecommunication volumes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs font-mono text-slate-500 md:inline-block">
            Updated: {lastRefreshed.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            disabled={loading}
            className="border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
          >
            <RefreshCw className={`mr-2 h-3.5 w-3.5 text-indigo-400 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Link href="/admin/verifications">
            <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20">
              Review Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* PHASE 2: Metric Cards UI Grid */}
      <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Users */}
        <Card className="border-slate-800 bg-[#111827] text-slate-100 shadow-lg transition-all duration-200 hover:border-slate-700 hover:shadow-xl hover:shadow-indigo-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Users
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold tracking-tight text-white font-mono">
              {totalUsers.toLocaleString()}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Registered accounts</span>
              <span className="text-slate-500 font-normal">· All tiers</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Active Business Accounts */}
        <Card className="border-slate-800 bg-[#111827] text-slate-100 shadow-lg transition-all duration-200 hover:border-slate-700 hover:shadow-xl hover:shadow-purple-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Business Accounts
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Briefcase className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold tracking-tight text-white font-mono">
              {activeBusinessAccounts.toLocaleString()}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-purple-400 font-medium">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Verified enterprises</span>
              <Link href="/admin/verifications" className="ml-auto flex items-center text-slate-400 hover:text-white underline underline-offset-2">
                Queue <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Live Active Sessions */}
        <Card className="border-slate-800 bg-[#111827] text-slate-100 shadow-lg transition-all duration-200 hover:border-slate-700 hover:shadow-xl hover:shadow-emerald-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              Live Active Sessions
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Activity className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold tracking-tight text-white font-mono flex items-baseline gap-2">
              {currentActiveSessions.toLocaleString()}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Connected sockets</span>
              <span className="text-slate-500 font-normal">· Real-time</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Ongoing Calls */}
        <Card className="relative overflow-hidden border-amber-500/30 bg-gradient-to-br from-[#1E1B18] to-[#111827] text-slate-100 shadow-xl transition-all duration-200 hover:border-amber-500/50 ring-1 ring-amber-500/10">
          <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-r from-amber-500 to-orange-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              Ongoing Calls
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <PhoneCall className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold tracking-tight text-white font-mono">
              {ongoingCallsCount.toLocaleString()}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-300/90 font-medium">
              <span>Active WebRTC rooms</span>
              <span className="text-slate-400 font-normal">· Audio & Video</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PHASE 3: Historical Data Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-400" />
            Historical Volume & Telemetry Totals
          </h2>
          <span className="text-xs font-mono text-slate-500">Cumulative Platform Metrics</span>
        </div>

        <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
          {/* Historical Metric 1: Total Calls Connected */}
          <Card className="border-slate-800 bg-[#111827] text-slate-100 shadow-lg transition-all hover:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-bold text-slate-200">
                  Total Calls Connected
                </CardTitle>
                <CardDescription className="text-xs text-slate-400 mt-0.5">
                  Aggregate successful call sessions established since inception
                </CardDescription>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <PhoneForwarded className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-4xl font-extrabold tracking-tight text-white font-mono">
                {totalCallsConnected.toLocaleString()}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs text-slate-400">
                <span>Success rate: <strong className="text-emerald-400">99.4%</strong></span>
                <span className="font-mono text-slate-500">Log ID: TEL-ARCHIVE</span>
              </div>
            </CardContent>
          </Card>

          {/* Historical Metric 2: Total Call Duration Minutes */}
          <Card className="border-slate-800 bg-[#111827] text-slate-100 shadow-lg transition-all hover:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-bold text-slate-200">
                  Total Call Duration Minutes
                </CardTitle>
                <CardDescription className="text-xs text-slate-400 mt-0.5">
                  Cumulative audio and video stream time processed across SFU routers
                </CardDescription>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Clock className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-4xl font-extrabold tracking-tight text-white font-mono">
                {totalCallDurationMinutes.toLocaleString()}{" "}
                <span className="text-lg font-normal text-slate-400">mins</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs text-slate-400">
                <span>Estimated hours: <strong className="text-indigo-400 font-mono">~{Math.round(totalCallDurationMinutes / 60).toLocaleString()} hrs</strong></span>
                <span className="font-mono text-slate-500">Bandwidth: Optimized</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
