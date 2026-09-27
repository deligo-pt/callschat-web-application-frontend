"use client";

import React from "react";
import { VerificationStatus } from "@/components/business/VerificationStatus";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function ProfileVerificationRoute() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] overflow-y-auto h-full p-6 md:p-10 font-sans">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-8 max-w-3xl mx-auto w-full">
        <button
          type="button"
          onClick={() => router.push("/profile/edit")}
          className="rounded-full p-2 bg-white border border-[#E6EAFA] hover:bg-gray-50 transition-colors shadow-2xs"
          title="Back to profile"
        >
          <ArrowLeft className="h-5 w-5 text-[#1D2A54]" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#1D2A54] tracking-tight">
              Identity Verification (KYC)
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              Personal
            </span>
          </div>
          <p className="text-xs font-medium text-[#8F95B2] mt-0.5">
            Verify your official government identity to unlock your verified badge across chats and calls
          </p>
        </div>
      </div>

      {/* Main Verification Card */}
      <div className="max-w-3xl mx-auto w-full">
        <div className="rounded-3xl bg-white p-6 md:p-8 border border-[#E6EAFA] shadow-xs">
          <VerificationStatus
            targetType="USER_IDENTITY"
            onBack={() => router.push("/profile/edit")}
          />
        </div>
      </div>
    </div>
  );
}
