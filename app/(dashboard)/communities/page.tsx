"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { CommunitiesRouteContainer } from "@/components/communities/CommunitiesRouteContainer";

export default function CommunitiesPage() {
  const router = useRouter();
  const { currentMode } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && currentMode === "BUSINESS") {
      router.replace("/business/chats");
    }
  }, [mounted, currentMode, router]);

  if (currentMode === "BUSINESS") {
    return null;
  }

  return <CommunitiesRouteContainer />;
}
