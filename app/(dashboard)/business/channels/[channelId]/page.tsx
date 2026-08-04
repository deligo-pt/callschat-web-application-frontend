"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { BusinessChannelsModal } from "@/components/business/BusinessChannelsModal";

export default function BusinessChannelDetailPage({
  params,
}: {
  params: Promise<{ channelId: string }> | { channelId: string };
}) {
  const router = useRouter();
  const unwrappedParams = params instanceof Promise ? use(params) : params;

  return (
    <div className="flex h-full w-full overflow-hidden">
      <BusinessChannelsModal
        isOpen={true}
        isEmbedded={true}
        initialChannelId={unwrappedParams.channelId}
        onClose={() => router.push("/business/channels")}
      />
    </div>
  );
}
