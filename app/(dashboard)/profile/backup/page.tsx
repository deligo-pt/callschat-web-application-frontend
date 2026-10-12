"use client";

import { useRouter } from "next/navigation";
import { KeyBackupSettings } from "@/components/profile/KeyBackupSettings";

export default function KeyBackupPage() {
  const router = useRouter();

  return (
    <div className="h-full w-full bg-[#F8FAFC] dark:bg-[#0C1317]">
      <KeyBackupSettings onBack={() => router.push("/profile/edit")} />
    </div>
  );
}
