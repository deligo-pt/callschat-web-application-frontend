"use client";

import { useQrLogin } from "@/hooks/useQrLogin";
import { Locale, routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Globe,
  HelpCircle,
  Info,
  Lock,
  Mail,
  MessageCircle,
  MessageSquare,
  Moon,
  Phone,
  RefreshCw,
  Sun,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import QRCode from "react-qr-code";
import Modal from "../shared/Modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const LANGUAGE_LABELS: Record<Locale, { label: string; flag: string }> = {
  en: { label: "English", flag: "🇺🇸" },
  bn: { label: "বাংলা", flag: "🇧🇩" },
  hi: { label: "हिन्दी", flag: "🇮🇳" },
  pt: { label: "Português", flag: "🇧🇷" },
  de: { label: "Deutsch", flag: "🇩🇪" },
};

export default function WebLoginScreen() {
  const router = useRouter();
  const [stayLoggedIn, setStayLoggedIn] = React.useState(true);
  const [isHelpOpen, setIsHelpOpen] = React.useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [currentLocale, setCurrentLocale] = React.useState<Locale>("en");
  const helpRef = React.useRef<HTMLDivElement>(null);

  // Real QR login state — connected to the /qr-auth Socket.IO namespace
  const { status, qrValue, countdown, errorMessage, refreshQrCode } = useQrLogin();

  const formatTime = (s: number) => `00:${s.toString().padStart(2, "0")}`;

  // Whether the QR code box should show a loading/error overlay
  const isQrReady = status === "ready" || status === "expired";
  const isLoading = status === "connecting" || status === "generating";
  const isSuccess = status === "success";
  const isError = status === "error";
  const isExpired = status === "expired";

  // Initialize theme & locale from localStorage on mount
  React.useEffect(() => {
    try {
      const storedTheme = localStorage.getItem("callschat_theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const isDark = storedTheme === "dark" || (!storedTheme && prefersDark);
      setIsDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      const storedLocale = localStorage.getItem("callschat_locale") as Locale | null;
      if (storedLocale && routing.locales.includes(storedLocale)) {
        setCurrentLocale(storedLocale);
      }
    } catch {
      // Ignore errors when localStorage is blocked
    }
  }, []);

  // Handle click-outside for help widget
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setIsHelpOpen(false);
      }
    };
    if (isHelpOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isHelpOpen]);

  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    try {
      if (nextDark) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("callschat_theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("callschat_theme", "light");
      }
    } catch {
      // Ignore storage errors
    }
  };

  const handleLanguageChange = (locale: Locale) => {
    setCurrentLocale(locale);
    try {
      localStorage.setItem("callschat_locale", locale);
      window.dispatchEvent(
        new CustomEvent("callschat_locale_changed", { detail: { locale } })
      );
    } catch {
      // Ignore storage errors
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-white dark:bg-[#0A0F1D] font-sans overflow-x-hidden flex flex-col transition-colors duration-300">
      
      {/* Background SVG pattern from Figma */}
      <img
        src="/figma/bg_pattern.svg"
        alt=""
        className="absolute pointer-events-none select-none hidden lg:block opacity-75 dark:opacity-20"
        style={{ left: -336, top: 374, width: 1312, height: 1182 }}
      />

      {/* Top-right subtract decoration from Figma */}
      <img
        src="/figma/subtract_decor.svg"
        alt=""
        className="absolute pointer-events-none select-none hidden lg:block opacity-50 dark:opacity-20"
        style={{ right: 0, top: 0, width: 251, height: 259, color: "#C7DFFE" }}
      />

      {/* ── NAVBAR (64px height, exact brand logo & controls) ── */}
      <header
        className="relative z-30 flex items-center justify-between w-full bg-white dark:bg-[#0E1528] border-b border-[#F3F4F6] dark:border-slate-800 transition-colors duration-300"
        style={{
          height: 64,
          paddingLeft: "clamp(1rem, 5vw, 43px)",
          paddingRight: "clamp(1rem, 5vw, 43px)",
          boxShadow: "0px 1px 2px -1px rgba(0,0,0,.1), 0px 1px 3px 0px rgba(0,0,0,.1)",
        }}
      >
        {/* Logo (wrapped in Link for Home Navigation) */}
        <Link
          href="/"
          className="flex items-center group transition-transform duration-200 hover:scale-[1.02] focus:outline-none"
          aria-label="CallsChat Home"
        >
          <Image
            src="/call_chats_logo.png"
            alt="CallsChat"
            width={79}
            height={57}
            className="object-contain"
            priority
          />
          <span
            className="hidden sm:inline-block"
            style={{
              fontFamily: "Inter",
              fontWeight: 700,
              fontSize: 23.75,
              lineHeight: 1,
              marginLeft: -12,
            }}
          >
            <span style={{ color: "#02235F" }} className="dark:text-white">Calls</span>
            <span style={{ color: "#037CFD" }}>Chat</span>
          </span>
        </Link>

        {/* Nav Controls: Dark mode toggle & Language dropdown */}
        <div className="flex items-center gap-2 sm:gap-[12px]">
          {/* Dark mode toggle (hidden temporarily) */}
          {/* 
          <button
            type="button"
            onClick={toggleDarkMode}
            className="flex items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors focus:outline-none"
            style={{
              gap: 10,
              padding: "8px 12px",
              border: "0.667px solid #B5B5B5",
              borderRadius: 18,
            }}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun size={16} className="text-amber-400" />
            ) : (
              <Moon size={16} style={{ color: "#364153" }} className="dark:text-slate-300" />
            )}
            <span
              className="hidden md:inline-block text-[#364153] dark:text-slate-200"
              style={{
                fontFamily: "Inter",
                fontWeight: 500,
                fontSize: 13,
                lineHeight: "19.5px",
              }}
            >
              {isDarkMode ? "Light mode" : "Dark mode"}
            </span>
            <div
              className="relative transition-colors duration-200"
              style={{
                width: 40,
                height: 22,
                background: "#155DFC",
                borderRadius: 9999,
              }}
            >
              <div
                className="absolute transition-transform duration-200"
                style={{
                  left: isDarkMode ? 20 : 2,
                  top: 2,
                  width: 18,
                  height: 18,
                  background: "#fff",
                  borderRadius: 9999,
                  boxShadow: "0px 1px 2px -1px rgba(0,0,0,.1),0px 1px 3px 0px rgba(0,0,0,.1)",
                }}
              />
            </div>
          </button>
          */}

          {/* Language Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors focus:outline-none"
                style={{
                  gap: 8,
                  padding: "8px 12px",
                  border: "0.667px solid #B5B5B5",
                  borderRadius: 18,
                }}
                aria-label="Select Language"
              >
                <Globe size={16} style={{ color: "#364153" }} className="dark:text-slate-300" />
                <span
                  className="hidden md:inline-block text-[#364153] dark:text-slate-200"
                  style={{
                    fontFamily: "Inter",
                    fontWeight: 500,
                    fontSize: 13,
                    lineHeight: "19.5px",
                  }}
                >
                  {LANGUAGE_LABELS[currentLocale]?.label || "English"}
                </span>
                <span className="text-xs">{LANGUAGE_LABELS[currentLocale]?.flag || "🇺🇸"}</span>
                <svg
                  width={14}
                  height={14}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#364153"
                  strokeWidth={2}
                  className="dark:stroke-slate-300"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 p-1.5 rounded-2xl shadow-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            >
              {routing.locales.map((loc) => {
                const item = LANGUAGE_LABELS[loc];
                const isSelected = currentLocale === loc;
                return (
                  <DropdownMenuItem
                    key={loc}
                    onClick={() => handleLanguageChange(loc)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors",
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span>{item.flag}</span>
                      <span>{item.label}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ── MAIN CONTENT (2-Column Layout) ── */}
      <main className="relative w-full flex-grow flex flex-col lg:flex-row items-center lg:items-start justify-center gap-12 lg:gap-8 px-4 sm:px-8 md:px-12 lg:px-[68px] pt-10 pb-20 max-w-[1440px] mx-auto z-10">

        {/* ── LEFT: Marketing copy & App Downloads ── */}
        <div className="flex flex-col w-full lg:w-1/2 max-w-[565px] lg:pt-10 xl:pt-[41px] relative">
          
          {/* Headings */}
          <div className="flex flex-col mb-5 lg:mb-0 lg:gap-[-10px] text-center lg:text-left">
            <h1
              className="text-4xl sm:text-5xl lg:text-[56px] leading-[1.2em] text-[#101828] dark:text-white m-0 tracking-tight"
              style={{ fontFamily: "Roboto", fontWeight: 700 }}
            >
              The future of
            </h1>
            <h1
              className="text-4xl sm:text-5xl lg:text-[56px] leading-[1.2em] text-[#155DFC] m-0 lg:pt-2 tracking-tight"
              style={{ fontFamily: "Roboto", fontWeight: 700 }}
            >
              secure messaging
            </h1>
          </div>
          
          {/* Subtitle */}
          <div className="pt-4 lg:pt-5 mb-10 text-center lg:text-left">
            <p
              className="text-lg sm:text-[20px] leading-[1.3em] text-[#6A7282] dark:text-slate-300 max-w-[448px] m-0 mx-auto lg:mx-0"
              style={{ fontFamily: "Roboto", fontWeight: 400 }}
            >
              AI-powered conversations with end-to-end encryption. Connect across devices seamlessly — your privacy, your control, your conversations.
            </p>
          </div>

          {/* ── FEATURE CARDS (3 Cards) ── */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-[16px] xl:gap-[22.18px] mb-[40px] lg:mb-[90px]">
            
            {/* E2E Encrypted */}
            <div
              className="relative shrink-0 flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md group cursor-default"
              style={{
                width: "clamp(140px, 15vw, 157.89px)",
                height: 117.44,
                background: "#fff",
                border: "1.305px solid #2563EB",
                borderRadius: 10.44,
                padding: "16px",
              }}
            >
              <Image
                src="/figma/icon_e2e.png"
                alt="E2E"
                width={18}
                height={22}
                className="object-cover mb-auto group-hover:scale-110 transition-transform duration-300"
              />
              <div className="flex flex-col">
                <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 14.35, color: "#2563EB" }}>
                  E2E Encrypted
                </span>
                <span style={{ fontFamily: "Inter", fontWeight: 300, fontSize: 13.05, color: "#2563EB" }}>
                  Military-grade
                </span>
              </div>
            </div>

            {/* AI-Powered (selected/elevated card) */}
            <div
              className="relative shrink-0 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md group cursor-default"
              style={{
                width: "clamp(150px, 16vw, 165.72px)",
                height: 122.66,
              }}
            >
              {/* dark bg shadow layer */}
              <div
                className="absolute right-0 bottom-0 w-[calc(100%-6px)] h-[calc(100%-6px)] bg-[#131928] rounded-[13.05px]"
                style={{ border: "1.305px solid #222836" }}
              />
              {/* white card on top */}
              <div
                className="absolute left-0 top-0 w-[calc(100%-6px)] h-[calc(100%-6px)] bg-white rounded-[10.44px] flex flex-col p-4"
                style={{ border: "1.305px solid #2563EB" }}
              >
                <Image
                  src="/figma/icon_ai.png"
                  alt="AI"
                  width={22}
                  height={22}
                  className="object-cover mb-auto group-hover:scale-110 transition-transform duration-300"
                />
                <div className="flex flex-col">
                  <span style={{ fontFamily: "Inter", fontWeight: 400, fontSize: 14.35, color: "#2563EB" }}>
                    AI-Powered
                  </span>
                  <span style={{ fontFamily: "Inter", fontWeight: 300, fontSize: 11.74, color: "#2563EB" }}>
                    Smart replies
                  </span>
                </div>
              </div>
            </div>

            {/* Instant Sync */}
            <div
              className="relative shrink-0 flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md group cursor-default"
              style={{
                width: "clamp(140px, 15vw, 157.89px)",
                height: 117.44,
                background: "#fff",
                border: "1.305px solid #2563EB",
                borderRadius: 10.44,
                padding: "16px",
              }}
            >
              <Image
                src="/figma/icon_sync.png"
                alt="Sync"
                width={14}
                height={21}
                className="object-cover mb-auto group-hover:scale-110 transition-transform duration-300"
              />
              <div className="flex flex-col">
                <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 13.05, color: "#2563EB" }}>
                  Instant Sync
                </span>
                <span style={{ fontFamily: "Inter", fontWeight: 400, fontSize: 11.74, color: "#2563EB" }}>
                  All devices
                </span>
              </div>
            </div>
          </div>

          {/* ── APP DOWNLOAD CARD & PHONE MOCKUPS ── */}
          <div className="relative z-20 mx-auto lg:mx-0 w-full max-w-[402px] lg:ml-[78px] xl:ml-[78px]">
            <div
              className="bg-white dark:bg-slate-900 transition-colors"
              style={{
                border: "0.667px solid #F3F4F6",
                borderRadius: 16,
                boxShadow: "0px 1px 2px -1px rgba(0,0,0,.1),0px 1px 3px 0px rgba(0,0,0,.1)",
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 11 }}>
                <span
                  className="text-[#101828] dark:text-white"
                  style={{
                    fontFamily: "Inter",
                    fontWeight: 600,
                    fontSize: 16,
                    lineHeight: "24px",
                    textAlign: "center",
                  }}
                >
                  Get CallsChat for your phone
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                {/* Google Play */}
                <button
                  type="button"
                  onClick={() => setIsDownloadModalOpen(true)}
                  className="hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    width: "100%",
                    maxWidth: 188,
                    height: 55,
                    padding: "10px 16px",
                    border: "2px solid #E5E7EB",
                    borderRadius: 18,
                    background: "transparent",
                  }}
                  aria-label="Download from Google Play"
                >
                  <svg width={20} height={20} viewBox="0 0 512 512">
                    <path fill="#3BCCFF" d="M22 0C10.7 7.5 3 22 3 41.5v429c0 19.5 7.7 34 19 41.5l257.5-256L22 0z" />
                    <path fill="#FF3333" d="M346.5 268l-68-68L22 429c13.2 12.3 33.7 13.8 54 2.1L346.5 268z" />
                    <path fill="#FFD400" d="M346.5 244l102.5-59c23.5-13.5 23.5-35.5 0-49L346.5 77l-68 68 68 99z" />
                    <path fill="#48FF48" d="M22 83l256.5 256 68-68L76 2.1C55.7-9.6 35.2-8.1 22 4.2L22 83z" />
                  </svg>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <span style={{ fontFamily: "Inter", fontWeight: 500, fontSize: 9, lineHeight: "13.5px", color: "#6A7282" }}>
                      GET IT ON
                    </span>
                    <span className="text-[#101828] dark:text-white" style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 14, lineHeight: "17.5px" }}>
                      Google Play
                    </span>
                  </div>
                </button>

                {/* App Store */}
                <button
                  type="button"
                  onClick={() => setIsDownloadModalOpen(true)}
                  className="hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    width: "100%",
                    maxWidth: 188,
                    height: 55,
                    padding: "10px 16px",
                    border: "2px solid #E5E7EB",
                    borderRadius: 18,
                    background: "transparent",
                  }}
                  aria-label="Download on App Store"
                >
                  <svg width={20} height={20} viewBox="0 0 384 512" className="fill-[#101828] dark:fill-white">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                  </svg>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <span style={{ fontFamily: "Inter", fontWeight: 500, fontSize: 9, lineHeight: "13.5px", color: "#6A7282" }}>
                      Download on the
                    </span>
                    <span className="text-[#101828] dark:text-white" style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 14, lineHeight: "17.5px" }}>
                      App Store
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* ── PHONE MOCKUPS (Figma placement: -left 42px, top 168px) ── */}
            <div className="relative mt-8 mb-12 lg:mt-0 lg:mb-0 lg:absolute lg:-left-[42px] lg:top-[168px] w-[295px] h-[326px] mx-auto lg:mx-0 lg:z-[-1]">
              {/* Back phone */}
              <Image
                src="/figma/phone_back.png"
                alt="Phone back"
                width={187}
                height={309}
                className="absolute left-[108.43px] top-[7.95px] object-cover rounded-[24px]"
              />
              {/* Front phone */}
              <Image
                src="/figma/phone_front.png"
                alt="Phone front"
                width={165}
                height={326}
                className="absolute left-0 top-0 object-cover rounded-[24px]"
                style={{ boxShadow: "6.15px 3.08px 19.76px 7.69px rgba(0,0,0,0.11)" }}
              />
            </div>
          </div>
        </div>

        {/* ── RIGHT: WhatsApp Web-Inspired "Scan to Log In" Section ── */}
        <div className="flex flex-col w-full lg:w-1/2 max-w-[530px] items-center lg:items-end z-20">
          
          {/* Main Scan Card (WhatsApp Web Refined Design & Rich Typography) */}
          <div className="w-full bg-white dark:bg-[#111B21] rounded-[28px] border border-[#E9ECEF] dark:border-slate-800 p-6 sm:p-8 md:p-9 shadow-[0_4px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-all duration-300 flex flex-col gap-6">
            
            {/* Header: Title */}
            <div>
              <h2 className="text-[26px] sm:text-[28px] font-bold tracking-tight text-[#111B21] dark:text-[#E9EDEF] mb-4">
                Scan to log in
              </h2>

              {/* 3 Step Stepper with connecting timeline track (WhatsApp Web Design) */}
              <div className="flex flex-col gap-0 my-3">
                {/* Step 1 */}
                <div className="flex items-start gap-3.5">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full border border-[#D1D7DB] dark:border-slate-600 bg-white dark:bg-slate-800 text-[#111B21] dark:text-white text-[12px] font-semibold flex items-center justify-center shrink-0 shadow-2xs">
                      1
                    </div>
                    <div className="w-[1.5px] h-7 bg-[#E2E8F0] dark:bg-slate-700/80 my-1" />
                  </div>
                  <p className="text-[14px] text-[#3B4A54] dark:text-[#8696A0] pt-0.5 leading-snug">
                    Open CallsChat on your phone
                  </p>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3.5">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full border border-[#D1D7DB] dark:border-slate-600 bg-white dark:bg-slate-800 text-[#111B21] dark:text-white text-[12px] font-semibold flex items-center justify-center shrink-0 shadow-2xs">
                      2
                    </div>
                    <div className="w-[1.5px] h-7 bg-[#E2E8F0] dark:bg-slate-700/80 my-1" />
                  </div>
                  <p className="text-[14px] text-[#3B4A54] dark:text-[#8696A0] pt-0.5 leading-snug">
                    Tap <strong className="font-semibold text-[#111B21] dark:text-[#E9EDEF]">Menu</strong> or <strong className="font-semibold text-[#111B21] dark:text-[#E9EDEF]">Settings</strong> and select <strong className="font-semibold text-[#111B21] dark:text-[#E9EDEF]">Linked Devices</strong>
                  </p>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3.5">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full border border-[#D1D7DB] dark:border-slate-600 bg-white dark:bg-slate-800 text-[#111B21] dark:text-white text-[12px] font-semibold flex items-center justify-center shrink-0 shadow-2xs">
                      3
                    </div>
                  </div>
                  <p className="text-[14px] text-[#3B4A54] dark:text-[#8696A0] pt-0.5 leading-snug">
                    Point your camera at this screen to capture the QR code
                  </p>
                </div>
              </div>

              {/* Need Help link with micro-animation */}
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={() => setIsHelpOpen(true)}
                  className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#037CFD] hover:underline cursor-pointer group focus:outline-none"
                >
                  <span>Need help?</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* ── QR CODE FRAME (With Centered CallsChat Logo & Subtle Animations) ── */}
            <div className="w-full flex flex-col items-center justify-center py-1">
              <div className="relative w-full max-w-[260px] aspect-square bg-white rounded-2xl p-4 border border-slate-200/90 dark:border-slate-700 shadow-sm flex items-center justify-center overflow-hidden transition-all duration-300">
                
                {/* Live QR code */}
                {isQrReady && qrValue && (
                  <div className="relative w-full h-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-300">
                    <QRCode
                      value={qrValue}
                      size={240}
                      fgColor="#111B21"
                      level="Q"
                      className="w-full h-full object-contain"
                    />
                    {/* Centered CallsChat Logo Badge with subtle shadow */}
                    <div className="absolute w-11 h-11 rounded-full bg-white shadow-md p-1 flex items-center justify-center border border-slate-100/90 ring-2 ring-blue-50/80">
                      <Image
                        src="/call_chats_logo.png"
                        alt="CallsChat"
                        width={30}
                        height={30}
                        className="object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Loading overlay */}
                {isLoading && (
                  <div className="flex flex-col items-center justify-center gap-2.5 text-center p-4">
                    <div className="w-9 h-9 rounded-full border-3 border-slate-200 border-t-[#037CFD] animate-spin" />
                    <span className="text-xs font-medium text-slate-600">
                      {status === "connecting" ? "Connecting to server…" : "Generating QR code…"}
                    </span>
                  </div>
                )}

                {/* Success overlay with celebration animation */}
                {isSuccess && (
                  <div className="flex flex-col items-center justify-center gap-2 text-center animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md animate-bounce">
                      <Check className="w-7 h-7 stroke-[3]" />
                    </div>
                    <span className="text-sm font-bold text-emerald-600">Logged in!</span>
                    <span className="text-xs text-slate-500 font-medium">Redirecting to chats…</span>
                  </div>
                )}

                {/* Expired / Error overlay with frosted backdrop blur */}
                {(isExpired || isError) && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center gap-2.5 animate-in fade-in duration-200">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shadow-xs">
                      <RefreshCw size={20} className="text-slate-600" />
                    </div>
                    <p className="text-xs font-semibold text-slate-800">
                      {isError ? errorMessage || "Connection failed" : "QR code expired"}
                    </p>
                    <button
                      type="button"
                      onClick={refreshQrCode}
                      className="px-4 py-2 rounded-xl bg-[#037CFD] hover:bg-blue-600 text-white text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      Click to reload QR
                    </button>
                  </div>
                )}
              </div>

              {/* Subtext below QR: Live pulsing timer & manual refresh */}
              <div className="w-full max-w-[260px] mt-3 flex items-center justify-between text-xs text-[#54656F] dark:text-[#8696A0]">
                <div className="flex items-center gap-2">
                  {/* Pulsing status dot */}
                  <span className="relative flex h-2 w-2">
                    <span className={cn(
                      "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                      isError || isExpired ? "bg-rose-400" : "bg-emerald-400"
                    )} />
                    <span className={cn(
                      "relative inline-flex rounded-full h-2 w-2",
                      isError || isExpired ? "bg-rose-500" : "bg-emerald-500"
                    )} />
                  </span>
                  
                  <span>
                    Expires in <strong className="font-semibold text-[#111B21] dark:text-slate-200">{formatTime(countdown)}</strong>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={refreshQrCode}
                  disabled={isLoading || isSuccess}
                  className="text-xs font-semibold text-[#037CFD] hover:underline disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer group"
                >
                  <RefreshCw
                    size={12}
                    className={cn(
                      "transition-transform",
                      isLoading || countdown <= 5 ? "animate-spin" : "group-hover:rotate-180 duration-500"
                    )}
                  />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Bottom Row inside card: Stay logged in checkbox & Phone login link */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#3B4A54] dark:text-[#8696A0]">
                <input
                  type="checkbox"
                  checked={stayLoggedIn}
                  onChange={(e) => setStayLoggedIn(e.target.checked)}
                  className="w-4 h-4 rounded text-[#037CFD] focus:ring-[#037CFD] border-slate-300 dark:border-slate-600 dark:bg-slate-800 accent-[#037CFD] cursor-pointer"
                />
                <span>Stay logged in on this browser</span>
                <span title="Keeps you signed in on this device so you don't need to re-scan.">
                  <Info
                    size={13}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-help"
                  />
                </span>
              </label>

              {/* Log in with phone number link with slide animation */}
              <button
                type="button"
                onClick={() => router.push("/connect")}
                className="text-xs sm:text-sm font-semibold text-[#037CFD] hover:underline inline-flex items-center gap-0.5 cursor-pointer group focus:outline-none"
              >
                <span>Log in with phone number</span>
                <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* ── BELOW THE SCAN CARD: Sign Up Link & Prominent High-Visibility E2EE Security Banner ── */}
          <div className="w-full flex flex-col items-center gap-2.5 mt-5 text-center">
            <div className="text-xs sm:text-[13px] font-medium text-[#3B4A54] dark:text-[#8696A0]">
              Don&apos;t have a CallsChat account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-[#037CFD] hover:underline inline-flex items-center gap-0.5 ml-0.5 group"
              >
                <span>Get started</span>
                <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>

            {/* Prominent High-Visibility E2EE Lock Banner */}
            <div className="flex items-center justify-center gap-2 text-[13px] sm:text-[13.5px] font-medium text-[#54656F] dark:text-[#8696A0] pt-1">
              <Lock size={14} className="text-[#54656F] dark:text-[#8696A0] shrink-0" />
              <span>Your personal messages are end-to-end encrypted</span>
            </div>
          </div>

        </div>
      </main>

      {/* ── HELP / SUPPORT POPUP WIDGET ── */}
      <div
        ref={helpRef}
        className="fixed z-50 bottom-6 right-6 flex flex-col items-end gap-2"
      >
        {isHelpOpen && (
          <div
            className="animate-in fade-in slide-in-from-bottom-3 duration-200"
            style={{
              width: 170,
              background: "#fff",
              border: "1px solid #E8E8E8",
              borderRadius: 16,
              boxShadow: "4px 4px 23.3px 0px rgba(0,0,0,0.19)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              paddingBottom: 8,
            }}
          >
            {/* Need help heading */}
            <div style={{ padding: "12px 16px 8px" }} className="flex items-center justify-between">
              <span style={{ fontFamily: "Roboto", fontWeight: 700, fontSize: 16, color: "#102A63" }}>
                Need help?
              </span>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-0.5"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>

            {/* Live Chat */}
            <button
              type="button"
              onClick={() => {
                setIsHelpOpen(false);
                router.push("/connect");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
              className="hover:bg-blue-50 transition-colors text-left"
            >
              <MessageSquare size={18} color="#102A63" />
              <span style={{ fontFamily: "Roboto", fontWeight: 500, fontSize: 12, color: "#102A63" }}>
                Live Support
              </span>
            </button>

            {/* Help Center */}
            <Link
              href="/#faq"
              onClick={() => setIsHelpOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
              className="hover:bg-blue-50 transition-colors text-left"
            >
              <HelpCircle size={18} color="#102A63" />
              <span style={{ fontFamily: "Roboto", fontWeight: 500, fontSize: 12, color: "#102A63" }}>
                Help Center
              </span>
            </Link>

            {/* Email support */}
            <a
              href="mailto:support@callschat.com"
              onClick={() => setIsHelpOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
              className="hover:bg-blue-50 transition-colors text-left"
            >
              <Mail size={16} color="#102A63" />
              <span style={{ fontFamily: "Roboto", fontWeight: 500, fontSize: 12, color: "#102A63" }}>
                Email support
              </span>
            </a>
          </div>
        )}

        {/* Floating Bubble Button */}
        <button
          type="button"
          onClick={() => setIsHelpOpen(!isHelpOpen)}
          style={{
            width: 48,
            height: 48,
            background: "#155DFC",
            borderRadius: 9999,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0px 4px 6px -4px rgba(0,0,0,.1),0px 10px 15px -3px rgba(0,0,0,.1)",
          }}
          className="hover:scale-105 active:scale-95 transition-transform"
          aria-label="Open support menu"
        >
          {isHelpOpen ? <X size={22} color="#fff" /> : <MessageCircle size={24} fill="#fff" color="#fff" />}
        </button>
      </div>

      {/* App Download Modal */}
      <Modal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        title="Get CallsChat Mobile App"
      />
    </div>
  );
}
