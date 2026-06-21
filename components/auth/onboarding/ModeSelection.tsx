"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { User, Briefcase, Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "personal" | "business" | null;

export default function ModeSelection() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = React.useState<Mode>(null);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className="flex min-h-screen bg-zinc-100" />;

  const handleContinue = () => {
    if (selectedMode) {
      // Logic to store the selected mode will go here (e.g., Context, LocalStorage)
      router.push("/login");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 sm:p-6">
      {/* Mobile constraint container simulating the 412x851 Figma dimensions on desktop */}
      <div className="relative flex h-[100dvh] w-full flex-col overflow-y-auto bg-[#FDFDFD] shadow-2xl sm:h-[851px] sm:w-[412px] sm:rounded-[2.5rem] [&::-webkit-scrollbar]:hidden">
        
        {/* Header */}
        <div className="mt-16 px-6 text-center">
          <h1 className="text-[28px] font-bold tracking-tight text-[#11142D]">
            Choose Your Mode
          </h1>
          <p className="mt-2 text-[14px] font-medium text-[#8F95B2]">
            Select how you'll use CallsChat
          </p>
        </div>

        {/* Cards Container */}
        <div className="mt-10 flex flex-col gap-6 px-6 pb-32">
          
          {/* Personal Mode Card */}
          <button
            onClick={() => setSelectedMode("personal")}
            className={cn(
              "relative flex w-full flex-col items-start rounded-3xl border-2 bg-white p-6 text-left shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300",
              selectedMode === "personal" 
                ? "border-[#3B58F5] shadow-[0_8px_30px_rgba(59,88,245,0.12)] scale-[1.02]" 
                : "border-transparent hover:border-gray-100"
            )}
          >
            {/* Checkmark */}
            {selectedMode === "personal" && (
              <div className="absolute right-6 top-6 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#3B58F5]">
                <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
              </div>
            )}

            {/* Icon */}
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3B58F5]">
              <User className="h-6 w-6 text-white" strokeWidth={2} />
            </div>

            <h2 className="mb-1 text-[18px] font-bold text-[#11142D]">Personal Mode</h2>
            <p className="mb-4 text-[13px] font-medium leading-[1.5] text-[#8F95B2]">
              Connect with friends and family
            </p>

            <ul className="flex flex-col gap-2.5">
              {[
                "Private messaging",
                "Voice & video calls",
                "Secure group chats",
                "Media sharing"
              ].map((item, i) => (
                <li key={i} className="flex items-center text-[12.5px] font-medium text-[#8F95B2]">
                  <div className="mr-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3B58F5]" />
                  {item}
                </li>
              ))}
            </ul>
          </button>

          {/* Business Mode Card */}
          <button
            onClick={() => setSelectedMode("business")}
            className={cn(
              "relative flex w-full flex-col items-start rounded-3xl border-2 bg-white p-6 text-left shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300",
              selectedMode === "business" 
                ? "border-[#8B5CF6] shadow-[0_8px_30px_rgba(139,92,246,0.12)] scale-[1.02]" 
                : "border-transparent hover:border-gray-100"
            )}
          >
            {/* Checkmark */}
            {selectedMode === "business" && (
              <div className="absolute right-6 top-6 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#8B5CF6]">
                <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
              </div>
            )}

            {/* Icon */}
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8B5CF6]">
              <Briefcase className="h-6 w-6 text-white" strokeWidth={2} />
            </div>

            <h2 className="mb-1 text-[18px] font-bold text-[#11142D]">Business Mode</h2>
            <p className="mb-4 text-[13px] font-medium leading-[1.5] text-[#8F95B2]">
              Manage teams, clients, and business communication
            </p>

            <ul className="flex flex-col gap-2.5">
              {[
                "Team management",
                "Client communication",
                "Analytics & insights"
              ].map((item, i) => (
                <li key={i} className="flex items-center text-[12.5px] font-medium text-[#8F95B2]">
                  <div className="mr-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8B5CF6]" />
                  {item}
                </li>
              ))}
            </ul>
          </button>
        </div>

        {/* Bottom Action Area (Sticky) */}
        <div className="fixed bottom-0 left-0 w-full sm:absolute z-10 bg-gradient-to-t from-[#FDFDFD] via-[#FDFDFD] to-transparent px-6 pb-8 pt-12">
          <button
            onClick={handleContinue}
            disabled={!selectedMode}
            className={cn(
              "flex w-full items-center justify-center rounded-[1rem] py-[18px] text-[15px] font-semibold transition-all duration-300",
              selectedMode
                ? "bg-[#3B58F5] text-white shadow-lg shadow-[#3B58F5]/25 hover:bg-[#2C48B8] active:scale-[0.98]"
                : "cursor-not-allowed bg-[#EEF0F5] text-[#A0A6C0]"
            )}
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

      </div>
    </div>
  );
}
