"use client";

import React, { useEffect, useState } from "react";
import { Settings, ShieldCheck, Building2, Globe, MapPin, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { VerificationStatus } from "@/components/business/VerificationStatus";
import { BusinessService, BusinessProfileData } from "@/services/business.service";
import { WorkspaceService } from "@/services/workspace.service";
import { useUser } from "@/context/UserContext";

export default function BusinessSettingsPage() {
  const router = useRouter();
  const { workspace, updateCurrentMode } = useUser();
  const [profile, setProfile] = useState<BusinessProfileData | null>(null);

  useEffect(() => {
    BusinessService.getProfile()
      .then((res) => {
        if (res?.success) setProfile(res.data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-[#F8FAFC] p-6 md:p-10 font-sans">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push("/business/dashboard")}
          className="rounded-full p-2 bg-white border border-[#E6EAFA] hover:bg-gray-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="h-5 w-5 text-[#1D2A54]" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-[#1D2A54] tracking-tight">Business Workspace Settings</h1>
          <p className="text-xs font-medium text-[#8F95B2]">Manage your professional profile, identity compliance, and verification</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl">
        {/* Left Column: Verification Status & Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl bg-white p-6 border border-[#E6EAFA] shadow-xs">
            <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-[#F4F6FC]">
              <ShieldCheck className="h-5 w-5 text-[#8B5CF6]" strokeWidth={2.5} />
              <h2 className="text-base font-bold text-[#1D2A54]">Identity & Compliance Verification</h2>
            </div>
            <VerificationStatus />
          </div>

          <div className="rounded-3xl bg-white p-6 border border-red-100 shadow-xs">
            <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-red-50">
              <h2 className="text-base font-bold text-red-600">Danger Zone</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1D2A54]">Leave Workspace</h3>
                <p className="text-xs text-[#8F95B2] mt-1">
                  Leave your current workspace. You will lose access to all channels and business data.
                </p>
              </div>
              <button
                onClick={async () => {
                  if (confirm("Are you sure you want to leave this workspace?")) {
                    try {
                      const res = await WorkspaceService.leaveWorkspace(workspace?.id || "");
                      if (res.success) {
                        updateCurrentMode("PERSONAL");
                        window.location.href = "/chats";
                      } else {
                        alert("Failed to leave workspace");
                      }
                    } catch (e: any) {
                      console.error(e);
                      alert(e.response?.data?.error?.message || "Failed to leave workspace");
                    }
                  }
                }}
                className="rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
              >
                Leave Workspace
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Profile Summary */}
        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-6 border border-[#E6EAFA] shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#F4F6FC]">
              <div className="flex items-center gap-2.5">
                <Building2 className="h-5 w-5 text-[#3B58F5]" strokeWidth={2.5} />
                <h2 className="text-base font-bold text-[#1D2A54]">Company Details</h2>
              </div>
            </div>

            {profile ? (
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8F95B2]">Company Name</span>
                  <p className="font-extrabold text-[#1D2A54] mt-0.5">{profile.companyName}</p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8F95B2]">Category</span>
                  <p className="font-semibold text-[#3B58F5] mt-0.5">{profile.category}</p>
                </div>
                {profile.website && (
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8F95B2]">Website</span>
                    <p className="font-medium text-[#1D2A54] flex items-center gap-1.5 mt-0.5 truncate">
                      <Globe className="h-3.5 w-3.5 text-[#8F95B2]" />
                      <a href={profile.website} target="_blank" rel="noreferrer" className="hover:underline text-[#3B58F5]">
                        {profile.website}
                      </a>
                    </p>
                  </div>
                )}
                {profile.address && (
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8F95B2]">Address</span>
                    <p className="font-medium text-[#1D2A54] flex items-center gap-1.5 mt-0.5">
                      <MapPin className="h-3.5 w-3.5 text-[#8F95B2] shrink-0" />
                      {profile.address}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-[#8F95B2] italic">Loading profile details...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
