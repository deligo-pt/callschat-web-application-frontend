"use client";

import React from "react";
import { BusinessDashboard } from "@/components/profile/BusinessDashboard";
import { useRouter } from "next/navigation";

export default function ProfileDashboardRoute() {
  const router = useRouter();
  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto h-full">
      <BusinessDashboard onBack={() => router.push("/profile/edit")} />
    </div>
  );
}
