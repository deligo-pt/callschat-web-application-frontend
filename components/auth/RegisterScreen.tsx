"use client";

import * as React from "react";
import { User, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [accountType, setAccountType] = React.useState<"PERSONAL" | "BUSINESS">("PERSONAL");
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    // Ensure the user has a registration token from the OTP step
    if (!sessionStorage.getItem("registrationToken")) {
      toast.error("Session expired. Please verify your phone number again.");
      router.replace("/login");
    }
  }, [router]);

  const handleRegister = () => {
    if (!name.trim()) return;

    const token = sessionStorage.getItem("registrationToken");
    if (!token) return;

    startTransition(async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1";
        
        const res = await fetch(`${baseUrl}/auth/register`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ name: name.trim(), accountType })
        });
        
        const data = await res.json();
        
        const accessToken = data.data?.accessToken || data.accessToken;
        const refreshToken = data.data?.refreshToken || data.refreshToken;

        if ((data.success || res.ok) && accessToken) {
          toast.success("Account created successfully!");
          
          localStorage.setItem("accessToken", accessToken);
          if (refreshToken) {
            localStorage.setItem("refreshToken", refreshToken);
          }
          
          sessionStorage.removeItem("registrationToken");
          
          // Route to the optional profile setup (Step 4)
          router.push("/profile/setup");
        } else {
          toast.error(data.message || data.data?.message || "Failed to create account.");
        }
      } catch (err) {
        toast.error("Network error. Please try again.");
      }
    });
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
          <h1 className="text-[28px] font-bold tracking-tight text-white">Create Account</h1>
          <p className="mt-1.5 text-[14px] font-medium text-white/80">Just a few more details</p>
        </div>

        {/* Bottom Sheet Area */}
        <div className="relative flex flex-1 flex-col rounded-t-[2.5rem] bg-white px-8 pt-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-[#1D2A54]">Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                disabled={isPending}
                onChange={(e) => setName(e.target.value)}
                className="flex h-[52px] w-full rounded-[1rem] border border-[#AEC0ED] bg-[#EEF2FB] px-4 text-[15px] font-semibold tracking-wide text-[#1D2A54] placeholder-[#A0A6C0] transition-colors focus:border-[#3B58F5] focus:outline-none hover:border-[#8E9FCD]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-[#1D2A54]">Account Type</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setAccountType("PERSONAL")}
                  className={cn(
                    "flex-1 rounded-[1rem] py-3.5 text-[14px] font-bold transition-all",
                    accountType === "PERSONAL" 
                      ? "bg-[#EEF2FB] text-[#3B58F5] border-2 border-[#3B58F5]" 
                      : "bg-white text-[#8F95B2] border-2 border-[#E6EAFA] hover:border-[#AEC0ED]"
                  )}
                >
                  Personal
                </button>
                <button
                  onClick={() => setAccountType("BUSINESS")}
                  className={cn(
                    "flex-1 rounded-[1rem] py-3.5 text-[14px] font-bold transition-all",
                    accountType === "BUSINESS" 
                      ? "bg-[#EEF2FB] text-[#3B58F5] border-2 border-[#3B58F5]" 
                      : "bg-white text-[#8F95B2] border-2 border-[#E6EAFA] hover:border-[#AEC0ED]"
                  )}
                >
                  Business
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleRegister}
            disabled={!name.trim() || isPending}
            className={cn(
              "mt-auto mb-8 w-full rounded-[1rem] py-[18px] text-[15px] font-bold transition-all duration-300",
              name.trim() && !isPending
                ? "bg-[#3B58F5] text-white shadow-lg shadow-[#3B58F5]/25 hover:bg-[#2C48B8] active:scale-[0.98]" 
                : "cursor-not-allowed bg-[#B5C7FE] text-white"
            )}
          >
            {isPending ? "Creating account..." : "Complete Registration"}
          </button>
        </div>
      </div>
    </div>
  );
}
