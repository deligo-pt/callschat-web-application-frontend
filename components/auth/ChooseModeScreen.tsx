"use client";

import * as React from "react";
import {
  User,
  Briefcase,
  ChevronLeft,
  Sparkles,
  Globe,
  ArrowRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

// ---------------------------------------------------------------------------
// Feature list bullet
// ---------------------------------------------------------------------------
function FeatureItem({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-slate-600">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#3B58F5]" />
      {label}
    </li>
  );
}

function BusinessFeatureItem({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-slate-600">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-purple-600" />
      {label}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
interface ChooseModeScreenProps {
  authType?: "login" | "signup";
}

export default function ChooseModeScreen({ authType = "signup" }: ChooseModeScreenProps) {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = React.useState<"PERSONAL" | "BUSINESS" | null>(null);

  const isLogin = authType === "login";

  const handleContinue = () => {
    if (!selectedMode) return;
    sessionStorage.setItem("auth_account_mode", selectedMode);
    localStorage.setItem("auth_account_mode", selectedMode);
    localStorage.setItem("currentMode", selectedMode);
    
    if (isLogin) {
      router.push(selectedMode === "BUSINESS" ? "/auth/business/login" : "/auth/personal/login");
    } else {
      router.push(selectedMode === "BUSINESS" ? "/auth/business/signup" : "/auth/personal/signup");
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#F8FAFC] font-sans">
      <div className="flex w-full min-h-screen">

        {/* ── Left Brand Showcase Column ───────────────────────────────── */}
        <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between bg-gradient-to-br from-[#0A2540] via-[#102A63] to-[#1A62E8] p-12 text-white relative overflow-hidden">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-12 right-12 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 relative z-10">
            <Image src="/call_chats_logo.png" height={56} width={56} alt="CallsChat Logo" priority className="drop-shadow-md" />
            <span className="text-2xl font-extrabold tracking-tight text-white">
              Calls<span className="text-[#1AC1F2]">Chat</span>
            </span>
          </Link>

          {/* Center showcase */}
          <div className="my-auto max-w-lg relative z-10 space-y-8 py-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur-md border border-white/15 text-[#1AC1F2]">
              <Sparkles className="h-3.5 w-3.5" /> Choose your path
            </div>

            <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight">
              One platform, <br />
              <span className="bg-gradient-to-r from-blue-300 via-[#1AC1F2] to-indigo-200 bg-clip-text text-transparent">
                two distinct paths.
              </span>
            </h1>

            <p className="text-base text-blue-100/90 leading-relaxed font-normal">
              {isLogin
                ? "Select your account type to sign in to your workspace or personal inbox — whether connecting with loved ones or managing business communications."
                : "Select your account type at sign-up to unlock the right experience for you — whether you're connecting with loved ones or running a business communication suite."}
            </p>

            <div className="grid grid-cols-1 gap-4 pt-4">
              <div className="flex items-center gap-3.5 rounded-2xl bg-white/5 p-4 backdrop-blur-sm border border-white/10">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-[#1AC1F2]">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Personal Accounts</h4>
                  <p className="text-xs text-blue-200/80">Private E2EE messaging, calls, groups &amp; media sharing.</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl bg-white/5 p-4 backdrop-blur-sm border border-white/10">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Business Accounts</h4>
                  <p className="text-xs text-blue-200/80">Dedicated workspace, team inboxes, automations &amp; analytics.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/15 pt-6 text-xs text-blue-200/80">
            <span className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#1AC1F2]" /> Separate accounts, distinct experiences
            </span>
            <span>© 2026 CallsChat LLC</span>
          </div>
        </div>

        {/* ── Right Selection Column ────────────────────────────────────── */}
        <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:w-7/12 xl:w-1/2 lg:px-20 xl:px-28 bg-white relative">

          {/* Top bar */}
          <div className="absolute top-6 left-6 sm:left-12 flex items-center justify-between w-[calc(100%-3rem)] sm:w-[calc(100%-6rem)]">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm font-semibold text-[#102A63] hover:text-primary transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <Image src="/call_chats_logo.png" height={36} width={36} alt="Logo" />
              <span className="font-bold text-lg text-[#0A2540]">CallsChat</span>
            </div>
          </div>

          {/* Content */}
          <div className="mx-auto w-full max-w-lg space-y-8 my-auto pt-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-[#0A2540]">
                {isLogin ? "Choose Login Mode" : "Choose Your Mode"}
              </h2>
              <p className="text-sm text-[#64748B] leading-relaxed">
                {isLogin ? "Select which account type you want to sign in to" : "Select how you'll use CallsChat"}
              </p>
            </div>

            {/* ── Cards ── */}
            <div className="grid grid-cols-1 gap-4 pt-2">

              {/* Personal Card */}
              <button
                id="choose-mode-personal"
                type="button"
                onClick={() => setSelectedMode("PERSONAL")}
                className={cn(
                  "group relative flex items-start gap-5 rounded-2xl p-6 text-left transition-all duration-200 border-2 cursor-pointer w-full",
                  selectedMode === "PERSONAL"
                    ? "bg-blue-50/60 border-blue-600 shadow-lg shadow-blue-500/10 ring-2 ring-blue-600/20 -translate-y-0.5"
                    : "bg-white border-slate-200 hover:border-slate-300"
                )}
              >
                {/* Icon */}
                <div className={cn(
                  "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-all duration-200",
                  selectedMode === "PERSONAL"
                    ? "bg-gradient-to-br from-[#3B58F5] to-[#1A62E8] shadow-lg shadow-blue-500/30"
                    : "bg-gradient-to-br from-blue-500 to-[#3B58F5]"
                )}>
                  <User className="h-7 w-7 text-white" strokeWidth={1.8} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-bold text-slate-900">Personal Mode</h3>
                    <div className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-200",
                      selectedMode === "PERSONAL"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "border border-slate-300 bg-transparent"
                    )}>
                      {selectedMode === "PERSONAL" && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mb-3">Connect with friends and family</p>
                  <ul className="space-y-1.5">
                    <FeatureItem label="Private messaging" />
                    <FeatureItem label="Voice & video calls" />
                    <FeatureItem label="Secure group chats" />
                    <FeatureItem label="Media sharing" />
                  </ul>
                </div>
              </button>

              {/* Business Card */}
              <button
                id="choose-mode-business"
                type="button"
                onClick={() => setSelectedMode("BUSINESS")}
                className={cn(
                  "group relative flex items-start gap-5 rounded-2xl p-6 text-left transition-all duration-200 border-2 cursor-pointer w-full",
                  selectedMode === "BUSINESS"
                    ? "bg-purple-50/60 border-purple-600 shadow-lg shadow-purple-500/10 ring-2 ring-purple-600/20 -translate-y-0.5"
                    : "bg-white border-slate-200 hover:border-slate-300"
                )}
              >
                {/* Icon */}
                <div className={cn(
                  "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-all duration-200",
                  selectedMode === "BUSINESS"
                    ? "bg-gradient-to-br from-purple-600 to-violet-700 shadow-lg shadow-purple-500/30"
                    : "bg-gradient-to-br from-purple-500 to-violet-600"
                )}>
                  <Briefcase className="h-7 w-7 text-white" strokeWidth={1.8} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-bold text-slate-900">Business Mode</h3>
                    <div className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-200",
                      selectedMode === "BUSINESS"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "border border-slate-300 bg-transparent"
                    )}>
                      {selectedMode === "BUSINESS" && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mb-3">Manage teams, clients, and business communication</p>
                  <ul className="space-y-1.5">
                    <BusinessFeatureItem label="Team management" />
                    <BusinessFeatureItem label="Client communication" />
                    <BusinessFeatureItem label="Analytics & insights" />
                  </ul>
                </div>
              </button>
            </div>

            {/* Continue Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={!selectedMode}
                onClick={handleContinue}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold transition-all duration-200 shadow-sm",
                  selectedMode
                    ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99] cursor-pointer shadow-md shadow-blue-500/20"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                )}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Switch between Login and Sign up */}
            <div className="pt-4 text-center text-sm font-medium text-slate-500">
              {isLogin ? "Don't have an account yet? " : "Already have an account? "}
              <Link
                href={isLogin ? "/signup" : "/login"}
                className="font-bold text-blue-600 hover:underline transition-colors ml-1"
              >
                {isLogin ? "Sign up" : "Log in"}
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
