"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Shield, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { UserService } from "@/services/user.service";

interface TimerOption {
  label: string;
  sublabel?: string;
  value: number | null;
}

const TIMER_OPTIONS: TimerOption[] = [
  { label: "Off",      sublabel: "Default — messages stay forever",    value: null    },
  { label: "24 hours", sublabel: "Messages disappear after 1 day",    value: 86400   },
  { label: "7 days",   sublabel: "Messages disappear after 1 week",   value: 604800  },
  { label: "90 days",  sublabel: "Messages disappear after 90 days",  value: 7776000 },
];

interface DisappearingMessagesProps {
  onBack?: () => void;
}

export function DisappearingMessages({ onBack }: DisappearingMessagesProps) {
  const [selectedTimer, setSelectedTimer] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("callschat_default_disappear_seconds");
      if (stored && stored !== "null" && stored !== "0") {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed)) {
          setSelectedTimer(parsed);
        }
      } else {
        setSelectedTimer(null);
      }
    }
  }, []);

  const [isSaving, setIsSaving] = useState(false);

  const handleSelect = async (value: number | null) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      // 1. Persist to backend — this also bulk-updates ALL personal conversations
      await UserService.updatePrivacy({ defaultDisappearingTimer: value });

      // 2. Mirror in localStorage for fast client-side reads
      if (typeof window !== "undefined") {
        if (value === null) {
          localStorage.removeItem("callschat_default_disappear_seconds");
        } else {
          localStorage.setItem("callschat_default_disappear_seconds", String(value));
        }
      }

      setSelectedTimer(value);

      const label = value === 86400 ? "24 hours" : value === 604800 ? "7 days" : "90 days";
      if (value === null) {
        toast.success("Disappearing messages turned off for all chats.");
      } else {
        toast.success(`Disappearing messages set to ${label} for all your chats.`);
      }
    } catch (e) {
      console.error("Failed to update global disappearing timer:", e);
      toast.error("Failed to update setting. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white relative overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-6 py-5 shrink-0 shadow-sm"
        style={{ background: "linear-gradient(135deg, #3B58F5 0%, #2563EB 100%)" }}
      >
        {onBack ? (
          <button
            onClick={onBack}
            aria-label="Go back"
            className="flex items-center gap-3 text-white hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="h-5 w-5" />
            <h2 className="text-[18px] font-bold text-white tracking-tight">
              Disappearing Messages
            </h2>
          </button>
        ) : (
          <h2 className="text-[18px] font-bold text-white tracking-tight">
            Disappearing Messages
          </h2>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8 scrollbar-hide">
        <div className="mx-auto max-w-[480px] flex flex-col gap-4 pb-8">
          {/* Banner Card */}
          <div className="flex items-start gap-4 rounded-2xl border border-[#E9D5FF] bg-[#FAF5FF] p-5 shadow-sm mb-2">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#8B5CF6] text-white shadow-sm">
              <Shield className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-[16px] font-bold text-[#1E1B4B] mb-1">
                Global Setting
              </h3>
              <p className="text-[13px] text-[#4C1D95]/80 font-medium leading-relaxed">
                This setting applies to <strong>all your personal conversations</strong>. When enabled, new messages in every chat will automatically disappear after the selected time — just like WhatsApp's global disappearing messages.
              </p>
            </div>
          </div>

          {/* Options List */}
          <div className="flex flex-col gap-3">
            {TIMER_OPTIONS.map((option) => {
              const isSelected = selectedTimer === option.value;
              const isOff = option.value === null;

              return (
                <button
                  key={String(option.value)}
                  onClick={() => handleSelect(option.value)}
                  type="button"
                  disabled={isSaving || selectedTimer === option.value}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl p-4 text-left transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed",
                    isSelected
                      ? "bg-[#EEF2FF] border-2 border-[#3B82F6] shadow-sm"
                      : "bg-white border border-[#E2E8F0] hover:bg-slate-50 shadow-sm"
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
                        isSelected
                          ? "bg-[#2563EB] text-white shadow-sm"
                          : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {isOff ? (
                        <AlertCircle className="h-5 w-5" />
                      ) : (
                        <Clock className="h-5 w-5" />
                      )}
                    </div>

                    {/* Label & Sublabel */}
                    <div className="flex flex-col items-start leading-tight">
                      <span
                        className={cn(
                          "text-[15px] font-bold",
                          isSelected ? "text-[#1E3A8A]" : "text-[#0F172A]"
                        )}
                      >
                        {option.label}
                      </span>
                      {option.sublabel && (
                        <span
                          className={cn(
                            "text-[12px] font-medium mt-0.5",
                            isSelected ? "text-slate-500" : "text-slate-400"
                          )}
                        >
                          {option.sublabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Checkmark */}
                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 text-[#2563EB] fill-[#2563EB] text-white shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
