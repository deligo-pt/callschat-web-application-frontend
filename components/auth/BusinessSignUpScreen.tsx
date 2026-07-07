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
  const [phoneNumber, setPhoneNumber] = React.useState<string | undefined>();
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
    const id = setInterval(() => setTimer((t) => { if (t <= 1) { clearInterval(id); return 0; } return t - 1; }), 1000);
    return () => clearInterval(id);
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
        if (data.success) { setSentPhone(phone); setStep("OTP"); setTimer(60); toast.success("Code sent!"); }
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
    <div className="flex min-h-screen w-full bg-[#F8FAFC] font-sans">
      <div className="flex w-full min-h-screen">

        {/* Left brand column */}
        <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between bg-gradient-to-br from-[#2D1B69] via-[#4A1D96] to-[#6D28D9] p-12 text-white relative overflow-hidden">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-12 right-12 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />

          <Link href="/" className="flex items-center gap-3 relative z-10">
            <Image src="/call_chats_logo.png" height={56} width={56} alt="CallsChat" priority className="drop-shadow-md" />
            <span className="text-2xl font-extrabold tracking-tight">Calls<span className="text-purple-300">Chat</span></span>
          </Link>

          <div className="my-auto max-w-lg relative z-10 space-y-8 py-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur-md border border-white/15 text-purple-300">
              <Briefcase className="h-3.5 w-3.5" /> Business Account
            </div>
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight">
              Power up your <br />
              <span className="bg-gradient-to-r from-purple-300 via-violet-300 to-pink-200 bg-clip-text text-transparent">
                business comms.
              </span>
            </h1>
            <p className="text-base text-purple-100/90 leading-relaxed">
              Manage customer support, team inboxes, automations, and analytics — all in one dedicated workspace.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {[
                "Dedicated team workspace",
                "Customer support inbox",
                "Automation & quick replies",
                "Team management & roles",
                "Analytics & insights",
              ].map((f) => (
                <div key={f} className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 border border-white/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
                  <span className="text-sm text-purple-100/90">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between border-t border-white/15 pt-6 text-xs text-purple-200/80">
            <span>Your workspace, your rules</span>
            <span>© 2026 CallsChat LLC</span>
          </div>
        </div>

        {/* Right form column */}
        <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:w-7/12 xl:w-1/2 lg:px-20 xl:px-28 bg-white relative">

          <div className="absolute top-6 left-6 sm:left-12 flex items-center justify-between w-[calc(100%-3rem)] sm:w-[calc(100%-6rem)]">
            <button
              onClick={() => step === "DETAILS" ? setStep("OTP") : step === "OTP" ? setStep("PHONE") : router.back()}
              className="flex items-center gap-2 text-sm font-semibold text-[#4A1D96] hover:text-purple-700 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <Image src="/call_chats_logo.png" height={36} width={36} alt="Logo" />
              <span className="font-bold text-lg text-[#2D1B69]">CallsChat</span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md space-y-8 my-auto pt-8">

            {/* Step bar */}
            <div className="flex items-center gap-2">
              {STEPS.map((_, i) => (
                <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-all duration-300", stepIndex >= i ? "bg-purple-600" : "bg-slate-200")} />
              ))}
            </div>

            {/* ── STEP: PHONE ── */}
            {step === "PHONE" && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-extrabold text-[#2D1B69]">Create Business Account</h2>
                  <p className="text-sm text-slate-500">Enter your phone number to get started</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 pl-1">Phone number</label>
                  <div className="flex items-center gap-3">
                    <div className="relative" ref={dropdownRef}>
                      <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex h-12 w-[100px] items-center justify-between rounded-xl border border-purple-100 bg-purple-50/50 px-3 transition-all focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 hover:border-purple-200">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                          <span className="text-lg">{getFlagEmoji(selectedCountry)}</span>
                          <span className="text-sm">+{getCountryCallingCode(selectedCountry)}</span>
                        </div>
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                      {isDropdownOpen && (
                        <div className="absolute left-0 top-14 z-50 flex max-h-72 w-64 flex-col rounded-xl bg-white py-2 shadow-xl border border-slate-100 overflow-hidden">
                          <div className="px-3 pb-2 pt-1 shrink-0">
                            <input type="text" placeholder="Search country…" value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)} autoFocus onClick={(e) => e.stopPropagation()}
                              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30" />
                          </div>
                          <div className="flex-1 overflow-y-auto min-h-0">
                            {filteredCountries.map((c) => {
                              let cName = c as string;
                              try { cName = regionNames.of(c as string) ?? c; } catch {}
                              return (
                                <button key={c} type="button" onClick={() => { setSelectedCountry(c); setIsDropdownOpen(false); setSearchQuery(""); }}
                                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-semibold text-slate-600 transition-colors hover:bg-purple-50 hover:text-purple-600">
                                  <span className="text-base">{getFlagEmoji(c)}</span>
                                  <span className="w-10 shrink-0 text-slate-400">+{getCountryCallingCode(c)}</span>
                                  <span className="ml-auto text-xs font-medium truncate">{cName}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    <Input country={selectedCountry} value={phoneNumber} onChange={setPhoneNumber} placeholder="000 000 0000" disabled={isPending}
                      className="flex h-12 flex-1 rounded-xl border border-purple-100 bg-purple-50/50 px-4 text-sm font-semibold text-slate-800 placeholder-slate-400 transition-all focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
                  </div>
                </div>

                <button type="button" onClick={handleRequestOTP} disabled={!phoneNumber || isPending}
                  className={cn("w-full flex items-center justify-center gap-2 rounded-xl h-12 text-sm font-bold transition-all duration-200",
                    phoneNumber && !isPending ? "bg-purple-600 text-white hover:bg-purple-700 active:scale-[0.99]" : "cursor-not-allowed bg-slate-100 text-slate-400")}>
                  {isPending ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Sending…</span> : "Continue"}
                </button>

                <p className="text-center text-sm text-slate-500">
                  Already have an account?{" "}
                  <Link href="/login" className="font-bold text-purple-600 hover:underline">Log in</Link>
                </p>
              </div>
            )}

            {/* ── STEP: OTP ── */}
            {step === "OTP" && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-extrabold text-[#2D1B69]">Verify Your Phone</h2>
                  <p className="text-sm text-slate-500">Code sent to <span className="font-bold text-slate-700">{sentPhone}</span></p>
                </div>
                <div className="flex justify-center gap-2 sm:gap-3">
                  {otp.map((digit, idx) => (
                    <input key={idx} id={`b-otp-${idx}`} type="text" inputMode="numeric" pattern="[0-9]*" maxLength={1} value={digit}
                      disabled={isPending} onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)} onPaste={handleOtpPaste}
                      className="h-12 w-10 sm:h-14 sm:w-12 rounded-xl border border-purple-100 bg-purple-50 text-center text-xl font-bold text-[#1E293B] transition-all focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
                  ))}
                </div>
                <div className="text-center text-sm text-slate-500">
                  Didn&apos;t receive the code?{" "}
                  {timer > 0 ? (
                    <span className="font-bold text-purple-400 cursor-not-allowed">
                      Resend ({Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")})
                    </span>
                  ) : (
                    <button type="button" onClick={handleRequestOTP} disabled={isPending} className="font-bold text-purple-600 hover:underline">Resend</button>
                  )}
                </div>
                <button type="button" onClick={handleVerifyOTP} disabled={!isOtpComplete || isPending}
                  className={cn("w-full flex items-center justify-center gap-2 rounded-xl h-12 text-sm font-bold transition-all duration-200",
                    isOtpComplete && !isPending ? "bg-purple-600 text-white hover:bg-purple-700 active:scale-[0.99]" : "cursor-not-allowed bg-slate-100 text-slate-400")}>
                  {isPending ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Verifying…</span> : "Verify & Continue"}
                </button>
              </div>
            )}

            {/* ── STEP: DETAILS ── */}
            {step === "DETAILS" && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h2 className="text-2xl font-extrabold text-[#2D1B69]">Set Up Your Workspace</h2>
                  <p className="text-sm text-slate-500">Tell us about your business</p>
                </div>

                {/* Owner name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 pl-1">Your full name</label>
                  <input type="text" placeholder="e.g. Sarah Connor" value={ownerName} disabled={isPending}
                    onChange={(e) => setOwnerName(e.target.value)} autoFocus
                    className="flex h-12 w-full rounded-xl border border-purple-100 bg-purple-50/50 px-4 text-sm font-semibold text-slate-800 placeholder-slate-400 transition-all focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
                </div>

                {/* Company name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 pl-1">Company name</label>
                  <input type="text" placeholder="e.g. Acme Corp" value={companyName} disabled={isPending}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="flex h-12 w-full rounded-xl border border-purple-100 bg-purple-50/50 px-4 text-sm font-semibold text-slate-800 placeholder-slate-400 transition-all focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
                </div>

                {/* Business handle */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 pl-1">
                    Business handle <span className="font-normal text-slate-400">(unique, like a username)</span>
                  </label>
                  <div className="relative">
                    <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input type="text" placeholder="acme-corp" value={businessHandle} disabled={isPending}
                      onChange={(e) => handleHandleChange(e.target.value)}
                      className={cn(
                        "flex h-12 w-full rounded-xl border pl-10 pr-4 text-sm font-semibold text-slate-800 placeholder-slate-400 transition-all focus:outline-none focus:ring-2",
                        handleError
                          ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500/20"
                          : "border-purple-100 bg-purple-50/50 focus:border-purple-500 focus:bg-white focus:ring-purple-500/20"
                      )} />
                  </div>
                  {handleError && <p className="text-xs text-red-500 pl-1">{handleError}</p>}
                  {!handleError && businessHandle && (
                    <p className="text-xs text-slate-400 pl-1">Your workspace will be @{businessHandle.toLowerCase()}</p>
                  )}
                </div>

                <button type="button" onClick={handleRegister} disabled={!isDetailsValid || isPending}
                  className={cn("w-full flex items-center justify-center gap-2 rounded-xl h-12 text-sm font-bold transition-all duration-200 mt-2",
                    isDetailsValid && !isPending ? "bg-purple-600 text-white hover:bg-purple-700 active:scale-[0.99]" : "cursor-not-allowed bg-slate-100 text-slate-400")}>
                  {isPending ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Creating workspace…</span> : "Create Business Account"}
                </button>

                <p className="text-xs text-center text-slate-400 leading-relaxed">
                  By continuing, you agree to our{" "}
                  <Link href="/terms-of-service" className="text-purple-500 hover:underline">Terms of Service</Link>
                  {" "}and{" "}
                  <Link href="/privacy-policy" className="text-purple-500 hover:underline">Privacy Policy</Link>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
