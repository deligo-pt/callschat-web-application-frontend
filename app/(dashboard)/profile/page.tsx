"use client";

import React, { useEffect, useState, useTransition } from "react";
import { ArrowLeft, Camera, Loader2, MessageSquare, Edit2, UserCircle2, LogOut, Briefcase, User, RefreshCw, X, Building2, Globe, MapPin, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [businessForm, setBusinessForm] = useState({
    companyName: "",
    category: "Technology",
    description: "",
    website: "",
    address: "",
  });

  const handleSwitchMode = async (targetMode: "PERSONAL" | "BUSINESS") => {
    setIsSwitchingMode(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${baseUrl}/business/switch-mode`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ mode: targetMode })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Switched to ${targetMode === "BUSINESS" ? "Business" : "Personal"} Mode!`);
        setUserData((prev) => prev ? { ...prev, currentMode: targetMode } : null);
      } else {
        if (res.status === 403 || data.error?.message?.toLowerCase().includes("set up a business profile") || data.message?.toLowerCase().includes("set up a business profile")) {
          toast.info("Please set up your Business Profile first to switch mode.");
          setShowBusinessModal(true);
        } else {
          toast.error(data.error?.message || data.message || "Failed to switch mode");
        }
      }
    } catch (err) {
      toast.error("Network error while switching mode");
    } finally {
      setIsSwitchingMode(false);
    }
  };

  const handleCreateBusinessProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessForm.companyName.trim()) {
      toast.error("Company Name is required");
      return;
    }
    setIsSwitchingMode(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${baseUrl}/business/setup`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(businessForm)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Business Profile created successfully! Switched to Business Mode.");
        setShowBusinessModal(false);
        setUserData((prev) => prev ? { ...prev, accountType: "BUSINESS", currentMode: "BUSINESS" } : null);
      } else {
        toast.error(data.error?.message || data.message || "Failed to set up business profile");
      }
    } catch (err) {
      toast.error("Network error while setting up business profile");
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
          <div className="flex items-center gap-2.5">
            <h1 className="text-[18px] font-bold">Profile</h1>
            {userData?.accountType && (
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-sm",
                userData.accountType === "BUSINESS" 
                  ? "bg-purple-500/30 text-purple-100 border border-purple-400/30" 
                  : "bg-white/20 text-blue-100 border border-white/20"
              )}>
                {userData.accountType === "BUSINESS" ? <Briefcase className="h-3 w-3" /> : <User className="h-3 w-3" />}
                {userData.accountType}
              </span>
            )}
          </div>
          
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

              {/* Account Interface Mode Segmented Card */}
              <div className="mt-6 w-full rounded-3xl border border-[#E6EAFA] bg-[#F4F6FC] p-4 shadow-sm">
                <div className="flex items-center justify-between px-1 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-extrabold text-[#1D2A54]">Active Interface Mode</span>
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Active" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#8F95B2]">
                    Type: <strong className="text-[#3B58F5] uppercase font-extrabold">{userData?.accountType || "PERSONAL"}</strong>
                  </span>
                </div>

                {/* Segmented Control */}
                <div className="relative flex w-full rounded-2xl bg-[#E6EAFA]/70 p-1.5 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if ((userData?.currentMode || userData?.accountType) !== "PERSONAL") {
                        handleSwitchMode("PERSONAL");
                      }
                    }}
                    disabled={isSwitchingMode}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold transition-all duration-200 cursor-pointer select-none",
                      (userData?.currentMode || userData?.accountType) !== "BUSINESS"
                        ? "bg-white text-[#3B58F5] shadow-md shadow-[#3B58F5]/10 scale-[1.01]"
                        : "text-[#64748B] hover:text-[#1E293B] hover:bg-white/40"
                    )}
                  >
                    {isSwitchingMode && (userData?.currentMode || userData?.accountType) !== "BUSINESS" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#3B58F5]" />
                    ) : (
                      <User className="h-4 w-4" strokeWidth={2.5} />
                    )}
                    Personal Mode
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if ((userData?.currentMode || userData?.accountType) !== "BUSINESS") {
                        handleSwitchMode("BUSINESS");
                      }
                    }}
                    disabled={isSwitchingMode}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold transition-all duration-200 cursor-pointer select-none",
                      (userData?.currentMode || userData?.accountType) === "BUSINESS"
                        ? "bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white shadow-md shadow-purple-500/25 scale-[1.01]"
                        : "text-[#64748B] hover:text-[#1E293B] hover:bg-white/40"
                    )}
                  >
                    {isSwitchingMode && (userData?.currentMode || userData?.accountType) === "BUSINESS" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      <Briefcase className="h-4 w-4" strokeWidth={2.5} />
                    )}
                    Business Mode
                  </button>
                </div>
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

      {/* Setup Business Profile Modal */}
      {showBusinessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl transition-all animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] p-6 text-white">
              <button
                onClick={() => setShowBusinessModal(false)}
                className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-[18px] font-bold">Create Business Profile</h3>
                  <p className="text-[13px] text-purple-100">Unlock professional features & tools</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateBusinessProfile} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[#1D2A54] flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-[#8B5CF6]" />
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={businessForm.companyName}
                  onChange={(e) => setBusinessForm({ ...businessForm, companyName: e.target.value })}
                  placeholder="e.g. Acme Corp"
                  className="h-[46px] w-full rounded-2xl border border-[#E6EAFA] bg-[#F4F6FC] px-4 text-[14px] font-semibold text-[#11142D] focus:border-[#8B5CF6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]/50 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[#1D2A54] flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#8B5CF6]" />
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={businessForm.category}
                  onChange={(e) => setBusinessForm({ ...businessForm, category: e.target.value })}
                  className="h-[46px] w-full rounded-2xl border border-[#E6EAFA] bg-[#F4F6FC] px-4 text-[14px] font-semibold text-[#11142D] focus:border-[#8B5CF6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]/50 transition-colors"
                >
                  <option value="Technology">Technology & Software</option>
                  <option value="Retail">Retail & E-commerce</option>
                  <option value="Healthcare">Healthcare & Wellness</option>
                  <option value="Consulting">Consulting & Agency</option>
                  <option value="Education">Education & Training</option>
                  <option value="Other">Other Business</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[#1D2A54] flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-[#8B5CF6]" />
                  Website (Optional)
                </label>
                <input
                  type="url"
                  value={businessForm.website}
                  onChange={(e) => setBusinessForm({ ...businessForm, website: e.target.value })}
                  placeholder="https://example.com"
                  className="h-[46px] w-full rounded-2xl border border-[#E6EAFA] bg-[#F4F6FC] px-4 text-[14px] font-semibold text-[#11142D] focus:border-[#8B5CF6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]/50 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[#1D2A54] flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#8B5CF6]" />
                  Address (Optional)
                </label>
                <input
                  type="text"
                  value={businessForm.address}
                  onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                  placeholder="City, Country or Street Address"
                  className="h-[46px] w-full rounded-2xl border border-[#E6EAFA] bg-[#F4F6FC] px-4 text-[14px] font-semibold text-[#11142D] focus:border-[#8B5CF6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]/50 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[#1D2A54]">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={businessForm.description}
                  onChange={(e) => setBusinessForm({ ...businessForm, description: e.target.value })}
                  placeholder="Briefly describe what your business does..."
                  className="w-full resize-none rounded-2xl border border-[#E6EAFA] bg-[#F4F6FC] p-3 text-[14px] font-semibold text-[#11142D] focus:border-[#8B5CF6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]/50 transition-colors"
                />
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowBusinessModal(false)}
                  className="flex-1 rounded-2xl border border-[#E6EAFA] bg-[#F4F6FC] py-3 text-[14px] font-bold text-[#8F95B2] hover:bg-[#E6EAFA] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSwitchingMode}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] py-3 text-[14px] font-bold text-white shadow-lg shadow-purple-500/25 hover:from-[#7C3AED] hover:to-[#5B21B6] transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isSwitchingMode ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Create & Switch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
