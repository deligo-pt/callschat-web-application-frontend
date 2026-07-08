"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { BusinessChannelsModal } from "@/components/business/BusinessChannelsModal";

export default function BusinessChannelsPage() {
  const router = useRouter();

  return (
    <div className="flex h-full w-full overflow-hidden">
      <BusinessChannelsModal
        isOpen={true}
        isEmbedded={true}
        onClose={() => router.push("/chats")}
      />
    </div>
  );
}
