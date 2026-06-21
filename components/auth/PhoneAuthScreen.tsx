"use client";

import * as React from "react";
import { MessageCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Input from "react-phone-number-input/input";
import { getCountries, getCountryCallingCode } from "react-phone-number-input";
import type { Country } from "react-phone-number-input";

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
  const [phoneNumber, setPhoneNumber] = React.useState<string | undefined>("");
  const [selectedCountry, setSelectedCountry] = React.useState<Country>("US");
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const countries = getCountries();

  // Dynamic Content based on type
  const isLogin = type === "login";
  const title = isLogin ? "Welcome Back" : "Create Account";
  const subtitle = isLogin ? "Log in to continue" : "Join CallsChat today";
  const sheetTitle = isLogin ? "Enter your number" : "Enter your phone number";
  const sheetSubtitle = isLogin 
    ? "We'll send you a verification code via SMS" 
    : "Make sure this number can receive SMS. You'll receive your activation code through it.";
  const buttonText = isLogin ? "Send verification code" : "Continue";
  
  // Note: the design screenshot for SignUp shows an active blue button even when empty.
  // We'll follow the exact look of the active state for signup, or just standard disabled logic.
  // Standard logic is better UX, but we can match the design exactly if requested. Let's stick to disabled state logic for UX.

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 sm:p-6">
      {/* Mobile constraint container */}
      <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-gradient-to-br from-[#4A72FF] to-[#1D3BB5] shadow-2xl sm:h-[851px] sm:w-[412px] sm:rounded-[2.5rem]">
        
        {/* Top Section (Blue Gradient) */}
        <div className="flex flex-col items-center justify-center pb-12 pt-20">
          {/* Logo Icon */}
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[1.25rem] border border-white/10 bg-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md">
            <MessageCircle className="h-9 w-9 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-white">
            {title}
          </h1>
          <p className="mt-1.5 text-[14px] font-medium text-white/80">
            {subtitle}
          </p>
        </div>

        {/* Bottom Sheet Area */}
        <div className="relative flex flex-1 flex-col rounded-t-[2.5rem] bg-white px-8 pt-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          
          <h2 className="mb-2 text-[22px] font-bold tracking-tight text-[#11142D]">
            {sheetTitle}
          </h2>
          <p className="mb-8 text-[14px] font-medium text-[#8F95B2]">
            {sheetSubtitle}
          </p>

          <div className="flex flex-col gap-2.5">
            <label className="text-[13px] font-semibold text-[#1D2A54]">
              Phone number
            </label>
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

                {/* Dropdown Menu */}
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

              {/* Headless Phone Input */}
              <Input
                country={selectedCountry}
                value={phoneNumber}
                onChange={setPhoneNumber}
                placeholder="000 000 0000"
                className="flex h-[52px] flex-1 rounded-[1rem] border border-[#AEC0ED] bg-[#EEF2FB] px-4 text-[16px] font-semibold tracking-wide text-[#1D2A54] placeholder-[#A0A6C0] transition-colors focus:border-[#3B58F5] focus:outline-none hover:border-[#8E9FCD]"
              />
            </div>
          </div>

          {/* Conditional Terms & Conditions for Login */}
          {isLogin ? (
            <p className="mt-8 px-2 text-center text-[12px] font-medium leading-[1.6] text-[#8F95B2]">
              By continuing you agree to our <Link href="#" className="font-semibold text-[#3B58F5] hover:underline">Terms of Service</Link> and <Link href="#" className="font-semibold text-[#3B58F5] hover:underline">Privacy Policy</Link>
            </p>
          ) : (
            // Spacer to push the button down if terms are absent, keeping layout stable
            <div className="mt-8 h-[38px] w-full" />
          )}

          <button
            disabled={!phoneNumber}
            className={cn(
              "mt-8 w-full rounded-[1rem] py-[18px] text-[15px] font-bold transition-all duration-300",
              phoneNumber 
                ? "bg-[#3B58F5] text-white shadow-lg shadow-[#3B58F5]/25 hover:bg-[#2C48B8] active:scale-[0.98]" 
                : "cursor-not-allowed bg-[#B5C7FE] text-white"
            )}
          >
            {buttonText}
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

        </div>
      </div>
    </div>
  );
}
