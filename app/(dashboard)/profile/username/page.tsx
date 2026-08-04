"use client";

import React from "react";
import { CustomUsername } from "@/components/profile/CustomUsername";
import { useRouter } from "next/navigation";

export default function ProfileUsernameRoute() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto h-full">
      <CustomUsername onBack={() => router.push("/profile/edit")} showHeader={true} />
    </div>
  );
}
