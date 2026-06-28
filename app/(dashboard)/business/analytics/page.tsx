"use client";

import React from "react";
import { BarChart3, TrendingUp, Clock, MessageSquare, ArrowLeft, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BusinessAnalyticsPage() {
  const router = useRouter();

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-[#F8FAFC] p-6 md:p-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push("/business/dashboard")}
          className="rounded-full p-2 bg-white border border-[#E6EAFA] hover:bg-gray-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="h-5 w-5 text-[#1D2A54]" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#1D2A54]">Workspace Analytics</h1>
          <p className="text-xs text-[#8F95B2]">Performance metrics for your business communications</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-[#E6EAFA] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase text-[#8F95B2]">Total Messages Sent</span>
            <MessageSquare className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-3xl font-extrabold text-[#1D2A54]">1,429</div>
          <div className="mt-2 text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" /> +18.4% vs last week
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E6EAFA] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase text-[#8F95B2]">Avg Response Time</span>
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-[#1D2A54]">4m 12s</div>
          <div className="mt-2 text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" /> 30s faster than average
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E6EAFA] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase text-[#8F95B2]">Client Satisfaction</span>
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-[#1D2A54]">99.2%</div>
          <div className="mt-2 text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" /> High trust score
          </div>
        </div>
      </div>

      {/* Mock Chart Area */}
      <div className="bg-white p-8 rounded-3xl border border-[#E6EAFA] shadow-xs flex flex-col items-center justify-center min-h-[300px] text-center">
        <BarChart3 className="h-16 w-16 text-purple-200 mb-4 animate-pulse" />
        <h3 className="text-lg font-bold text-[#1D2A54]">Activity Chart Live Stream</h3>
        <p className="text-sm text-[#8F95B2] max-w-md mt-1">
          Real-time message volume and team responsiveness charts are processing incoming telemetry.
        </p>
      </div>
    </div>
  );
}
