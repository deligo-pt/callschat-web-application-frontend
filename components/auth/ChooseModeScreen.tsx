"use client";

import * as React from "react";
import { User, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function ChooseModeScreen() {
  const router = useRouter();
  const [accountType, setAccountType] = React.useState<"PERSONAL" | "BUSINESS">("PERSONAL");

  const handleContinue = () => {
    sessionStorage.setItem("auth_account_mode", accountType);
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 sm:p-6">
      <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-gradient-to-br from-[#4A72FF] to-[#1D3BB5] shadow-2xl sm:h-[851px] sm:w-[412px] sm:rounded-[2.5rem]">
        
        {/* Top Section */}
        <div className="relative flex flex-col items-center justify-center pb-12 pt-24">
          <button 
            onClick={() => router.back()}
            className="absolute left-6 top-16 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30"
          >
            <ChevronLeft className="mr-0.5 h-5 w-5 text-white" strokeWidth={2.5} />
          </button>

          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[1.25rem] border border-white/10 bg-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md">
            <User className="h-9 w-9 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-white">Account Type</h1>
          <p className="mt-1.5 text-[14px] font-medium text-white/80">How will you use CallsChat?</p>
        </div>

        {/* Bottom Sheet Area */}
        <div className="relative flex flex-1 flex-col rounded-t-[2.5rem] bg-white px-8 pt-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-[#1D2A54]">Select Mode</label>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setAccountType("PERSONAL")}
                  className={cn(
                    "rounded-[1rem] p-4 text-left transition-all",
                    accountType === "PERSONAL" 
                      ? "bg-[#EEF2FB] border-2 border-[#3B58F5]" 
                      : "bg-white border-2 border-[#E6EAFA] hover:border-[#AEC0ED]"
                  )}
                >
                  <h3 className={cn("text-[16px] font-bold", accountType === "PERSONAL" ? "text-[#3B58F5]" : "text-[#1D2A54]")}>Personal</h3>
                  <p className="mt-1 text-[13px] text-[#8F95B2]">For chatting with friends and family.</p>
                </button>
                <button
                  onClick={() => setAccountType("BUSINESS")}
                  className={cn(
                    "rounded-[1rem] p-4 text-left transition-all",
                    accountType === "BUSINESS" 
                      ? "bg-[#EEF2FB] border-2 border-[#3B58F5]" 
                      : "bg-white border-2 border-[#E6EAFA] hover:border-[#AEC0ED]"
                  )}
                >
                  <h3 className={cn("text-[16px] font-bold", accountType === "BUSINESS" ? "text-[#3B58F5]" : "text-[#1D2A54]")}>Business</h3>
                  <p className="mt-1 text-[13px] text-[#8F95B2]">For professional use and managing clients.</p>
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleContinue}
            className="mt-auto mb-8 w-full rounded-[1rem] bg-[#3B58F5] py-[18px] text-[15px] font-bold text-white shadow-lg shadow-[#3B58F5]/25 transition-all duration-300 hover:bg-[#2C48B8] active:scale-[0.98]"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
