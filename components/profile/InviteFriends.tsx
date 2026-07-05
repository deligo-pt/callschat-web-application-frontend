"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";

interface ContactItem {
  id: string;
  initials: string;
  name: string;
  phone: string;
}

const CONTACTS: ContactItem[] = [
  { id: "1", initials: "SJ", name: "Wade Warren", phone: "+1 (555) xxx-4567" },
  { id: "2", initials: "AB", name: "Annette Black", phone: "+1 (555) xxx-4567" },
  { id: "3", initials: "MM", name: "Marvin McKinney", phone: "+1 (555) xxx-4567" },
  { id: "4", initials: "CF", name: "Cody Fisher", phone: "+1 (555) xxx-4567" },
  { id: "5", initials: "DL", name: "Devon Lane", phone: "+1 (555) xxx-4567" },
  { id: "6", initials: "RE", name: "Ralph Edwards", phone: "+1 (555) xxx-4567" },
  { id: "7", initials: "RE2", name: "Ralph Edwards", phone: "+1 (555) xxx-4567" },
  { id: "8", initials: "RE3", name: "Ralph Edwards", phone: "+1 (555) xxx-4567" },
  { id: "9", initials: "RE4", name: "Ralph Edwards", phone: "+1 (555) xxx-4567" },
];

interface InviteFriendsProps {
  onBack?: () => void;
}

export function InviteFriends({ onBack }: InviteFriendsProps) {
  return (
    <div className="flex h-full flex-col bg-white relative overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-6 py-5 shrink-0 shadow-sm"
        style={{ background: "linear-gradient(135deg, #3B58F5 0%, #2563EB 100%)" }}
      >
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Go back"
            className="flex items-center gap-3 text-white hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="h-5 w-5" />
            <h2 className="text-[18px] font-bold text-white tracking-tight">
              Invite Friends
            </h2>
          </button>
        )}
        {!onBack && (
          <h2 className="text-[18px] font-bold text-white tracking-tight">
            Invite Friends
          </h2>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8 scrollbar-hide">
        <h3 className="text-center text-[18px] font-bold text-[#1E3A8A] mb-6 tracking-tight">
          From Contacts
        </h3>

        <div className="mx-auto max-w-[480px] flex flex-col gap-3 pb-8">
          {CONTACTS.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center justify-between rounded-xl border border-[#E0E7FF] bg-white p-4 shadow-sm hover:shadow hover:border-blue-200 transition-all duration-200"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#3B82F6] text-[14px] font-bold text-white shadow-sm">
                  {contact.initials.slice(0, 2)}
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[14px] font-bold text-[#0F172A]">
                    {contact.name}
                  </span>
                  <span className="text-[12px] font-medium text-slate-400 mt-0.5">
                    {contact.phone}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="text-[14px] font-bold text-[#2563EB] hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Invite
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
