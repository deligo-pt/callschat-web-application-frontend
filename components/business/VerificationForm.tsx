"use client";

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import {
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  X,
  AlertCircle,
  Shield,
  CreditCard,
  Building2,
  FileCheck2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  VerificationService,
  VerificationTargetType,
} from "@/services/verification.service";

export interface VerificationFormProps {
  /** Target of verification: individual identity or business entity */
  targetType?: VerificationTargetType;
  /** Whether submitting fresh documents or updating existing/rejected request */
  mode?: "submit" | "update";
  /** Optional request ID for explicit update targeting */
  requestId?: string;
  /** Initial selected document type */
  initialIdType?: string;
  /** Initial document serial or registration number */
  initialIdNumber?: string;
  /** Callback fired upon successful verification submission */
  onSuccess?: () => void;
  /** Optional cancel callback when rendered in modal or expandable panel */
  onCancel?: () => void;
  /** Additional container styling */
  className?: string;
}

interface FormValues {
  idType: string;
  idNumber: string;
}

const USER_ID_OPTIONS = [
  { value: "NATIONAL_ID", label: "National ID Card (NID)", hint: "Government-issued national identity card" },
  { value: "PASSPORT", label: "International Passport", hint: "Valid travel passport photo & signature page" },
  { value: "DRIVING_LICENSE", label: "Driver's License", hint: "Official state or national motor vehicle license" },
];

const BUSINESS_ID_OPTIONS = [
  { value: "TRADE_LICENSE", label: "Trade License / Registration Certificate", hint: "Government issued commercial trade license" },
  { value: "TAX_CERTIFICATE", label: "Tax Identification Certificate (TIN / VAT)", hint: "Official corporate tax registration document" },
  { value: "ARTICLES_OF_INCORPORATION", label: "Articles of Incorporation / MoA", hint: "Corporate bylaws or registration charter" },
  { value: "OTHER", label: "Other Official Compliance Document", hint: "Any certified legal business document" },
];

export function VerificationForm({
  targetType = "BUSINESS_ENTITY",
  mode = "submit",
  requestId,
  initialIdType,
  initialIdNumber = "",
  onSuccess,
  onCancel,
  className,
}: VerificationFormProps) {
  const isUserIdentity = targetType === "USER_IDENTITY";
  const idOptions = isUserIdentity ? USER_ID_OPTIONS : BUSINESS_ID_OPTIONS;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultIdType = initialIdType || (isUserIdentity ? "NATIONAL_ID" : "TRADE_LICENSE");

  const { register, handleSubmit, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      idType: defaultIdType,
      idNumber: initialIdNumber,
    },
  });

  const currentIdType = watch("idType");

  const handleFileSelect = (file: File) => {
    // Validate file type (Images or PDF)
    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast.error("Unsupported format. Please upload a JPEG, PNG, WEBP, or PDF file.");
      return;
    }

    // Validate size (max 15MB to match backend limit)
    if (file.size > 15 * 1024 * 1024) {
      toast.error("File size exceeds 15MB limit.");
      return;
    }

    setSelectedFile(file);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const onSubmit = async (values: FormValues) => {
    if (!selectedFile) {
      toast.error("Please attach a valid identification document to submit.");
      return;
    }

    setIsSubmitting(true);
    const actionLabel = mode === "update" ? "Updating verification documents..." : "Encrypting and submitting documents...";
    const toastId = toast.loading(actionLabel);

    try {
      const formData = new FormData();
      formData.append("targetType", targetType);
      formData.append("idType", values.idType);
      if (values.idNumber && values.idNumber.trim()) {
        formData.append("idNumber", values.idNumber.trim());
      }
      if (mode === "update" && requestId) {
        formData.append("requestId", requestId);
      }
      formData.append("document", selectedFile);

      if (mode === "update") {
        await VerificationService.update(formData);
        toast.success("Verification documents updated successfully! Your application is now queued for re-review.", {
          id: toastId,
        });
      } else {
        await VerificationService.submit(formData);
        toast.success("Verification submitted successfully! Our compliance team will review your application.", {
          id: toastId,
        });
      }

      removeFile();
      onSuccess?.();
    } catch (error: any) {
      console.error("Verification form submission error:", error);
      const backendMessage =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to submit verification document. Please try again.";
      toast.error(backendMessage, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn(
        "space-y-6 rounded-3xl bg-white p-6 md:p-8 border border-[#E6EAFA] shadow-xs transition-all",
        className
      )}
    >
      {/* Header Info */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            {isUserIdentity ? (
              <Shield className="h-5 w-5 text-indigo-600" />
            ) : (
              <Building2 className="h-5 w-5 text-purple-600" />
            )}
            <h3 className="text-lg font-bold text-[#1D2A54]">
              {mode === "update"
                ? `Update ${isUserIdentity ? "Identity" : "Business"} Verification`
                : `Submit ${isUserIdentity ? "Identity (KYC)" : "Business (KYB)"} Documents`}
            </h3>
          </div>
          <p className="text-xs md:text-sm text-[#8F95B2] leading-relaxed">
            {isUserIdentity
              ? "Upload a government-issued photo ID to unlock verified badge status and elevated caller trust."
              : "Upload official legal credentials to register your business enterprise and earn a verified green checkmark."}
          </p>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* ID Type Selection */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[#1D2A54] uppercase tracking-wider">
          Select Document Type <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {idOptions.map((opt) => {
            const isSelected = currentIdType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setValue("idType", opt.value)}
                className={cn(
                  "flex flex-col text-left p-3.5 rounded-2xl border transition-all text-xs",
                  isSelected
                    ? "border-[#8B5CF6] bg-purple-50/60 ring-2 ring-purple-500/20 shadow-xs"
                    : "border-[#E6EAFA] bg-[#F8FAFC] hover:border-[#D1D8F5] hover:bg-gray-50 text-[#1D2A54]"
                )}
              >
                <div className="flex items-center justify-between font-bold text-sm mb-1 text-[#1D2A54]">
                  <span>{opt.label}</span>
                  {isSelected && <FileCheck2 className="h-4 w-4 text-[#8B5CF6] shrink-0" />}
                </div>
                <span className="text-[11px] text-[#8F95B2] leading-normal">{opt.hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Document Identification Number */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#1D2A54] uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-[#8F95B2]" />
            Document ID / Registration Number
          </label>
          <span className="text-[11px] text-[#8F95B2]">Optional / Confidential</span>
        </div>
        <input
          type="text"
          {...register("idNumber")}
          placeholder={
            isUserIdentity
              ? "e.g. 1990123456789 or A01234567"
              : "e.g. TRAD/DNCC/012345/2026 or TIN-9876543210"
          }
          className="w-full rounded-xl border border-[#E6EAFA] bg-[#F8FAFC] px-4 py-3 text-sm text-[#1D2A54] placeholder-[#A0A7C2] focus:border-[#8B5CF6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
        />
      </div>

      {/* File Upload Zone */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[#1D2A54] uppercase tracking-wider">
          Upload Document File <span className="text-red-500">*</span>
        </label>

        {!selectedFile ? (
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 group",
              isDragging
                ? "border-[#8B5CF6] bg-purple-50/50 scale-[0.99]"
                : "border-[#D1D8F5] hover:border-[#8B5CF6] bg-[#F8FAFC] hover:bg-purple-50/20"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md text-[#8B5CF6] group-hover:scale-110 transition-transform mb-3 border border-[#E6EAFA]">
              <Upload className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold text-[#1D2A54]">
              Click to select document <span className="font-normal text-[#8F95B2]">or drag and drop</span>
            </span>
            <span className="mt-1 text-xs text-[#8F95B2] font-medium">
              Supported formats: JPEG, PNG, WEBP or PDF (Max 15MB)
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-2xl border border-[#E6EAFA] bg-[#F8FAFC] p-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-[#8B5CF6]">
                <FileText className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-[#1D2A54] truncate">{selectedFile.name}</p>
                <p className="text-xs font-semibold text-[#8F95B2]">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={removeFile}
              disabled={isSubmitting}
              className="rounded-full p-2 text-[#8F95B2] hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
              title="Remove file"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-200/80 text-slate-700 text-xs">
        <AlertCircle className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed font-medium">
          Uploaded verification files are strongly encrypted at rest using AES-256-GCM in our isolated compliance vault.
          Only authenticated administrative compliance officers can access these records for legal identity verification.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-[#E6EAFA] bg-white text-sm font-bold text-[#1D2A54] hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!selectedFile || isSubmitting}
          className="flex-1 w-full flex items-center justify-center gap-2 rounded-2xl bg-[#8B5CF6] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition-all hover:bg-[#7C3AED] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {mode === "update" ? "Updating Application..." : "Encrypting & Submitting..."}
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              {mode === "update" ? "Update Document & Resubmit" : "Submit Document for Verification"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default VerificationForm;
