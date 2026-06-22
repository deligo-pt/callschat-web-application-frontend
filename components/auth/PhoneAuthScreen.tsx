"use client";

import * as React from "react";
import { MessageCircle, ChevronDown, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "react-phone-number-input/input";
import { getCountries, getCountryCallingCode } from "react-phone-number-input";
import type { Country } from "react-phone-number-input";
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
  // Capture the exact phone string sent to the backend for OTP request
  // so verify uses the IDENTICAL string (prevents backend key mismatch)
  const [sentPhoneNumber, setSentPhoneNumber] = React.useState("");

  // Handle dropdown outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle OTP countdown timer
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
    
    // Normalise: remove all whitespace, ensure leading +
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
          // ✅ Freeze the exact string the backend stored the OTP against
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
    // ✅ Use the EXACT phone string that was sent to /otp/request
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
        
        // Extract from data wrapper if it exists, otherwise use root level
        const token = responseData.data?.registrationToken || responseData.registrationToken;
        const isExistingUser = responseData.data?.isExistingUser !== undefined 
          ? responseData.data.isExistingUser 
          : responseData.isExistingUser;

        if (responseData.success && token) {
          
          if (type === "login") {
            if (isExistingUser) {
              toast.success("Verification successful!");
              // Branch A: Existing User -> Background call to Login Route
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
                
                const accessToken = loginData.data?.accessToken || loginData.accessToken;
                const refreshToken = loginData.data?.refreshToken || loginData.refreshToken;

                if ((loginData.success || loginRes.ok) && accessToken) {
                  localStorage.setItem("accessToken", accessToken);
                  if (refreshToken) {
                    localStorage.setItem("refreshToken", refreshToken);
                  }
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
                  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
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
                if (refreshToken) {
                  localStorage.setItem("refreshToken", refreshToken);
                }
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
  const title = isLogin ? "Welcome Back" : "Create Account";
  const subtitle = isLogin ? "Log in to continue" : "Join CallsChat today";
  const sheetTitle = isLogin ? "Enter your number" : "Enter your phone number";
  const sheetSubtitle = isLogin 
    ? "We'll send you a verification code via SMS" 
    : "Make sure this number can receive SMS. You'll receive your activation code through it.";
  const buttonText = isLogin ? "Send verification code" : "Continue";
  const isOtpComplete = otp.every((digit) => digit.length === 1) && !!sentPhoneNumber;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 sm:p-6">
      {/* Mobile constraint container */}
      <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-gradient-to-br from-[#4A72FF] to-[#1D3BB5] shadow-2xl sm:h-[851px] sm:w-[412px] sm:rounded-[2.5rem]">
        
        {step === "OTP" && (
          <button 
            onClick={() => {
              setStep("PHONE");
              setOtp(["", "", "", "", "", ""]);
            }}
            className="absolute left-6 top-16 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30"
          >
            <ChevronLeft className="mr-0.5 h-5 w-5 text-white" strokeWidth={2.5} />
          </button>
        )}

        {/* Top Section (Blue Gradient) */}
        <div className={cn("flex flex-col items-center justify-center pb-12 transition-all", step === "OTP" ? "pt-24" : "pt-20")}>
          {step === "PHONE" ? (
            <>
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[1.25rem] border border-white/10 bg-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md">
                <MessageCircle className="h-9 w-9 text-white" strokeWidth={1.5} />
              </div>
              <h1 className="text-[28px] font-bold tracking-tight text-white">{title}</h1>
              <p className="mt-1.5 text-[14px] font-medium text-white/80">{subtitle}</p>
            </>
          ) : (
            <>
              <h1 className="text-[26px] font-bold tracking-tight text-white">Verification code</h1>
              <p className="mt-3 text-center text-[13px] font-medium leading-[1.6] text-white/80">
                We sent a 6-digit code to<br />
                <span className="font-semibold text-white">{phoneNumber}</span>
              </p>
            </>
          )}
        </div>

        {/* Bottom Sheet Area */}
        <div className={cn("relative flex flex-1 flex-col rounded-t-[2.5rem] bg-white px-8 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]", step === "OTP" ? "items-center pt-12" : "pt-10")}>
          
          {step === "PHONE" ? (
            <>
              <h2 className="mb-2 text-[22px] font-bold tracking-tight text-[#11142D]">{sheetTitle}</h2>
              <p className="mb-8 text-[14px] font-medium text-[#8F95B2]">{sheetSubtitle}</p>

              <div className="flex flex-col gap-2.5">
                <label className="text-[13px] font-semibold text-[#1D2A54]">Phone number</label>
                <div className="flex items-center gap-3">
                  
                  {/* Custom Country Code Selector */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex h-[52px] w-[96px] items-center justify-between rounded-[1rem] border border-[#AEC0ED] bg-[#EEF2FB] px-3 transition-colors focus:border-[#3B58F5] focus:outline-none hover:border-[#8E9FCD]"
                    >
                      <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1D2A54]">
                        <span className="text-[18px]">{getFlagEmoji(selectedCountry)}</span>
                        <span>+{getCountryCallingCode(selectedCountry)}</span>
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 text-[#8F95B2]" strokeWidth={2.5} />
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute left-0 top-[60px] z-50 flex max-h-[240px] w-[180px] flex-col overflow-y-auto rounded-[1rem] bg-white py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100">
                        {countries.map((country) => (
                          <button
                            key={country}
                            onClick={() => {
                              setSelectedCountry(country);
                              setIsDropdownOpen(false);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] font-semibold text-[#11142D] transition-colors hover:bg-[#F7F9FC]"
                          >
                            <span className="text-[16px]">{getFlagEmoji(country)}</span>
                            <span>+{getCountryCallingCode(country)}</span>
                            <span className="ml-auto text-[13px] font-medium text-[#8F95B2]">{country}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <Input
                    country={selectedCountry}
                    value={phoneNumber}
                    onChange={setPhoneNumber}
                    placeholder="000 000 0000"
                    disabled={isPending}
                    className="flex h-[52px] flex-1 rounded-[1rem] border border-[#AEC0ED] bg-[#EEF2FB] px-4 text-[16px] font-semibold tracking-wide text-[#1D2A54] placeholder-[#A0A6C0] transition-colors focus:border-[#3B58F5] focus:outline-none hover:border-[#8E9FCD]"
                  />
                </div>
              </div>

              {isLogin ? (
                <p className="mt-8 px-2 text-center text-[12px] font-medium leading-[1.6] text-[#8F95B2]">
                  By continuing you agree to our <Link href="#" className="font-semibold text-[#3B58F5] hover:underline">Terms of Service</Link> and <Link href="#" className="font-semibold text-[#3B58F5] hover:underline">Privacy Policy</Link>
                </p>
              ) : (
                <div className="mt-8 h-[38px] w-full" />
              )}

              <button
                onClick={handleRequestOTP}
                disabled={!phoneNumber || isPending}
                className={cn(
                  "mt-8 w-full rounded-[1rem] py-[18px] text-[15px] font-bold transition-all duration-300",
                  phoneNumber && !isPending
                    ? "bg-[#3B58F5] text-white shadow-lg shadow-[#3B58F5]/25 hover:bg-[#2C48B8] active:scale-[0.98]" 
                    : "cursor-not-allowed bg-[#B5C7FE] text-white"
                )}
              >
                {isPending ? "Sending..." : buttonText}
              </button>

              <div className="mt-auto pb-8 pt-6 text-center text-[14px] font-medium text-[#8F95B2]">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <Link 
                  href={isLogin ? "/signup" : "/login"} 
                  className="font-bold text-[#3B58F5] hover:underline transition-colors"
                >
                  {isLogin ? "Sign Up" : "Login"}
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="mb-6 text-[13px] font-medium text-[#8F95B2]">Enter the code below</p>
              
              <div className="mb-8 flex justify-center gap-2 sm:gap-3">
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
                    className="flex h-[52px] w-[46px] sm:h-[60px] sm:w-[50px] rounded-[1rem] border border-[#AEC0ED] bg-[#EEF2FB] text-center text-[22px] font-bold text-[#1D2A54] transition-colors focus:border-[#3B58F5] focus:outline-none hover:border-[#8E9FCD]"
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={!isOtpComplete || isPending}
                className={cn(
                  "w-full rounded-[1rem] py-[18px] text-[15px] font-bold transition-all duration-300",
                  isOtpComplete && !isPending
                    ? "bg-[#3B58F5] text-white shadow-lg shadow-[#3B58F5]/25 hover:bg-[#2C48B8] active:scale-[0.98]" 
                    : "cursor-not-allowed bg-[#B5C7FE] text-white"
                )}
              >
                {isPending ? "Verifying..." : "Verify & Continue"}
              </button>

              <p className="mt-6 text-[13px] font-medium text-[#8F95B2]">
                {timer > 0 ? (
                  <>
                    This code will expire in <span className="font-bold text-[#3B58F5]">{timer}s</span>
                  </>
                ) : (
                  <>
                    Didn't receive the code?{" "}
                    <button 
                      onClick={handleRequestOTP}
                      disabled={isPending}
                      className="font-bold text-[#3B58F5] hover:underline"
                    >
                      Resend Code
                    </button>
                  </>
                )}
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
