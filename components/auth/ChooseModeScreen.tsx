"use client";

import * as React from "react";
import { User, ChevronLeft, Briefcase, Sparkles, Globe, ShieldCheck, Zap, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function ChooseModeScreen() {
  const router = useRouter();
  const [accountType, setAccountType] = React.useState<"PERSONAL" | "BUSINESS">("PERSONAL");

  const handleContinue = () => {
    sessionStorage.setItem("auth_account_mode", accountType);
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen w-full bg-[#F8FAFC] font-sans">
      {/* Web Split-Screen Container */}
      <div className="flex w-full min-h-screen">
        
        {/* Left Brand Showcase Column */}
        <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between bg-gradient-to-br from-[#0A2540] via-[#102A63] to-[#1A62E8] p-12 text-white relative overflow-hidden">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-12 right-12 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

          {/* Top Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 relative z-10">
            <Image src="/call_chats_logo.png" height={56} width={56} alt="CallsChat Logo" priority className="drop-shadow-md" />
            <span className="text-2xl font-extrabold tracking-tight text-white">
              Calls<span className="text-[#1AC1F2]">Chat</span>
            </span>
          </Link>

          {/* Center Showcase Content */}
          <div className="my-auto max-w-lg relative z-10 space-y-8 py-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur-md border border-white/15 text-[#1AC1F2]">
              <Sparkles className="h-3.5 w-3.5" /> Tailored Workspace Environments
            </div>
            
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight">
              One platform, <br />
              <span className="bg-gradient-to-r from-blue-300 via-[#1AC1F2] to-indigo-200 bg-clip-text text-transparent">
                two powerful modes.
              </span>
            </h1>
            
            <p className="text-base text-blue-100/90 leading-relaxed font-normal">
              Whether you are connecting with friends and family or managing a dedicated enterprise communication suite, CallsChat dynamically adapts its interface to your workflow.
            </p>

            <div className="grid grid-cols-1 gap-4 pt-4">
              <div className="flex items-center gap-3.5 rounded-2xl bg-white/5 p-4 backdrop-blur-sm border border-white/10">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-[#1AC1F2]">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Personal Workspace</h4>
                  <p className="text-xs text-blue-200/80">Streamlined calling, groups, and HD video messaging.</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl bg-white/5 p-4 backdrop-blur-sm border border-white/10">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Business Suite</h4>
                  <p className="text-xs text-blue-200/80">Verified company badge, client management tools & analytics.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trust Badge */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/15 pt-6 text-xs text-blue-200/80">
            <span className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#1AC1F2]" /> Switch modes effortlessly anytime
            </span>
            <span>© 2026 CallsChat LLC</span>
          </div>
        </div>

        {/* Right Selection Column */}
        <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:w-7/12 xl:w-1/2 lg:px-20 xl:px-28 bg-white relative">
          
          <div className="absolute top-6 left-6 sm:left-12 flex items-center justify-between w-[calc(100%-3rem)] sm:w-[calc(100%-6rem)]">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-semibold text-[#102A63] hover:text-primary transition-colors">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            
            <div className="lg:hidden flex items-center gap-2">
              <Image src="/call_chats_logo.png" height={36} width={36} alt="Logo" />
              <span className="font-bold text-lg text-[#0A2540]">CallsChat</span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-lg space-y-8 my-auto pt-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-[#0A2540]">
                Choose your account experience
              </h2>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Select how you primarily plan to use CallsChat. You can always toggle between modes or add a secondary profile later.
              </p>
            </div>

            {/* Selection Cards Grid */}
            <div className="grid grid-cols-1 gap-4 pt-2">
              {/* Personal Option */}
              <button
                type="button"
                onClick={() => setAccountType("PERSONAL")}
                className={cn(
                  "relative flex items-start gap-4 rounded-2xl p-6 text-left transition-all duration-200 border-2 cursor-pointer",
                  accountType === "PERSONAL"
                    ? "bg-blue-50/60 border-primary shadow-md shadow-blue-500/10 ring-2 ring-primary/20"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                )}
              >
                <div className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors",
                  accountType === "PERSONAL" ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
                )}>
                  <User className="h-6 w-6" />
                </div>
                <div className="flex-1 pr-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Personal Account</h3>
                    {accountType === "PERSONAL" && (
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    Designed for everyday communication. Connect with contacts via encrypted voice, video, and instant messaging.
                  </p>
                </div>
              </button>

              {/* Business Option */}
              <button
                type="button"
                onClick={() => setAccountType("BUSINESS")}
                className={cn(
                  "relative flex items-start gap-4 rounded-2xl p-6 text-left transition-all duration-200 border-2 cursor-pointer",
                  accountType === "BUSINESS"
                    ? "bg-purple-50/60 border-purple-600 shadow-md shadow-purple-500/10 ring-2 ring-purple-600/20"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                )}
              >
                <div className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors",
                  accountType === "BUSINESS" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"
                )}>
                  <Briefcase className="h-6 w-6" />
                </div>
                <div className="flex-1 pr-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      Business Account
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-extrabold text-purple-700 uppercase">Pro</span>
                    </h3>
                    {accountType === "BUSINESS" && (
                      <CheckCircle2 className="h-5 w-5 text-purple-600 shrink-0" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    For professionals and merchants. Unlocks verified organization badges, team collaboration tools, and customer inquiry routing.
                  </p>
                </div>
              </button>
            </div>

            {/* Action button */}
            <button
              type="button"
              onClick={handleContinue}
              className={cn(
                "w-full flex items-center justify-center gap-2 rounded-xl h-14 text-base font-bold text-white transition-all duration-200 shadow-md active:scale-[0.99]",
                accountType === "BUSINESS"
                  ? "bg-purple-600 hover:bg-purple-700 shadow-purple-500/25"
                  : "bg-primary hover:bg-primary/90 shadow-blue-500/25"
              )}
            >
              Continue as {accountType === "BUSINESS" ? "Business" : "Personal"} <ArrowRight className="h-4 w-4" />
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}
