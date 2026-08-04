"use client";

import * as React from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function VerificationScreen() {
  const router = useRouter();
  const [otp, setOtp] = React.useState(["", "", "", ""]);
  
  // Dummy data
  const phoneNumber = "+1234XXX45678";
  const timer = 60;

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    if (value.length > 1) value = value.slice(-1); // Take the last digit if pasted/multiple
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus to next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      if (i < 4) newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    
    // Focus the next empty input or the last one
    const focusIndex = Math.min(pastedData.length, 3);
    const nextInput = document.getElementById(`otp-${focusIndex}`);
    if (nextInput) nextInput.focus();
  };

  const isComplete = otp.every((digit) => digit.length === 1);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 sm:p-6">
      {/* Mobile constraint container */}
      <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-gradient-to-br from-[#4A72FF] to-[#1D3BB5] shadow-2xl sm:h-[851px] sm:w-[412px] sm:rounded-[2.5rem]">
        
        {/* Top Section (Blue Gradient) */}
        <div className="relative flex flex-col items-center justify-center pb-12 pt-24">
          {/* Back Button */}
          <button 
            onClick={() => router.back()}
            className="absolute left-6 top-16 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30"
          >
            <ChevronLeft className="mr-0.5 h-5 w-5 text-white" strokeWidth={2.5} />
          </button>

          <h1 className="text-[26px] font-bold tracking-tight text-white">
            Verification code
          </h1>
          <p className="mt-3 text-center text-[13px] font-medium leading-[1.6] text-white/80">
            We sent a 4-digit code to<br />
            <span className="font-semibold text-white">{phoneNumber}</span>
          </p>
        </div>

        {/* Bottom Sheet Area */}
        <div className="relative flex flex-1 flex-col items-center rounded-t-[2.5rem] bg-white px-8 pt-12 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          
          <p className="mb-6 text-[13px] font-medium text-[#8F95B2]">
            Enter the code below
          </p>

          {/* OTP Input Row */}
          <div className="mb-8 flex justify-center gap-3">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-${idx}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                className="flex h-[60px] w-[56px] rounded-[1rem] border-2 border-[#EEF0F5] bg-[#F7F9FC] text-center text-[22px] font-bold text-[#11142D] transition-colors focus:border-[#3B58F5] focus:outline-none hover:border-[#E2E6F0]"
              />
            ))}
          </div>

          <button
            disabled={!isComplete}
            className={cn(
              "w-full rounded-[1rem] py-[18px] text-[15px] font-bold transition-all duration-300",
              isComplete 
                ? "bg-[#3B58F5] text-white shadow-lg shadow-[#3B58F5]/25 hover:bg-[#2C48B8] active:scale-[0.98]" 
                : "cursor-not-allowed bg-[#B5C7FE] text-white"
            )}
          >
            Verify & Continue
          </button>

          <p className="mt-6 text-[13px] font-medium text-[#8F95B2]">
            This code will expire in <span className="font-bold text-[#3B58F5]">{timer}s</span>
          </p>

        </div>
      </div>
    </div>
  );
}
