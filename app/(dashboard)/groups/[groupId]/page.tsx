"use client";

import React, { Suspense } from "react";
import { useParams } from "next/navigation";
import { GroupChatView } from "@/components/group/GroupChatView";
import { Loader2 } from "lucide-react";

function GroupPageContent() {
  const params = useParams();
  const groupId = params?.groupId as string;

  if (!groupId) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#EEF2FF] dark:bg-[#111b21]">
        <Loader2 className="h-8 w-8 animate-spin text-[#00A884]" />
      </div>
    );
  }

  return <GroupChatView groupId={groupId} backUrl="/groups" />;
}

export default function GroupChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center bg-[#EEF2FF] dark:bg-[#111b21]">
          <Loader2 className="h-8 w-8 animate-spin text-[#00A884]" />
        </div>
      }
    >
      <GroupPageContent />
    </Suspense>
  );
}
