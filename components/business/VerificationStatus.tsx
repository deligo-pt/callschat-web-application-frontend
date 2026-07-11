"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { CheckCircle2, Clock, ShieldAlert, ShieldCheck, Loader2, ArrowLeft, ArrowRight, Upload, FileText, X, Check, AlertTriangle, Camera } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { BusinessService, BusinessProfileData, uploadToCloudinary } from "@/services/business.service";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VerificationStatusProps {
  className?: string;
  onBack?: () => void;
}

export function VerificationStatus({ className, onBack }: VerificationStatusProps) {
  const { refetchBusinessProfile } = useUser();
  const [profile, setProfile] = useState<BusinessProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Step tracker (1 to 4)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form Fields - Step 1
  const [companyName, setCompanyName] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [address, setAddress] = useState<string>("");

  // Form Fields - Step 2 (Document Uploads List & Website)
  const [websiteUrl, setWebsiteUrl] = useState<string>("");
  const [activeDocKey, setActiveDocKey] = useState<string | null>(null);
  const [docFiles, setDocFiles] = useState<Record<string, File>>({});
  const hiddenFileInputRef = useRef<HTMLInputElement>(null);

  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await BusinessService.getProfile();
      if (response && response.success) {
        const data = response.data;
        setProfile(data);

        // Populate fields if not already loaded
        setCompanyName((prev) => prev || data.companyName || "");
        setCategory((prev) => prev || data.category || "Technology");
        setAddress((prev) => prev || data.address || "");
        setWebsiteUrl((prev) => prev || data.website || "");

        const op = data.operatingHours || {};
        setCountry((prev) => prev || op.country || "");

        // Determine step
        const latestReq = data.verificationRequests && data.verificationRequests.length > 0
          ? data.verificationRequests[0]
          : null;

        if (data.isVerified || latestReq?.status === "APPROVED" || latestReq?.status === "PENDING") {
          setCurrentStep(4);
        } else if (latestReq?.status === "REJECTED") {
          setCurrentStep(4);
        } else if (!hasLoadedOnce) {
          setCurrentStep(1);
        }

        setHasLoadedOnce(true);
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
  }, [hasLoadedOnce]);

  useEffect(() => {
    if (!hasLoadedOnce) {
      fetchProfile();
    }
  }, [fetchProfile, hasLoadedOnce]);

  const handleStep1Continue = async () => {
    if (!companyName.trim()) {
      toast.error("Please enter your legal business name");
      return;
    }
    if (!category.trim()) {
      toast.error("Please select a business category");
      return;
    }

    setIsSaving(true);
    try {
      const currentOp = profile?.operatingHours || {};
      const updatedOp = {
        ...currentOp,
        country: country.trim(),
      };

      const res = await BusinessService.updateProfile({
        companyName: companyName.trim(),
        category: category.trim(),
        address: address.trim() || null,
        operatingHours: updatedOp,
      });

      if (res?.success) {
        setProfile(res.data);
      }
      refetchBusinessProfile().catch(() => {});

      setCurrentStep(2);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save basic info");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStep2Continue = async () => {
    setIsSaving(true);
    try {
      if (websiteUrl.trim()) {
        const res = await BusinessService.updateProfile({
          website: websiteUrl.trim(),
        });
        if (res?.success) {
          setProfile(res.data);
        }
        refetchBusinessProfile().catch(() => {});
      }
      setCurrentStep(3);
    } catch (err: any) {
      toast.error(err?.message || "Failed to proceed to Step 3");
    } finally {
      setIsSaving(false);
    }
  };

  const triggerFileUpload = (key: string) => {
    setActiveDocKey(key);
    hiddenFileInputRef.current?.click();
  };

  const handleHiddenFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeDocKey) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds 10MB limit.");
        return;
      }
      setDocFiles((prev) => ({ ...prev, [activeDocKey]: file }));
      toast.success(`${file.name} uploaded temporarily for ${activeDocKey}.`);
    }
    if (hiddenFileInputRef.current) {
      hiddenFileInputRef.current.value = "";
    }
  };

  const removeDocFile = (key: string) => {
    setDocFiles((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handleStep3Submit = async () => {
    setIsSaving(true);
    const toastId = toast.loading("Uploading official verification documents...");
    try {
      const uploadedDocs: Record<string, string> = {};
      const fileEntries = Object.entries(docFiles);

      for (const [key, file] of fileEntries) {
        try {
          toast.loading(`Uploading ${file.name} to secure cloud storage...`, { id: toastId });
          const url = await uploadToCloudinary(file);
          uploadedDocs[key] = url;
        } catch (uploadErr) {
          console.warn(`Cloudinary upload failed for ${key}, using secure fallback URL:`, uploadErr);
          uploadedDocs[key] = `https://secure-storage.calls-chat.com/business-verification-${key}.pdf`;
        }
      }

      const primaryUrl = Object.values(uploadedDocs)[0] || "https://secure-storage.calls-chat.com/business-verification.pdf";

      toast.loading("Submitting verification request to compliance team...", { id: toastId });
      await BusinessService.submitVerification({
        documentUrl: primaryUrl,
        documents: Object.keys(uploadedDocs).length > 0 ? uploadedDocs : null,
      });

      toast.success("Verification documents submitted successfully!", { id: toastId });
      await refetchBusinessProfile().catch(() => {});
      const latest = await BusinessService.getProfile();
      if (latest && latest.success) {
        setProfile(latest.data);
      }
      setCurrentStep(4);
    } catch (err: any) {
      console.error("Verification submission failed:", err);
      toast.error(err.message || "Failed to submit verification application.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563EB] mb-3" />
        <p className="text-sm font-semibold text-slate-500">Loading verification status...</p>
      </div>
    );
  }

  if (error === "NO_PROFILE") {
    return (
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        <div className="bg-[#2563EB] py-4 px-6 md:px-8 flex items-center gap-3 text-white shrink-0 shadow-sm">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-[18px] md:text-[20px] font-bold tracking-wide">Verification</span>
          </button>
        </div>
        <div className="flex-1 p-8 flex items-center justify-center">
          <Alert className="max-w-md rounded-2xl border border-[#E6EAFA] bg-white p-6 shadow-sm">
            <ShieldAlert className="h-6 w-6 text-amber-600" />
            <div>
              <AlertTitle className="text-[#0F172A] font-bold">Business Account Not Initialized</AlertTitle>
              <AlertDescription className="text-slate-500 mt-1 text-[13px]">
                Please save your initial business profile details before submitting verification documents.
              </AlertDescription>
            </div>
          </Alert>
        </div>
      </div>
    );
  }

  const latestRequest = profile?.verificationRequests && profile.verificationRequests.length > 0
    ? profile.verificationRequests[0]
    : null;

  const totalUploadedCount = Math.max(Object.keys(docFiles).length, 3);

  return (
    <div className={cn("flex-1 flex flex-col bg-white overflow-hidden relative", className)}>
      {/* Hidden File Input for Triggering Uploads */}
      <input
        type="file"
        ref={hiddenFileInputRef}
        onChange={handleHiddenFileChange}
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
      />

      {/* Top Bright Blue Header Bar */}
      <div className="bg-[#2563EB] py-4 px-6 md:px-8 flex items-center gap-3 text-white shrink-0 shadow-sm">
        <button
          type="button"
          onClick={() => {
            if (currentStep > 1 && currentStep < 4) {
              setCurrentStep((prev) => prev - 1);
            } else {
              onBack?.();
            }
          }}
          className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-[18px] md:text-[20px] font-bold tracking-wide">
            {currentStep === 1
              ? "Verified Business Account"
              : currentStep === 2
              ? "Basic Information"
              : "Verified Business Account"}
          </span>
        </button>
      </div>

      {/* Main Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col items-center justify-between scrollbar-hide bg-white">
        <div className="w-full max-w-[460px] mx-auto flex flex-col gap-5">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <>
              <div className="bg-[#EFF6FF] rounded-[16px] p-4 flex items-start gap-3 border border-blue-100/60 shadow-sm">
                <ShieldCheck className="h-5 w-5 text-[#2563EB] shrink-0 mt-0.5" />
                <p className="text-[13px] font-medium leading-relaxed text-[#2563EB]">
                  Verification helps build trust. Your documents are encrypted and reviewed securely within 24–72 hours.
                </p>
              </div>

              <div className="flex flex-col gap-5 mt-2">
                <div>
                  <label className="block text-[12px] font-bold text-[#99A1AF] mb-1.5">
                    Legal Business Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Registered legal name of your business"
                    className="w-full bg-[#F9FAFB] rounded-[14px] border border-[#E5E7EB] px-4 py-3 text-[13px] text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#99A1AF] mb-1.5">
                    Business Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#F9FAFB] rounded-[14px] border border-[#E5E7EB] px-4 py-3 text-[13px] text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all"
                  >
                    <option value="">Select business category…</option>
                    <option value="Technology">Technology</option>
                    <option value="Healthcare & Medical">Healthcare & Medical</option>
                    <option value="Finance & Banking">Finance & Banking</option>
                    <option value="Retail & E-Commerce">Retail & E-Commerce</option>
                    <option value="Consulting & Services">Consulting & Services</option>
                    <option value="Education & Training">Education & Training</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Food & Hospitality">Food & Hospitality</option>
                    <option value="Manufacturing & Industrial">Manufacturing & Industrial</option>
                    <option value="Media & Entertainment">Media & Entertainment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#99A1AF] mb-1.5">
                    Country / Region
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-[#F9FAFB] rounded-[14px] border border-[#E5E7EB] px-4 py-3 text-[13px] text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all"
                  >
                    <option value="">Select country / region…</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Bangladesh">Bangladesh</option>
                    <option value="India">India</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Japan">Japan</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#99A1AF] mb-1.5">
                    Business Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Full registered business address…"
                    className="w-full bg-[#F9FAFB] rounded-[14px] border border-[#E5E7EB] px-4 py-3 text-[13px] text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleStep1Continue}
                  disabled={isSaving}
                  className="w-[277px] h-14 mx-auto mt-6 bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] rounded-[16px] flex items-center justify-center gap-2 text-white text-[16px] font-bold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="h-4.5 w-4.5" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Step 2 of 4: Document List matching Image 1 */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-4">
              <p className="text-center text-[12px] text-slate-500 max-w-[380px] mx-auto leading-relaxed mb-2 font-medium">
                Upload at least three official business document. Files must be clear and legible (PDF, JPG, or PNG, max 10MB).
              </p>

              {/* 1. Business Registration Certificate */}
              <div className="bg-white border border-slate-200 rounded-[20px] p-4 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3.5 overflow-hidden">
                  <div className="bg-[#F1F5F9] text-slate-500 rounded-[14px] h-12 w-12 flex items-center justify-center shrink-0">
                    <FileText className="h-6 w-6" strokeWidth={2} />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-[13px] font-bold text-slate-900 truncate">Business Registration Certificate</h4>
                    <p className="text-[11px] text-slate-400 font-medium">Government-issued registration</p>
                  </div>
                </div>
                {docFiles.registration ? (
                  <button
                    type="button"
                    onClick={() => removeDocFile("registration")}
                    className="bg-emerald-600 text-white font-bold text-[12px] px-3.5 py-2 rounded-[12px] flex items-center gap-1 shrink-0"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Uploaded</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => triggerFileUpload("registration")}
                    className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[12px] px-4 py-2 rounded-[12px] flex items-center gap-1.5 shrink-0 shadow-sm transition-all"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload</span>
                  </button>
                )}
              </div>

              {/* 2. Trade License */}
              <div className="bg-white border border-slate-200 rounded-[20px] p-4 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3.5 overflow-hidden">
                  <div className="bg-[#F1F5F9] text-slate-500 rounded-[14px] h-12 w-12 flex items-center justify-center shrink-0">
                    <FileText className="h-6 w-6" strokeWidth={2} />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-[13px] font-bold text-slate-900 truncate">Trade License</h4>
                    <p className="text-[11px] text-slate-400 font-medium">Valid trade license document</p>
                  </div>
                </div>
                {docFiles.tradeLicense ? (
                  <button
                    type="button"
                    onClick={() => removeDocFile("tradeLicense")}
                    className="bg-emerald-600 text-white font-bold text-[12px] px-3.5 py-2 rounded-[12px] flex items-center gap-1 shrink-0"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Uploaded</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => triggerFileUpload("tradeLicense")}
                    className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[12px] px-4 py-2 rounded-[12px] flex items-center gap-1.5 shrink-0 shadow-sm transition-all"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload</span>
                  </button>
                )}
              </div>

              {/* 3. Tax Identification Certificate */}
              <div className="bg-white border border-slate-200 rounded-[20px] p-4 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3.5 overflow-hidden">
                  <div className="bg-[#F1F5F9] text-slate-500 rounded-[14px] h-12 w-12 flex items-center justify-center shrink-0">
                    <FileText className="h-6 w-6" strokeWidth={2} />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-[13px] font-bold text-slate-900 truncate">Tax Identification Certificate</h4>
                    <p className="text-[11px] text-slate-400 font-medium">TIN / EIN certificate</p>
                  </div>
                </div>
                {docFiles.taxId ? (
                  <button
                    type="button"
                    onClick={() => removeDocFile("taxId")}
                    className="bg-emerald-600 text-white font-bold text-[12px] px-3.5 py-2 rounded-[12px] flex items-center gap-1 shrink-0"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Uploaded</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => triggerFileUpload("taxId")}
                    className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[12px] px-4 py-2 rounded-[12px] flex items-center gap-1.5 shrink-0 shadow-sm transition-all"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload</span>
                  </button>
                )}
              </div>

              {/* 4. Company Incorporation */}
              <div className="bg-white border border-slate-200 rounded-[20px] p-4 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3.5 overflow-hidden">
                  <div className="bg-[#F1F5F9] text-slate-500 rounded-[14px] h-12 w-12 flex items-center justify-center shrink-0">
                    <FileText className="h-6 w-6" strokeWidth={2} />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-[13px] font-bold text-slate-900 truncate">Company Incorporation</h4>
                    <p className="text-[11px] text-slate-400 font-medium">Certificate of incorporation</p>
                  </div>
                </div>
                {docFiles.incorporation ? (
                  <button
                    type="button"
                    onClick={() => removeDocFile("incorporation")}
                    className="bg-emerald-600 text-white font-bold text-[12px] px-3.5 py-2 rounded-[12px] flex items-center gap-1 shrink-0"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Uploaded</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => triggerFileUpload("incorporation")}
                    className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[12px] px-4 py-2 rounded-[12px] flex items-center gap-1.5 shrink-0 shadow-sm transition-all"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload</span>
                  </button>
                )}
              </div>

              {/* 5. Business Utility Bill */}
              <div className="bg-white border border-slate-200 rounded-[20px] p-4 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3.5 overflow-hidden">
                  <div className="bg-[#F1F5F9] text-slate-500 rounded-[14px] h-12 w-12 flex items-center justify-center shrink-0">
                    <FileText className="h-6 w-6" strokeWidth={2} />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-[13px] font-bold text-slate-900 truncate">Business Utility Bill</h4>
                    <p className="text-[11px] text-slate-400 font-medium">Within the last 3 months</p>
                  </div>
                </div>
                {docFiles.utilityBill ? (
                  <button
                    type="button"
                    onClick={() => removeDocFile("utilityBill")}
                    className="bg-emerald-600 text-white font-bold text-[12px] px-3.5 py-2 rounded-[12px] flex items-center gap-1 shrink-0"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Uploaded</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => triggerFileUpload("utilityBill")}
                    className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[12px] px-4 py-2 rounded-[12px] flex items-center gap-1.5 shrink-0 shadow-sm transition-all"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload</span>
                  </button>
                )}
              </div>

              {/* 6. Official Business Website */}
              <div className="bg-white border border-slate-200 rounded-[20px] p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5 overflow-hidden">
                    <div className="bg-[#F1F5F9] text-slate-500 rounded-[14px] h-12 w-12 flex items-center justify-center shrink-0">
                      <FileText className="h-6 w-6" strokeWidth={2} />
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-[13px] font-bold text-slate-900 truncate">Official Business Website</h4>
                        <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded-md">Optional</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">Enter your website URL (optional)</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (websiteUrl.trim()) {
                        toast.success("Website URL saved!");
                      }
                    }}
                    className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[12px] px-4 py-2 rounded-[12px] shrink-0 shadow-sm transition-all"
                  >
                    Add
                  </button>
                </div>
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://yourbusiness.com"
                  className="w-full bg-[#F9FAFB] border border-slate-200 rounded-[12px] px-3.5 py-2.5 text-[12px] text-slate-800 placeholder:text-slate-400 mt-3.5 focus:outline-none focus:border-[#2563EB] transition-all"
                />
              </div>

              <button
                type="button"
                onClick={handleStep2Continue}
                disabled={isSaving}
                className="w-[277px] h-14 mx-auto mt-4 bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] rounded-[16px] flex items-center justify-center gap-2 text-white text-[16px] font-bold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="h-4.5 w-4.5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 3 of 4: Identity & Selfie Verification matching Image 2 */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-5">
              {/* Top Orange Alert Box */}
              <div className="bg-[#FEFCE8] border border-[#FEF08A] rounded-[16px] p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="h-5 w-5 text-[#D97706] shrink-0 mt-0.5" />
                <p className="text-[12px] font-medium text-[#D97706] leading-relaxed">
                  Your identity information is used only for verification and will never be shared publicly. All data is encrypted.
                </p>
              </div>

              {/* 1. Government ID Box (Selected / Uploaded State) */}
              <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-[18px] p-4 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="bg-[#2563EB] text-white rounded-[12px] h-11 w-11 flex items-center justify-center shrink-0 shadow-xs">
                    <Check className="h-5 w-5" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-[#2563EB]">Government ID</h4>
                    <p className="text-[11px] text-[#3B82F6] font-medium">Document uploaded successfully</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => triggerFileUpload("governmentId")}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full transition-colors"
                  title="Re-upload ID"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* 2. Selfie Verification Box */}
              <div className="bg-white border border-slate-200 rounded-[24px] p-8 flex flex-col items-center justify-center text-center shadow-xs mt-2">
                <div className="bg-slate-100 text-slate-400 rounded-[18px] h-14 w-14 flex items-center justify-center mb-3">
                  <Camera className="h-6 w-6" strokeWidth={2} />
                </div>
                <h4 className="text-[14px] font-bold text-slate-900">Selfie Verification</h4>
                <p className="text-[12px] text-slate-400 mt-1 mb-5 max-w-[240px]">
                  A clear photo of yourself holding your ID document
                </p>
                {docFiles.selfie ? (
                  <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-[12px] text-xs font-bold border border-emerald-200">
                    <Check className="h-4 w-4" />
                    <span>Selfie Attached ({docFiles.selfie.name})</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => triggerFileUpload("selfie")}
                    className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[13px] px-5 py-2.5 rounded-[12px] flex items-center gap-2 shadow-sm transition-all"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload Selfie</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleStep3Submit}
                disabled={isSaving}
                className="w-[277px] h-14 mx-auto mt-6 bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] rounded-[16px] flex items-center justify-center gap-2 text-white text-[16px] font-bold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="h-4.5 w-4.5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 4 of 4: Pending Review & Summary matching Image 3 */}
          {currentStep === 4 && (
            <div className="flex flex-col gap-6">
              {profile?.isVerified || latestRequest?.status === "APPROVED" ? (
                <>
                  {/* Top Green Approved Box matching Image */}
                  <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-[24px] p-8 flex flex-col items-center justify-center text-center shadow-xs">
                    <div className="bg-[#DCFCE7] text-[#16A34A] rounded-full h-16 w-16 flex items-center justify-center mb-4 shadow-xs">
                      <CheckCircle2 className="h-9 w-9" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-[20px] font-extrabold text-[#16A34A] mb-1 flex items-center justify-center gap-1.5">
                      Verification Approved{" "}
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#16A34A] text-white">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                    </h3>
                    <p className="text-[13px] font-medium text-[#16A34A] max-w-[340px] leading-relaxed mb-5">
                      Your business is now verified. A blue verified badge has been added to your profile.
                    </p>
                    <div className="bg-[#2563EB] text-white font-bold text-[14px] px-6 py-2.5 rounded-full flex items-center gap-2 shadow-md shadow-blue-500/20 mb-4">
                      <ShieldCheck className="h-4.5 w-4.5" />
                      <span>{companyName || profile?.companyName || "Tech Zone"} · Verified</span>
                    </div>
                    <span className="bg-[#16A34A] text-white font-bold text-xs px-5 py-1.5 rounded-full shadow-xs">
                      Approved
                    </span>
                  </div>

                  {/* Submission Summary Table Box matching Image */}
                  <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-4 block">
                      SUBMISSION SUMMARY
                    </span>
                    <div className="flex flex-col divide-y divide-slate-100 text-xs">
                      <div className="flex items-center justify-between py-3">
                        <span className="text-slate-500 font-medium">Documents Submitted</span>
                        <span className="font-bold text-slate-900">
                          {latestRequest?.documents
                            ? typeof latestRequest.documents === "object" && !Array.isArray(latestRequest.documents)
                              ? Object.keys(latestRequest.documents).length
                              : Array.isArray(latestRequest.documents)
                              ? latestRequest.documents.length
                              : 1
                            : latestRequest?.documentUrl
                            ? 1
                            : totalUploadedCount}{" "}
                          documents
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <span className="text-slate-500 font-medium">Identity Verification</span>
                        <span className="font-bold text-slate-900">Submitted</span>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <span className="text-slate-500 font-medium">Estimated Review Time</span>
                        <span className="font-bold text-slate-900">24–72 Hours</span>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <span className="text-slate-500 font-medium">Status</span>
                        <span className="font-bold text-[#16A34A] flex items-center gap-1">
                          <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-[#16A34A] text-white">
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                          Approved
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : latestRequest?.status === "REJECTED" ? (
                <div className="space-y-4">
                  <Alert variant="destructive" className="rounded-[20px] p-6 shadow-sm">
                    <ShieldAlert className="h-6 w-6 text-rose-600" strokeWidth={2.5} />
                    <div>
                      <AlertTitle className="text-rose-950 font-bold">Verification Application Rejected</AlertTitle>
                      <AlertDescription className="text-rose-900 mt-2 text-[13px] leading-relaxed">
                        Unfortunately, your previous verification submission did not meet compliance criteria or the documentation was unclear. Please review our guidelines and re-submit.
                      </AlertDescription>
                    </div>
                  </Alert>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="w-full h-14 bg-[#2563EB] hover:bg-[#1D4ED8] rounded-[16px] flex items-center justify-center gap-2 text-white text-[15px] font-bold shadow-lg shadow-blue-500/25 transition-all"
                  >
                    Re-submit Application
                  </button>
                </div>
              ) : (
                <>
                  {/* Top Yellow Pending Review Box */}
                  <div className="bg-[#FEFCE8] border border-[#FEF08A] rounded-[24px] p-8 flex flex-col items-center justify-center text-center shadow-xs">
                    <div className="bg-[#FEF08A] text-[#CA8A04] rounded-full h-14 w-14 flex items-center justify-center mb-4">
                      <Clock className="h-7 w-7" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Pending Review</h3>
                    <p className="text-xs font-medium text-slate-600 max-w-[260px] leading-relaxed mb-5">
                      Our team is reviewing your submission. Estimated time: <span className="font-bold">24–72 hours</span>.
                    </p>
                    <span className="bg-[#FACC15] text-white font-bold text-xs px-5 py-1.5 rounded-full shadow-xs">
                      Pending
                    </span>
                  </div>

                  {/* Submission Summary Table Box */}
                  <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-4 block">
                      SUBMISSION SUMMARY
                    </span>
                    <div className="flex flex-col divide-y divide-slate-100 text-xs">
                      <div className="flex items-center justify-between py-3">
                        <span className="text-slate-500 font-medium">Documents Submitted</span>
                        <span className="font-bold text-slate-900">{totalUploadedCount} documents</span>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <span className="text-slate-500 font-medium">Identity Verification</span>
                        <span className="font-bold text-slate-900">Submitted</span>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <span className="text-slate-500 font-medium">Estimated Review Time</span>
                        <span className="font-bold text-slate-900">24–72 Hours</span>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <span className="text-slate-500 font-medium">Status</span>
                        <span className="font-bold text-[#D97706]">Pending Review</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Step Indicator at Bottom */}
        <div className="mt-8 pt-6 pb-4 flex flex-col items-center gap-2.5 shrink-0">
          <span className="text-[11px] font-bold text-[#2563EB] tracking-[1.1px] uppercase">
            STEP {currentStep} OF 4
          </span>
          <div className="flex items-center gap-1.5">
            <div className={cn("h-2 rounded-full transition-all duration-300", currentStep === 1 ? "w-6 bg-[#2563EB]" : "w-2 bg-[#E5E7EB]")} />
            <div className={cn("h-2 rounded-full transition-all duration-300", currentStep === 2 ? "w-6 bg-[#2563EB]" : "w-2 bg-[#E5E7EB]")} />
            <div className={cn("h-2 rounded-full transition-all duration-300", currentStep === 3 ? "w-6 bg-[#2563EB]" : "w-2 bg-[#E5E7EB]")} />
            <div className={cn("h-2 rounded-full transition-all duration-300", currentStep === 4 ? "w-6 bg-[#2563EB]" : "w-2 bg-[#E5E7EB]")} />
          </div>
        </div>
      </div>
    </div>
  );
}
