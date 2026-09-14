import { Suspense } from "react";
import ChooseModeScreen from "@/components/auth/ChooseModeScreen";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#EEF2F9]" />}>
      <ChooseModeScreen authType="login" />
    </Suspense>
  );
}
