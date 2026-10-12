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
import { useTheme } from "next-themes";
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
  const [mounted, setMounted] = React.useState(false);
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isDarkMode = mounted && resolvedTheme === "dark";
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

  // Initialize theme & locale on mount
  React.useEffect(() => {
    setMounted(true);
    try {
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
    setTheme(isDarkMode ? "light" : "dark");
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
    <div className="relative min-h-screen w-full bg-white dark:bg-[#0C1317] font-sans overflow-x-hidden flex flex-col transition-colors duration-300">
      
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
        className="relative z-30 flex items-center justify-between w-full bg-white dark:bg-[#111B21] border-b border-[#F3F4F6] dark:border-[#222D34] transition-colors duration-300"
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
            className="object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-xs dark:drop-shadow-[0_0_14px_rgba(3,124,253,0.4)]"
            priority
          />
          <span
            className="hidden sm:inline-block tracking-tight"
            style={{
              fontFamily: "Inter",
              fontWeight: 700,
              fontSize: 23.75,
              lineHeight: 1,
              marginLeft: -12,
            }}
          >
            <span className="text-[#02235F] dark:text-white transition-colors duration-200">Calls</span>
            <span className="text-[#037CFD] dark:text-[#38BDF8] transition-colors duration-200">Chat</span>
          </span>
        </Link>

        {/* Nav Controls: Dark mode toggle & Language dropdown */}
        <div className="flex items-center gap-2 sm:gap-[12px]">
          {/* Dark mode toggle */}
          <button
            type="button"
            onClick={toggleDarkMode}
            className="flex items-center gap-2.5 px-3 py-2 border border-[#B5B5B5] dark:border-[#2A3942] rounded-[18px] cursor-pointer hover:bg-slate-50 dark:hover:bg-[#202C33] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-[#00A884]"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun size={16} className="text-amber-400" />
            ) : (
              <Moon size={16} className="text-[#364153] dark:text-slate-300" />
            )}
            <span
              className="hidden md:inline-block text-[#364153] dark:text-[#E9EDEF]"
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
                background: isDarkMode ? "#00A884" : "#155DFC",
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

          {/* Language Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-2 border border-[#B5B5B5] dark:border-[#2A3942] rounded-[18px] cursor-pointer hover:bg-slate-50 dark:hover:bg-[#202C33] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-[#00A884]"
                aria-label="Select Language"
              >
                <Globe size={16} className="text-[#364153] dark:text-[#E9EDEF]" />
                <span
                  className="hidden md:inline-block text-[#364153] dark:text-[#E9EDEF]"
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
                  stroke="currentColor"
                  strokeWidth={2}
                  className="text-[#364153] dark:text-[#E9EDEF]"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 p-1.5 rounded-2xl shadow-xl bg-white dark:bg-[#202C33] border border-slate-200 dark:border-[#2A3942]"
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
                        ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-[#38BDF8] font-semibold"
                        : "hover:bg-slate-100 dark:hover:bg-[#111B21] text-slate-700 dark:text-[#E9EDEF]"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span>{item.flag}</span>
                      <span>{item.label}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-[#38BDF8]" />}
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
              className="text-4xl sm:text-5xl lg:text-[56px] leading-[1.2em] text-[#155DFC] dark:text-[#38BDF8] m-0 lg:pt-2 tracking-tight transition-colors"
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
              className="relative shrink-0 flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md group cursor-default bg-white dark:bg-[#111B21] border border-[#2563EB]/40 dark:border-[#2A3942] dark:hover:border-[#00A884]/60 rounded-[10.44px] p-4"
              style={{
                width: "clamp(140px, 15vw, 157.89px)",
                height: 117.44,
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
                <span className="font-['Inter'] font-bold text-[14.35px] text-[#2563EB] dark:text-[#E9EDEF]">
                  E2E Encrypted
                </span>
                <span className="font-['Inter'] font-light text-[13.05px] text-[#2563EB]/80 dark:text-[#8696A0]">
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
                className="absolute right-0 bottom-0 w-[calc(100%-6px)] h-[calc(100%-6px)] bg-[#131928] dark:bg-[#00A884]/20 rounded-[13.05px] border border-[#222836] dark:border-[#00A884]/30"
              />
              {/* white card on top */}
              <div
                className="absolute left-0 top-0 w-[calc(100%-6px)] h-[calc(100%-6px)] bg-white dark:bg-[#111B21] border border-[#2563EB] dark:border-[#00A884] rounded-[10.44px] flex flex-col p-4 dark:shadow-[0_0_20px_rgba(0,168,132,0.15)]"
              >
                <Image
                  src="/figma/icon_ai.png"
                  alt="AI"
                  width={22}
                  height={22}
                  className="object-cover mb-auto group-hover:scale-110 transition-transform duration-300"
                />
                <div className="flex flex-col">
                  <span className="font-['Inter'] font-semibold text-[14.35px] text-[#2563EB] dark:text-[#E9EDEF]">
                    AI-Powered
                  </span>
                  <span className="font-['Inter'] font-light text-[11.74px] text-[#2563EB]/80 dark:text-[#8696A0]">
                    Smart replies
                  </span>
                </div>
              </div>
            </div>

            {/* Instant Sync */}
            <div
              className="relative shrink-0 flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md group cursor-default bg-white dark:bg-[#111B21] border border-[#2563EB]/40 dark:border-[#2A3942] dark:hover:border-[#00A884]/60 rounded-[10.44px] p-4"
              style={{
                width: "clamp(140px, 15vw, 157.89px)",
                height: 117.44,
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
                <span className="font-['Inter'] font-bold text-[13.05px] text-[#2563EB] dark:text-[#E9EDEF]">
                  Instant Sync
                </span>
                <span className="font-['Inter'] font-normal text-[11.74px] text-[#2563EB]/80 dark:text-[#8696A0]">
                  All devices
                </span>
              </div>
            </div>
          </div>

          {/* ── APP DOWNLOAD CARD & PHONE MOCKUPS ── */}
          <div className="relative z-20 mx-auto lg:mx-0 w-full max-w-[402px] lg:ml-[78px] xl:ml-[78px]">
            <div
              className="bg-white dark:bg-[#111B21] border border-[#F3F4F6] dark:border-[#222D34] rounded-2xl p-5 flex flex-col gap-5 shadow-xs dark:shadow-md transition-colors"
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 11 }}>
                <span
                  className="text-[#101828] dark:text-[#E9EDEF]"
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
                  className="flex items-center justify-center gap-2 w-full max-w-[188px] h-[55px] px-4 py-2.5 border-2 border-[#E5E7EB] dark:border-[#2A3942] rounded-[18px] bg-transparent hover:bg-slate-50 dark:hover:bg-[#202C33]/60 hover:border-blue-500 dark:hover:border-[#00A884] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-[#00A884]"
                  aria-label="Download from Google Play"
                >
                  <svg width={20} height={20} viewBox="0 0 512 512">
                    <path fill="#3BCCFF" d="M22 0C10.7 7.5 3 22 3 41.5v429c0 19.5 7.7 34 19 41.5l257.5-256L22 0z" />
                    <path fill="#FF3333" d="M346.5 268l-68-68L22 429c13.2 12.3 33.7 13.8 54 2.1L346.5 268z" />
                    <path fill="#FFD400" d="M346.5 244l102.5-59c23.5-13.5 23.5-35.5 0-49L346.5 77l-68 68 68 99z" />
                    <path fill="#48FF48" d="M22 83l256.5 256 68-68L76 2.1C55.7-9.6 35.2-8.1 22 4.2L22 83z" />
                  </svg>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <span className="font-['Inter'] font-medium text-[9px] leading-[13.5px] text-[#6A7282] dark:text-[#8696A0]">
                      GET IT ON
                    </span>
                    <span className="text-[#101828] dark:text-[#E9EDEF]" style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 14, lineHeight: "17.5px" }}>
                      Google Play
                    </span>
                  </div>
                </button>

                {/* App Store */}
                <button
                  type="button"
                  onClick={() => setIsDownloadModalOpen(true)}
                  className="flex items-center justify-center gap-2 w-full max-w-[188px] h-[55px] px-4 py-2.5 border-2 border-[#E5E7EB] dark:border-[#2A3942] rounded-[18px] bg-transparent hover:bg-slate-50 dark:hover:bg-[#202C33]/60 hover:border-blue-500 dark:hover:border-[#00A884] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-[#00A884]"
                  aria-label="Download on App Store"
                >
                  <svg width={20} height={20} viewBox="0 0 384 512" className="fill-[#101828] dark:fill-[#E9EDEF]">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                  </svg>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <span className="font-['Inter'] font-medium text-[9px] leading-[13.5px] text-[#6A7282] dark:text-[#8696A0]">
                      Download on the
                    </span>
                    <span className="text-[#101828] dark:text-[#E9EDEF]" style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 14, lineHeight: "17.5px" }}>
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
          <div className="w-full bg-white dark:bg-[#111B21] rounded-[28px] border border-[#E9ECEF] dark:border-[#222D34] p-6 sm:p-8 md:p-9 shadow-[0_4px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.45)] transition-all duration-300 flex flex-col gap-6">
            
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
                    <div className="w-6 h-6 rounded-full border border-[#D1D7DB] dark:border-[#2A3942] bg-white dark:bg-[#202C33] text-[#111B21] dark:text-[#E9EDEF] text-[12px] font-semibold flex items-center justify-center shrink-0 shadow-2xs">
                      1
                    </div>
                    <div className="w-[1.5px] h-7 bg-[#E2E8F0] dark:bg-[#2A3942] my-1" />
                  </div>
                  <p className="text-[14px] text-[#3B4A54] dark:text-[#8696A0] pt-0.5 leading-snug">
                    Open CallsChat on your phone
                  </p>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3.5">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full border border-[#D1D7DB] dark:border-[#2A3942] bg-white dark:bg-[#202C33] text-[#111B21] dark:text-[#E9EDEF] text-[12px] font-semibold flex items-center justify-center shrink-0 shadow-2xs">
                      2
                    </div>
                    <div className="w-[1.5px] h-7 bg-[#E2E8F0] dark:bg-[#2A3942] my-1" />
                  </div>
                  <p className="text-[14px] text-[#3B4A54] dark:text-[#8696A0] pt-0.5 leading-snug">
                    Tap <strong className="font-semibold text-[#111B21] dark:text-[#E9EDEF]">Menu</strong> or <strong className="font-semibold text-[#111B21] dark:text-[#E9EDEF]">Settings</strong> and select <strong className="font-semibold text-[#111B21] dark:text-[#E9EDEF]">Linked Devices</strong>
                  </p>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3.5">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full border border-[#D1D7DB] dark:border-[#2A3942] bg-white dark:bg-[#202C33] text-[#111B21] dark:text-[#E9EDEF] text-[12px] font-semibold flex items-center justify-center shrink-0 shadow-2xs">
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
                  className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#037CFD] dark:text-[#53BDEB] hover:underline cursor-pointer group focus:outline-none"
                >
                  <span>Need help?</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* ── QR CODE FRAME (With Centered CallsChat Logo & Subtle Animations) ── */}
            <div className="w-full flex flex-col items-center justify-center py-1">
              <div className="relative w-full max-w-[260px] aspect-square bg-white rounded-2xl p-4 border border-slate-200/90 dark:border-[#2A3942] shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.6)] flex items-center justify-center overflow-hidden transition-all duration-300">
                
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

                {/* Expired / Error overlay with soothing dark backdrop */}
                {(isExpired || isError) && (
                  <div className="absolute inset-0 bg-white/95 dark:bg-[#111B21]/95 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center gap-2.5 animate-in fade-in duration-200">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#202C33] text-slate-700 dark:text-[#E9EDEF] flex items-center justify-center shadow-xs border border-transparent dark:border-[#2A3942]">
                      <RefreshCw size={20} className="text-slate-600 dark:text-[#8696A0]" />
                    </div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-[#E9EDEF]">
                      {isError ? errorMessage || "Connection failed" : "QR code expired"}
                    </p>
                    <button
                      type="button"
                      onClick={refreshQrCode}
                      className="px-4 py-2 rounded-xl bg-[#037CFD] dark:bg-[#00A884] hover:bg-blue-600 dark:hover:bg-[#008069] text-white text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00A884]"
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
                    Expires in <strong className="font-semibold text-[#111B21] dark:text-[#E9EDEF]">{formatTime(countdown)}</strong>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={refreshQrCode}
                  disabled={isLoading || isSuccess}
                  className="text-xs font-semibold text-[#037CFD] dark:text-[#53BDEB] hover:underline disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer group"
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
            <div className="pt-4 border-t border-slate-100 dark:border-[#222D34] flex flex-col sm:flex-row items-center justify-between gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#3B4A54] dark:text-[#8696A0]">
                <input
                  type="checkbox"
                  checked={stayLoggedIn}
                  onChange={(e) => setStayLoggedIn(e.target.checked)}
                  className="w-4 h-4 rounded text-[#037CFD] focus:ring-[#037CFD] border-slate-300 dark:border-[#2A3942] dark:bg-[#202C33] accent-[#037CFD] dark:accent-[#00A884] cursor-pointer"
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
                onClick={() => router.push("/login")}
                className="text-xs sm:text-sm font-semibold text-[#037CFD] dark:text-[#53BDEB] hover:underline inline-flex items-center gap-0.5 cursor-pointer group focus:outline-none"
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
                className="font-semibold text-[#037CFD] dark:text-[#53BDEB] hover:underline inline-flex items-center gap-0.5 ml-0.5 group"
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
            className="animate-in fade-in slide-in-from-bottom-3 duration-200 w-[170px] bg-white dark:bg-[#202C33] border border-[#E8E8E8] dark:border-[#2A3942] rounded-2xl shadow-[4px_4px_23.3px_0px_rgba(0,0,0,0.19)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden pb-2"
          >
            {/* Need help heading */}
            <div className="px-4 pt-3 pb-2 flex items-center justify-between">
              <span className="font-['Roboto'] font-bold text-base text-[#102A63] dark:text-[#E9EDEF]">
                Need help?
              </span>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:text-[#8696A0] dark:hover:text-[#E9EDEF] p-0.5 cursor-pointer"
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
              className="flex items-center gap-2 px-3 py-2 bg-transparent hover:bg-blue-50 dark:hover:bg-[#111B21] transition-colors text-left cursor-pointer group"
            >
              <MessageSquare size={18} className="text-[#102A63] dark:text-[#00A884] group-hover:scale-105 transition-transform" />
              <span className="font-['Roboto'] font-medium text-xs text-[#102A63] dark:text-[#E9EDEF]">
                Live Support
              </span>
            </button>

            {/* Help Center */}
            <Link
              href="/#faq"
              onClick={() => setIsHelpOpen(false)}
              className="flex items-center gap-2 px-3 py-2 bg-transparent hover:bg-blue-50 dark:hover:bg-[#111B21] transition-colors text-left cursor-pointer group"
            >
              <HelpCircle size={18} className="text-[#102A63] dark:text-[#00A884] group-hover:scale-105 transition-transform" />
              <span className="font-['Roboto'] font-medium text-xs text-[#102A63] dark:text-[#E9EDEF]">
                Help Center
              </span>
            </Link>

            {/* Email support */}
            <a
              href="mailto:support@callschat.com"
              onClick={() => setIsHelpOpen(false)}
              className="flex items-center gap-2 px-3 py-2 bg-transparent hover:bg-blue-50 dark:hover:bg-[#111B21] transition-colors text-left cursor-pointer group"
            >
              <Mail size={16} className="text-[#102A63] dark:text-[#00A884] group-hover:scale-105 transition-transform" />
              <span className="font-['Roboto'] font-medium text-xs text-[#102A63] dark:text-[#E9EDEF]">
                Email support
              </span>
            </a>
          </div>
        )}

        {/* Floating Bubble Button */}
        <button
          type="button"
          onClick={() => setIsHelpOpen(!isHelpOpen)}
          className="w-12 h-12 rounded-full bg-[#155DFC] dark:bg-[#00A884] hover:bg-blue-700 dark:hover:bg-[#008069] flex items-center justify-center shadow-lg dark:shadow-[0_4px_16px_rgba(0,168,132,0.35)] hover:scale-105 active:scale-95 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-[#00A884]"
          aria-label="Open support menu"
        >
          {isHelpOpen ? <X size={22} className="text-white" /> : <MessageCircle size={24} className="fill-white text-white" />}
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
