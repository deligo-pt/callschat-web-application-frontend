"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();

  useEffect(() => {
    const mode = sessionStorage.getItem("auth_account_mode");
    if (mode === "BUSINESS") {
      router.replace("/auth/business/signup");
    } else if (mode === "PERSONAL") {
      router.replace("/auth/personal/signup");
    } else {
      router.replace("/choose-mode");
    }
  }, [router]);

  return <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]" />;
}
