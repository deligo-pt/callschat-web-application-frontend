"use client";

import React from "react";
import { VerificationStatus } from "@/components/business/VerificationStatus";
import { ArrowLeft, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BusinessVerificationRoute() {
  const router = useRouter();

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-[#F8FAFC] dark:bg-[#0C1317] p-6 md:p-10 font-sans">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-8 max-w-4xl mx-auto w-full">
        <button
          type="button"
          onClick={() => router.push("/business/settings")}
          className="rounded-full p-2 bg-white dark:bg-[#111B21] border border-[#E6EAFA] dark:border-[#222D34] hover:bg-gray-50 dark:hover:bg-[#202C33] transition-colors shadow-2xs cursor-pointer"
          title="Back to business settings"
        >
          <ArrowLeft className="h-5 w-5 text-[#1D2A54] dark:text-[#E9EDEF]" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#1D2A54] dark:text-[#E9EDEF] tracking-tight">
              Enterprise Compliance & Verification (KYB)
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 dark:bg-purple-950/40 px-2.5 py-0.5 text-xs font-bold text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800/40">
              <Building2 className="h-3.5 w-3.5" />
              Business
            </span>
          </div>
          <p className="text-xs font-medium text-[#8F95B2] dark:text-[#8696A0] mt-0.5">
            Submit official commercial documentation and monitor your verified corporate status
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div className="rounded-3xl bg-white dark:bg-[#111B21] p-6 md:p-8 border border-[#E6EAFA] dark:border-[#222D34] shadow-xs">
          <VerificationStatus
            targetType="BUSINESS_ENTITY"
            onBack={() => router.push("/business/settings")}
          />
        </div>
      </div>
    </div>
  );
}
