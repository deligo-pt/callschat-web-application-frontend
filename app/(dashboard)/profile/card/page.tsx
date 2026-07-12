"use client";

import React from "react";
import { DigitalBusinessCard } from "@/components/profile/DigitalBusinessCard";
import { useRouter } from "next/navigation";

export default function ProfileCardRoute() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto h-full">
      <DigitalBusinessCard onBack={() => router.push("/profile/edit")} showHeader={true} />
    </div>
  );
}
