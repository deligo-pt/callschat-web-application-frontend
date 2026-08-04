"use client";

import React, { useState, useEffect, useRef } from "react";
import { AtSign, Check, X, CheckCircle2, XCircle, Loader2, ArrowLeft } from "lucide-react";
import apiClient from "@/services/api.client";
import { useProfile } from "@/context/ProfileContext";
import { toast } from "sonner";

interface CustomUsernameProps {
  onBack?: () => void;
  showHeader?: boolean;
}

export const CustomUsername: React.FC<CustomUsernameProps> = ({ onBack, showHeader = true }) => {
  const { userData, formData, setFormData, handleSaveProfile, isPending } = useProfile();
  
  const initialUsername = formData.username || userData?.profile?.username || "";
  const [usernameInput, setUsernameInput] = useState<string>(initialUsername);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [status, setStatus] = useState<"IDLE" | "AVAILABLE" | "TAKEN" | "INVALID">("IDLE");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initial state if context loads late
  useEffect(() => {
    if (!usernameInput && (formData.username || userData?.profile?.username)) {
      setUsernameInput(formData.username || userData?.profile?.username || "");
    }
  }, [formData.username, userData?.profile?.username]);

  // Validation Rules
  const rule1_length = usernameInput.length >= 4 && usernameInput.length <= 30;
  const rule2_chars = usernameInput.length > 0 && /^[a-zA-Z0-9_]+$/.test(usernameInput);
  const rule3_nospaces = usernameInput.length > 0 && !/\s/.test(usernameInput);
  const rule4_unique =
    status === "AVAILABLE" ||
    (usernameInput.toLowerCase() === (formData.username || userData?.profile?.username || "").toLowerCase() &&
      rule1_length &&
      rule2_chars &&
      rule3_nospaces);

  const canSave = rule1_length && rule2_chars && rule3_nospaces && rule4_unique && status !== "TAKEN";

  // Check availability when input changes
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const clean = usernameInput.trim().toLowerCase();

    if (!clean) {
      setStatus("IDLE");
      setErrorMessage("");
      setIsChecking(false);
      return;
    }

    if (!rule1_length || !rule2_chars || !rule3_nospaces) {
      setStatus("INVALID");
      if (usernameInput.length < 4) setErrorMessage("Must be at least 4 characters");
      else if (usernameInput.length > 30) setErrorMessage("Must not exceed 30 characters");
      else if (/\s/.test(usernameInput)) setErrorMessage("Spaces are not allowed");
      else setErrorMessage("Only letters, digits, and underscores allowed");
      setIsChecking(false);
      return;
    }

    // If it's unchanged from existing saved username
    if (clean === (formData.username || userData?.profile?.username || "").toLowerCase()) {
      setStatus("AVAILABLE");
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    setStatus("IDLE");

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await apiClient.get("/user/username/check", {
          params: { username: clean },
        });
        if (res?.data?.success) {
          if (res.data.isAvailable) {
            setStatus("AVAILABLE");
          } else {
            setStatus("TAKEN");
          }
        } else {
          setStatus("AVAILABLE"); // fallback if api format differs
        }
      } catch (error: any) {
        // If 409 conflict or check returns taken
        if (error?.response?.status === 409) {
          setStatus("TAKEN");
        } else {
          // If endpoint fails, don't block user if format is valid
          setStatus("AVAILABLE");
        }
      } finally {
        setIsChecking(false);
      }
    }, 350);

    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, [usernameInput, rule1_length, rule2_chars, rule3_nospaces, formData.username, userData?.profile?.username]);

  const handleSave = async () => {
    if (!canSave || isSaving || isPending) return;
    setIsSaving(true);
    try {
      const clean = usernameInput.trim().toLowerCase();
      // 1. Update backend directly via FormData multipart patch to ensure profile updates cleanly
      const updateForm = new FormData();
      updateForm.append("username", clean);
      await apiClient.patch("/user/profile", updateForm);

      // 2. Update context state
      setFormData({ ...formData, username: clean });
      toast.success("Username updated successfully!");
      if (onBack) {
        setTimeout(() => onBack(), 800);
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Failed to update username";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const displayHandle = usernameInput ? `@${usernameInput.trim().toLowerCase()}` : "@yourusername";

  return (
    <div className="flex flex-col w-full h-full font-sans bg-white md:bg-[#F8FAFC] overflow-y-auto">
      {/* Top Header */}
      {showHeader && (
        <div className="bg-[#2563EB] py-4 px-6 md:px-8 flex items-center gap-3 text-white shrink-0 shadow-sm">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity p-1 -ml-1 rounded-full hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-[18px] md:text-[20px] font-bold tracking-tight text-white leading-tight">
              Custom User Name
            </h1>
            <p className="text-[12px] text-blue-100 font-medium">Create your user name</p>
          </div>
        </div>
      )}

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col items-center">
        <div className="w-full max-w-[440px] flex flex-col items-center gap-5">
          {/* Card 1: YOUR USERNAME BANNER */}
          <div className="w-full rounded-[20px] bg-[#0F172A] p-6 text-white shadow-md flex items-center gap-4 transition-all">
            <div className="flex h-12 w-12 md:h-14 md:w-14 shrink-0 items-center justify-center rounded-2xl bg-[#2563EB] text-white shadow-sm">
              <AtSign className="h-6 w-6 md:h-7 md:w-7 stroke-[2.2]" />
            </div>
            <div className="flex flex-col overflow-hidden min-w-0">
              <span className="text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase">YOUR USERNAME</span>
              <span className="text-lg md:text-xl font-extrabold text-white tracking-tight truncate mt-0.5">
                {displayHandle}
              </span>
            </div>
          </div>

          {/* Card 2: SET USERNAME INPUT */}
          <div className="w-full rounded-[20px] border border-[#E2E8F0] bg-white p-6 shadow-xs flex flex-col">
            <label className="text-[13px] font-bold text-[#0F172A] mb-2.5">Set Username</label>
            <div
              className={`relative flex h-[50px] w-full items-center justify-between rounded-xl border px-4 transition-all ${
                status === "AVAILABLE" && rule4_unique
                  ? "border-[#22C55E] bg-[#F0FDF4]/40"
                  : status === "TAKEN" || (status === "INVALID" && usernameInput.length > 0)
                  ? "border-[#EF4444] bg-[#FEF2F2]/40"
                  : "border-[#E2E8F0] bg-[#F8FAFC] focus-within:border-[#2563EB] focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/10"
              }`}
            >
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="your user name"
                maxLength={30}
                className="w-full bg-transparent text-[14px] font-semibold text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none"
              />
              <span className="text-[12px] font-semibold text-[#94A3B8] shrink-0 ml-2">
                {usernameInput.length}/30
              </span>
            </div>

            {/* Live Availability Feedback Row */}
            <div className="mt-3 flex items-center min-h-[20px]">
              {isChecking && (
                <div className="flex items-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin text-[#2563EB]" />
                  <span className="text-xs font-bold text-[#2563EB]">Checking availability...</span>
                </div>
              )}
              {!isChecking && status === "AVAILABLE" && rule4_unique && (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                  <span className="text-xs font-bold text-[#22C55E]">@{usernameInput.trim().toLowerCase()} is available</span>
                </div>
              )}
              {!isChecking && status === "TAKEN" && (
                <div className="flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-[#EF4444]" />
                  <span className="text-xs font-bold text-[#EF4444]">@{usernameInput.trim().toLowerCase()} is already taken</span>
                </div>
              )}
              {!isChecking && status === "INVALID" && errorMessage && (
                <div className="flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-[#EF4444]" />
                  <span className="text-xs font-bold text-[#EF4444]">{errorMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: USERNAME RULES */}
          <div className="w-full rounded-[20px] border border-[#E2E8F0] bg-white p-6 shadow-xs flex flex-col">
            <span className="text-[11px] font-bold tracking-wider text-[#94A3B8] uppercase mb-4 block">
              USERNAME RULES
            </span>

            <div className="flex flex-col gap-3">
              {/* Rule 1: Length */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors ${
                    rule1_length ? "bg-[#22C55E] text-white" : "bg-[#F1F5F9] text-[#94A3B8]"
                  }`}
                >
                  {rule1_length ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <X className="h-3.5 w-3.5 stroke-[2.5]" />}
                </div>
                <span className={`text-[13px] font-medium transition-colors ${rule1_length ? "text-[#334155] font-semibold" : "text-[#64748B]"}`}>
                  4–30 characters
                </span>
              </div>

              {/* Rule 2: Allowed Characters */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors ${
                    rule2_chars ? "bg-[#22C55E] text-white" : "bg-[#F1F5F9] text-[#94A3B8]"
                  }`}
                >
                  {rule2_chars ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <X className="h-3.5 w-3.5 stroke-[2.5]" />}
                </div>
                <span className={`text-[13px] font-medium transition-colors ${rule2_chars ? "text-[#334155] font-semibold" : "text-[#64748B]"}`}>
                  Letters, numbers, or underscore
                </span>
              </div>

              {/* Rule 3: No spaces */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors ${
                    rule3_nospaces ? "bg-[#22C55E] text-white" : "bg-[#F1F5F9] text-[#94A3B8]"
                  }`}
                >
                  {rule3_nospaces ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <X className="h-3.5 w-3.5 stroke-[2.5]" />}
                </div>
                <span className={`text-[13px] font-medium transition-colors ${rule3_nospaces ? "text-[#334155] font-semibold" : "text-[#64748B]"}`}>
                  No spaces
                </span>
              </div>

              {/* Rule 4: Unique username */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors ${
                    rule4_unique ? "bg-[#22C55E] text-white" : "bg-[#F1F5F9] text-[#94A3B8]"
                  }`}
                >
                  {rule4_unique ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <X className="h-3.5 w-3.5 stroke-[2.5]" />}
                </div>
                <span className={`text-[13px] font-medium transition-colors ${rule4_unique ? "text-[#334155] font-semibold" : "text-[#64748B]"}`}>
                  Unique username
                </span>
              </div>
            </div>
          </div>

          {/* Save Username Button */}
          <button
            onClick={handleSave}
            disabled={!canSave || isSaving || isPending}
            className={`mt-3 flex h-[48px] w-full items-center justify-center rounded-xl text-[14px] font-bold transition-all ${
              canSave
                ? "bg-[#2563EB] text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 active:scale-[0.99] cursor-pointer"
                : "bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed"
            }`}
          >
            {isSaving || isPending ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : "Save Username"}
          </button>
        </div>
      </div>
    </div>
  );
};
