"use client";

import * as React from "react";
import { ChevronDown, ChevronLeft, Briefcase, AtSign } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Country } from "react-phone-number-input";
import { getCountries, getCountryCallingCode } from "react-phone-number-input";
import Input from "react-phone-number-input/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";

const getFlagEmoji = (cc: string) => {
  const codePoints = cc.toUpperCase().split("").map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:8000/api/v1";

const STEPS = ["PHONE", "OTP", "DETAILS"] as const;
type Step = (typeof STEPS)[number];

export default function BusinessSignUpScreen() {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>("PHONE");
  const [isPending, startTransition] = React.useTransition();

  // Phone
  const [phoneNumber, setPhoneNumber] = React.useState<string>("");
  const [selectedCountry, setSelectedCountry] = React.useState<Country>("US");
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // OTP
  const [otp, setOtp] = React.useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = React.useState(60);
  const [sentPhone, setSentPhone] = React.useState("");
  const [registrationToken, setRegistrationToken] = React.useState("");

  // Details
  const [ownerName, setOwnerName] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [businessHandle, setBusinessHandle] = React.useState("");
  const [handleError, setHandleError] = React.useState("");

  const countries = getCountries();
  const regionNames = React.useMemo(() => new Intl.DisplayNames(["en"], { type: "region" }), []);
  const filteredCountries = React.useMemo(() => {
    if (!searchQuery) return countries;
    const q = searchQuery.toLowerCase();
    return countries.filter((c) => {
      let n = "";
      try { n = regionNames.of(c as string)?.toLowerCase() ?? ""; } catch {}
      return n.includes(q) || c.toLowerCase().includes(q) || getCountryCallingCode(c).includes(q);
    });
  }, [countries, searchQuery, regionNames]);

  React.useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false); setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  React.useEffect(() => {
    if (step !== "OTP") return;
    setTimer(60);
    const id = setInterval(() => setTimer((t) => {
      if (t <= 1) { clearInterval(id); return 0; }
      return t - 1;
    }), 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Sanitise handle as user types
  const handleHandleChange = (val: string) => {
    const sanitised = val.replace(/[^a-zA-Z0-9_-]/g, "");
    setBusinessHandle(sanitised);
    setHandleError(
      sanitised.length > 0 && sanitised.length < 3
        ? "Handle must be at least 3 characters"
        : ""
    );
  };

  const handleRequestOTP = () => {
    const phone = phoneNumber?.replace(/\s+/g, "").trim();
    if (!phone) return;
    startTransition(async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/otp/request`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: phone }),
        });
        const data = await res.json();
        if (data.success) { 
          if (data.data?.devOtp) {
            console.log("\\n==================================");
            console.log(`🔑 DEV OTP: ${data.data.devOtp}`);
            console.log("==================================\\n");
          }
          setSentPhone(phone); setStep("OTP"); setTimer(60); toast.success("Code sent!"); 
        }
        else toast.error(data.error?.message ?? data.message ?? "Failed to send OTP.");
      } catch { toast.error("Network error."); }
    });
  };

  const handleVerifyOTP = () => {
    const otpStr = otp.join("").trim();
    if (otpStr.length !== 6 || !sentPhone) return;
    startTransition(async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/otp/verify`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: sentPhone, otp: otpStr }),
        });
        const data = await res.json();
        const token = data.data?.registrationToken ?? data.registrationToken;
        const isExisting = data.data?.isExistingUser ?? data.isExistingUser;
        const existingAccountType = data.data?.existingAccountType ?? data.existingAccountType;
        if (data.success && token) {
          if (isExisting || existingAccountType) {
            if (existingAccountType === "PERSONAL") {
              toast.error(
                "This phone number is already registered as a Personal account. You cannot create a Business account with the same phone number."
              );
              return;
            }
            toast.info("Account found! Logging you in…");
            await autoLogin(token);
          } else {
            setRegistrationToken(token);
            setStep("DETAILS");
            toast.success("Phone verified!");
          }
        } else {
          toast.error(data.error?.message ?? data.message ?? "Verification failed.");
        }
      } catch { toast.error("Network error."); }
    });
  };

  const handleRegister = () => {
    if (!ownerName.trim() || !companyName.trim() || businessHandle.length < 3) return;
    if (!registrationToken) return;
    startTransition(async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${registrationToken}` },
          body: JSON.stringify({
            name: ownerName.trim(),
            accountType: "BUSINESS",
            companyName: companyName.trim(),
            businessHandle: businessHandle.trim().toLowerCase(),
          }),
        });
        const data = await res.json();
        const accessToken = data.data?.tokens?.accessToken ?? data.data?.accessToken;
        const refreshToken = data.data?.tokens?.refreshToken ?? data.data?.refreshToken;
        if ((data.success || res.ok) && accessToken) {
          storeTokens(accessToken, refreshToken);
          localStorage.setItem("currentMode", "BUSINESS");
          localStorage.setItem("auth_account_mode", "BUSINESS");
          sessionStorage.setItem("auth_account_mode", "BUSINESS");
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent('workspaceModeChanged', { detail: { mode: 'BUSINESS' } }));
          }
          toast.success("Business account created! Welcome.");
          await new Promise((r) => setTimeout(r, 50));
          router.push("/business/dashboard");
        } else {
          const msg = data.error?.message ?? data.message ?? "Registration failed.";
          if (msg.toLowerCase().includes("handle")) setHandleError(msg);
          else toast.error(msg);
        }
      } catch { toast.error("Network error."); }
    });
  };

  async function autoLogin(token: string) {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      const accessToken = data.data?.tokens?.accessToken ?? data.data?.accessToken;
      const refreshToken = data.data?.tokens?.refreshToken ?? data.data?.refreshToken;
      const accountType = data.data?.user?.accountType ?? "PERSONAL";
      if ((data.success || res.ok) && accessToken) {
        storeTokens(accessToken, refreshToken);
        localStorage.setItem("currentMode", accountType);
        localStorage.setItem("auth_account_mode", accountType);
        sessionStorage.setItem("auth_account_mode", accountType);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent('workspaceModeChanged', { detail: { mode: accountType } }));
        }
        await new Promise((r) => setTimeout(r, 50));
        router.push(accountType === "BUSINESS" ? "/business/dashboard" : "/chats");
      } else {
        toast.error(data.error?.message ?? data.message ?? "Login failed.");
      }
    } catch { toast.error("Network error during login."); }
  }

  function storeTokens(access: string, refresh?: string) {
    localStorage.setItem("accessToken", access);
    document.cookie = `accessToken=${access}; path=/; max-age=2592000`;
    if (refresh) {
      localStorage.setItem("refreshToken", refresh);
      document.cookie = `refreshToken=${refresh}; path=/; max-age=2592000`;
    }
  }

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    if (val.length > 1) val = val.slice(-1);
    const next = [...otp]; next[idx] = val; setOtp(next);
    if (val && idx < 5) document.getElementById(`b-otp-${idx + 1}`)?.focus();
  };
  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) document.getElementById(`b-otp-${idx - 1}`)?.focus();
  };
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!p) return;
    const next = [...otp];
    for (let i = 0; i < p.length; i++) next[i] = p[i]!;
    setOtp(next);
    document.getElementById(`b-otp-${Math.min(p.length, 5)}`)?.focus();
  };
  const isOtpComplete = otp.every((d) => d.length === 1) && !!sentPhone;
  const isDetailsValid = ownerName.trim().length >= 2 && companyName.trim().length >= 2 && businessHandle.length >= 3 && !handleError;

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-b from-[#7C3AED] to-[#5B21B6] font-sans relative">
      {/* Top Header Bar */}
      <div className="absolute top-6 left-6 sm:left-12 flex items-center justify-between w-[calc(100%-3rem)] sm:w-[calc(100%-6rem)] z-20">
        <button
          type="button"
          onClick={() => {
            if (step === "DETAILS") setStep("OTP");
            else if (step === "OTP") setStep("PHONE");
            else router.back();
          }}
          className="flex items-center gap-2 text-sm sm:text-base font-semibold text-white/90 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/call_chats_logo.png" height={34} width={34} alt="CallsChat Logo" className="drop-shadow-sm" />
          <span className="font-extrabold text-lg sm:text-xl text-white tracking-tight">
            Calls<span className="text-purple-200">Chat</span>
          </span>
        </Link>
      </div>

      {/* Top Hero Header Section */}
      <div className="flex flex-col items-center justify-center pt-16 pb-12 sm:pb-14 text-white px-4 relative z-10">
        {step === "PHONE" && (
          <>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-sm">
              <Briefcase className="h-7 w-7 text-white" strokeWidth={1.8} />
            </div>
            <h1 className="text-3xl sm:text-[36px] font-extrabold tracking-tight mb-2 text-center">
              Create Business Account
            </h1>
            <p className="text-purple-100 font-medium text-center text-sm sm:text-base">
              Power up your business communications
            </p>
          </>
        )}

        {step === "OTP" && (
          <>
            <h1 className="text-3xl sm:text-[36px] font-extrabold tracking-tight mb-2 text-center">
              Verify Your Phone
            </h1>
            <p className="text-purple-100 font-medium text-center text-sm sm:text-base">
              We&apos;ve sent a code to <span className="font-bold text-white">{sentPhone}</span>
            </p>
          </>
        )}

        {step === "DETAILS" && (
          <>
            <h1 className="text-3xl sm:text-[36px] font-extrabold tracking-tight mb-2 text-center">
              Set Up Your Workspace
            </h1>
            <p className="text-purple-100 font-medium text-center text-sm sm:text-base">
              Tell us about your business
            </p>
          </>
        )}
      </div>

      {/* Bottom White Card Section */}
      <div className="flex-1 rounded-t-[2.5rem] sm:rounded-t-[3.5rem] bg-white px-6 py-10 sm:px-12 flex flex-col items-center shadow-2xl relative z-10 w-full">
        
        {/* ── STEP: PHONE ─────────────────────────────────────────── */}
        {step === "PHONE" && (
          <div className="w-full max-w-[420px] flex-1 flex flex-col pt-2 sm:pt-4">
            <div className="space-y-1.5 mb-6">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#2D1B69]">
                Enter your phone number
              </h2>
              <p className="text-sm font-medium text-[#64748B] leading-relaxed">
                Make sure this number can receive SMS. You&apos;ll receive your activation code through it.
              </p>
            </div>

            <div className="space-y-2 mb-8">
              <label className="text-xs font-bold text-slate-700 pl-1">
                Phone number
              </label>
              <div className="flex items-center gap-3">
                {/* Country selector */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex h-13 w-[105px] items-center justify-between rounded-xl border border-purple-100 bg-[#F5F3FF] px-3 transition-all focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-600/20 hover:border-purple-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <span className="text-lg">
                        {getFlagEmoji(selectedCountry)}
                      </span>
                      <span className="text-sm">
                        +{getCountryCallingCode(selectedCountry)}
                      </span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute left-0 top-14 z-50 flex max-h-72 w-64 flex-col rounded-xl bg-white py-2 shadow-xl border border-slate-100 overflow-hidden">
                      <div className="px-3 pb-2 pt-1 shrink-0">
                        <input
                          type="text"
                          placeholder="Search country…"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600/30"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="flex-1 overflow-y-auto min-h-0">
                        {filteredCountries.length > 0 ? (
                          filteredCountries.map((c) => {
                            let cName = c as string;
                            try {
                              cName = regionNames.of(c as string) ?? c;
                            } catch {}
                            return (
                              <button
                                key={c}
                                type="button"
                                onClick={() => {
                                  setSelectedCountry(c);
                                  setIsDropdownOpen(false);
                                  setSearchQuery("");
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-semibold text-slate-600 transition-colors hover:bg-purple-50 hover:text-purple-600 cursor-pointer"
                              >
                                <span className="text-base">
                                  {getFlagEmoji(c)}
                                </span>
                                <span className="w-10 shrink-0 text-slate-400">
                                  +{getCountryCallingCode(c)}
                                </span>
                                <span className="ml-auto text-xs font-medium truncate">
                                  {cName}
                                </span>
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-4 py-4 text-center text-sm text-slate-500">
                            No countries found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Input
                  country={selectedCountry}
                  value={phoneNumber}
                  onChange={(v) => setPhoneNumber(v || "")}
                  placeholder="000 000 0000"
                  disabled={isPending}
                  className="flex h-13 flex-1 rounded-xl border border-purple-100 bg-[#F5F3FF] px-4 text-sm font-semibold text-slate-800 placeholder-slate-400 transition-all focus:border-purple-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600/20 hover:border-purple-200"
                />
              </div>
            </div>

            <div className="mt-auto pt-6 pb-6 space-y-6">
              <button
                type="button"
                onClick={handleRequestOTP}
                disabled={!phoneNumber || isPending}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-xl h-13 py-4 text-base font-bold transition-all duration-200 shadow-sm cursor-pointer",
                  phoneNumber && !isPending
                    ? "bg-[#7C3AED] text-white hover:bg-purple-700 active:scale-[0.99] shadow-lg shadow-purple-600/25"
                    : "cursor-not-allowed bg-slate-100 text-slate-400"
                )}
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending…
                  </span>
                ) : (
                  "Continue"
                )}
              </button>

              <p className="text-center text-sm font-medium text-slate-500">
                Already have an account?{" "}
                <Link
                  href="/auth/business/login"
                  className="font-bold text-[#7C3AED] hover:underline"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* ── STEP: OTP ───────────────────────────────────────────── */}
        {step === "OTP" && (
          <div className="w-full max-w-[420px] flex-1 flex flex-col pt-2 sm:pt-4">
            <div className="space-y-1.5 mb-8">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#2D1B69]">
                Enter the code below
              </h2>
              <p className="text-sm font-medium text-[#64748B]">
                We sent a 6-digit verification code to your phone
              </p>
            </div>

            <div className="flex justify-center gap-2 sm:gap-3 mb-8">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`b-otp-${idx}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  disabled={isPending}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  onPaste={handleOtpPaste}
                  className="h-13 w-11 sm:h-14 sm:w-13 rounded-xl border border-purple-100 bg-[#F5F3FF] text-center text-xl font-bold text-[#1E293B] transition-all focus:border-purple-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600/20"
                />
              ))}
            </div>

            <div className="text-center text-sm font-medium text-slate-500 mb-8">
              Didn&apos;t receive the code?{" "}
              {timer > 0 ? (
                <span className="font-bold text-purple-400 cursor-not-allowed">
                  Resend ({Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")})
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestOTP}
                  disabled={isPending}
                  className="font-bold text-[#7C3AED] hover:underline cursor-pointer"
                >
                  Resend
                </button>
              )}
            </div>

            <div className="mt-auto pt-6 pb-6">
              <button
                type="button"
                onClick={handleVerifyOTP}
                disabled={!isOtpComplete || isPending}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-xl h-13 py-4 text-base font-bold transition-all duration-200 shadow-sm cursor-pointer",
                  isOtpComplete && !isPending
                    ? "bg-[#7C3AED] text-white hover:bg-purple-700 active:scale-[0.99] shadow-lg shadow-purple-600/25"
                    : "cursor-not-allowed bg-slate-100 text-slate-400"
                )}
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Verifying…
                  </span>
                ) : (
                  "Verify & Continue"
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: DETAILS ───────────────────────────────────────── */}
        {step === "DETAILS" && (
          <div className="w-full max-w-[420px] flex-1 flex flex-col pt-2 sm:pt-4">
            <div className="space-y-1.5 mb-6">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#2D1B69]">
                Workspace Details
              </h2>
              <p className="text-sm font-medium text-[#64748B]">
                Tell us about your business workspace
              </p>
            </div>

            <div className="space-y-5">
              {/* Owner name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 pl-1">
                  Your full name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Connor"
                  value={ownerName}
                  disabled={isPending}
                  onChange={(e) => setOwnerName(e.target.value)}
                  autoFocus
                  className="flex h-13 w-full rounded-xl border border-purple-100 bg-[#F5F3FF] px-4 text-sm font-semibold text-slate-800 placeholder-slate-400 transition-all focus:border-purple-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600/20 hover:border-purple-200"
                />
              </div>

              {/* Company name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 pl-1">
                  Company name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={companyName}
                  disabled={isPending}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="flex h-13 w-full rounded-xl border border-purple-100 bg-[#F5F3FF] px-4 text-sm font-semibold text-slate-800 placeholder-slate-400 transition-all focus:border-purple-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600/20 hover:border-purple-200"
                />
              </div>

              {/* Business handle */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 pl-1">
                  Business handle <span className="font-normal text-slate-400">(unique username)</span>
                </label>
                <div className="relative">
                  <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="acme-corp"
                    value={businessHandle}
                    disabled={isPending}
                    onChange={(e) => handleHandleChange(e.target.value)}
                    className={cn(
                      "flex h-13 w-full rounded-xl border pl-10 pr-4 text-sm font-semibold text-slate-800 placeholder-slate-400 transition-all focus:outline-none focus:ring-2",
                      handleError
                        ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500/20"
                        : "border-purple-100 bg-[#F5F3FF] focus:border-purple-600 focus:bg-white focus:ring-purple-600/20 hover:border-purple-200"
                    )}
                  />
                </div>
                {handleError && <p className="text-xs font-semibold text-red-500 pl-1">{handleError}</p>}
                {!handleError && businessHandle && (
                  <p className="text-xs font-medium text-slate-500 pl-1">
                    Your workspace will be @{businessHandle.toLowerCase()}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-auto pt-8 pb-6 space-y-4">
              <button
                type="button"
                onClick={handleRegister}
                disabled={!isDetailsValid || isPending}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-xl h-13 py-4 text-base font-bold transition-all duration-200 shadow-sm cursor-pointer",
                  isDetailsValid && !isPending
                    ? "bg-[#7C3AED] text-white hover:bg-purple-700 active:scale-[0.99] shadow-lg shadow-purple-600/25"
                    : "cursor-not-allowed bg-slate-100 text-slate-400"
                )}
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating workspace…
                  </span>
                ) : (
                  "Create Business Account"
                )}
              </button>

              <p className="text-xs text-center text-slate-400 leading-relaxed font-medium">
                By continuing, you agree to our{" "}
                <Link href="/terms-of-service" className="text-purple-600 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy-policy" className="text-purple-600 hover:underline">
                  Privacy Policy
                </Link>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
