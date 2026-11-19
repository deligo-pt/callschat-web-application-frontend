"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PersonalSignUpScreen from "@/components/auth/PersonalSignUpScreen";

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const isTestParam = searchParams.get("test") === "true";
    const isTestEnv = process.env.NEXT_PUBLIC_ENABLE_TEST_AUTH === "true";
    const isDev = process.env.NODE_ENV !== "production";

    if (!isTestParam && !isTestEnv && !isDev) {
      router.replace("/connect");
    } else {
      setIsAllowed(true);
    }
  }, [router, searchParams]);

  if (!isAllowed) {
    return null;
  }

  return <PersonalSignUpScreen />;
}

export default function PersonalSignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#EEF2F9]" />}>
      <SignUpContent />
    </Suspense>
  );
}
