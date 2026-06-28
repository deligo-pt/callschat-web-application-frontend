"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { Loader2 } from "lucide-react";

export default function BusinessSectionLayout({ children }: { children: React.ReactNode }) {
  const { workspace, isLoading, currentMode } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && currentMode === "BUSINESS" && workspace === null && pathname !== "/business/onboarding") {
      router.replace("/business/onboarding");
    }
  }, [isLoading, currentMode, workspace, pathname, router]);

  if (isLoading || (currentMode === "BUSINESS" && workspace === undefined && pathname !== "/business/onboarding")) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6]" />
      </div>
    );
  }

  return <>{children}</>;
}
