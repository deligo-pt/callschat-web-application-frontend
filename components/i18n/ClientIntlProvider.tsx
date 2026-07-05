"use client";

import React, { useEffect, useState } from "react";
import { NextIntlClientProvider } from "next-intl";
import { Locale, routing } from "@/i18n/routing";

// Static message bundles – module-level constants, never re-created
import enMessages from "@/messages/en.json";
import bnMessages from "@/messages/bn.json";
import ptMessages from "@/messages/pt.json";
import hiMessages from "@/messages/hi.json";

type Messages = typeof enMessages;

const MESSAGE_MAP: Record<Locale, Messages> = {
  en: enMessages,
  bn: bnMessages,
  pt: ptMessages,
  hi: hiMessages,
};

interface ClientIntlProviderProps {
  children: React.ReactNode;
}

export function ClientIntlProvider({ children }: ClientIntlProviderProps) {
  /**
   * CRITICAL: Always initialize with "en" so SSR and the initial client
   * render produce identical HTML (no hydration mismatch).
   * We update to the stored locale AFTER the first render in useEffect.
   */
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    // After hydration: read persisted locale and swap if different
    try {
      const stored = localStorage.getItem("callschat_locale") as Locale | null;
      if (stored && routing.locales.includes(stored) && stored !== "en") {
        setLocale(stored);
      }
    } catch {
      // localStorage unavailable – stay on "en"
    }

    // Listen for locale-change events dispatched by LanguageSelector
    const handler = (e: CustomEvent<{ locale: Locale }>) => {
      setLocale(e.detail.locale);
    };
    window.addEventListener(
      "callschat_locale_changed",
      handler as EventListener
    );
    return () =>
      window.removeEventListener(
        "callschat_locale_changed",
        handler as EventListener
      );
  }, []); // runs exactly once after mount

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={MESSAGE_MAP[locale]}
      timeZone="UTC"
    >
      {children}
    </NextIntlClientProvider>
  );
}
