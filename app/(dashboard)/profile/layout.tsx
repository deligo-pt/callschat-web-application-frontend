"use client";

import React, { useState, useEffect } from "react";
import { ProfileProvider, useProfile } from "@/context/ProfileContext";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { ThemeModal } from "@/components/theme/ThemeModal";
import {
  Star, Search, UserCircle2, Check, ShieldCheck, Building2,
  ChevronRight, AtSign, CreditCard, Globe, Send, Bell, Briefcase, Clock, LogOut
, Heart, MonitorSmartphone, KeyRound, LifeBuoy, Sun, Moon, Radio} from "lucide-react";
import { Locale } from "@/i18n/routing";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English (US)",
  bn: "বাংলা",
  pt: "Português",
  hi: "हिन्दी",
  de: "Deutsch",
};

function ProfileSidebarNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale() as Locale;
  const { theme, resolvedTheme } = useTheme();
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");

  const {
    userData,
    formData,
    avatarPreview,
    activeMode,
    notificationsEnabled,
    setNotificationsEnabled,
    handleLogout,
    businessProfile,
  } = useProfile();

  const isRouteActive = (route: string) => {
    if (route === "/profile/edit" && (pathname === "/profile" || pathname === "/profile/edit")) {
      return true;
    }
    return pathname === route;
  };

  return (
    <div className="flex h-full w-full flex-col border-r border-[#E6EAFA] dark:border-[#222D34] bg-white dark:bg-[#111B21] md:w-[350px] shrink-0 overflow-y-auto scrollbar-hide">
      {/* Header (Matching Image precisely) */}
      <div className="flex flex-col px-6 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-[24px] font-bold tracking-tight text-[#2563EB] dark:text-[#38BDF8]">Profile</h1>
          <div className="flex items-center gap-2">
            <Link 
              href="/chats/favorites" 
              title="Favorites"
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#F0F2F5] dark:hover:bg-[#202C33] text-[#54656F] dark:text-[#8696A0] hover:text-red-500 transition-colors focus:outline-none"
              aria-label="Favorites"
            >
              <Heart className="h-4.5 w-4.5" />
            </Link>
            <NotificationDropdown />
          </div>
        </div>
        <div className="mt-4 relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-[#8696A0]" />
          <input
            type="text"
            placeholder={tCommon("search")}
            className="h-10 w-full rounded-full bg-[#F1F5F9] dark:bg-[#202C33] pl-10 pr-4 text-[13px] font-medium text-slate-700 dark:text-[#E9EDEF] placeholder:text-slate-400 dark:placeholder:text-[#8696A0] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 dark:focus:ring-[#00A884]/30 transition-all border border-transparent"
          />
        </div>
      </div>

      {/* User Summary */}
      <div className="flex flex-col items-center px-6 pt-4 pb-6">
        <div className="h-20 w-20 rounded-full bg-[#EEF2FF] dark:bg-[#202C33] flex items-center justify-center border border-[#E0E7FF] dark:border-[#2A3942] mb-3 overflow-hidden shadow-sm">
          {avatarPreview ? (
            <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <UserCircle2 className="h-12 w-12 text-slate-400 dark:text-[#8696A0]" strokeWidth={1.5} />
          )}
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          <h2 className="text-[16px] font-bold text-[#0F172A] dark:text-[#E9EDEF]">
            {userData?.profile?.displayName || formData.displayName || "Fandy Eve"}
          </h2>
          {activeMode === "BUSINESS" && businessProfile?.isVerified && (
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-xs" title="Verified Business Account">
              <Check className="h-2.5 w-2.5" strokeWidth={3} />
            </span>
          )}
        </div>
        <p className="text-[12px] font-medium text-slate-500 dark:text-[#8696A0] mt-1">{formData.phone || "+111 xxx 2345"}</p>
        {activeMode === "BUSINESS" && (
          <span
            onClick={() => router.push("/profile/edit")}
            className="text-[12px] font-bold text-[#2563EB] dark:text-[#38BDF8] hover:underline cursor-pointer mt-1"
          >
            {businessProfile?.companyName || formData.companyName || "techzone"}
          </span>
        )}
        {activeMode === "BUSINESS" && businessProfile?.isVerified ? (
          <div className="mt-1.5 rounded-full bg-[#2563EB] px-3 py-1 text-[10px] font-bold text-white flex items-center gap-1 shadow-xs">
            <ShieldCheck className="h-3 w-3" />
            Verified Business
          </div>
        ) : (
          <div className="mt-1.5 rounded-full bg-[#EEF2FF] dark:bg-[#202C33] px-3 py-1 text-[10px] font-bold text-[#2563EB] dark:text-[#38BDF8]">
            {activeMode === "BUSINESS" ? "Business" : "Personal"}
          </div>
        )}
      </div>

      {/* Menu Items */}
      <div className="px-6 pb-8 flex flex-col gap-6">
        {/* ACCOUNT */}
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-slate-500 dark:text-[#8696A0] uppercase tracking-wider mb-2">{t("account")}</span>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => router.push("/profile/edit")}
              className={cn(
                "flex items-center justify-between rounded-xl border p-3 transition-colors",
                isRouteActive("/profile/edit")
                  ? "border-blue-200 bg-[#EEF2FF] dark:border-[#2563EB]/40 dark:bg-[#2563EB]/20"
                  : "border-slate-100 dark:border-[#222D34] bg-white dark:bg-[#182229] hover:bg-slate-50 dark:hover:bg-[#202C33]"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#38BDF8]">
                  <Building2 className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className={cn(
                    "text-[13px] font-bold",
                    isRouteActive("/profile/edit") ? "text-[#2563EB] dark:text-[#38BDF8]" : "text-[#0F172A] dark:text-[#E9EDEF]"
                  )}>{t("title") || "Business Profile"}</span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-[#8696A0] mt-0.5">{t("edit_information") || "Edit your information"}</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 dark:text-[#8696A0]" />
            </button>

            {activeMode === "BUSINESS" ? (
              <>
                <button
                  onClick={() => router.push("/business/verification")}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-3 transition-colors",
                    isRouteActive("/business/verification")
                      ? "border-blue-200 bg-[#EEF2FF] dark:border-[#2563EB]/40 dark:bg-[#2563EB]/20"
                      : "border-slate-100 dark:border-[#222D34] bg-white dark:bg-[#182229] hover:bg-slate-50 dark:hover:bg-[#202C33]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#38BDF8]">
                      <ShieldCheck className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "text-[13px] font-bold",
                          isRouteActive("/business/verification") ? "text-[#2563EB] dark:text-[#38BDF8]" : "text-[#0F172A] dark:text-[#E9EDEF]"
                        )}>Verified Business Account</span>
                        {businessProfile?.isVerified && (
                          <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-xs">
                            <Check className="h-2 w-2" strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-[#8696A0] mt-0.5">
                        {businessProfile?.isVerified ? "Verified organization" : "Complete business KYB"}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 dark:text-[#8696A0]" />
                </button>

                <button
                  onClick={() => router.push("/profile/username")}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-3 transition-colors",
                    isRouteActive("/profile/username")
                      ? "border-blue-200 bg-[#EEF2FF] dark:border-[#2563EB]/40 dark:bg-[#2563EB]/20"
                      : "border-slate-100 dark:border-[#222D34] bg-white dark:bg-[#182229] hover:bg-slate-50 dark:hover:bg-[#202C33]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#38BDF8]">
                      <AtSign className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                      <span className={cn(
                        "text-[13px] font-bold",
                        isRouteActive("/profile/username") ? "text-[#2563EB] dark:text-[#38BDF8]" : "text-[#0F172A] dark:text-[#E9EDEF]"
                      )}>Custom Business Username</span>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-[#8696A0] mt-0.5">{formData.username ? `@${formData.username}` : "@mybusiness"}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 dark:text-[#8696A0]" />
                </button>

                <button
                  onClick={() => router.push("/profile/card")}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-3 transition-colors",
                    isRouteActive("/profile/card")
                      ? "border-blue-200 bg-[#EEF2FF] dark:border-[#2563EB]/40 dark:bg-[#2563EB]/20"
                      : "border-slate-100 dark:border-[#222D34] bg-white dark:bg-[#182229] hover:bg-slate-50 dark:hover:bg-[#202C33]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#38BDF8]">
                      <CreditCard className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                      <span className={cn(
                        "text-[13px] font-bold",
                        isRouteActive("/profile/card") ? "text-[#2563EB] dark:text-[#38BDF8]" : "text-[#0F172A] dark:text-[#E9EDEF]"
                      )}>Digital Business Card</span>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-[#8696A0] mt-0.5">Tap to view & share</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 dark:text-[#8696A0]" />
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push("/profile/verification")}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-3 transition-colors",
                  isRouteActive("/profile/verification")
                    ? "border-indigo-200 bg-indigo-50/60 dark:border-indigo-500/40 dark:bg-indigo-500/20"
                    : "border-slate-100 dark:border-[#222D34] bg-white dark:bg-[#182229] hover:bg-slate-50 dark:hover:bg-[#202C33]"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                    <ShieldCheck className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex flex-col items-start leading-tight">
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "text-[13px] font-bold",
                        isRouteActive("/profile/verification") ? "text-indigo-600 dark:text-indigo-400" : "text-[#0F172A] dark:text-[#E9EDEF]"
                      )}>Identity Verification (KYC)</span>
                      {(userData as any)?.isVerified && (
                        <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs">
                          <Check className="h-2 w-2" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-[#8696A0] mt-0.5">
                      {(userData as any)?.isVerified ? "Identity verified" : "Submit government ID"}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 dark:text-[#8696A0]" />
              </button>
            )}

            <button
              onClick={() => router.push("/profile/host")}
              className={cn(
                "flex items-center justify-between rounded-xl border p-3 transition-colors",
                isRouteActive("/profile/host")
                  ? "border-blue-200 bg-[#EEF2FF] dark:border-[#2563EB]/40 dark:bg-[#2563EB]/20"
                  : "border-slate-100 dark:border-[#222D34] bg-white dark:bg-[#182229] hover:bg-slate-50 dark:hover:bg-[#202C33]"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/20 text-[#2563EB] dark:text-[#38BDF8]">
                  <Radio className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "text-[13px] font-bold",
                      isRouteActive("/profile/host") ? "text-[#2563EB] dark:text-[#38BDF8]" : "text-[#0F172A] dark:text-[#E9EDEF]"
                    )}>Live Creator & Host</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800/40">
                      Studio
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-[#8696A0] mt-0.5">
                    Apply to become an approved host
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 dark:text-[#8696A0]" />
            </button>
          </div>
        </div>

        {/* PREFERENCES */}
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-slate-500 dark:text-[#8696A0] uppercase tracking-wider mb-2">{t("preferences")}</span>
          <div className="flex flex-col gap-1.5">
            {/* Theme / Appearance */}
            <button
              type="button"
              onClick={() => setIsThemeModalOpen(true)}
              className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-[#222D34] bg-white dark:bg-[#182229] p-3 hover:bg-slate-50 dark:hover:bg-[#202C33] transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#38BDF8]">
                  {mounted ? (
                    resolvedTheme === "dark" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5 text-amber-500" />
                  ) : (
                    <div className="h-4.5 w-4.5" />
                  )}
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[13px] font-bold text-[#0F172A] dark:text-[#E9EDEF]">Theme</span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-[#8696A0] mt-0.5 capitalize">
                    {mounted ? (theme === "system" ? "System default" : theme || "System") : "System default"}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 dark:text-[#8696A0]" />
            </button>

            <button
              id="open-language-selector"
              onClick={() => router.push("/profile/language")}
              className={cn(
                "flex items-center justify-between rounded-xl border p-3 transition-colors",
                isRouteActive("/profile/language")
                  ? "border-blue-200 bg-[#EEF2FF] dark:border-[#2563EB]/40 dark:bg-[#2563EB]/20"
                  : "border-slate-100 dark:border-[#222D34] bg-white dark:bg-[#182229] hover:bg-slate-50 dark:hover:bg-[#202C33]"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#38BDF8]"
                )}>
                  <Globe className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className={cn(
                    "text-[13px] font-bold",
                    isRouteActive("/profile/language") ? "text-[#2563EB] dark:text-[#38BDF8]" : "text-[#0F172A] dark:text-[#E9EDEF]"
                  )}>{tCommon("language")}</span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-[#8696A0] mt-0.5">{LOCALE_LABELS[currentLocale]}</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 dark:text-[#8696A0]" />
            </button>

            <button
              onClick={() => router.push("/profile/invite")}
              className={cn(
                "flex items-center justify-between rounded-xl border p-3 transition-colors",
                isRouteActive("/profile/invite")
                  ? "border-blue-200 bg-[#EEF2FF] dark:border-[#2563EB]/40 dark:bg-[#2563EB]/20"
                  : "border-slate-100 dark:border-[#222D34] bg-white dark:bg-[#182229] hover:bg-slate-50 dark:hover:bg-[#202C33]"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#38BDF8]"
                )}>
                  <Send className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className={cn(
                    "text-[13px] font-bold",
                    isRouteActive("/profile/invite") ? "text-[#2563EB] dark:text-[#38BDF8]" : "text-[#0F172A] dark:text-[#E9EDEF]"
                  )}>{tCommon("invite")}</span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-[#8696A0] mt-0.5">{t("invite_friend")}</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 dark:text-[#8696A0]" />
            </button>

            <div
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-[#222D34] bg-white dark:bg-[#182229] p-3 hover:bg-slate-50 dark:hover:bg-[#202C33] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#38BDF8]">
                  <Bell className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[13px] font-bold text-[#0F172A] dark:text-[#E9EDEF]">{tCommon("notifications")}</span>
                </div>
              </div>
              <div className={cn(
                "h-5 w-9 rounded-full relative transition-colors duration-200 ease-in-out",
                notificationsEnabled ? "bg-[#2563EB]" : "bg-slate-200 dark:bg-slate-700"
              )}>
                <div className={cn(
                  "absolute top-1 h-3 w-3 rounded-full bg-white shadow-sm transition-all duration-200 ease-in-out",
                  notificationsEnabled ? "right-1" : "left-1"
                )} />
              </div>
            </div>

            {activeMode === "BUSINESS" && (
              <button
                onClick={() => router.push("/profile/dashboard")}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-3 transition-colors",
                  isRouteActive("/profile/dashboard")
                    ? "border-blue-200 bg-[#EEF2FF] dark:border-[#2563EB]/40 dark:bg-[#2563EB]/20"
                    : "border-slate-100 dark:border-[#222D34] bg-white dark:bg-[#182229] hover:bg-slate-50 dark:hover:bg-[#202C33]"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#38BDF8]"
                  )}>
                    <Briefcase className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className={cn(
                      "text-[13px] font-bold",
                      isRouteActive("/profile/dashboard") ? "text-[#2563EB] dark:text-[#38BDF8]" : "text-[#0F172A] dark:text-[#E9EDEF]"
                    )}>{tCommon("business_dashboard")}</span>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-[#8696A0] mt-0.5">{t("analytical_insight")}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 dark:text-[#8696A0]" />
              </button>
            )}
          </div>
        </div>

        {/* SECURITY */}
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-slate-500 dark:text-[#8696A0] uppercase tracking-wider mb-2">{t("security")}</span>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => router.push("/profile/sessions")}
              className={cn(
                "flex items-center justify-between rounded-xl border p-3 transition-colors",
                isRouteActive("/profile/sessions")
                  ? "border-blue-200 bg-[#EEF2FF] dark:border-[#2563EB]/40 dark:bg-[#2563EB]/20"
                  : "border-slate-100 dark:border-[#222D34] bg-white dark:bg-[#182229] hover:bg-slate-50 dark:hover:bg-[#202C33]"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#38BDF8]"
                )}>
                  <MonitorSmartphone className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className={cn(
                    "text-[13px] font-bold",
                    isRouteActive("/profile/sessions") ? "text-[#2563EB] dark:text-[#38BDF8]" : "text-[#0F172A] dark:text-[#E9EDEF]"
                  )}>Active Sessions</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 dark:text-[#8696A0]" />
            </button>

            <button
              onClick={() => router.push("/profile/disappearing")}
              className={cn(
                "flex items-center justify-between rounded-xl border p-3 transition-colors",
                isRouteActive("/profile/disappearing")
                  ? "border-blue-200 bg-[#EEF2FF] dark:border-[#2563EB]/40 dark:bg-[#2563EB]/20"
                  : "border-slate-100 dark:border-[#222D34] bg-white dark:bg-[#182229] hover:bg-slate-50 dark:hover:bg-[#202C33]"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#38BDF8]"
                )}>
                  <Clock className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className={cn(
                    "text-[13px] font-bold",
                    isRouteActive("/profile/disappearing") ? "text-[#2563EB] dark:text-[#38BDF8]" : "text-[#0F172A] dark:text-[#E9EDEF]"
                  )}>{tCommon("disappearing_messages")}</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 dark:text-[#8696A0]" />
            </button>

            <button
              onClick={() => router.push("/profile/backup")}
              className={cn(
                "flex items-center justify-between rounded-xl border p-3 transition-colors",
                isRouteActive("/profile/backup")
                  ? "border-blue-200 bg-[#EEF2FF] dark:border-[#2563EB]/40 dark:bg-[#2563EB]/20"
                  : "border-slate-100 dark:border-[#222D34] bg-white dark:bg-[#182229] hover:bg-slate-50 dark:hover:bg-[#202C33]"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#38BDF8]"
                )}>
                  <KeyRound className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className={cn(
                    "text-[13px] font-bold",
                    isRouteActive("/profile/backup") ? "text-[#2563EB] dark:text-[#38BDF8]" : "text-[#0F172A] dark:text-[#E9EDEF]"
                  )}>E2EE Key Backup</span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-[#8696A0] mt-0.5">Protect & restore chats</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 dark:text-[#8696A0]" />
            </button>
          </div>
        </div>

        {/* SUPPORT & FEEDBACK */}
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-slate-500 dark:text-[#8696A0] uppercase tracking-wider mb-2">Support</span>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => router.push("/profile/feedback")}
              className={cn(
                "flex items-center justify-between rounded-xl border p-3 transition-colors",
                isRouteActive("/profile/feedback")
                  ? "border-blue-200 bg-[#EEF2FF] dark:border-[#2563EB]/40 dark:bg-[#2563EB]/20"
                  : "border-slate-100 dark:border-[#222D34] bg-white dark:bg-[#182229] hover:bg-slate-50 dark:hover:bg-[#202C33]"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#38BDF8]"
                )}>
                  <LifeBuoy className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className={cn(
                    "text-[13px] font-bold",
                    isRouteActive("/profile/feedback") ? "text-[#2563EB] dark:text-[#38BDF8]" : "text-[#0F172A] dark:text-[#E9EDEF]"
                  )}>Help & Feedback</span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-[#8696A0] mt-0.5">Report bugs & view replies</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 dark:text-[#8696A0]" />
            </button>
          </div>
        </div>

        {/* LOGOUT */}
        <div className="flex flex-col mt-2">
          <button
            onClick={handleLogout}
            className="flex items-center justify-between rounded-xl border border-red-100 dark:border-red-950/40 bg-red-50 dark:bg-red-950/20 p-3 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30 text-red-500">
                <LogOut className="h-4.5 w-4.5" />
              </div>
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[13px] font-bold text-red-600 dark:text-red-400">{tCommon("logout")}</span>
              </div>
            </div>
          </button>
        </div>
      </div>
      <ThemeModal isOpen={isThemeModalOpen} onClose={() => setIsThemeModalOpen(false)} />
    </div>
  );
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProfileProvider>
      <div className="flex h-full w-full bg-[#F8FAFC] dark:bg-[#0C1317]">
        <ProfileSidebarNavigation />
        <div className="flex-1 flex flex-col bg-white dark:bg-[#111B21] overflow-hidden relative">
          {children}
        </div>
      </div>
    </ProfileProvider>
  );
}
