"use client";

import React from "react";
import { ArrowLeft, Phone, Mail, Globe, Download, Share2, Printer, Pencil, QrCode } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { toast } from "sonner";

interface DigitalBusinessCardProps {
  onBack?: () => void;
  onEdit?: () => void;
  onDownloadPNG?: () => void;
  onDownloadPDF?: () => void;
  onShare?: () => void;
  onPrint?: () => void;
  showHeader?: boolean;
}

export const DigitalBusinessCard: React.FC<DigitalBusinessCardProps> = ({
  onBack,
  onEdit,
  onDownloadPNG,
  onDownloadPDF,
  onShare,
  onPrint,
  showHeader = true,
}) => {
  const { userData, formData, avatarPreview, businessProfile } = useProfile();

  // Fallback values matching the professional UI mockup exact design
  const companyName = businessProfile?.companyName || formData.companyName || "Tech Zone";
  const personName = userData?.profile?.displayName || formData.displayName || "Alex Johnson";
  const roleTitle = (businessProfile as any)?.role || (formData as any)?.role || (userData?.profile as any)?.title || "CEO & Founder";
  const phone = formData.phone || "+1 555 000 0000";
  const email = userData?.email || formData.email || "hello@techzone.com";
  const website = businessProfile?.website || formData.website || "techzone.com";

  // Circle badge initial letter
  const circleBadgeText = "M"; // Matching the exact "M" circle from the UI image design

  const handleEditClick = () => {
    if (onEdit) {
      onEdit();
    } else {
      toast.info("Edit mode will be connected to API");
    }
  };

  const handleDownloadPNGClick = () => {
    if (onDownloadPNG) {
      onDownloadPNG();
    } else {
      toast.info("Download PNG feature will be connected soon");
    }
  };

  const handleDownloadPDFClick = () => {
    if (onDownloadPDF) {
      onDownloadPDF();
    } else {
      toast.info("Download PDF feature will be connected soon");
    }
  };

  const handleShareClick = () => {
    if (onShare) {
      onShare();
    } else {
      toast.info("Share Card feature will be connected soon");
    }
  };

  const handlePrintClick = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="flex flex-col w-full h-full font-sans bg-white md:bg-[#F8FAFC] overflow-y-auto">
      {/* Top Header */}
      {showHeader && (
        <div className="bg-[#2563EB] py-4 px-6 md:px-8 flex items-center gap-3 text-white shrink-0 shadow-sm">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Go back"
              className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity p-1 -ml-1 rounded-full hover:bg-white/10 cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-[18px] md:text-[20px] font-bold tracking-tight text-white leading-tight">
              Digital Business Card
            </h1>
            <p className="text-[12px] text-blue-100 font-medium">
              Professional, shareable, always with you
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col items-center justify-center">
        <div className="w-full max-w-[500px] flex flex-col items-center my-auto py-4">
          {/* Digital Card Box */}
          <div className="w-full rounded-[28px] bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#8B5CF6] p-7 md:p-8 text-white shadow-xl shadow-indigo-500/15 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/25 border border-white/10">
            {/* Top Row: Circle Badge & QR Code */}
            <div className="flex items-start justify-between mb-6">
              <div className="h-12 w-12 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center font-bold text-lg text-white shadow-inner border border-white/30 overflow-hidden shrink-0">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span>{circleBadgeText}</span>
                )}
              </div>
              <div className="p-2 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-sm">
                <QrCode className="h-9 w-9 text-white opacity-95" strokeWidth={1.5} />
              </div>
            </div>

            {/* Middle Section: Company & Person Details */}
            <div className="flex flex-col">
              <h3 className="text-xl md:text-[22px] font-extrabold text-white tracking-tight leading-snug">
                {companyName}
              </h3>
              <p className="text-xs md:text-[13px] font-medium text-white/80 mt-1">
                {personName} · {roleTitle}
              </p>
            </div>

            {/* Horizontal Divider Line */}
            <div className="my-5 h-px w-full bg-white/20" />

            {/* Bottom Section: Contact Info Rows */}
            <div className="flex flex-col gap-2.5 text-xs md:text-[13px] text-white/90 font-medium">
              <div className="flex items-center gap-2.5">
                <Phone className="h-3.5 w-3.5 text-white/75 shrink-0" strokeWidth={2} />
                <span>{phone}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-3.5 w-3.5 text-white/75 shrink-0" strokeWidth={2} />
                <span>{email}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Globe className="h-3.5 w-3.5 text-white/75 shrink-0" strokeWidth={2} />
                <span>{website}</span>
              </div>
            </div>
          </div>

          {/* Edit Button */}
          <div className="mt-6 flex justify-center w-full">
            <button
              onClick={handleEditClick}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5 text-slate-500" strokeWidth={2.2} />
              <span>Edit</span>
            </button>
          </div>

          {/* Action Buttons Grid (2x2) */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
            <button
              onClick={handleDownloadPNGClick}
              className="flex items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-xs md:text-sm font-bold text-slate-800 shadow-xs hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all active:scale-[0.99] cursor-pointer"
            >
              <Download className="h-4 w-4 text-slate-600" strokeWidth={2.2} />
              <span>Download PNG</span>
            </button>

            <button
              onClick={handleDownloadPDFClick}
              className="flex items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-xs md:text-sm font-bold text-slate-800 shadow-xs hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all active:scale-[0.99] cursor-pointer"
            >
              <Download className="h-4 w-4 text-slate-600" strokeWidth={2.2} />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handleShareClick}
              className="flex items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-xs md:text-sm font-bold text-slate-800 shadow-xs hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all active:scale-[0.99] cursor-pointer"
            >
              <Share2 className="h-4 w-4 text-slate-600" strokeWidth={2.2} />
              <span>Share Card</span>
            </button>

            <button
              onClick={handlePrintClick}
              className="flex items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-xs md:text-sm font-bold text-slate-800 shadow-xs hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all active:scale-[0.99] cursor-pointer"
            >
              <Printer className="h-4 w-4 text-slate-600" strokeWidth={2.2} />
              <span>Print Card</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
