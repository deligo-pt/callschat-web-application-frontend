"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThemeModal({ isOpen, onClose }: ThemeModalProps) {
  const { theme, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<string>("system");

  useEffect(() => {
    if (isOpen) {
      setSelectedTheme(theme || "system");
    }
  }, [isOpen, theme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApply = () => {
    setTheme(selectedTheme);
    onClose();
  };

  const options = [
    {
      id: "light",
      label: "Light",
      icon: Sun,
      description: "Clean, classic light background and crisp contrast",
    },
    {
      id: "dark",
      label: "Dark",
      icon: Moon,
      description: "Authentic WhatsApp dark surfaces optimized for night use",
    },
    {
      id: "system",
      label: "System default",
      icon: Monitor,
      description: "Automatically matches your device operating system setting",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-[420px] rounded-3xl bg-white dark:bg-[#202C33] border border-black/10 dark:border-white/10 shadow-2xl p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="theme-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] dark:border-[#222D34]">
          <h2 id="theme-modal-title" className="text-[20px] font-bold text-[#111B21] dark:text-[#E9EDEF]">
            Choose Theme
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8696A0] hover:text-[#111B21] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2">
          {options.map((opt) => {
            const isSelected = selectedTheme === opt.id;
            const Icon = opt.icon;

            return (
              <label
                key={opt.id}
                onClick={() => setSelectedTheme(opt.id)}
                className={cn(
                  "flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer group",
                  isSelected
                    ? "border-[#00A884] bg-[#00A884]/10 dark:bg-[#00A884]/15"
                    : "border-transparent bg-[#F0F2F5] dark:bg-[#182229] hover:bg-[#E9EDEF] dark:hover:bg-[#222D34]"
                )}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                    isSelected 
                      ? "bg-[#00A884] text-white" 
                      : "bg-white dark:bg-[#202C33] text-[#54656F] dark:text-[#8696A0]"
                  )}>
                    <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
                  </div>
                  <div className="flex flex-col">
                    <span className={cn(
                      "text-[14.5px] font-semibold tracking-tight",
                      isSelected 
                        ? "text-[#008069] dark:text-[#00A884]" 
                        : "text-[#111B21] dark:text-[#E9EDEF]"
                    )}>
                      {opt.label}
                    </span>
                    <span className="text-[12px] text-[#667781] dark:text-[#8696A0] leading-snug">
                      {opt.description}
                    </span>
                  </div>
                </div>

                {/* Radio Circle */}
                <div className={cn(
                  "h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ml-3",
                  isSelected
                    ? "border-[#00A884] bg-white dark:bg-[#202C33]"
                    : "border-[#8696A0]/50"
                )}>
                  {isSelected && (
                    <div className="h-2.5 w-2.5 rounded-full bg-[#00A884]" />
                  )}
                </div>
              </label>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full text-[13.5px] font-semibold text-[#54656F] dark:text-[#8696A0] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-6 py-2 rounded-full text-[13.5px] font-bold text-white bg-[#00A884] hover:bg-[#008069] shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
