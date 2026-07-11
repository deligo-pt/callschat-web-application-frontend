"use client";

import React from "react";
import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function ProfileContactsRoute() {
  const router = useRouter();
  const t = useTranslations("profile");
  const tContacts = useTranslations("contacts");

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white overflow-y-auto h-full">
      <div className="flex flex-col items-center text-center max-w-sm">
        <div
          onClick={() => router.push("/contacts")}
          className="mb-6 flex flex-col items-center justify-center h-[140px] w-[140px] rounded-2xl bg-[#2563EB] hover:bg-blue-700 transition-all cursor-pointer text-white shadow-lg shadow-blue-500/20 gap-2 group"
        >
          <UserPlus className="h-10 w-10 group-hover:scale-110 transition-transform" strokeWidth={2} />
          <span className="text-[14px] font-bold tracking-tight">Add contact</span>
        </div>
        <p className="text-[14px] font-medium text-slate-500 leading-relaxed mb-6 max-w-[280px]">
          {t("add_contact_desc") || tContacts("add_contact_desc") || "Add contacts and start chatting or calling them instantly."}
        </p>
        <button
          onClick={() => router.push("/contacts")}
          className="rounded-full bg-[#0F172A] px-6 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-slate-800 shadow-sm"
        >
          + Add number
        </button>
      </div>
    </div>
  );
}
