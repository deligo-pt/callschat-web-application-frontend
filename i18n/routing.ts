import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // All supported locales
  locales: ["en", "bn", "pt", "hi", "de"] as const,

  // Default locale used when no locale prefix is detected
  defaultLocale: "en",

  // Use "as-needed" so English URLs stay clean (e.g. /profile vs /en/profile)
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
