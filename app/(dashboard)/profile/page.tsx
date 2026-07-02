"use client";

import React, { useEffect, useState, useTransition } from "react";
import { ArrowLeft, Camera, Loader2, MessageSquare, Edit2, UserCircle2, LogOut, Briefcase, User, RefreshCw, X, Building2, Globe, MapPin, Sparkles, Search, Star, ChevronRight, Send, Bell, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { BusinessService } from "@/services/business.service";
import SetupBusinessModal from "@/components/business/SetupBusinessModal";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

// Define the shape of the user profile from the API
interface UserProfileData {
  id: string;
  phone: string;
  email: string | null;
  accountType?: string;
  currentMode?: string;
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
  const { updateCurrentMode, currentMode } = useUser();
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

  // Business Mode & Switching State
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  const activeMode = currentMode || userData?.currentMode || (userData?.accountType === "BUSINESS" ? "BUSINESS" : "PERSONAL");

  const handleSwitchMode = async (targetMode: "PERSONAL" | "BUSINESS") => {
    setIsSwitchingMode(true);
    try {
      await BusinessService.switchMode(targetMode);
      updateCurrentMode(targetMode);
      setUserData((prev) => prev ? { ...prev, currentMode: targetMode } : null);
      toast.success(`Switched to ${targetMode === "BUSINESS" ? "Business" : "Personal"} Mode!`);
    } catch (err: any) {
      const status = err.response?.status;
      const errorMsg = err.response?.data?.message || err.response?.data?.error?.message || err.message || "";
      if (status === 403 || errorMsg.toLowerCase().includes("set up a business profile") || errorMsg.toLowerCase().includes("setup") || errorMsg.toLowerCase().includes("business profile")) {
        toast.info("Please set up your Business Profile first to switch to Business Mode.");
        setIsSetupModalOpen(true);
      } else {
        toast.error(errorMsg || "Failed to switch mode");
      }
    } finally {
      setIsSwitchingMode(false);
    }
  };

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
          if (data.data.currentMode) {
            updateCurrentMode(data.data.currentMode);
          }
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
      document.cookie = "accessToken=; path=/; max-age=0";
      toast.success("Logged out successfully");
      router.push("/login");
    }
  };

  return (
    <div className="flex h-full w-full bg-[#F8FAFC]">
      {/* Middle Column (Settings Menu) */}
      <div className="flex h-full w-full flex-col border-r border-[#E6EAFA] bg-white md:w-[350px] shrink-0 overflow-y-auto scrollbar-hide">
        {/* Header (Matching Image precisely) */}
        <div className="flex flex-col px-6 pt-8 pb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-[24px] font-bold tracking-tight text-[#2563EB]">Groups</h1>
            <div className="flex items-center gap-2">
              <Link href="/chats/favorites" className="relative flex items-center justify-center p-2 transition-colors hover:bg-slate-50 rounded-full">
                <Star className="h-5 w-5 fill-[#F59E0B] text-[#F59E0B]" />
              </Link>
              <NotificationDropdown />
            </div>
          </div>
          <div className="mt-4 relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="h-10 w-full rounded-full bg-[#EEF2FF] pl-10 pr-4 text-[13px] font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-transparent focus:border-blue-200 transition-all"
            />
          </div>
        </div>

        {/* User Summary */}
        <div className="flex flex-col items-center px-6 pt-4 pb-6">
          <div className="h-20 w-20 rounded-full bg-[#EEF2FF] flex items-center justify-center border border-[#E0E7FF] mb-3 overflow-hidden">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <UserCircle2 className="h-12 w-12 text-slate-400" strokeWidth={1.5} />
            )}
          </div>
          <h2 className="text-[16px] font-bold text-[#0F172A]">{formData.displayName || "User"}</h2>
          <p className="text-[12px] font-medium text-slate-500 mt-1">{formData.phone || "+111 xxx 2345"}</p>
          <div className="mt-2 rounded-full bg-[#EEF2FF] px-3 py-1 text-[10px] font-bold text-[#2563EB]">
            {activeMode === "BUSINESS" ? "Business" : "Personal"}
          </div>
        </div>

        {/* Menu Items */}
        <div className="px-6 pb-8 flex flex-col gap-6">
          {/* ACCOUNT */}
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Account</span>
            <div className="flex flex-col gap-1">
              <button className="flex items-center justify-between rounded-xl border border-blue-100 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF2FF] text-[#2563EB]">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[13px] font-bold text-[#0F172A]">Profile</span>
                    <span className="text-[11px] font-medium text-slate-500">Edit your information</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* PREFERENCES */}
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Preferences</span>
            <div className="flex flex-col gap-1">
              <button className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-500">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[13px] font-bold text-[#0F172A]">Language</span>
                    <span className="text-[11px] font-medium text-slate-500">English (US)</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              <button className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 hover:bg-slate-50 transition-colors mt-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-400">
                    <Send className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[13px] font-bold text-[#0F172A]">Invite</span>
                    <span className="text-[11px] font-medium text-slate-500">Invite a friend</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
              
              <button className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 hover:bg-slate-50 transition-colors mt-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-orange-400">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[13px] font-bold text-[#0F172A]">Notifications</span>
                    <span className="text-[11px] font-medium text-slate-500">Manage alerts</span>
                  </div>
                </div>
                {/* Toggle switch */}
                <div className="h-5 w-9 rounded-full bg-[#2563EB] relative cursor-pointer">
                  <div className="absolute right-1 top-1 h-3 w-3 rounded-full bg-white shadow-sm" />
                </div>
              </button>

              <button className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 hover:bg-slate-50 transition-colors mt-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 text-purple-400">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[13px] font-bold text-[#0F172A]">Business Dashboard</span>
                    <span className="text-[11px] font-medium text-slate-500">Analytical & insight</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* SECURITY */}
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Security</span>
            <div className="flex flex-col gap-1">
              <button className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-50 text-pink-400">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[13px] font-bold text-[#0F172A]">Disappearing Messages</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column (Edit Form) */}
      <div className="flex-1 flex flex-col items-center bg-white overflow-y-auto scrollbar-hide py-16">
        <div className="w-full max-w-[440px] flex flex-col px-6">
          {/* Avatar Edit */}
          <div className="flex flex-col items-center mb-10">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative flex h-[100px] w-[100px] cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[#EEF2FF] border border-[#E0E7FF] transition-transform hover:scale-105"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <UserCircle2 className="h-12 w-12 text-slate-400" strokeWidth={1.5} />
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 flex items-center gap-1.5 text-[12px] font-bold text-[#2563EB] hover:underline"
            >
              <Camera className="h-3.5 w-3.5" />
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
          <div className="flex flex-col gap-5 w-full">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#0F172A]">Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="h-[46px] w-full rounded-xl border border-transparent bg-[#F8FAFC] px-4 text-[13px] font-medium text-slate-800 focus:border-blue-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="User"
                />
                <Edit2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2563EB]" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#0F172A]">Phone</label>
              <input
                type="text"
                value={formData.phone}
                readOnly
                className="h-[46px] w-full rounded-xl border border-transparent bg-[#F8FAFC] px-4 text-[13px] font-medium text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#0F172A]">Email</label>
              <input
                type="email"
                value={formData.email || ""}
                readOnly
                placeholder="Not set"
                className="h-[46px] w-full rounded-xl border border-transparent bg-[#F8FAFC] px-4 text-[13px] font-medium text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={handleSaveProfile}
                disabled={isPending || isLoading}
                className="flex h-10 w-36 items-center justify-center rounded-full bg-[#2563EB] text-[13px] font-bold text-white shadow-sm hover:bg-blue-700 transition-all"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Change"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <SetupBusinessModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
      />
    </div>
  );
}
