"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { User, Briefcase, Check, ArrowRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

type Mode = "personal" | "business" | null;

export default function ModeSelection() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = React.useState<Mode>(null);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className="flex min-h-screen w-full bg-[#EEF2F9]" />;

  const handleContinue = () => {
    if (selectedMode) {
      sessionStorage.setItem("auth_account_mode", selectedMode.toUpperCase());
      localStorage.setItem("auth_account_mode", selectedMode.toUpperCase());
      localStorage.setItem("currentMode", selectedMode.toUpperCase());
      router.push(selectedMode === "business" ? "/auth/business/signup" : "/auth/personal/signup");
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#EEF2F9] font-sans text-[#0F172A] relative px-6 py-12 selection:bg-blue-500 selection:text-white">
      {/* Background Subtle Glows */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <div className="absolute top-6 left-6 sm:left-12 flex items-center justify-between w-[calc(100%-3rem)] sm:w-[calc(100%-6rem)] z-20">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm sm:text-base font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/call_chats_logo.png" height={36} width={36} alt="CallsChat Logo" className="drop-shadow-sm" />
          <span className="font-extrabold text-lg sm:text-xl text-[#0A2540]">
            Calls<span className="text-[#2563EB]">Chat</span>
          </span>
        </Link>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-[460px] mx-auto flex flex-col items-center z-10 pt-10 sm:pt-6">
        {/* Title & Subtitle */}
        <div className="text-center mb-8 sm:mb-10 w-full">
          <h1 className="text-3xl sm:text-[34px] font-extrabold tracking-tight text-[#0F172A] mb-2.5">
            Choose Your Mode
          </h1>
          <p className="text-[15px] sm:text-base font-medium text-[#64748B]">
            Select how you&apos;ll use CallsChat
          </p>
        </div>

        {/* Option Cards */}
        <div className="flex flex-col gap-5 w-full">
          
          {/* Personal Mode Card */}
          <button
            type="button"
            onClick={() => setSelectedMode("personal")}
            className={cn(
              "group relative flex flex-col items-start rounded-[24px] p-6 text-left transition-all duration-300 border-2 cursor-pointer w-full bg-white",
              selectedMode === "personal"
                ? "border-[#2563EB] shadow-xl shadow-blue-600/10 scale-[1.01]"
                : "border-transparent shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:border-slate-200 hover:shadow-md"
            )}
          >
            {/* Top Row: Icon & Checkmark */}
            <div className="flex items-center justify-between w-full mb-4">
              <div className={cn(
                "flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300",
                selectedMode === "personal" ? "bg-[#2563EB] shadow-lg shadow-blue-500/30" : "bg-[#2563EB]"
              )}>
                <User className="h-7 w-7 text-white" strokeWidth={1.8} />
              </div>
              {selectedMode === "personal" && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-sm animate-in fade-in zoom-in-50 duration-200">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Typography */}
            <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] mb-1">Personal Mode</h3>
            <p className="text-sm font-medium text-[#64748B] mb-4">Connect with friends and family</p>

            {/* Bullet List */}
            <ul className="space-y-2.5 w-full pt-3 border-t border-slate-100/80">
              {[
                "Private messaging",
                "Voice & video calls",
                "Secure group chats",
                "Media sharing"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-[13px] sm:text-sm font-medium text-[#64748B]">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB]" />
                  {item}
                </li>
              ))}
            </ul>
          </button>

          {/* Business Mode Card */}
          <button
            type="button"
            onClick={() => setSelectedMode("business")}
            className={cn(
              "group relative flex flex-col items-start rounded-[24px] p-6 text-left transition-all duration-300 border-2 cursor-pointer w-full bg-white",
              selectedMode === "business"
                ? "border-[#8B5CF6] shadow-xl shadow-purple-600/10 scale-[1.01]"
                : "border-transparent shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:border-slate-200 hover:shadow-md"
            )}
          >
            {/* Top Row: Icon & Checkmark */}
            <div className="flex items-center justify-between w-full mb-4">
              <div className={cn(
                "flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300",
                selectedMode === "business" ? "bg-[#8B5CF6] shadow-lg shadow-purple-500/30" : "bg-[#8B5CF6]"
              )}>
                <Briefcase className="h-7 w-7 text-white" strokeWidth={1.8} />
              </div>
              {selectedMode === "business" && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#8B5CF6] text-white shadow-sm animate-in fade-in zoom-in-50 duration-200">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Typography */}
            <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] mb-1">Business Mode</h3>
            <p className="text-sm font-medium text-[#64748B] mb-4">Manage teams, clients, and business communication</p>

            {/* Bullet List */}
            <ul className="space-y-2.5 w-full pt-3 border-t border-slate-100/80">
              {[
                "Team management",
                "Client communication",
                "Analytics & insights"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-[13px] sm:text-sm font-medium text-[#64748B]">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#8B5CF6]" />
                  {item}
                </li>
              ))}
            </ul>
          </button>
        </div>

        {/* Continue Button */}
        <div className="mt-8 w-full">
          <button
            type="button"
            disabled={!selectedMode}
            onClick={handleContinue}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-2xl py-4 sm:py-5 text-base sm:text-lg font-bold transition-all duration-300 shadow-sm cursor-pointer",
              selectedMode
                ? selectedMode === "business"
                  ? "bg-[#8B5CF6] text-white hover:bg-[#7C3AED] active:scale-[0.98] shadow-xl shadow-purple-600/25"
                  : "bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:scale-[0.98] shadow-xl shadow-blue-600/25"
                : "bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed"
            )}
          >
            Continue
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
