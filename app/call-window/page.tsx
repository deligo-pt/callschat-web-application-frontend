"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const CallWindowView = dynamic(() => import("./CallWindowView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0C1317] text-[#E9EDEF] select-none">
      <div className="flex flex-col items-center gap-4 max-w-sm text-center">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#202C33] border border-white/10 shadow-xl">
          <Loader2 className="h-8 w-8 text-[#00A884] animate-spin" />
        </div>
        <h1 className="text-lg font-bold text-[#E9EDEF]">Connecting Call Window...</h1>
        <p className="text-sm text-[#8696A0]">
          Synchronizing with your CallsChat session.
        </p>
      </div>
    </div>
  ),
});

export default function StandaloneCallWindowPage() {
  return <CallWindowView />;
}
