"use client";

import { useQrLogin } from "@/hooks/useQrLogin";
import { Locale, routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  Check,
  Globe,
  HelpCircle,
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

      {/* ── NAVBAR (Figma BusinessLanding: 64px height, exact borders & logo) ── */}
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
          {/* Dark mode toggle */}
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
            {/* Toggle switch */}
            <div
              className="relative transition-colors duration-200"
              style={{
                width: 40,
                height: 22,
                background: isDarkMode ? "#155DFC" : "#155DFC",
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

      {/* ── MAIN CONTENT (Figma 2-Column: 1440px layout max-width) ── */}
      <main className="relative w-full flex-grow flex flex-col lg:flex-row items-center lg:items-start justify-center gap-12 lg:gap-8 px-4 sm:px-8 md:px-12 lg:px-[68px] pt-10 pb-20 max-w-[1440px] mx-auto z-10">

        {/* ── LEFT: Marketing copy & App Downloads ── */}
        <div className="flex flex-col w-full lg:w-1/2 max-w-[565px] lg:pt-10 xl:pt-[41px] relative">
          
          {/* Headings */}
          <div className="flex flex-col mb-5 lg:mb-0 lg:gap-[-10px] text-center lg:text-left">
            <h1
              className="text-4xl sm:text-5xl lg:text-[56px] leading-[1.2em] text-[#101828] dark:text-white m-0"
              style={{ fontFamily: "Roboto", fontWeight: 700 }}
            >
              The future of
            </h1>
            <h1
              className="text-4xl sm:text-5xl lg:text-[56px] leading-[1.2em] text-[#155DFC] m-0 lg:pt-2"
              style={{ fontFamily: "Roboto", fontWeight: 700 }}
            >
              secure messaging
            </h1>
          </div>
          
          {/* Subtitle */}
          <div className="pt-4 lg:pt-5 mb-10 text-center lg:text-left">
            <p
              className="text-lg sm:text-[20px] leading-[1.2em] text-[#6A7282] dark:text-slate-300 max-w-[448px] m-0 mx-auto lg:mx-0"
              style={{ fontFamily: "Roboto", fontWeight: 400 }}
            >
              AI-powered conversations with end-to-end encryption. Connect across devices seamlessly — your privacy, your control, your conversations.
            </p>
          </div>

          {/* ── FEATURE CARDS (Figma Exact 3 Cards Layout) ── */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-[16px] xl:gap-[22.18px] mb-[40px] lg:mb-[90px]">
            
            {/* E2E Encrypted */}
            <div
              className="relative shrink-0 flex flex-col transition-transform duration-200 hover:-translate-y-1"
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
                className="object-cover mb-auto"
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

            {/* AI-Powered (Figma selected/elevated with dark background offset) */}
            <div
              className="relative shrink-0 transition-transform duration-200 hover:-translate-y-1"
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
                  className="object-cover mb-auto"
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
              className="relative shrink-0 flex flex-col transition-transform duration-200 hover:-translate-y-1"
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
                className="object-cover mb-auto"
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

        {/* ── RIGHT: Blue QR Login Panel ── */}
        <div className="flex flex-col w-full lg:w-1/2 max-w-[519px] items-center lg:items-end z-20">
          <div
            className="w-full flex flex-col justify-between shadow-2xl shadow-blue-900/30"
            style={{
              height: "auto",
              minHeight: 642,
              background: "linear-gradient(224deg, rgba(8,46,121,1) 0%, rgba(11,63,165,1) 65%, rgba(15,85,223,1) 100%)",
              borderRadius: 16,
              padding: "70px 0 45px 0",
            }}
          >
            {/* Instructions block */}
            <div className="px-6 sm:px-[57px] flex flex-col gap-[18px]">
              <div className="flex flex-col gap-[2px]">
                <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 19, color: "#fff", lineHeight: "25px" }}>
                  Scan to log in
                </span>
                <span style={{ fontFamily: "Inter", fontWeight: 400, fontSize: 11, color: "#fff", lineHeight: "17px" }}>
                  Use your CallsChat mobile app to scan
                </span>
              </div>
              <div className="flex flex-col gap-[7px]">
                {[
                  { num: "1", text: "Open CallsChat on your phone", numColor: "#CAE3FB" },
                  { num: "2", text: "Tap Menu → Linked Devices", numColor: "#CDE4FB" },
                  { num: "3", text: "Point your camera at this screen", numColor: "#CBE3FB" },
                ].map(({ num, text, numColor }) => (
                  <div key={num} className="flex items-center gap-[9px]">
                    <div
                      style={{
                        width: 28,
                        height: 27,
                        borderRadius: 6,
                        background: "rgba(255,255,255,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontFamily: "Inter", fontWeight: 500, fontSize: 10, color: numColor }}>
                        {num}
                      </span>
                    </div>
                    <span style={{ fontFamily: "Inter", fontWeight: 400, fontSize: 11, color: "#fff" }}>
                      {text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* QR Code box (Figma 311 x 275px) */}
            <div className="w-full flex justify-center mt-10 mb-[14px] px-4">
              <div
                style={{
                  width: "100%",
                  maxWidth: 311,
                  height: 275,
                  background: "#fff",
                  borderRadius: 9,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "7px",
                  position: "relative",
                  boxShadow: "0px 4px 20px rgba(0,0,0,0.15)",
                }}
              >
                {/* Real QR code when token is ready */}
                {isQrReady && qrValue && (
                  <div
                    style={{
                      position: "relative",
                      width: 263,
                      height: 263,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <QRCode
                      value={qrValue}
                      size={263}
                      fgColor="#2563EB"
                      level="Q"
                      style={{ width: "100%", height: "100%", maxWidth: 263, maxHeight: 263 }}
                    />
                    {/* Centered Logo overlay */}
                    <div
                      style={{
                        position: "absolute",
                        width: 65,
                        height: 62,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 62,
                          height: 62,
                          borderRadius: 9999,
                          background: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                        }}
                      >
                        <Image
                          src="/call_chats_logo.png"
                          alt="Logo"
                          width={58}
                          height={42}
                          style={{ objectFit: "contain" }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Loading overlay (connecting / generating) */}
                {isLoading && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 9999,
                        border: "3px solid #E5E7EB",
                        borderTopColor: "#2563EB",
                        animation: "spin 0.9s linear infinite",
                      }}
                    />
                    <span style={{ fontFamily: "Inter", fontWeight: 500, fontSize: 13, color: "#6A7282" }}>
                      {status === "connecting" ? "Connecting…" : "Generating QR…"}
                    </span>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                )}

                {/* Success overlay */}
                {isSuccess && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 9999,
                        background: "#22C55E",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}>
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                    <span style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 14, color: "#16A34A" }}>
                      Logged in!
                    </span>
                    <span style={{ fontFamily: "Inter", fontWeight: 400, fontSize: 12, color: "#6A7282" }}>
                      Redirecting…
                    </span>
                  </div>
                )}

                {/* Error overlay */}
                {isError && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 10,
                      padding: "0 12px",
                      textAlign: "center",
                    }}
                  >
                    <span style={{ fontFamily: "Inter", fontWeight: 500, fontSize: 13, color: "#EF4444" }}>
                      {errorMessage || "Something went wrong."}
                    </span>
                    <button
                      type="button"
                      onClick={refreshQrCode}
                      style={{
                        marginTop: 4,
                        padding: "8px 18px",
                        background: "#2563EB",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontFamily: "Inter",
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      Try again
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* QR refresh info bar (Figma 317px width) */}
            <div className="w-full flex justify-center mt-auto px-4">
              <div
                style={{
                  width: "100%",
                  maxWidth: 317,
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: 18,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <button
                  type="button"
                  onClick={refreshQrCode}
                  aria-label="Refresh QR Code"
                  className="bg-transparent border-0 p-0 cursor-pointer text-white/80 hover:text-white transition-colors shrink-0"
                >
                  <RefreshCw
                    size={20}
                    className={cn(
                      "transition-transform",
                      isLoading || countdown <= 5 ? "animate-spin" : "hover:rotate-180 duration-500"
                    )}
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className="truncate m-0"
                    style={{
                      fontFamily: "Inter",
                      fontWeight: 500,
                      fontSize: "clamp(11px, 2vw, 14px)",
                      lineHeight: "20px",
                      color: "#fff",
                    }}
                  >
                    QR code refreshes automatically
                  </p>
                  <p
                    className="truncate m-0"
                    style={{
                      fontFamily: "Inter",
                      fontWeight: 400,
                      fontSize: "clamp(11px, 2vw, 14px)",
                      lineHeight: "20px",
                      color: "#BEDBFF",
                    }}
                  >
                    {isLoading ? (
                      "Loading…"
                    ) : isError ? (
                      <span style={{ color: "#FCA5A5" }}>Connection error — click refresh</span>
                    ) : isSuccess ? (
                      <span style={{ color: "#86EFAC" }}>Logged in! Redirecting…</span>
                    ) : (
                      <>
                        Expires in{" "}
                        <strong style={{ fontWeight: 700, color: "#fff" }}>
                          {formatTime(countdown)}
                        </strong>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── PHONE LOGIN BUTTON (Figma 458 x 56px #155DFC, navigates to /login) ── */}
          <div className="w-full flex flex-col items-center justify-center mt-[10px] lg:mt-8 gap-2">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="hover:scale-[1.01] active:scale-[0.98] transition-transform cursor-pointer"
              style={{
                width: "100%",
                maxWidth: 458,
                height: 56,
                background: "#155DFC",
                borderRadius: 16,
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                boxShadow: "0px 2px 4px -2px rgba(0,0,0,.1),0px 4px 6px -1px rgba(0,0,0,.1)",
              }}
            >
              <Phone size={20} fill="#fff" color="#fff" />
              <span
                style={{
                  fontFamily: "Inter",
                  fontWeight: 600,
                  fontSize: 16,
                  lineHeight: "24px",
                  color: "#fff",
                }}
              >
                Log in with phone number
              </span>
            </button>

            {/* Subtle Sign Up Link for New Users */}
            <div className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              New to CallsChat?{" "}
              <Link
                href="/signup"
                className="font-bold text-[#155DFC] hover:underline transition-colors ml-0.5"
              >
                Create an account
              </Link>
            </div>
          </div>

          {/* ── E2E ENCRYPTED TEXT (Figma 9px #102A63) ── */}
          <div className="w-full flex justify-center xl:justify-center mt-3 lg:mt-[40px] mb-8 lg:mb-0">
            <p
              className="text-center"
              style={{
                fontFamily: "Inter",
                fontWeight: 400,
                fontSize: 9,
                color: "#102A63",
                margin: 0,
              }}
            >
              End-to-end encrypted - Your data stays private
            </p>
          </div>
        </div>
      </main>

      {/* ── HELP WIDGET (Figma 146 x 234px #102A63 Support Card & Floating Button) ── */}
      <div
        ref={helpRef}
        className="fixed z-50 bottom-6 right-6 flex flex-col items-end gap-2"
      >
        {isHelpOpen && (
          <div
            className="animate-in fade-in slide-in-from-bottom-3 duration-200"
            style={{
              width: 146,
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
            <div style={{ padding: "12px 18px 8px" }} className="flex items-center justify-between">
              <span style={{ fontFamily: "Roboto", fontWeight: 700, fontSize: 18, color: "#102A63" }}>
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
                router.push("/login");
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
              <MessageSquare size={20} color="#102A63" />
              <span style={{ fontFamily: "Roboto", fontWeight: 500, fontSize: 12, color: "#102A63" }}>
                Live Chat
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

            {/* SMS / chat FAB icon inside panel */}
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  background: "#155DFC",
                  borderRadius: 9999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0px 4px 6px -4px rgba(0,0,0,.1),0px 10px 15px -3px rgba(0,0,0,.1)",
                }}
              >
                <MessageCircle size={22} fill="#fff" color="#fff" />
              </div>
            </div>
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
