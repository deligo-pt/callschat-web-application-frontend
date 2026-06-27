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
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = React.useState(false);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
  
  const [isPending, startTransition] = React.useTransition();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

        if (fileInputRef.current?.files?.[0]) {
          formData.append("profileImage", fileInputRef.current.files[0]);
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

  return (
    <div className="flex min-h-screen w-full bg-[#F8FAFC] font-sans">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        onChange={handlePhotoUpload} 
        className="hidden" 
      />

      {/* Web Split-Screen Container */}
      <div className="flex w-full min-h-screen">
        
        {/* Left Brand Showcase Column */}
        <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between bg-gradient-to-br from-[#0A2540] via-[#102A63] to-[#1A62E8] p-12 text-white relative overflow-hidden">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-12 right-12 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

          {/* Top Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 relative z-10">
            <Image src="/call_chats_logo.png" height={56} width={56} alt="CallsChat Logo" priority className="drop-shadow-md" />
            <span className="text-2xl font-extrabold tracking-tight text-white">
              Calls<span className="text-[#1AC1F2]">Chat</span>
            </span>
          </Link>

          {/* Center Showcase Content */}
          <div className="my-auto max-w-lg relative z-10 space-y-8 py-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur-md border border-white/15 text-[#1AC1F2]">
              <Sparkles className="h-3.5 w-3.5" /> Almost There!
            </div>
            
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight">
              Customize your <br />
              <span className="bg-gradient-to-r from-blue-300 via-[#1AC1F2] to-indigo-200 bg-clip-text text-transparent">
                digital identity.
              </span>
            </h1>
            
            <p className="text-base text-blue-100/90 leading-relaxed font-normal">
              Set your name and avatar so colleagues, contacts, and friends can recognize you across encrypted channels and voice rooms.
            </p>

            <div className="grid grid-cols-1 gap-4 pt-4">
              <div className="flex items-center gap-3.5 rounded-2xl bg-white/5 p-4 backdrop-blur-sm border border-white/10">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-[#1AC1F2]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Full Privacy Control</h4>
                  <p className="text-xs text-blue-200/80">You control who sees your display photo in settings.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trust Badge */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/15 pt-6 text-xs text-blue-200/80">
            <span className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#1AC1F2]" /> End-to-end encrypted profile metadata
            </span>
            <span>© 2026 CallsChat LLC</span>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:w-7/12 xl:w-1/2 lg:px-20 xl:px-28 bg-white relative">
          
          <div className="absolute top-6 left-6 sm:left-12 flex items-center justify-between w-[calc(100%-3rem)] sm:w-[calc(100%-6rem)]">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-semibold text-[#102A63] hover:text-primary transition-colors">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            
            <div className="lg:hidden flex items-center gap-2">
              <Image src="/call_chats_logo.png" height={36} width={36} alt="Logo" />
              <span className="font-bold text-lg text-[#0A2540]">CallsChat</span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md space-y-8 my-auto pt-8">
            <div className="space-y-2 text-center sm:text-left">
              <h2 className="text-3xl font-extrabold tracking-tight text-[#0A2540]">
                Setup Profile
              </h2>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Add your personal details and an optional photo to get started with your new workspace.
              </p>
            </div>

            {/* Avatar Uploader Section */}
            <div className="flex flex-col items-center sm:items-start pt-2">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <button 
                    type="button"
                    onClick={() => setIsPhotoPickerOpen(true)}
                    className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-slate-100 bg-slate-50 transition-all group-hover:border-primary/20 shadow-md"
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="Profile preview" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-slate-400" strokeWidth={1.5} />
                    )}
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => setIsPhotoPickerOpen(true)}
                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary shadow-md text-white transition-transform hover:scale-110 active:scale-95"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">Profile Photo</h4>
                  <p className="text-xs text-slate-500 max-w-[200px]">We recommend a square image at least 400x400px.</p>
                  <button
                    type="button"
                    onClick={() => setIsPhotoPickerOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline pt-1"
                  >
                    <Upload className="h-3 w-3" /> Upload picture
                  </button>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-5 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#334155]">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alexander"
                  value={firstName}
                  disabled={isPending}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="flex h-14 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-base font-semibold text-slate-800 placeholder-slate-400 transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-slate-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#334155]">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pierce"
                  value={lastName}
                  disabled={isPending}
                  onChange={(e) => setLastName(e.target.value)}
                  className="flex h-14 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-base font-semibold text-slate-800 placeholder-slate-400 transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-slate-400"
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-xs font-medium leading-relaxed text-slate-600">
                Your display name is stored securely and can be updated anytime in your account settings.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <button
                type="button"
                onClick={handleRegister}
                disabled={!firstName || !lastName || isPending}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-xl h-14 text-base font-bold transition-all duration-200 shadow-md",
                  firstName && lastName && !isPending
                    ? "bg-primary text-white shadow-blue-500/25 hover:bg-primary/90 hover:shadow-lg active:scale-[0.99]"
                    : "cursor-not-allowed bg-slate-200 text-slate-400 shadow-none"
                )}
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving profile...
                  </span>
                ) : (
                  <>
                    Complete Setup & Enter Workspace <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => router.push("/chats")}
                  className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Skip for now →
                </button>
              </div>
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
                  className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-primary/40 hover:bg-blue-50/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Camera className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-sm text-slate-800">Take Photo</span>
                    <span className="block text-xs text-slate-500">Use device camera</span>
                  </div>
                </button>
                
                <button 
                  onClick={handleGalleryClick}
                  className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-primary/40 hover:bg-blue-50/50"
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
