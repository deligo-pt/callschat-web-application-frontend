"use client";

import React, { useEffect, useState, useTransition } from "react";
import { ArrowLeft, Camera, Loader2, MessageSquare, Edit2, UserCircle2, LogOut, Briefcase, User, RefreshCw, X, Building2, Globe, MapPin, Sparkles, Search, Star, ChevronRight, Send, Bell, Clock, ShieldCheck, AtSign, CreditCard, UserPlus, Copy, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { useTranslations, useLocale } from "next-intl";
import { LanguageSelector } from "@/components/i18n/LanguageSelector";
import { InviteFriends } from "@/components/profile/InviteFriends";
import { DisappearingMessages } from "@/components/profile/DisappearingMessages";
import { BusinessDashboard } from "@/components/profile/BusinessDashboard";
import { VerificationStatus } from "@/components/business/VerificationStatus";
import { Locale } from "@/i18n/routing";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English (US)",
  bn: "বাংলা",
  pt: "Português",
  hi: "हिन्दी",
  de: "Deutsch",
};

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
  const { currentMode, updateCurrentMode } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const currentLocale = useLocale() as Locale;
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");

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

  const activeMode = currentMode || userData?.currentMode || (userData?.accountType === "BUSINESS" ? "BUSINESS" : "PERSONAL");

  // Controls which panel is rendered in the right column
  type ActivePanel = "contacts" | "edit" | "language" | "invite" | "disappearing" | "dashboard" | "verified" | "card";
  const [activePanel, setActivePanel] = useState<ActivePanel>(activeMode === "BUSINESS" ? "contacts" : "edit");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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
        if (formData.email !== undefined) submitData.append("email", formData.email);
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
          <div className="h-20 w-20 rounded-full bg-[#EEF2FF] flex items-center justify-center border border-[#E0E7FF] mb-3 overflow-hidden shadow-sm">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <UserCircle2 className="h-12 w-12 text-slate-400" strokeWidth={1.5} />
            )}
          </div>
          <h2 className="text-[16px] font-bold text-[#0F172A]">{formData.displayName || "User"}</h2>
          <p className="text-[12px] font-medium text-slate-500 mt-1">{formData.phone || "+111 xxx 2345"}</p>
          {activeMode === "BUSINESS" && (
            <span 
              onClick={() => setActivePanel("edit")}
              className="text-[12px] font-bold text-[#2563EB] hover:underline cursor-pointer mt-1"
            >
              {formData.username ? `@${formData.username}` : "techzone"}
            </span>
          )}
          <div className="mt-1.5 rounded-full bg-[#EEF2FF] px-3 py-1 text-[10px] font-bold text-[#2563EB]">
            {activeMode === "BUSINESS" ? "Business" : "Personal"}
          </div>
        </div>

        {/* Menu Items */}
        <div className="px-6 pb-8 flex flex-col gap-6">
          {/* ACCOUNT */}
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{t("account")}</span>
            <div className="flex flex-col gap-1.5">
              <button 
                onClick={() => setActivePanel("edit")}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-3 transition-all",
                  activePanel === "edit" ? "border-blue-200 bg-[#EEF2FF]" : "border-slate-100 bg-white hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#2563EB]">
                    <Building2 className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-[13px] font-bold text-[#0F172A]">{t("title") || "Business Profile"}</span>
                    <span className="text-[11px] font-medium text-slate-500 mt-0.5">{t("edit_information") || "Edit your information"}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              {activeMode === "BUSINESS" && (
                <>
                  <button 
                    onClick={() => setActivePanel("verified")}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-3 transition-all",
                      activePanel === "verified" ? "border-blue-200 bg-[#EEF2FF]" : "border-slate-100 bg-white hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#2563EB]">
                        <ShieldCheck className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex flex-col items-start leading-tight">
                        <span className="text-[13px] font-bold text-[#0F172A]">Verified Business Account</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>

                  <button 
                    onClick={() => setActivePanel("edit")}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 hover:bg-slate-50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#2563EB]">
                        <AtSign className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex flex-col items-start leading-tight">
                        <span className="text-[13px] font-bold text-[#0F172A]">Custom Business Username</span>
                        <span className="text-[11px] font-medium text-slate-500 mt-0.5">{formData.username ? `@${formData.username}` : "@mybusiness"}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>

                  <button 
                    onClick={() => setActivePanel("card")}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-3 transition-all",
                      activePanel === "card" ? "border-blue-200 bg-[#EEF2FF]" : "border-slate-100 bg-white hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#2563EB]">
                        <CreditCard className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex flex-col items-start leading-tight">
                        <span className="text-[13px] font-bold text-[#0F172A]">Digital Business Card</span>
                        <span className="text-[11px] font-medium text-slate-500 mt-0.5">Tap to view & share</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* PREFERENCES */}
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{t("preferences")}</span>
            <div className="flex flex-col gap-1.5">
              <button
                id="open-language-selector"
                onClick={() => setActivePanel("language")}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-3 transition-colors",
                  activePanel === "language"
                    ? "border-blue-200 bg-[#EEF2FF]"
                    : "border-slate-100 bg-white hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    activePanel === "language" ? "bg-[#EEF2FF] text-[#2563EB]" : "bg-[#EEF2FF] text-[#2563EB]"
                  )}>
                    <Globe className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className={cn(
                      "text-[13px] font-bold",
                      activePanel === "language" ? "text-[#2563EB]" : "text-[#0F172A]"
                    )}>{tCommon("language")}</span>
                    <span className="text-[11px] font-medium text-slate-500 mt-0.5">{LOCALE_LABELS[currentLocale]}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                onClick={() => setActivePanel("invite")}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-3 transition-colors",
                  activePanel === "invite"
                    ? "border-blue-200 bg-[#EEF2FF]"
                    : "border-slate-100 bg-white hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    activePanel === "invite" ? "bg-[#EEF2FF] text-[#2563EB]" : "bg-[#EEF2FF] text-[#2563EB]"
                  )}>
                    <Send className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className={cn(
                      "text-[13px] font-bold",
                      activePanel === "invite" ? "text-[#2563EB]" : "text-[#0F172A]"
                    )}>{tCommon("invite")}</span>
                    <span className="text-[11px] font-medium text-slate-500 mt-0.5">{t("invite_friend")}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
              
              <div 
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#2563EB]">
                    <Bell className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-[13px] font-bold text-[#0F172A]">{tCommon("notifications")}</span>
                  </div>
                </div>
                {/* Toggle switch */}
                <div className={cn(
                  "h-5 w-9 rounded-full relative transition-colors duration-200 ease-in-out",
                  notificationsEnabled ? "bg-[#2563EB]" : "bg-slate-200"
                )}>
                  <div className={cn(
                    "absolute top-1 h-3 w-3 rounded-full bg-white shadow-sm transition-all duration-200 ease-in-out",
                    notificationsEnabled ? "right-1" : "left-1"
                  )} />
                </div>
              </div>

              {activeMode === "BUSINESS" && (
                <button
                  onClick={() => setActivePanel("dashboard")}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-3 transition-colors",
                    activePanel === "dashboard"
                      ? "border-blue-200 bg-[#EEF2FF]"
                      : "border-slate-100 bg-white hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      activePanel === "dashboard" ? "bg-[#EEF2FF] text-[#2563EB]" : "bg-[#EEF2FF] text-[#2563EB]"
                    )}>
                      <Briefcase className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                      <span className={cn(
                        "text-[13px] font-bold",
                        activePanel === "dashboard" ? "text-[#2563EB]" : "text-[#0F172A]"
                      )}>{tCommon("business_dashboard")}</span>
                      <span className="text-[11px] font-medium text-slate-500 mt-0.5">{t("analytical_insight")}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* SECURITY */}
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{t("security")}</span>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setActivePanel("disappearing")}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-3 transition-colors",
                  activePanel === "disappearing"
                    ? "border-blue-200 bg-[#EEF2FF]"
                    : "border-slate-100 bg-white hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    activePanel === "disappearing" ? "bg-[#EEF2FF] text-[#2563EB]" : "bg-[#EEF2FF] text-[#2563EB]"
                  )}>
                    <Clock className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className={cn(
                      "text-[13px] font-bold",
                      activePanel === "disappearing" ? "text-[#2563EB]" : "text-[#0F172A]"
                    )}>{tCommon("disappearing_messages")}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* LOGOUT */}
          <div className="flex flex-col mt-2">
            <button
              onClick={handleLogout}
              className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 p-3 hover:bg-red-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-500">
                  <LogOut className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[13px] font-bold text-red-600">{tCommon("logout")}</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Right Column – switches between panels */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        {activePanel === "contacts" && activeMode === "BUSINESS" ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white overflow-y-auto">
            <div className="flex flex-col items-center text-center max-w-sm">
              <div 
                onClick={() => router.push("/contacts")}
                className="mb-6 flex flex-col items-center justify-center h-[140px] w-[140px] rounded-2xl bg-[#2563EB] hover:bg-blue-700 transition-all cursor-pointer text-white shadow-lg shadow-blue-500/20 gap-2 group"
              >
                <UserPlus className="h-10 w-10 group-hover:scale-110 transition-transform" strokeWidth={2} />
                <span className="text-[14px] font-bold tracking-tight">Add contact</span>
              </div>
              <p className="text-[14px] font-medium text-slate-500 leading-relaxed mb-6 max-w-[280px]">
                {t("add_contact_desc") || "Add contacts and start chatting or calling them instantly."}
              </p>
              <button 
                onClick={() => router.push("/contacts")}
                className="rounded-full bg-[#0F172A] px-6 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-slate-800 shadow-sm"
              >
                + Add number
              </button>
            </div>
          </div>
        ) : activePanel === "language" ? (
          <LanguageSelector
            currentLocale={currentLocale}
            onBack={() => setActivePanel(activeMode === "BUSINESS" ? "contacts" : "edit")}
          />
        ) : activePanel === "invite" ? (
          <InviteFriends
            onBack={() => setActivePanel(activeMode === "BUSINESS" ? "contacts" : "edit")}
          />
        ) : activePanel === "disappearing" ? (
          <DisappearingMessages
            onBack={() => setActivePanel(activeMode === "BUSINESS" ? "contacts" : "edit")}
          />
        ) : activePanel === "dashboard" && activeMode === "BUSINESS" ? (
          <BusinessDashboard
            onBack={() => setActivePanel(activeMode === "BUSINESS" ? "contacts" : "edit")}
          />
        ) : activePanel === "verified" && activeMode === "BUSINESS" ? (
          <div className="flex-1 flex flex-col bg-[#F8FAFC] overflow-y-auto scrollbar-hide p-6 md:p-10">
            <div className="max-w-3xl mx-auto w-full">
              <div className="flex items-center gap-3 mb-8">
                <button
                  onClick={() => setActivePanel(activeMode === "BUSINESS" ? "contacts" : "edit")}
                  aria-label="Go back"
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="text-[15px] font-bold">Back</span>
                </button>
              </div>
              <VerificationStatus />
            </div>
          </div>
        ) : activePanel === "card" && activeMode === "BUSINESS" ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC] overflow-y-auto scrollbar-hide p-6 md:p-10">
            <div className="max-w-md w-full">
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => setActivePanel(activeMode === "BUSINESS" ? "contacts" : "edit")}
                  aria-label="Go back"
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="text-[15px] font-bold">Back</span>
                </button>
              </div>
              
              {/* Digital Business Card Preview */}
              <div className="rounded-3xl bg-gradient-to-br from-[#1E1B4B] via-[#2E1065] to-[#4C1D95] p-8 text-white shadow-2xl relative overflow-hidden border border-white/10">
                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-purple-500/20 blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md text-white border border-white/20">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-200">CallsChat Business</span>
                      <p className="text-xs text-purple-300">Verified Organization</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                    Verified
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/40 shadow-md shrink-0">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <UserCircle2 className="h-10 w-10 text-white/80" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-xl font-bold text-white truncate">{formData.displayName || "Business Account"}</h3>
                    <p className="text-sm font-medium text-purple-200 truncate">{formData.username ? `@${formData.username}` : "techzone"}</p>
                    <p className="text-xs text-purple-300 mt-0.5 truncate">{formData.phone || "+111 xxx 2345"}</p>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6 mt-6 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">Digital Card ID</span>
                    <p className="text-xs font-mono text-white mt-0.5">{userData?.id?.slice(0, 12) || "CC-BUS-982314"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(window.location.origin + `/profile`);
                        toast.success("Card link copied to clipboard!");
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-md transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy Link
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center overflow-y-auto scrollbar-hide py-16">
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
              <div className="relative">
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Not set"
                  className="h-[46px] w-full rounded-xl border border-transparent bg-[#F8FAFC] px-4 text-[13px] font-medium text-slate-800 focus:border-blue-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                <Edit2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2563EB]" />
              </div>
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
        )}
      </div>
    </div>
  );
}
