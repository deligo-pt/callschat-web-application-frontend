"use client";

import { cn } from "@/lib/utils";
import { ArrowRight, ChevronDown, ChevronLeft, Globe, Lock, ShieldCheck, Sparkles, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import type { Country } from "react-phone-number-input";
import { getCountries, getCountryCallingCode } from "react-phone-number-input";
import Input from "react-phone-number-input/input";
import { toast } from "sonner";

interface PhoneAuthScreenProps {
  type: "login" | "signup";
}

const getFlagEmoji = (countryCode: string) => {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export default function PhoneAuthScreen({ type }: PhoneAuthScreenProps) {
  const router = useRouter();
  const [step, setStep] = React.useState<"PHONE" | "OTP">("PHONE");
  const [isPending, startTransition] = React.useTransition();

  // Phone Step State
  const [phoneNumber, setPhoneNumber] = React.useState<string | undefined>("");
  const [selectedCountry, setSelectedCountry] = React.useState<Country>("US");
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // OTP Step State
  const [otp, setOtp] = React.useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = React.useState(60);
  const [sentPhoneNumber, setSentPhoneNumber] = React.useState("");

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "OTP") {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step]);

  const countries = getCountries();

  const handleRequestOTP = () => {
    if (!phoneNumber) return;
    
    const sanitizedPhone = phoneNumber.replace(/\s+/g, "").trim();
    if (!sanitizedPhone) return;

    startTransition(async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1";
        console.log("[OTP Request] Sending phoneNumber:", sanitizedPhone);
        const res = await fetch(`${baseUrl}/auth/otp/request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: sanitizedPhone })
        });
        
        const data = await res.json();
        if (data.success) {
          setSentPhoneNumber(sanitizedPhone);
          toast.success("OTP sent successfully!");
          setStep("OTP");
          setTimer(60);
        } else {
          toast.error(data.error?.message || data.message || "Failed to send OTP.");
        }
      } catch (err) {
        toast.error("Network error. Please try again.");
      }
    });
  };

  const handleVerifyOTP = () => {
    const otpString = otp.join("").trim();
    if (otpString.length !== 6 || !sentPhoneNumber) return;

    startTransition(async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1";
        console.log("[OTP Verify] phoneNumber:", sentPhoneNumber, "otp:", otpString);
        const res = await fetch(`${baseUrl}/auth/otp/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: sentPhoneNumber, otp: otpString })
        });
        
        const responseData = await res.json();
        
        const token = responseData.data?.registrationToken || responseData.registrationToken;
        const isExistingUser = responseData.data?.isExistingUser !== undefined 
          ? responseData.data.isExistingUser 
          : responseData.isExistingUser;

        if (responseData.success && token) {
          if (type === "login") {
            if (isExistingUser) {
              toast.success("Verification successful!");
              try {
                const loginRes = await fetch(`${baseUrl}/auth/login`, {
                  method: "POST",
                  headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                  },
                  body: JSON.stringify({})
                });
                
                const loginData = await loginRes.json();
                
                const accessToken = loginData.data?.tokens?.accessToken || loginData.data?.accessToken || loginData.accessToken;
                const refreshToken = loginData.data?.tokens?.refreshToken || loginData.data?.refreshToken || loginData.refreshToken;

                if ((loginData.success || loginRes.ok) && accessToken) {
                  localStorage.setItem("accessToken", accessToken);
                  document.cookie = `accessToken=${accessToken}; path=/; max-age=2592000`;
                  if (refreshToken) {
                    localStorage.setItem("refreshToken", refreshToken);
                    document.cookie = `refreshToken=${refreshToken}; path=/; max-age=2592000`;
                  }
                  
                  await new Promise(resolve => setTimeout(resolve, 50));
                  router.push("/chats");
                } else {
                  toast.error(loginData.message || loginData.data?.message || "Failed to finalize login.");
                }
              } catch (err) {
                toast.error("Network error during login finalization.");
              }
            } else {
              toast.info("No account found. Let's get you signed up!");
              router.push("/signup");
            }
          } else {
            // type === "signup"
            if (isExistingUser) {
              toast.info("You already have an account! Logging you in...");
              try {
                const loginRes = await fetch(`${baseUrl}/auth/login`, {
                  method: "POST",
                  headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                  },
                  body: JSON.stringify({})
                });
                
                const loginData = await loginRes.json();
                const accessToken = loginData.data?.tokens?.accessToken || loginData.data?.accessToken || loginData.accessToken;
                const refreshToken = loginData.data?.tokens?.refreshToken || loginData.data?.refreshToken || loginData.refreshToken;

                if ((loginData.success || loginRes.ok) && accessToken) {
                  localStorage.setItem("accessToken", accessToken);
                  document.cookie = `accessToken=${accessToken}; path=/; max-age=2592000`;
                  if (refreshToken) {
                    localStorage.setItem("refreshToken", refreshToken);
                    document.cookie = `refreshToken=${refreshToken}; path=/; max-age=2592000`;
                  }
                  
                  await new Promise(resolve => setTimeout(resolve, 50));
                  router.push("/chats");
                } else {
                  toast.error(`Login failed: ${loginData.message || JSON.stringify(loginData)}`);
                }
              } catch (err) {
                toast.error(`Network error: ${err}`);
              }
            } else {
              toast.success("Verification successful!");
              const sessionMode = sessionStorage.getItem("auth_account_mode") || "PERSONAL";
              
              try {
                const registerRes = await fetch(`${baseUrl}/auth/register`, {
                  method: "POST",
                  headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                  },
                  body: JSON.stringify({ 
                    name: "User", 
                    accountType: sessionMode,
                    ...(sessionMode === "BUSINESS" && { companyName: "Business Account" })
                  })
                });
              
                const registerData = await registerRes.json();
                
                const accessToken = registerData.data?.tokens?.accessToken || registerData.data?.accessToken || registerData.accessToken;
                const refreshToken = registerData.data?.tokens?.refreshToken || registerData.data?.refreshToken || registerData.refreshToken;

                if ((registerData.success || registerRes.ok) && accessToken) {
                  localStorage.setItem("accessToken", accessToken);
                  document.cookie = `accessToken=${accessToken}; path=/; max-age=2592000`;
                  if (refreshToken) {
                    localStorage.setItem("refreshToken", refreshToken);
                    document.cookie = `refreshToken=${refreshToken}; path=/; max-age=2592000`;
                  }
                  
                  await new Promise(resolve => setTimeout(resolve, 50));
                  router.push("/setup-profile");
                } else {
                  toast.error(`Register failed: ${registerData.message || JSON.stringify(registerData)}`);
                }
              } catch (err) {
                toast.error(`Network error: ${err}`);
              }
            }
          }
        } else {
          const errMsg = responseData.error?.message || responseData.message || JSON.stringify(responseData);
          toast.error(`Verification failed: ${errMsg}`);
        }
      } catch (err) {
        toast.error(`Network error: ${err}`);
      }
    });
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 1) value = value.slice(-1);
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      if (i < 6) newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    
    const focusIndex = Math.min(pastedData.length, 5);
    const nextInput = document.getElementById(`otp-${focusIndex}`);
    if (nextInput) nextInput.focus();
  };

  const isLogin = type === "login";
  const title = isLogin ? "Sign in to your account" : "Create your CallsChat account";
  const subtitle = isLogin 
    ? "Enter your phone number to access your encrypted messaging workspace." 
    : "Join our privacy-first communication platform in under a minute.";
  const isOtpComplete = otp.every((digit) => digit.length === 1) && !!sentPhoneNumber;

  return (
    <div className="flex min-h-screen w-full bg-[#F8FAFC] font-sans">
      {/* Web Split-Screen Container */}
      <div className="flex w-full min-h-screen">
        
        {/* Left Brand Showcase Column (Hidden on mobile/tablet, shown on lg screens) */}
        <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between bg-gradient-to-br from-[#0A2540] via-[#102A63] to-[#1A62E8] p-12 text-white relative overflow-hidden">
          {/* Background Decorative Glows */}
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
              <Sparkles className="h-3.5 w-3.5" /> Next-Gen Privacy First Communication
            </div>
            
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight">
              Connect securely <br />
              <span className="bg-gradient-to-r from-blue-300 via-[#1AC1F2] to-indigo-200 bg-clip-text text-transparent">
                without exposing phone numbers.
              </span>
            </h1>
            
            <p className="text-base text-blue-100/90 leading-relaxed font-normal">
              CallsChat uses unique CallsChat IDs and military-grade encryption so you can message, voice call, and run live translations in absolute privacy.
            </p>

            <div className="grid grid-cols-1 gap-4 pt-4">
              <div className="flex items-center gap-3.5 rounded-2xl bg-white/5 p-4 backdrop-blur-sm border border-white/10">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-[#1AC1F2]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Zero Public Number Exposure</h4>
                  <p className="text-xs text-blue-200/80">Your phone number stays strictly private by default.</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl bg-white/5 p-4 backdrop-blur-sm border border-white/10">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Real-Time Live Translation</h4>
                  <p className="text-xs text-blue-200/80">Break language barriers across voice calls instantly.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trust Badge */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/15 pt-6 text-xs text-blue-200/80">
            <span className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#1AC1F2]" /> Available in multiple countries
            </span>
            <span>© 2026 CallsChat LLC</span>
          </div>
        </div>

        {/* Right Authentication Form Column */}
        <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:w-7/12 xl:w-1/2 lg:px-20 xl:px-28 bg-white relative">
          
          {/* Top navigation for mobile / back trigger */}
          <div className="absolute top-6 left-6 sm:left-12 flex items-center justify-between w-[calc(100%-3rem)] sm:w-[calc(100%-6rem)]">
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-[#102A63] hover:text-primary transition-colors">
              <ChevronLeft className="h-4 w-4" /> Return to Homepage
            </Link>
            
            <div className="lg:hidden flex items-center gap-2">
              <Image src="/call_chats_logo.png" height={36} width={36} alt="Logo" />
              <span className="font-bold text-lg text-[#0A2540]">CallsChat</span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md space-y-8 my-auto pt-8">
            
            {/* Header section */}
            <div className="space-y-2">
              {step === "OTP" && (
                <button 
                  onClick={() => {
                    setStep("PHONE");
                    setOtp(["", "", "", "", "", ""]);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline mb-2"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Change phone number
                </button>
              )}
              
              <h2 className="text-3xl font-extrabold tracking-tight text-[#0A2540]">
                {step === "PHONE" ? title : "Verify your identity"}
              </h2>
              <p className="text-sm text-[#64748B] leading-relaxed">
                {step === "PHONE" ? subtitle : (
                  <>
                    We sent a 6-digit one-time security code via SMS to <span className="font-bold text-[#0A2540]">{phoneNumber}</span>.
                  </>
                )}
              </p>
            </div>

            {/* Form Section */}
            {step === "PHONE" ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#334155]">
                    Mobile Phone Number
                  </label>
                  <div className="flex items-center gap-3">
                    {/* Country Code Selector */}
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex h-14 w-28 items-center justify-between rounded-xl border border-slate-300 bg-slate-50 px-3.5 transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 hover:border-slate-400"
                      >
                        <div className="flex items-center gap-2 font-semibold text-slate-800">
                          <span className="text-xl">{getFlagEmoji(selectedCountry)}</span>
                          <span className="text-sm">+{getCountryCallingCode(selectedCountry)}</span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                      </button>

                      {isDropdownOpen && (
                        <div className="absolute left-0 top-16 z-50 flex max-h-60 w-64 flex-col overflow-y-auto rounded-xl bg-white py-2 shadow-2xl border border-slate-200">
                          {countries.map((country) => (
                            <button
                              key={country}
                              type="button"
                              onClick={() => {
                                setSelectedCountry(country);
                                setIsDropdownOpen(false);
                              }}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-indigo-50 hover:text-primary"
                            >
                              <span className="text-lg">{getFlagEmoji(country)}</span>
                              <span>+{getCountryCallingCode(country)}</span>
                              <span className="ml-auto text-xs font-medium text-slate-400 truncate max-w-[110px]">{country}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <Input
                      country={selectedCountry}
                      value={phoneNumber}
                      onChange={setPhoneNumber}
                      placeholder="Enter phone number"
                      disabled={isPending}
                      className="flex h-14 flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 text-base font-semibold text-slate-800 placeholder-slate-400 transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-slate-400"
                    />
                  </div>
                  <p className="text-[12px] text-slate-500 pt-1 flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-slate-400" /> Your phone number is used exclusively for secure OTP verification.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRequestOTP}
                  disabled={!phoneNumber || isPending}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 rounded-xl h-14 text-base font-bold transition-all duration-200 shadow-md",
                    phoneNumber && !isPending
                      ? "bg-primary text-white shadow-blue-500/25 hover:bg-primary/90 hover:shadow-lg active:scale-[0.99]"
                      : "cursor-not-allowed bg-slate-200 text-slate-400 shadow-none"
                  )}
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Sending code...
                    </span>
                  ) : (
                    <>
                      {isLogin ? "Send Login Code" : "Send Activation Code"} <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="pt-4 border-t border-slate-100 text-center text-sm font-medium text-slate-600">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <Link
                    href={isLogin ? "/signup" : "/login"}
                    className="font-bold text-primary hover:underline transition-colors ml-1"
                  >
                    {isLogin ? "Create account" : "Sign in"}
                  </Link>
                </div>
              </div>
            ) : (
              /* OTP Verification Step */
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#334155]">
                    One-Time Verification Code
                  </label>
                  <div className="flex justify-between gap-2 sm:gap-3">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-${idx}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        disabled={isPending}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={handleOtpPaste}
                        className="h-14 w-12 sm:h-16 sm:w-14 rounded-xl border border-slate-300 bg-slate-50 text-center text-2xl font-extrabold text-slate-800 transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-slate-400"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyOTP}
                  disabled={!isOtpComplete || isPending}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 rounded-xl h-14 text-base font-bold transition-all duration-200 shadow-md",
                    isOtpComplete && !isPending
                      ? "bg-primary text-white shadow-blue-500/25 hover:bg-primary/90 hover:shadow-lg active:scale-[0.99]"
                      : "cursor-not-allowed bg-slate-200 text-slate-400 shadow-none"
                  )}
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Verifying code...
                    </span>
                  ) : (
                    "Verify & Access Workspace"
                  )}
                </button>

                <div className="flex items-center justify-between pt-2 text-sm text-slate-600">
                  <span>Didn't receive SMS?</span>
                  {timer > 0 ? (
                    <span className="font-mono font-semibold text-slate-400">Resend in {timer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestOTP}
                      disabled={isPending}
                      className="font-bold text-primary hover:underline"
                    >
                      Resend Code Now
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Terms Footer */}
            <p className="text-center text-xs text-slate-400 pt-6">
              By proceeding, you agree to our{" "}
              <Link href="#" className="underline hover:text-slate-600">Terms of Service</Link> &{" "}
              <Link href="#" className="underline hover:text-slate-600">Privacy Policy</Link>.
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}
