"use client";

import React from "react";
import { useProfile } from "@/context/ProfileContext";
import { ArrowLeft, Briefcase, UserCircle2, Copy, QrCode } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ProfileCardRoute() {
  const router = useRouter();
  const { userData, formData, avatarPreview, businessProfile, activeMode } = useProfile();

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC] overflow-y-auto scrollbar-hide p-6 md:p-10 h-full">
      <div className="max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push("/profile/edit")}
            aria-label="Go back"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-[15px] font-bold">Back</span>
          </button>
        </div>

        {/* Digital Business Card Preview */}
        <div className="rounded-3xl bg-gradient-to-br from-[#1E1B4B] via-[#2E1065] to-[#4C1D95] p-8 text-white shadow-2xl relative overflow-hidden border border-white/10">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-purple-500/20 blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md text-white border border-white/20">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-200">CallsChat Business</span>
                <p className="text-xs text-purple-300">Verified Organization</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
              Verified
            </span>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/40 shadow-md shrink-0">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <UserCircle2 className="h-10 w-10 text-white/80" />
              )}
            </div>
            <div className="overflow-hidden">
              <h3 className="text-xl font-bold text-white truncate">
                {userData?.profile?.displayName || formData.displayName || "Fandy Eve"}
              </h3>
              <p className="text-sm font-medium text-purple-200 truncate">
                {businessProfile?.companyName || formData.companyName || "techzone"}
              </p>
              <p className="text-xs text-purple-300 mt-0.5 truncate">{formData.phone || "+111 xxx 2345"}</p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 mt-6 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">Digital Card ID</span>
              <p className="text-xs font-mono text-white mt-0.5">{userData?.id?.slice(0, 12) || "CC-BUS-982314"}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  toast.info("QR Code view opening soon!");
                }}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Show QR Code"
              >
                <QrCode className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.origin + `/profile/card`);
                  toast.success("Card link copied to clipboard!");
                }}
                className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-md transition-colors"
              >
                <Copy className="h-3.5 w-3.5" /> Copy Link
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
