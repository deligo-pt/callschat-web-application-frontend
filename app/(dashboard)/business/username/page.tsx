"use client";

import React from "react";
import { CustomUsername } from "@/components/profile/CustomUsername";
import { useRouter } from "next/navigation";

export default function BusinessUsernameRoute() {
  const router = useRouter();

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-white font-sans">
      <CustomUsername onBack={() => router.push("/business/settings")} showHeader={true} />
    </div>
  );
}
