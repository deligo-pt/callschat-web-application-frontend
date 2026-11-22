"use client";

import React from "react";
import { CustomUsername } from "@/components/profile/CustomUsername";
import { useRouter } from "next/navigation";

export default function ProfileUsernameRoute() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] dark:bg-[#0C1317] overflow-y-auto h-full">
      <CustomUsername onBack={() => router.push("/profile/edit")} showHeader={true} />
    </div>
  );
}
