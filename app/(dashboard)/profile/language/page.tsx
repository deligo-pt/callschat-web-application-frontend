"use client";

import React from "react";
import { LanguageSelector } from "@/components/i18n/LanguageSelector";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Locale } from "@/i18n/routing";

export default function ProfileLanguageRoute() {
  const router = useRouter();
  const currentLocale = useLocale() as Locale;

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto h-full">
      <LanguageSelector
        currentLocale={currentLocale}
        onBack={() => router.push("/profile/edit")}
      />
    </div>
  );
}
