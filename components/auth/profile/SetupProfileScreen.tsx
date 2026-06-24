"use client";

import * as React from "react";
import { ChevronLeft, User, Camera, Info, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import apiClient from "@/services/api.client";

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

        // Send 'profileImage' or 'avatar' as expected. Usually backend expects 'profileImage' based on previous code.
        // Prompt says "(e.g., avatar or profileImage)". Let's use 'profileImage' since it was there before.
        if (fileInputRef.current?.files?.[0]) {
          formData.append("profileImage", fileInputRef.current.files[0]);
        }

        const res = await apiClient.patch("/user/profile/setup", formData, {
          headers: {
             "Content-Type": undefined // Ensure browser sets the multipart boundary
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
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 sm:p-6">
      {/* Mobile constraint container */}
      <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-gradient-to-br from-[#4A72FF] to-[#1D3BB5] shadow-2xl sm:h-[851px] sm:w-[412px] sm:rounded-[2.5rem]">
        
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          onChange={handlePhotoUpload} 
          className="hidden" 
        />

        {/* Top Section (Blue Gradient) */}
        <div className="relative flex flex-col items-center justify-center pb-10 pt-20">
          {/* Back Button */}
          <button 
            onClick={() => router.back()}
            className="absolute left-6 top-16 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30"
          >
            <ChevronLeft className="mr-0.5 h-5 w-5 text-white" strokeWidth={2.5} />
          </button>

          <h1 className="mt-4 text-[26px] font-bold tracking-tight text-white">
            Set up your profile
          </h1>
          <p className="mt-2 text-[13px] font-medium text-white/80">
            Let others know who you are
          </p>
        </div>

        {/* Bottom Sheet Area */}
        <div className="relative flex flex-1 flex-col items-center rounded-t-[2.5rem] bg-white px-8 pt-8 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          
          {/* Avatar Uploader */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <button 
                onClick={() => setIsPhotoPickerOpen(true)}
                className="flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full border-2 border-[#E6EAFA] bg-[#F4F6FC] transition-transform hover:scale-105 active:scale-95"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-[#8F95B2]" strokeWidth={2} />
                )}
              </button>
              
              {/* Little Camera Badge */}
              <button 
                onClick={() => setIsPhotoPickerOpen(true)}
                className="absolute bottom-0 right-0 flex h-[28px] w-[28px] items-center justify-center rounded-full border-2 border-white bg-[#3B58F5] shadow-sm transition-transform hover:scale-110 active:scale-95"
              >
                <Camera className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
              </button>
            </div>
            <p className="mt-3 text-[11px] font-medium text-[#8F95B2]">
              Add profile photo (optional)
            </p>
          </div>

          {/* Form Fields */}
          <div className="mt-8 flex w-full flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-semibold text-[#1D2A54]">
                First Name
              </label>
              <input
                type="text"
                placeholder="Enter your first name"
                value={firstName}
                disabled={isPending}
                onChange={(e) => setFirstName(e.target.value)}
                className="flex h-[52px] w-full rounded-[1rem] border border-[#AEC0ED] bg-[#EEF2FB] px-4 text-[15px] font-semibold tracking-wide text-[#1D2A54] placeholder-[#A0A6C0] transition-colors focus:border-[#3B58F5] focus:outline-none hover:border-[#8E9FCD]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-semibold text-[#1D2A54]">
                Last Name
              </label>
              <input
                type="text"
                placeholder="Enter your last name"
                value={lastName}
                disabled={isPending}
                onChange={(e) => setLastName(e.target.value)}
                className="flex h-[52px] w-full rounded-[1rem] border border-[#AEC0ED] bg-[#EEF2FB] px-4 text-[15px] font-semibold tracking-wide text-[#1D2A54] placeholder-[#A0A6C0] transition-colors focus:border-[#3B58F5] focus:outline-none hover:border-[#8E9FCD]"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 flex w-full items-start gap-3 rounded-[1rem] border border-[#E6EAFA] bg-[#F4F7FE] p-4">
            <div className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border border-[#3B58F5] bg-transparent">
              <Info className="h-3 w-3 text-[#3B58F5]" strokeWidth={3} />
            </div>
            <p className="text-[11px] font-medium leading-[1.5] text-[#3B58F5]">
              Your name will be visible to your contacts. You can change it anytime in settings.
            </p>
          </div>

          <button
            onClick={handleRegister}
            disabled={!firstName || !lastName || isPending}
            className={cn(
              "mt-8 w-full rounded-[1rem] py-[18px] text-[15px] font-bold transition-all duration-300",
              firstName && lastName && !isPending
                ? "bg-[#3B58F5] text-white shadow-lg shadow-[#3B58F5]/25 hover:bg-[#2C48B8] active:scale-[0.98]" 
                : "cursor-not-allowed bg-[#B5C7FE] text-white"
            )}
          >
            {isPending ? "Creating account..." : "Continue"}
          </button>

          <div className="mt-auto pb-8 pt-6">
            <button
              onClick={() => router.push("/chats")}
              className="text-[14px] font-semibold text-[#8F95B2] hover:text-[#3B58F5] transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>

        {/* Photo Picker Bottom Sheet Overlay */}
        <AnimatePresence>
          {isPhotoPickerOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsPhotoPickerOpen(false)}
                className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm"
              />

              {/* Sheet */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute bottom-0 left-0 z-50 flex w-full flex-col rounded-t-[2.5rem] bg-[#1E274A] px-6 pb-12 pt-4 shadow-[0_-20px_50px_rgba(0,0,0,0.3)]"
              >
                {/* Drag Handle */}
                <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-white/20" />
                
                {/* Header */}
                <div className="relative mb-8 flex items-center justify-center">
                  <button 
                    onClick={() => setIsPhotoPickerOpen(false)}
                    className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                  >
                    <X className="h-4 w-4 text-white" strokeWidth={2.5} />
                  </button>
                  <h3 className="text-[17px] font-bold text-white">Profile picture</h3>
                </div>

                {/* Options */}
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={handleCameraClick}
                    className="flex w-full items-center gap-4 rounded-2xl px-4 py-4 transition-colors hover:bg-white/5 active:bg-white/10"
                  >
                    <Camera className="h-5 w-5 text-white" strokeWidth={2} />
                    <span className="text-[15px] font-semibold text-white">Camera</span>
                  </button>
                  
                  <button 
                    onClick={handleGalleryClick}
                    className="flex w-full items-center gap-4 rounded-2xl px-4 py-4 transition-colors hover:bg-white/5 active:bg-white/10"
                  >
                    <ImageIcon className="h-5 w-5 text-white" strokeWidth={2} />
                    <span className="text-[15px] font-semibold text-white">Gallery</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
