"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardItem {
  id: string;
  initials: string;
  name: string;
  phone: string;
  status: "Send" | "Seen" | "Pending";
}

const DASHBOARD_ITEMS: DashboardItem[] = [
  { id: "1", initials: "SJ", name: "Wade Warren", phone: "+1 (555) xxx-4567", status: "Send" },
  { id: "2", initials: "AB", name: "Annette Black", phone: "+1 (555) xxx-4567", status: "Send" },
  { id: "3", initials: "MM", name: "Marvin McKinney", phone: "+1 (555) xxx-4567", status: "Seen" },
  { id: "4", initials: "CF", name: "Cody Fisher", phone: "+1 (555) xxx-4567", status: "Seen" },
  { id: "5", initials: "DL", name: "Devon Lane", phone: "+1 (555) xxx-4567", status: "Pending" },
  { id: "6", initials: "RE", name: "Ralph Edwards", phone: "+1 (555) xxx-4567", status: "Pending" },
  { id: "7", initials: "RE2", name: "Ralph Edwards", phone: "+1 (555) xxx-4567", status: "Pending" },
  { id: "8", initials: "RE3", name: "Ralph Edwards", phone: "+1 (555) xxx-4567", status: "Pending" },
];

interface BusinessDashboardProps {
  onBack?: () => void;
}

export function BusinessDashboard({ onBack }: BusinessDashboardProps) {
  return (
    <div className="flex h-full flex-col bg-white relative overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-6 py-5 shrink-0 shadow-sm"
        style={{ background: "linear-gradient(135deg, #3B58F5 0%, #2563EB 100%)" }}
      >
        {onBack ? (
          <button
            onClick={onBack}
            aria-label="Go back"
            className="flex items-center gap-3 text-white hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="h-5 w-5" />
            <h2 className="text-[18px] font-bold text-white tracking-tight">
              Business Dashboard
            </h2>
          </button>
        ) : (
          <h2 className="text-[18px] font-bold text-white tracking-tight">
            Business Dashboard
          </h2>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8 scrollbar-hide">
        <div className="mx-auto max-w-[520px] flex flex-col pb-8">
          
          {/* Top Summary Card */}
          <div className="rounded-2xl bg-[#F4F8FF] border border-[#E0E7FF] p-6 mb-8 shadow-sm">
            <h3 className="text-[16px] font-bold text-[#1E3A8A] mb-4 tracking-tight">
              Business Dashboard
            </h3>
            
            <div className="grid grid-cols-3 gap-3">
              {/* Customers Box */}
              <div className="flex flex-col items-start justify-center rounded-xl bg-white p-3.5 border border-[#E2E8F0] shadow-sm">
                <span className="text-[22px] font-bold text-[#2563EB] leading-none mb-1.5">
                  127
                </span>
                <span className="text-[12px] font-medium text-[#64748B]">
                  Customers
                </span>
              </div>

              {/* Response Box */}
              <div className="flex flex-col items-start justify-center rounded-xl bg-white p-3.5 border border-[#E2E8F0] shadow-sm">
                <span className="text-[22px] font-bold text-[#10B981] leading-none mb-1.5">
                  89
                </span>
                <span className="text-[12px] font-medium text-[#64748B]">
                  Response
                </span>
              </div>

              {/* Pending Box */}
              <div className="flex flex-col items-start justify-center rounded-xl bg-white p-3.5 border border-[#E2E8F0] shadow-sm">
                <span className="text-[22px] font-bold text-[#F59E0B] leading-none mb-1.5">
                  24
                </span>
                <span className="text-[12px] font-medium text-[#64748B]">
                  Pending
                </span>
              </div>
            </div>
          </div>

          {/* Contact List */}
          <div className="flex flex-col gap-6 px-2">
            {DASHBOARD_ITEMS.map((item) => {
              const isSend = item.status === "Send";
              const isSeen = item.status === "Seen";
              const isPending = item.status === "Pending";

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between"
                >
                  {/* Left: Avatar & Info */}
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#3B82F6] text-[14px] font-bold text-white shadow-sm">
                      {item.initials.slice(0, 2)}
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-[15px] font-bold text-[#0F172A]">
                        {item.name}
                      </span>
                      <span className="text-[13px] font-medium text-slate-400 mt-0.5">
                        {item.phone}
                      </span>
                    </div>
                  </div>

                  {/* Right: Status / Action */}
                  <div>
                    <span
                      className={cn(
                        "text-[14px] font-semibold transition-colors",
                        isSend && "text-[#2563EB] cursor-pointer hover:underline",
                        isSeen && "text-[#16A34A]",
                        isPending && "text-[#D97706]"
                      )}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
