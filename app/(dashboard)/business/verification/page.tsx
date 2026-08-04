"use client";

import React from "react";
import { VerificationStatus } from "@/components/business/VerificationStatus";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BusinessVerificationRoute() {
  const router = useRouter();

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-[#F8FAFC] p-6 md:p-10 font-sans">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push("/business/settings")}
          className="rounded-full p-2 bg-white border border-[#E6EAFA] hover:bg-gray-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="h-5 w-5 text-[#1D2A54]" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-[#1D2A54] tracking-tight">Identity & Compliance Verification</h1>
          <p className="text-xs font-medium text-[#8F95B2]">Submit documentation and view your verified business account status</p>
        </div>
      </div>

      <div className="max-w-4xl space-y-6">
        <div className="rounded-3xl bg-white p-6 md:p-8 border border-[#E6EAFA] shadow-xs">
          <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-[#F4F6FC]">
            <ShieldCheck className="h-5 w-5 text-[#2563EB]" strokeWidth={2.5} />
            <h2 className="text-base font-bold text-[#1D2A54]">Business Verification Status</h2>
          </div>
          <VerificationStatus onBack={() => router.push("/business/settings")} />
        </div>
      </div>
    </div>
  );
}
