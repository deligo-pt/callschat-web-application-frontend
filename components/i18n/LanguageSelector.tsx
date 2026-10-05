"use client";

import React, { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import { Locale, routing } from "@/i18n/routing";

interface LanguageOption {
  code: Locale;
  nativeName: string;
  regionLabel: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: "en", nativeName: "English", regionLabel: "English (US)" },
  { code: "bn", nativeName: "বাংলা", regionLabel: "Bengali" },
  { code: "hi", nativeName: "हिन्दी", regionLabel: "Hindi" },
  { code: "pt", nativeName: "Português", regionLabel: "Portuguese" },
  { code: "de", nativeName: "Deutsch", regionLabel: "German (DE)" },
];

interface LanguageSelectorProps {
  currentLocale: Locale;
  onBack?: () => void;
}

export function LanguageSelector({ currentLocale, onBack }: LanguageSelectorProps) {
  const t = useTranslations("language");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Locale>(currentLocale);
  const [isPending, startTransition] = useTransition();

  const filtered = LANGUAGES.filter(
    (lang) =>
      lang.nativeName.toLowerCase().includes(query.toLowerCase()) ||
      lang.regionLabel.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (locale: Locale) => {
    setSelected(locale);
    startTransition(() => {
      // Persist to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("callschat_locale", locale);
        // Dispatch custom event so ClientIntlProvider re-renders with new locale
        window.dispatchEvent(
          new CustomEvent("callschat_locale_changed", { detail: { locale } })
        );
      }
    });
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-[#111B21] relative">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-6 py-5 border-b border-[#E6EAFA] dark:border-[#222D34] shrink-0"
        style={{ background: "linear-gradient(135deg, #3B58F5 0%, #2563EB 100%)" }}
      >
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Go back"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <h2 className="text-[17px] font-bold text-white tracking-tight">
          {t("title")}
        </h2>
      </div>

      {/* Search Bar */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-[#8696A0] pointer-events-none" />
          <input
            id="language-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search_placeholder")}
            className="h-10 w-full rounded-full bg-[#F1F5FF] dark:bg-[#202C33] pl-10 pr-4 text-[13px] font-medium text-slate-800 dark:text-[#E9EDEF] placeholder-slate-400 dark:placeholder-[#8696A0] focus:outline-none focus:ring-2 focus:ring-blue-400/30 dark:focus:ring-[#00A884]/30 border border-transparent focus:border-blue-200 dark:focus:border-[#00A884]/40 transition-all"
          />
        </div>
      </div>

      {/* Language List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        {filtered.map((lang) => {
          const isActive = selected === lang.code;
          return (
            <button
              key={lang.code}
              id={`language-option-${lang.code}`}
              onClick={() => handleSelect(lang.code)}
              disabled={isPending}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl px-4 py-3.5 transition-all duration-200 cursor-pointer",
                isActive
                  ? "bg-[#EEF2FF] dark:bg-[#202C33] border border-[#C7D2FE] dark:border-[#2A3942] shadow-sm"
                  : "hover:bg-slate-50 dark:hover:bg-[#202C33]/60 border border-transparent"
              )}
            >
              <div className="flex items-center gap-3">
                {/* Radio circle */}
                <div
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isActive
                      ? "border-[#2563EB] bg-[#2563EB] dark:border-[#38BDF8] dark:bg-[#38BDF8]"
                      : "border-slate-300 dark:border-[#374248] bg-white dark:bg-[#111B21]"
                  )}
                >
                  {isActive && <div className="h-2 w-2 rounded-full bg-white dark:bg-[#111B21]" />}
                </div>

                {/* Language name */}
                <div className="flex flex-col items-start leading-tight">
                  <span
                    className={cn(
                      "text-[14px] font-semibold",
                      isActive ? "text-[#2563EB] dark:text-[#38BDF8]" : "text-[#0F172A] dark:text-[#E9EDEF]"
                    )}
                  >
                    {lang.nativeName}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-[#8696A0]">
                    {lang.regionLabel}
                  </span>
                </div>
              </div>

              {/* Checkmark for active */}
              {isActive && (
                <Check className="h-4 w-4 text-[#2563EB] dark:text-[#38BDF8] shrink-0" strokeWidth={2.5} />
              )}
            </button>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-[#8696A0]">
            <Search className="h-8 w-8 mb-3 opacity-40" />
            <p className="text-[13px] font-medium">No languages found</p>
          </div>
        )}
      </div>

      {/* Pending overlay */}
      {isPending && (
        <div className="absolute inset-0 bg-white/60 dark:bg-[#111B21]/70 flex items-center justify-center z-10">
          <div className="h-5 w-5 rounded-full border-2 border-[#2563EB] dark:border-[#38BDF8] border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
}
