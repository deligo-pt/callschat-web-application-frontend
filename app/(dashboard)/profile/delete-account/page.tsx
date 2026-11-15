"use client";

import React from "react";
import { DeleteAccount } from "@/components/profile/DeleteAccount";
import { useRouter } from "next/navigation";

export default function ProfileDeleteAccountRoute() {
  const router = useRouter();
  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] dark:bg-[#0C1317] overflow-y-auto h-full">
      <DeleteAccount onBack={() => router.push("/profile/edit")} />
    </div>
  );
}
