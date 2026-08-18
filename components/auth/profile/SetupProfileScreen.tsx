"use client";

import * as React from "react";
import { ChevronLeft, User, Camera, Info, X, Image as ImageIcon, Sparkles, Globe, ShieldCheck, ArrowRight, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import apiClient from "@/services/api.client";
import Link from "next/link";
import Image from "next/image";

export default function SetupProfileScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [gender, setGender] = React.useState<"MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY" | "">("");
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = React.useState(false);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
  
  const [isPending, startTransition] = React.useTransition();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const displayAvatarSrc = React.useMemo(() => {
    if (photoPreview) return photoPreview;
    if (gender === "MALE") return "/default-avatar-male.png";
    if (gender === "FEMALE") return "/default-avatar-female.png";
    return "/default-avatar.png";
  }, [photoPreview, gender]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
      setIsPhotoPickerOpen(false);
    }
  };

  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("capture", "environment");
      fileInputRef.current.click();
    }
  };

  const handleGalleryClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute("capture");
      fileInputRef.current.click();
    }
  };

  const handleRegister = () => {
    if (!firstName || !lastName) {
      toast.error("Please enter both First Name and Last Name");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("firstName", firstName.trim());
        formData.append("lastName", lastName.trim());
        if (gender) {
          formData.append("gender", gender);
        }

        if (fileInputRef.current?.files?.[0]) {
          const mediaForm = new FormData();
          mediaForm.append("file", fileInputRef.current.files[0]);
          const uploadRes = await apiClient.post("/media/upload", mediaForm);
          if (uploadRes.data?.success && uploadRes.data?.data?.key) {
            formData.append("profileImage", uploadRes.data.data.key);
          } else {
            toast.error("Failed to upload profile image");
            return;
          }
        }

        const res = await apiClient.patch("/user/profile/setup", formData, {
          headers: {
             "Content-Type": undefined
          }
        });
        
        if (res.data.success || res.status === 200 || res.status === 201) {
          toast.success("Profile updated successfully!");
          router.push("/chats");
        } else {
          toast.error(res.data?.message || "Failed to setup profile.");
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || err.message || "Network error. Please try again.");
      }
    });
  };

  const handleSkip = async () => {
    try {
      await apiClient.post("/user/profile/skip");
    } catch {
      // Ignore network failure on skip
    }
    router.push("/chats");
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] font-sans">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        onChange={handlePhotoUpload} 
        className="hidden" 
      />

      {/* Top Header Section */}
      <div className="flex flex-col items-center justify-center pt-16 pb-10 text-white px-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2 text-center">
          Set up your profile
        </h1>
        <p className="text-blue-100 font-medium text-center">
          Let others know who you are
        </p>
      </div>

      {/* Bottom White Section */}
      <div className="flex-1 rounded-t-[2.5rem] sm:rounded-t-[3.5rem] bg-white px-6 py-8 sm:px-12 flex flex-col items-center shadow-2xl relative">
        <div className="w-full max-w-[420px] flex-1 flex flex-col pt-2 sm:pt-4">

          {/* Avatar Section with dynamic cartoon preview */}
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <button 
                type="button"
                onClick={() => setIsPhotoPickerOpen(true)}
                className="flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center overflow-hidden rounded-full border-[5px] border-[#EEF2FF] bg-[#E2E8F0] transition-all hover:border-blue-100 shadow-md group-hover:scale-[1.02]"
              >
                <img 
                  src={displayAvatarSrc} 
                  alt="Profile preview" 
                  className="h-full w-full object-cover" 
                />
              </button>
              
              <button 
                type="button"
                onClick={() => setIsPhotoPickerOpen(true)}
                className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white bg-[#2563EB] shadow-md text-white transition-transform hover:scale-110 active:scale-95"
                title="Change Photo"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 pl-1">
                First Name
              </label>
              <input
                type="text"
                placeholder="Enter your first name"
                value={firstName}
                disabled={isPending}
                onChange={(e) => setFirstName(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-indigo-50 bg-[#EEF2FF] px-4 text-sm font-semibold text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-indigo-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 pl-1">
                Last Name
              </label>
              <input
                type="text"
                placeholder="Enter your last name"
                value={lastName}
                disabled={isPending}
                onChange={(e) => setLastName(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-indigo-50 bg-[#EEF2FF] px-4 text-sm font-semibold text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-indigo-100"
              />
            </div>

            {/* Optional Gender Selection */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between pl-1">
                <label className="text-xs font-bold text-slate-700">
                  Gender
                </label>
                <span className="text-[11px] font-medium text-slate-400">Optional</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setGender(gender === "MALE" ? "" : "MALE")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 h-10 rounded-xl border text-xs font-semibold transition-all",
                    gender === "MALE"
                      ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <span>👨</span>
                  <span>Male</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGender(gender === "FEMALE" ? "" : "FEMALE")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 h-10 rounded-xl border text-xs font-semibold transition-all",
                    gender === "FEMALE"
                      ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <span>👩</span>
                  <span>Female</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGender(gender === "PREFER_NOT_TO_SAY" ? "" : "PREFER_NOT_TO_SAY")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 h-10 rounded-xl border text-xs font-semibold transition-all",
                    gender === "PREFER_NOT_TO_SAY" || gender === "OTHER"
                      ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <span>✨</span>
                  <span>Other</span>
                </button>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-blue-50 bg-[#EEF2FF] p-3">
            <Info className="h-4 w-4 text-[#2563EB] shrink-0 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed text-[#2563EB]">
              Your name will be visible to your contacts. You can change your information or avatar anytime.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-auto space-y-3 pt-6 pb-4">
            <button
              type="button"
              onClick={handleRegister}
              disabled={!firstName || !lastName || isPending}
              className={cn(
                "w-full flex items-center justify-center gap-2 rounded-xl h-11 text-sm font-bold transition-all duration-200 shadow-sm",
                firstName && lastName && !isPending
                  ? "bg-[#2563EB] text-white hover:bg-blue-700 active:scale-[0.99]"
                  : "cursor-not-allowed bg-slate-100 text-slate-400"
              )}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </span>
              ) : (
                "Continue"
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors py-1"
              >
                Skip for now
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Photo Picker Modal / Dialog */}
      <AnimatePresence>
        {isPhotoPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPhotoPickerOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <h3 className="text-lg font-bold text-slate-800">Select Profile Picture</h3>
                <button 
                  onClick={() => setIsPhotoPickerOpen(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={handleCameraClick}
                  className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-blue-500/40 hover:bg-blue-50/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-[#2563EB]">
                    <Camera className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-sm text-slate-800">Take Photo</span>
                    <span className="block text-xs text-slate-500">Use device camera</span>
                  </div>
                </button>
                
                <button 
                  onClick={handleGalleryClick}
                  className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-blue-500/40 hover:bg-blue-50/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-sm text-slate-800">Choose from File / Gallery</span>
                    <span className="block text-xs text-slate-500">Upload existing image</span>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
