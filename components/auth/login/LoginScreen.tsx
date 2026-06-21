"use client";

import * as React from "react";
import { MessageCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  
  // Dummy countries mapping
  const countries = [
    { code: "+1", flag: "🇺🇸", name: "US" },
    { code: "+44", flag: "🇬🇧", name: "UK" },
    { code: "+49", flag: "🇩🇪", name: "DE" },
    { code: "+33", flag: "🇫🇷", name: "FR" },
    { code: "+91", flag: "🇮🇳", name: "IN" },
    { code: "+61", flag: "🇦🇺", name: "AU" },
  ];
  
  const [selectedCountry, setSelectedCountry] = React.useState(countries[0]);

  // Handle outside click for dropdown
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
            Welcome Back
          </h1>
          <p className="mt-1.5 text-[14px] font-medium text-white/80">
            Log in to continue
          </p>
        </div>

        {/* Bottom Sheet Area */}
        <div className="relative flex flex-1 flex-col rounded-t-[2.5rem] bg-white px-8 pt-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          
          <h2 className="mb-2 text-[22px] font-bold tracking-tight text-[#11142D]">
            Enter your number
          </h2>
          <p className="mb-8 text-[14px] font-medium text-[#8F95B2]">
            We'll send you a verification code via SMS
          </p>

          <div className="flex flex-col gap-2.5">
            <label className="text-[12px] font-semibold text-[#8F95B2]">
              Phone number
            </label>
            <div className="flex items-center gap-3">
              
              {/* Country Code Selector */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex h-[52px] w-[96px] items-center justify-between rounded-[1rem] border-2 border-[#EEF0F5] bg-[#F7F9FC] px-3 transition-colors focus:border-[#3B58F5] focus:outline-none hover:border-[#E2E6F0]"
                >
                  <div className="flex items-center gap-1.5 text-[15px] font-semibold text-[#11142D]">
                    <span>{selectedCountry.flag}</span>
                    <span>{selectedCountry.code}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-[#8F95B2]" strokeWidth={2.5} />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute left-0 top-[60px] z-50 w-[140px] overflow-hidden rounded-[1rem] bg-white py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100">
                    {countries.map((country, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedCountry(country);
                          setIsDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] font-semibold text-[#11142D] transition-colors hover:bg-[#F7F9FC]"
                      >
                        <span className="text-[16px]">{country.flag}</span>
                        <span>{country.code}</span>
                        <span className="ml-auto text-[13px] font-medium text-[#8F95B2]">{country.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Phone Input */}
              <input
                type="tel"
                placeholder="000 000 0000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex h-[52px] flex-1 rounded-[1rem] border-2 border-[#EEF0F5] bg-[#F7F9FC] px-4 text-[16px] font-semibold tracking-wide text-[#11142D] placeholder-[#A0A6C0] transition-colors focus:border-[#3B58F5] focus:outline-none hover:border-[#E2E6F0]"
              />
            </div>
          </div>

          <p className="mt-8 px-2 text-center text-[12px] font-medium leading-[1.6] text-[#8F95B2]">
            By continuing you agree to our <Link href="#" className="font-semibold text-[#3B58F5] hover:underline">Terms of Service</Link> and <Link href="#" className="font-semibold text-[#3B58F5] hover:underline">Privacy Policy</Link>
          </p>

          <button
            disabled={!phoneNumber}
            className={cn(
              "mt-8 w-full rounded-[1rem] py-[18px] text-[15px] font-bold transition-all duration-300",
              phoneNumber 
                ? "bg-[#3B58F5] text-white shadow-lg shadow-[#3B58F5]/25 hover:bg-[#2C48B8] active:scale-[0.98]" 
                : "cursor-not-allowed bg-[#B5C7FE] text-white"
            )}
          >
            Send verification code
          </button>

          <div className="mt-auto pb-8 pt-6 text-center text-[14px] font-medium text-[#8F95B2]">
            Don't have an account?{" "}
            <Link href="/register" className="font-bold text-[#3B58F5] hover:underline transition-colors">
              Sign Up
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
