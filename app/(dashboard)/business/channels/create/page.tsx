"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { BusinessChannelsModal } from "@/components/business/BusinessChannelsModal";

export default function CreateBusinessChannelPage() {
  const router = useRouter();

  return (
    <div className="flex h-full w-full overflow-hidden bg-white">
      <BusinessChannelsModal
        isOpen={true}
        isEmbedded={true}
        initialChannelId="create"
        onClose={() => router.push("/business/channels")}
      />
    </div>
  );
}
