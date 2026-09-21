"use client";

import React from "react";
import { ProfileProvider, useProfile } from "@/context/ProfileContext";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import {
  Star, Search, UserCircle2, Check, ShieldCheck, Building2,
  ChevronRight, AtSign, CreditCard, Globe, Send, Bell, Briefcase, Clock, LogOut
, Heart, MonitorSmartphone, KeyRound} from "lucide-react";
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
    <div className="flex h-full w-full flex-col border-r border-[#E6EAFA] bg-white md:w-[350px] shrink-0 overflow-y-auto scrollbar-hide">
      {/* Header (Matching Image precisely) */}
      <div className="flex flex-col px-6 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-[24px] font-bold tracking-tight text-[#2563EB]">Groups</h1>
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
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={tCommon("search")}
            className="h-10 w-full rounded-full bg-[#F1F5F9] pl-10 pr-4 text-[13px] font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
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
        <div className="flex items-center gap-1.5 justify-center">
          <h2 className="text-[16px] font-bold text-[#0F172A]">
            {userData?.profile?.displayName || formData.displayName || "Fandy Eve"}
          </h2>
          {activeMode === "BUSINESS" && businessProfile?.isVerified && (
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-xs" title="Verified Business Account">
              <Check className="h-2.5 w-2.5" strokeWidth={3} />
            </span>
          )}
        </div>
        <p className="text-[12px] font-medium text-slate-500 mt-1">{formData.phone || "+111 xxx 2345"}</p>
        {activeMode === "BUSINESS" && (
          <span
            onClick={() => router.push("/profile/edit")}
            className="text-[12px] font-bold text-[#2563EB] hover:underline cursor-pointer mt-1"
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
          <div className="mt-1.5 rounded-full bg-[#EEF2FF] px-3 py-1 text-[10px] font-bold text-[#2563EB]">
            {activeMode === "BUSINESS" ? "Business" : "Personal"}
          </div>
        )}
      </div>

      {/* Menu Items */}
      <div className="px-6 pb-8 flex flex-col gap-6">
        {/* ACCOUNT */}
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{t("account")}</span>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => router.push("/profile/edit")}
              className={cn(
                "flex items-center justify-between rounded-xl border p-3 transition-all",
                isRouteActive("/profile/edit") ? "border-blue-200 bg-[#EEF2FF]" : "border-slate-100 bg-white hover:bg-slate-50"
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
                  onClick={() => router.push("/profile/verification")}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-3 transition-all",
                    isRouteActive("/profile/verification") ? "border-blue-200 bg-[#EEF2FF]" : "border-slate-100 bg-white hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#2563EB]">
                      <ShieldCheck className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-bold text-[#0F172A]">Verified Business Account</span>
                        {businessProfile?.isVerified && (
                          <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-xs">
                            <Check className="h-2 w-2" strokeWidth={3} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>

                <button
                  onClick={() => router.push("/profile/username")}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-3 transition-all",
                    isRouteActive("/profile/username") ? "border-blue-200 bg-[#EEF2FF]" : "border-slate-100 bg-white hover:bg-slate-50"
                  )}
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
                  onClick={() => router.push("/profile/card")}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-3 transition-all",
                    isRouteActive("/profile/card") ? "border-blue-200 bg-[#EEF2FF]" : "border-slate-100 bg-white hover:bg-slate-50"
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
              onClick={() => router.push("/profile/language")}
              className={cn(
                "flex items-center justify-between rounded-xl border p-3 transition-colors",
                isRouteActive("/profile/language")
                  ? "border-blue-200 bg-[#EEF2FF]"
                  : "border-slate-100 bg-white hover:bg-slate-50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#2563EB]"
                )}>
                  <Globe className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className={cn(
                    "text-[13px] font-bold",
                    isRouteActive("/profile/language") ? "text-[#2563EB]" : "text-[#0F172A]"
                  )}>{tCommon("language")}</span>
                  <span className="text-[11px] font-medium text-slate-500 mt-0.5">{LOCALE_LABELS[currentLocale]}</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>

            <button
              onClick={() => router.push("/profile/invite")}
              className={cn(
                "flex items-center justify-between rounded-xl border p-3 transition-colors",
                isRouteActive("/profile/invite")
                  ? "border-blue-200 bg-[#EEF2FF]"
                  : "border-slate-100 bg-white hover:bg-slate-50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#2563EB]"
                )}>
                  <Send className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className={cn(
                    "text-[13px] font-bold",
                    isRouteActive("/profile/invite") ? "text-[#2563EB]" : "text-[#0F172A]"
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
                onClick={() => router.push("/profile/dashboard")}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-3 transition-colors",
                  isRouteActive("/profile/dashboard")
                    ? "border-blue-200 bg-[#EEF2FF]"
                    : "border-slate-100 bg-white hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#2563EB]"
                  )}>
                    <Briefcase className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className={cn(
                      "text-[13px] font-bold",
                      isRouteActive("/profile/dashboard") ? "text-[#2563EB]" : "text-[#0F172A]"
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
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => router.push("/profile/sessions")}
              className={cn(
                "flex items-center justify-between rounded-xl border p-3 transition-colors",
                isRouteActive("/profile/sessions")
                  ? "border-blue-200 bg-[#EEF2FF]"
                  : "border-slate-100 bg-white hover:bg-slate-50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#2563EB]"
                )}>
                  <MonitorSmartphone className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className={cn(
                    "text-[13px] font-bold",
                    isRouteActive("/profile/sessions") ? "text-[#2563EB]" : "text-[#0F172A]"
                  )}>Active Sessions</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>

            <button
              onClick={() => router.push("/profile/disappearing")}
              className={cn(
                "flex items-center justify-between rounded-xl border p-3 transition-colors",
                isRouteActive("/profile/disappearing")
                  ? "border-blue-200 bg-[#EEF2FF]"
                  : "border-slate-100 bg-white hover:bg-slate-50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#2563EB]"
                )}>
                  <Clock className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className={cn(
                    "text-[13px] font-bold",
                    isRouteActive("/profile/disappearing") ? "text-[#2563EB]" : "text-[#0F172A]"
                  )}>{tCommon("disappearing_messages")}</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>

            <button
              onClick={() => router.push("/profile/backup")}
              className={cn(
                "flex items-center justify-between rounded-xl border p-3 transition-colors",
                isRouteActive("/profile/backup")
                  ? "border-blue-200 bg-[#EEF2FF]"
                  : "border-slate-100 bg-white hover:bg-slate-50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#2563EB]"
                )}>
                  <KeyRound className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className={cn(
                    "text-[13px] font-bold",
                    isRouteActive("/profile/backup") ? "text-[#2563EB]" : "text-[#0F172A]"
                  )}>E2EE Key Backup</span>
                  <span className="text-[11px] font-medium text-slate-500 mt-0.5">Protect & restore chats</span>
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
  );
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProfileProvider>
      <div className="flex h-full w-full bg-[#F8FAFC]">
        <ProfileSidebarNavigation />
        <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
          {children}
        </div>
      </div>
    </ProfileProvider>
  );
}
