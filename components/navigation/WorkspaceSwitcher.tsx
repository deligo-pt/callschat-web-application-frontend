"use client";

import React from "react";
import { User, Briefcase, Check, Loader2, ChevronDown, CheckCircle2 } from "lucide-react";
import { useUser } from "@/context/UserContext";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface WorkspaceSwitcherProps {
  className?: string;
  compact?: boolean;
}

export function WorkspaceSwitcher({ className, compact = true }: WorkspaceSwitcherProps) {
  const { currentMode, switchWorkspaceMode, isSwitchingMode, businessProfile } = useUser();
  const isBusiness = currentMode === "BUSINESS";
  const isVerified = businessProfile?.isVerified;

  const handleModeSwitch = async (mode: "PERSONAL" | "BUSINESS") => {
    if (mode === currentMode || isSwitchingMode) return;
    try {
      await switchWorkspaceMode(mode);
    } catch (error) {
      console.error("Failed to switch workspace:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={isSwitchingMode}
          className={cn(
            "relative flex items-center justify-center rounded-[1.25rem] transition-all duration-300 focus:outline-none disabled:opacity-70 group",
            compact ? "h-12 w-12" : "h-12 px-3 gap-2.5 w-full",
            isBusiness
              ? "bg-purple-50 text-[#8B5CF6] hover:bg-purple-100 shadow-sm"
              : "bg-[#EEF2FB] text-[#3B58F5] hover:bg-[#E2EAF8] shadow-sm",
            className
          )}
          title={`Active Workspace: ${isBusiness ? (businessProfile?.companyName || "Business") + (isVerified ? " (Verified)" : "") : "Personal"}`}
        >
          {isSwitchingMode ? (
            <Loader2 className="h-5 w-5 animate-spin text-current" />
          ) : isBusiness ? (
            <Briefcase className="h-5 w-5 shrink-0" strokeWidth={2.5} />
          ) : (
            <User className="h-5 w-5 shrink-0" strokeWidth={2.5} />
          )}

          {!compact && (
            <div className="flex flex-col items-start overflow-hidden text-left">
              <span className="text-[12px] font-bold tracking-tight truncate leading-tight flex items-center gap-1">
                {isBusiness ? businessProfile?.companyName || "Business" : "Personal"}
                {isBusiness && isVerified && <CheckCircle2 className="h-3 w-3 text-[#3B58F5] fill-[#3B58F5]" />}
              </span>
              <span className="text-[10px] font-medium opacity-75 truncate leading-tight">
                Workspace
              </span>
            </div>
          )}

          {!compact && <ChevronDown className="h-3.5 w-3.5 ml-auto opacity-60" />}

          {/* Mode Badge indicator for compact view */}
          {compact && !isSwitchingMode && (
            <span
              className={cn(
                "absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-extrabold text-white shadow-xs",
                isBusiness ? "bg-[#8B5CF6]" : "bg-[#3B58F5]"
              )}
            >
              {isBusiness ? "B" : "P"}
            </span>
          )}

          {compact && isBusiness && isVerified && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white shadow-xs">
              <CheckCircle2 className="h-3 w-3 text-[#3B58F5] fill-[#3B58F5]" />
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent side="right" align="start" sideOffset={12} className="w-64 p-2 rounded-2xl shadow-xl border border-[#E6EAFA] bg-white">
        <DropdownMenuLabel className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-[#8F95B2]">
          Switch Workspace
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#F4F6FC]" />

        <DropdownMenuItem
          onClick={() => handleModeSwitch("PERSONAL")}
          disabled={isSwitchingMode}
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors mt-1",
            !isBusiness ? "bg-[#EEF2FB] text-[#3B58F5] font-bold" : "hover:bg-[#F4F6FC] text-[#1D2A54]"
          )}
        >
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0", !isBusiness ? "bg-[#3B58F5] text-white" : "bg-[#F4F6FC] text-[#8F95B2]")}>
            <User className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[14px] leading-tight">Personal</span>
            <span className={cn("text-[11px] font-normal mt-0.5 truncate", !isBusiness ? "text-[#3B58F5]/80" : "text-[#8F95B2]")}>
              Private chats & calls
            </span>
          </div>
          {!isBusiness && <Check className="h-4 w-4 ml-auto text-[#3B58F5]" strokeWidth={3} />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleModeSwitch("BUSINESS")}
          disabled={isSwitchingMode}
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors mt-1.5",
            isBusiness ? "bg-purple-50 text-[#8B5CF6] font-bold" : "hover:bg-[#F4F6FC] text-[#1D2A54]"
          )}
        >
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0", isBusiness ? "bg-[#8B5CF6] text-white" : "bg-[#F4F6FC] text-[#8F95B2]")}>
            <Briefcase className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[14px] leading-tight flex items-center gap-1.5">
              {businessProfile?.companyName || "Business"}
              {isVerified && <CheckCircle2 className="h-3.5 w-3.5 text-[#3B58F5] fill-[#3B58F5]" />}
            </span>
            <span className={cn("text-[11px] font-normal mt-0.5 truncate", isBusiness ? "text-[#8B5CF6]/80" : "text-[#8F95B2]")}>
              Team & professional tools
            </span>
          </div>
          {isBusiness && <Check className="h-4 w-4 ml-auto text-[#8B5CF6]" strokeWidth={3} />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
