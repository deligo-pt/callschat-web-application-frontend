"use client";

import React, { useEffect } from "react";
import { Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";

export default function ChannelsPage() {
  const router = useRouter();
  const { currentMode } = useUser();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted && currentMode === "BUSINESS") {
      router.replace("/business/channels");
    }
  }, [mounted, currentMode, router]);

  return (
    <div className="hidden flex-1 flex-col items-center justify-center bg-white md:flex w-full h-full">
      <div className="flex flex-col items-center text-center max-w-sm px-6">
        <div className="relative mb-8">
          <div className="h-[120px] w-[120px] rounded-full bg-[#EEF2FF] flex items-center justify-center border border-[#E0E7FF] shadow-2xl shadow-blue-500/10">
            <Share2 className="h-16 w-16 text-[#2563EB]" strokeWidth={1.5} />
          </div>
        </div>
        
        <h2 className="text-[22px] font-bold text-[#0F172A] mb-3">No Channels Found</h2>
        <p className="text-[13px] font-semibold text-[#1E293B] leading-relaxed max-w-[260px]">
          Follow or create broadcast channels to share updates, news, and announcements directly with your subscribers.
        </p>
      </div>
    </div>
  );
}
