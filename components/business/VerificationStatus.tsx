"use client";

import React, { useEffect, useState, useCallback } from "react";
import { CheckCircle2, Clock, ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { VerificationForm } from "./VerificationForm";
import { BusinessService, BusinessProfileData } from "@/services/business.service";
import { useUser } from "@/context/UserContext";

interface VerificationStatusProps {
  className?: string;
}

export function VerificationStatus({ className }: VerificationStatusProps) {
  const { refetchBusinessProfile } = useUser();
  const [profile, setProfile] = useState<BusinessProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await BusinessService.getProfile();
      if (response && response.success) {
        setProfile(response.data);
        refetchBusinessProfile().catch(() => {});
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError("NO_PROFILE");
      } else {
        console.error("Failed to fetch business profile:", err);
        setError("FETCH_ERROR");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-[#E6EAFA] bg-white p-10 text-center shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6] mb-3" />
        <p className="text-sm font-semibold text-[#8F95B2]">Loading verification status...</p>
      </div>
    );
  }

  if (error === "NO_PROFILE" || !profile) {
    return (
      <Alert className="rounded-3xl border border-[#E6EAFA] bg-white p-6 shadow-sm">
        <ShieldAlert className="h-6 w-6 text-[#8F95B2]" />
        <div>
          <AlertTitle className="text-[#1D2A54]">Business Account Not Initialized</AlertTitle>
          <AlertDescription className="text-[#8F95B2]">
            Please set up your basic business profile information before submitting verification documents.
          </AlertDescription>
        </div>
      </Alert>
    );
  }

  const latestRequest = profile.verificationRequests && profile.verificationRequests.length > 0
    ? profile.verificationRequests[0]
    : null;

  // Case 1: Verified
  if (profile.isVerified || latestRequest?.status === "APPROVED") {
    return (
      <div className={className}>
        <Alert variant="success" className="rounded-3xl p-6 shadow-sm border-emerald-500/30 bg-emerald-50">
          <CheckCircle2 className="h-6 w-6 text-[#3B58F5]" strokeWidth={2.5} />
          <div>
            <AlertTitle className="text-[#1D2A54] flex items-center gap-2">
              Your business is verified
              <span className="inline-flex items-center gap-1 rounded-full bg-[#3B58F5]/10 px-2.5 py-0.5 text-[11px] font-extrabold text-[#3B58F5]">
                Verified Badge Active
              </span>
            </AlertTitle>
            <AlertDescription className="text-emerald-800 mt-1">
              Your organization has successfully passed identity and compliance checks. Your verified badge is displayed to clients across all communications.
            </AlertDescription>
          </div>
        </Alert>
      </div>
    );
  }

  // Case 2: Pending
  if (latestRequest?.status === "PENDING") {
    return (
      <div className={className}>
        <Alert variant="warning" className="rounded-3xl p-6 shadow-sm border-amber-500/30 bg-amber-50">
          <Clock className="h-6 w-6 text-amber-600" strokeWidth={2.5} />
          <div>
            <AlertTitle className="text-amber-950 font-bold">Verification Under Review</AlertTitle>
            <AlertDescription className="text-amber-800 mt-1">
              Your verification is currently under review by our administrative team. Document submitted on{" "}
              <span className="font-semibold">
                {new Date(latestRequest.submittedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              . Reviews typically complete within 24–48 business hours.
            </AlertDescription>
          </div>
        </Alert>
      </div>
    );
  }

  // Case 3: Rejected
  if (latestRequest?.status === "REJECTED") {
    return (
      <div className={`space-y-6 ${className}`}>
        <Alert variant="destructive" className="rounded-3xl p-6 shadow-sm">
          <ShieldAlert className="h-6 w-6 text-rose-600" strokeWidth={2.5} />
          <div>
            <AlertTitle className="text-rose-950 font-bold">Verification Application Rejected</AlertTitle>
            <AlertDescription className="text-rose-900 mt-1 leading-relaxed">
              Unfortunately, your previous verification submission did not meet our compliance verification criteria or the provided documentation was incomplete or unclear. Please review our guidelines and upload an updated document below.
            </AlertDescription>
          </div>
        </Alert>

        <VerificationForm onSuccess={fetchProfile} />
      </div>
    );
  }

  // Case 4: Unverified and no pending requests
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-[#1E1B4B] to-purple-950 p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-purple-300 backdrop-blur-md border border-white/10">
            <ShieldCheck className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="text-xl font-extrabold tracking-tight">Why verify your business?</h4>
            <p className="mt-2 text-sm text-purple-200 leading-relaxed max-w-2xl">
              Verification authenticates your business credibility on the platform. Verified accounts gain a distinctive blue checkmark badge, enhanced messaging throughput, and boosted trust during client interactions.
            </p>
          </div>
        </div>
      </div>

      <VerificationForm onSuccess={fetchProfile} />
    </div>
  );
}
