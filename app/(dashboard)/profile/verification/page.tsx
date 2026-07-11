"use client";

import React from "react";
import { VerificationStatus } from "@/components/business/VerificationStatus";
import { useRouter } from "next/navigation";

export default function ProfileVerificationRoute() {
  const router = useRouter();
  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto h-full">
      <VerificationStatus onBack={() => router.push("/profile/edit")} />
    </div>
  );
}
