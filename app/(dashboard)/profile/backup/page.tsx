"use client";

import { useRouter } from "next/navigation";
import { KeyBackupSettings } from "@/components/profile/KeyBackupSettings";

export default function KeyBackupPage() {
  const router = useRouter();

  return (
    <div className="h-full w-full">
      <KeyBackupSettings onBack={() => router.push("/profile/edit")} />
    </div>
  );
}
