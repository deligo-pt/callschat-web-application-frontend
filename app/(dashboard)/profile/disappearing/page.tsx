"use client";

import React from "react";
import { DisappearingMessages } from "@/components/profile/DisappearingMessages";
import { useRouter } from "next/navigation";

export default function ProfileDisappearingRoute() {
  const router = useRouter();
  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] dark:bg-[#0C1317] overflow-y-auto h-full">
      <DisappearingMessages onBack={() => router.push("/profile/edit")} />
    </div>
  );
}
