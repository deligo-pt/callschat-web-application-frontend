"use client";

import React, { useEffect, useState, useTransition } from "react";
import { ArrowLeft, Camera, Loader2, MessageSquare, Edit2, UserCircle2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Define the shape of the user profile from the API
interface UserProfileData {
  id: string;
  phone: string;
  email: string | null;
  profile: {
    displayName: string;
    username: string;
    bio: string | null;
    avatarUrl: string | null;
    country: string | null;
    timezone: string;
    language: string;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  
  // State for form fields
  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [formData, setFormData] = useState({
    displayName: "",
    username: "",
    email: "", // read-only from root usually, but keeping for display
    phone: "", // read-only
    bio: "",
    country: "",
    timezone: "UTC",
    language: "en",
  });
  
  // Avatar handling
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch initial profile data
  useEffect(() => {
    async function fetchProfile() {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.push("/login");
          return;
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1";
        const res = await fetch(`${baseUrl}/user/profile`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        const data = await res.json();
        if (data.success && data.data) {
          setUserData(data.data);
          setFormData({
            displayName: data.data.profile.displayName || "",
            username: data.data.profile.username || "",
            email: data.data.email || "",
            phone: data.data.phone || "",
            bio: data.data.profile.bio || "",
            country: data.data.profile.country || "",
            timezone: data.data.profile.timezone || "UTC",
            language: data.data.profile.language || "en",
          });
          if (data.data.profile.avatarUrl) {
            setAvatarPreview(data.data.profile.avatarUrl);
          }
        } else {
          toast.error("Failed to load profile data");
        }
      } catch (error) {
        toast.error("Network error while fetching profile");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchProfile();
  }, [router]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      setAvatarFile(file);
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  };

  const handleSaveProfile = () => {
    startTransition(async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1";
        
        // Build FormData
        const submitData = new FormData();
        if (formData.displayName) submitData.append("displayName", formData.displayName);
        if (formData.username) submitData.append("username", formData.username);
        if (formData.bio) submitData.append("bio", formData.bio);
        if (formData.country) submitData.append("country", formData.country);
        if (formData.timezone) submitData.append("timezone", formData.timezone);
        if (formData.language) submitData.append("language", formData.language);
        if (avatarFile) submitData.append("avatar", avatarFile);

        const res = await fetch(`${baseUrl}/user/profile`, {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${token}`
            // Note: Do NOT set Content-Type for FormData, the browser sets it with the boundary automatically
          },
          body: submitData
        });

        const data = await res.json();
        
        if (data.success || res.ok) {
          toast.success("Profile updated successfully!");
        } else {
          toast.error(data.message || "Failed to update profile");
        }
      } catch (error) {
        toast.error("Network error while updating profile");
      }
    });
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");
      
      if (!token) {
        router.push("/login");
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1";
      
      // Attempt to call logout API, but don't block local logout on failure
      if (refreshToken) {
        await fetch(`${baseUrl}/auth/logout`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ refreshToken })
        }).catch(err => console.error("Logout API error:", err));
      }
      
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      // Always clear local session
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      toast.success("Logged out successfully");
      router.push("/login");
    }
  };

  return (
    <div className="flex h-full w-full bg-[#F8FAFC]">
      
      {/* Left Panel - Profile View */}
      <div className="flex h-full w-full flex-col border-r border-[#E6EAFA] bg-white md:w-[400px] shrink-0">
        
        {/* Header */}
        <div className="flex items-center gap-4 bg-[#3B58F5] px-6 py-5 text-white shadow-md z-10">
          <button 
            onClick={() => router.push("/chats")}
            className="rounded-full p-1.5 transition-colors hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <h1 className="text-[18px] font-bold">Profile</h1>
          
          <button 
             onClick={handleLogout}
             className="ml-auto rounded-full p-1.5 transition-colors hover:bg-red-500/80 text-red-100 hover:text-white flex items-center justify-center bg-red-500/20"
             title="Logout"
          >
             <LogOut className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#3B58F5]" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="flex flex-col items-center px-6 py-8">
              
              {/* Avatar Section */}
              <div className="flex flex-col items-center">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-[#EEF2FB] bg-[#F4F6FC] transition-transform hover:scale-105 shadow-sm"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <UserCircle2 className="h-14 w-14 text-[#A0A6C0]" strokeWidth={1.5} />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 flex items-center gap-1.5 text-[13px] font-bold text-[#3B58F5] hover:underline"
                >
                  <Camera className="h-4 w-4" />
                  Picture
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/jpeg,image/png,image/webp" 
                  className="hidden" 
                />
              </div>

              {/* Form Fields */}
              <div className="mt-8 flex w-full flex-col gap-5">
                
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-[#1D2A54]">Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="h-[48px] w-full rounded-2xl border border-[#E6EAFA] bg-[#F4F6FC] px-4 text-[14px] font-semibold text-[#11142D] focus:border-[#3B58F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#3B58F5]/50 transition-colors"
                      placeholder="Your display name"
                    />
                    <Edit2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3B58F5]" />
                  </div>
                </div>

                {/* Username */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-[#1D2A54]">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="h-[48px] w-full rounded-2xl border border-[#E6EAFA] bg-[#F4F6FC] px-4 text-[14px] font-semibold text-[#11142D] focus:border-[#3B58F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#3B58F5]/50 transition-colors"
                    placeholder="@username"
                  />
                </div>

                {/* Bio */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-[#1D2A54]">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-[#E6EAFA] bg-[#F4F6FC] p-4 text-[14px] font-semibold text-[#11142D] focus:border-[#3B58F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#3B58F5]/50 transition-colors"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {/* Phone (Read Only) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-[#1D2A54]">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    readOnly
                    className="h-[48px] w-full rounded-2xl border border-[#E6EAFA] bg-[#F4F6FC] px-4 text-[14px] font-semibold text-[#8F95B2] cursor-not-allowed"
                  />
                </div>

                {/* Email (Read Only - placeholder) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-[#1D2A54]">Email</label>
                  <input
                    type="email"
                    value={formData.email || ""}
                    readOnly
                    placeholder="Not set"
                    className="h-[48px] w-full rounded-2xl border border-[#E6EAFA] bg-[#F4F6FC] px-4 text-[14px] font-semibold text-[#8F95B2] cursor-not-allowed"
                  />
                </div>

                {/* Additional Settings Group */}
                <div className="mt-2 flex gap-4">
                  <div className="flex flex-1 flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-[#1D2A54]">Country</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="h-[48px] w-full rounded-2xl border border-[#E6EAFA] bg-[#F4F6FC] px-4 text-[14px] font-semibold text-[#11142D] focus:border-[#3B58F5] focus:bg-white focus:outline-none"
                      placeholder="e.g. US"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-[#1D2A54]">Language</label>
                    <input
                      type="text"
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="h-[48px] w-full rounded-2xl border border-[#E6EAFA] bg-[#F4F6FC] px-4 text-[14px] font-semibold text-[#11142D] focus:border-[#3B58F5] focus:bg-white focus:outline-none"
                      placeholder="e.g. en"
                    />
                  </div>
                </div>

              </div>
              
              {/* Spacer for bottom padding */}
              <div className="h-8" />
            </div>
          </div>
        )}

        {/* Fixed Save Button Area */}
        <div className="border-t border-[#E6EAFA] bg-white p-6 pb-28 md:pb-6 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <button
            onClick={handleSaveProfile}
            disabled={isPending || isLoading}
            className={cn(
              "flex h-[52px] w-full items-center justify-center rounded-2xl text-[15px] font-bold text-white transition-all",
              isPending || isLoading 
                ? "bg-[#B5C7FE] cursor-not-allowed" 
                : "bg-[#3B58F5] hover:bg-[#2C48B8] shadow-lg shadow-[#3B58F5]/25 active:scale-[0.98]"
            )}
          >
            {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Change"}
          </button>
        </div>
      </div>

      {/* Right Panel - Empty State (Desktop Only) */}
      <div className="hidden flex-1 flex-col items-center justify-center bg-[#F8FAFC] md:flex relative overflow-hidden">
        {/* Background abstract shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-gradient-to-br from-[#4A72FF]/5 to-[#1D3BB5]/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-80 w-80 rounded-full bg-gradient-to-tr from-[#3B58F5]/5 to-transparent blur-2xl" />
        
        <div className="flex flex-col items-center text-center p-8 z-10">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl shadow-blue-500/5 mb-6">
            <MessageSquare className="h-10 w-10 text-[#3B58F5]" strokeWidth={1.5} />
          </div>
          <h2 className="text-[24px] font-bold text-[#1D2A54]">CallsChat for Web</h2>
          <p className="mt-3 text-[15px] font-medium text-[#8F95B2] max-w-md leading-relaxed">
            Update your profile details on the left. Changes will instantly sync across all your devices using our real-time database.
          </p>
          
          <div className="mt-10 flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-[13px] font-bold text-green-600">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            End-to-End Encrypted
          </div>
        </div>
      </div>

    </div>
  );
}
