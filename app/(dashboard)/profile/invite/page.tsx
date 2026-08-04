"use client";

import React from "react";
import { InviteFriends } from "@/components/profile/InviteFriends";
import { useRouter } from "next/navigation";

export default function ProfileInviteRoute() {
  const router = useRouter();
  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto h-full">
      <InviteFriends onBack={() => router.push("/profile/edit")} />
    </div>
  );
}
