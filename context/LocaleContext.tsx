"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { routing, Locale } from "@/i18n/routing";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => undefined,
});

export function LocaleProvider({ children, initialLocale }: { children: React.ReactNode; initialLocale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // Persist locale choice to localStorage so we can restore it across sessions
  useEffect(() => {
    const stored = localStorage.getItem("callschat_locale") as Locale | null;
    if (stored && routing.locales.includes(stored)) {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback(
    (newLocale: Locale) => {
      localStorage.setItem("callschat_locale", newLocale);
      setLocaleState(newLocale);
      // Build locale-prefixed path for next-intl middleware
      const prefix = newLocale === "en" ? "" : `/${newLocale}`;
      const target = `${prefix}${pathname}` || "/";
      router.push(target);
    },
    [router, pathname]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
