"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Radio, Mic2 } from "lucide-react";
import { HostStatusContainer } from "@/components/host/HostStatusContainer";

export default function ProfileHostRoute() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] dark:bg-[#0C1317] overflow-y-auto h-full p-6 md:p-10 font-sans">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-8 max-w-4xl mx-auto w-full">
        <button
          type="button"
          onClick={() => router.push("/profile/edit")}
          className="rounded-full p-2 bg-white dark:bg-[#111B21] border border-[#E6EAFA] dark:border-[#222D34] hover:bg-gray-50 dark:hover:bg-[#202C33] transition-colors shadow-2xs cursor-pointer shrink-0"
          title="Back to profile"
        >
          <ArrowLeft className="h-5 w-5 text-[#1D2A54] dark:text-[#E9EDEF]" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#1D2A54] dark:text-[#E9EDEF] tracking-tight">
              Live Creator & Host Studio
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800/40">
              <Radio className="h-3.5 w-3.5 text-red-500 animate-pulse" />
              Live Stage
            </span>
          </div>
          <p className="text-xs font-medium text-[#8F95B2] dark:text-[#8696A0] mt-0.5">
            Apply to become an approved Live Host, manage stage permissions, and broadcast interactive audio rooms
          </p>
        </div>
      </div>

      {/* Main Host Container */}
      <div className="max-w-4xl mx-auto w-full">
        <HostStatusContainer />
      </div>
    </div>
  );
}
