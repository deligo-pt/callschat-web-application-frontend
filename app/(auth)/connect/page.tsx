import { Suspense } from "react";
import WebLoginScreen from "@/components/auth/WebLoginScreen";

export default function ConnectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-[#0C1317]" />}>
      <WebLoginScreen />
    </Suspense>
  );
}
