"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, ChevronLeft, MessageCircle } from "lucide-react";
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
  const [phoneNumber, setPhoneNumber] = React.useState<string | undefined>();
  const [selectedCountry, setSelectedCountry] = React.useState<Country>("US");
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  // OTP Step State
  const [otp, setOtp] = React.useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = React.useState(60);
  const [sentPhoneNumber, setSentPhoneNumber] = React.useState("");

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchQuery("");
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
  const regionNames = React.useMemo(() => new Intl.DisplayNames(['en'], { type: 'region' }), []);

  const filteredCountries = React.useMemo(() => {
    if (!searchQuery) return countries;
    const lowerQuery = searchQuery.toLowerCase();
    return countries.filter((country) => {
      let name = "";
      try {
        name = regionNames.of(country as string)?.toLowerCase() || "";
      } catch (e) {
        // Ignore invalid region codes
      }
      const code = country.toLowerCase();
      const callingCode = getCountryCallingCode(country).toLowerCase();
      return name.includes(lowerQuery) || code.includes(lowerQuery) || callingCode.includes(lowerQuery);
    });
  }, [countries, searchQuery, regionNames]);

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
  const title = isLogin ? "Login Account" : "Create Account";
  const subtitle = isLogin 
    ? "Sign in to CallsChat" 
    : "Join CallsChat today";
  const isOtpComplete = otp.every((digit) => digit.length === 1) && !!sentPhoneNumber;

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] font-sans">
      {/* Top Header Section */}
      <div className="flex flex-col items-center justify-center pt-16 pb-10 text-white px-4">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner">
          <MessageCircle className="h-8 w-8 text-white stroke-[2]" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2 text-center">
          {step === "PHONE" ? title : "Verify Account"}
        </h1>
        <p className="text-blue-100 font-medium text-center">
          {step === "PHONE" ? subtitle : "Enter your activation code"}
        </p>
      </div>

      {/* Bottom White Section */}
      <div className="flex-1 rounded-t-[2.5rem] sm:rounded-t-[3.5rem] bg-white px-6 py-10 sm:px-12 flex flex-col items-center shadow-2xl relative">
        {step === "OTP" && (
          <button 
            onClick={() => {
              setStep("PHONE");
              setOtp(["", "", "", "", "", ""]);
            }}
            className="absolute top-6 left-6 sm:top-8 sm:left-12 flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        )}

        <div className="w-full max-w-[400px] flex-1 flex flex-col pt-4 sm:pt-6">
          {/* Form header */}
          <div className="text-center space-y-3 mb-10">
             <h2 className="text-2xl font-bold text-[#0F172A]">
               {step === "PHONE" ? "Enter your phone number" : "Enter activation code"}
             </h2>
             <p className="text-sm text-slate-500 leading-relaxed">
               {step === "PHONE" 
                 ? "Make sure this number can receive SMS. You'll receive your activation code through it."
                 : <>We sent a 6-digit one-time security code via SMS to <span className="font-bold text-[#0F172A]">{phoneNumber}</span>.</>}
             </p>
          </div>

          {/* Form Body */}
          <div className="flex-1">
            {step === "PHONE" ? (
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 pl-1">
                    Phone number
                  </label>
                  <div className="flex items-center gap-3">
                    {/* Country Code Selector */}
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex h-12 w-[100px] items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 hover:border-indigo-200"
                      >
                        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                          <span className="text-lg">{getFlagEmoji(selectedCountry)}</span>
                          <span className="text-sm">+{getCountryCallingCode(selectedCountry)}</span>
                        </div>
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                      </button>

                      {isDropdownOpen && (
                        <div className="absolute left-0 top-14 z-50 flex max-h-[20rem] w-64 flex-col rounded-xl bg-white py-2 shadow-xl border border-slate-100 overflow-hidden">
                          <div className="px-3 pb-2 pt-1 shrink-0">
                            <input
                              type="text"
                              placeholder="Search country..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="flex-1 overflow-y-auto min-h-0">
                            {filteredCountries.length > 0 ? (
                              filteredCountries.map((country) => {
                                let countryName: string = country as string;
                                try {
                                  countryName = regionNames.of(country as string) || (country as string);
                                } catch (e) {}
                                return (
                                  <button
                                    key={country}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCountry(country);
                                      setIsDropdownOpen(false);
                                      setSearchQuery("");
                                    }}
                                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-semibold text-slate-600 transition-colors hover:bg-indigo-50 hover:text-blue-600"
                                  >
                                    <span className="text-base">{getFlagEmoji(country)}</span>
                                    <span className="w-10 shrink-0 text-slate-400">+{getCountryCallingCode(country)}</span>
                                    <span className="ml-auto text-xs font-medium truncate">{countryName}</span>
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
                      onChange={setPhoneNumber}
                      placeholder="000 000 0000"
                      disabled={isPending}
                      className="flex h-12 flex-1 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 text-sm font-semibold text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-indigo-200"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRequestOTP}
                  disabled={!phoneNumber || isPending}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 rounded-xl h-12 text-sm font-bold transition-all duration-200 shadow-sm mt-4",
                    phoneNumber && !isPending
                      ? "bg-[#2563EB] text-white hover:bg-blue-700 active:scale-[0.99]"
                      : "cursor-not-allowed bg-slate-100 text-slate-400"
                  )}
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Loading...
                    </span>
                  ) : (
                    "Continue"
                  )}
                </button>
              </div>
            ) : (
              /* OTP Verification Step */
              <div className="space-y-8">
                <div className="flex justify-between gap-2 sm:gap-3 px-2">
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
                      className="h-12 w-10 sm:h-14 sm:w-12 rounded-xl border border-indigo-100 bg-indigo-50/50 text-center text-xl font-bold text-slate-800 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-indigo-200"
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleVerifyOTP}
                  disabled={!isOtpComplete || isPending}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 rounded-xl h-12 text-sm font-bold transition-all duration-200 shadow-sm mt-4",
                    isOtpComplete && !isPending
                      ? "bg-[#2563EB] text-white hover:bg-blue-700 active:scale-[0.99]"
                      : "cursor-not-allowed bg-slate-100 text-slate-400"
                  )}
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Verifying...
                    </span>
                  ) : (
                    "Continue"
                  )}
                </button>

                <div className="flex items-center justify-center pt-2 text-sm text-slate-500">
                  {timer > 0 ? (
                    <span>Resend code in <span className="font-medium text-slate-700">{timer}s</span></span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestOTP}
                      disabled={isPending}
                      className="font-bold text-blue-600 hover:underline"
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Link */}
          <div className="mt-12 mb-4 text-center text-sm font-medium text-slate-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <Link
              href={isLogin ? "/signup" : "/login"}
              className="font-bold text-blue-600 hover:underline transition-colors ml-1"
            >
              {isLogin ? "Sign up" : "Login"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
