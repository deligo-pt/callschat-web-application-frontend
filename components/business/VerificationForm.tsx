"use client";

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { Upload, FileText, CheckCircle2, Loader2, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { uploadToCloudinary, BusinessService } from "@/services/business.service";
import { cn } from "@/lib/utils";

interface VerificationFormProps {
  onSuccess?: () => void;
  className?: string;
}

interface FormValues {
  document: File | null;
}

export function VerificationForm({ onSuccess, className }: VerificationFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { handleSubmit, setValue } = useForm<FormValues>({
    defaultValues: {
      document: null,
    },
  });

  const handleFileSelect = (file: File) => {
    // Validate file type (Images or PDF)
    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload a JPG, PNG, WEBP, or PDF document.");
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit.");
      return;
    }

    setSelectedFile(file);
    setValue("document", file);
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
    setValue("document", null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async () => {
    if (!selectedFile) {
      toast.error("Please select a document to upload.");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Uploading official document to secure cloud storage...");

    try {
      // Step 1: Upload to Cloudinary
      const secureUrl = await uploadToCloudinary(selectedFile);
      
      toast.loading("Submitting verification request to compliance server...", { id: toastId });

      // Step 2: Submit to backend API
      await BusinessService.submitVerification({ documentUrl: secureUrl });

      toast.success("Verification document submitted successfully! Our administrative team will review it shortly.", { id: toastId });
      removeFile();
      onSuccess?.();
    } catch (error: any) {
      console.error("Verification submission failed:", error);
      toast.error(error.message || "Failed to submit verification document. Please try again.", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn("space-y-6 rounded-3xl bg-white p-6 md:p-8 border border-[#E6EAFA] shadow-sm", className)}>
      <div>
        <h3 className="text-lg font-bold text-[#1D2A54]">Upload Verification Document</h3>
        <p className="mt-1 text-sm text-[#8F95B2]">
          Please upload your official Business Registration Certificate, Tax Identification Document, or Articles of Incorporation (JPG, PNG, or PDF up to 10MB).
        </p>
      </div>

      {/* Upload Zone */}
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
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md text-[#8B5CF6] group-hover:scale-110 transition-transform mb-4 border border-[#E6EAFA]">
            <Upload className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold text-[#1D2A54]">
            Click to upload <span className="font-normal text-[#8F95B2]">or drag and drop</span>
          </span>
          <span className="mt-1 text-xs text-[#8F95B2] font-medium">
            Supported formats: PDF, PNG, JPG or WEBP (Max 10MB)
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
            disabled={isUploading}
            className="rounded-full p-2 text-[#8F95B2] hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
            title="Remove file"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Info Notice */}
      <div className="flex items-start gap-3 rounded-xl bg-blue-50/60 p-3.5 border border-blue-100 text-blue-800 text-xs">
        <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed font-medium">
          Documents are encrypted and stored in secure cloud infrastructure. Only verified administrative staff have access to review compliance materials.
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!selectedFile || isUploading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#8B5CF6] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition-all hover:bg-[#7C3AED] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing Document...
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Submit Document for Verification
          </>
        )}
      </button>
    </form>
  );
}
