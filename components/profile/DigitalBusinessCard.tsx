"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  ArrowLeft,
  Phone,
  Mail,
  Globe,
  MapPin,
  Download,
  Share2,
  Printer,
  Pencil,
  QrCode,
  X,
  Check,
  Loader2,
  Copy,
  UserCheck,
  FileText,
  MessageSquare,
  Send,
  Link as LinkIcon,
} from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { toast } from "sonner";
import { CardService, type DigitalCardData } from "@/services/card.service";
import { toBlob, toPng } from "html-to-image";
import { getOptimizedImageUrl } from "@/utils/image";

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
  const { userData, formData, avatarPreview, businessProfile, refreshProfile } = useProfile();

  const cardRef = useRef<HTMLDivElement>(null);

  const [cardData, setCardData] = useState<DigitalCardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadingPng, setDownloadingPng] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [downloadingVCard, setDownloadingVCard] = useState<boolean>(false);
  const [sharingCard, setSharingCard] = useState<boolean>(false);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareImageBlob, setShareImageBlob] = useState<Blob | null>(null);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [copiedImage, setCopiedImage] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    companyName: "",
    displayName: "",
    role: "",
    phone: "",
    email: "",
    website: "",
    address: "",
  });

  // Fetch digital card data on mount
  useEffect(() => {
    let isMounted = true;
    const fetchCard = async () => {
      try {
        setLoading(true);
        const response = await CardService.getCard();
        if (isMounted && response.success && response.data) {
          setCardData(response.data);
          setEditForm({
            companyName: response.data.companyName || "",
            displayName: response.data.displayName || "",
            role: response.data.role || "",
            phone: response.data.phone || "",
            email: response.data.email || "",
            website: response.data.website || "",
            address: response.data.address || "",
          });
        }
      } catch (err) {
        console.warn("Using local profile data fallback for Digital Business Card");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCard();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync fallback values when cardData is not loaded
  const companyName = cardData?.companyName || businessProfile?.companyName || formData.companyName || "Tech Zone";
  const personName = cardData?.displayName || userData?.profile?.displayName || formData.displayName || "Alex Johnson";
  const roleTitle =
    cardData?.role ||
    (businessProfile as any)?.role ||
    (formData as any)?.role ||
    (userData?.profile as any)?.title ||
    "CEO & Founder";
  const phone = cardData?.phone || formData.phone || "+1 555 000 0000";
  const email = cardData?.email || userData?.email || formData.email || "hello@techzone.com";
  const website = cardData?.website || businessProfile?.website || formData.website || "techzone.com";
  const address = cardData?.address || businessProfile?.address || (formData as any)?.address || "123 Business Parkway, Suite 100, Silicon Valley, CA";
  const qrImage = cardData?.qrCodeDataUrl || null;
  const isVerified = cardData?.isVerified || businessProfile?.isVerified || false;
  const shareUrl = cardData?.shareUrl || (typeof window !== "undefined" ? window.location.href : "");

  // Circle badge initial letter
  const circleBadgeText = personName ? personName.charAt(0).toUpperCase() : "M";

  // Handlers
  const handleEditClick = () => {
    if (onEdit) {
      onEdit();
    } else {
      setEditForm({
        companyName,
        displayName: personName,
        role: roleTitle,
        phone,
        email,
        website,
        address: address || "",
      });
      setIsEditModalOpen(true);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingEdit(true);
      const response = await CardService.updateCard(editForm);
      if (response.success && response.data) {
        setCardData(response.data);
        toast.success("Digital Business Card updated successfully!");
        setIsEditModalOpen(false);
        if (refreshProfile) {
          refreshProfile();
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update card details. Please try again.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDownloadPNGClick = async () => {
    if (onDownloadPNG) {
      onDownloadPNG();
      return;
    }
    try {
      setDownloadingPng(true);
      if (cardRef.current) {
        const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 3 });
        const link = document.createElement("a");
        link.download = `${companyName.replace(/\s+/g, "_")}_Business_Card.png`;
        link.href = dataUrl;
        link.click();
        toast.success("Business Card PNG downloaded!");
      } else {
        await CardService.downloadPNG(`${companyName.replace(/\s+/g, "_")}_QR_Card.png`);
        toast.success("QR Code PNG downloaded!");
      }
    } catch (err) {
      toast.error("Failed to download PNG. Please verify server connection.");
    } finally {
      setDownloadingPng(false);
    }
  };

  const handleDownloadPDFClick = async () => {
    if (onDownloadPDF) {
      onDownloadPDF();
      return;
    }
    try {
      setDownloadingPdf(true);
      await CardService.downloadPDF(`${personName.replace(/\s+/g, "_")}_Business_Card.pdf`);
      toast.success("Business Card PDF downloaded!");
    } catch (err) {
      toast.error("Failed to download PDF. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadVCardClick = async () => {
    try {
      setDownloadingVCard(true);
      await CardService.downloadVCard(`${personName.replace(/\s+/g, "_")}.vcf`);
      toast.success("Contact file (.vcf) downloaded!");
    } catch (err) {
      toast.error("Failed to download contact vCard.");
    } finally {
      setDownloadingVCard(false);
    }
  };

  const handleShareClick = async () => {
    if (onShare) {
      onShare();
      return;
    }
    if (!cardRef.current) {
      toast.error("Card element unavailable for sharing.");
      return;
    }

    try {
      setSharingCard(true);
      const blob = await toBlob(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "transparent",
      });

      if (!blob) {
        throw new Error("Could not generate card image.");
      }

      const fileName = `${companyName.replace(/\s+/g, "_")}_Digital_Card.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `${personName} - Digital Business Card`,
            text: `Connect with ${personName} (${companyName}) on CallsChat!\n${shareUrl}`,
          });
          toast.success("Card image shared!");
          setSharingCard(false);
          return;
        } catch (err: any) {
          if (err.name === "AbortError") {
            setSharingCard(false);
            return;
          }
        }
      }

      const url = URL.createObjectURL(blob);
      setShareImageBlob(blob);
      setShareImageUrl(url);
      setIsShareModalOpen(true);
    } catch (err: any) {
      toast.error("Failed to generate card image for sharing.");
    } finally {
      setSharingCard(false);
    }
  };

  const handleCopyImageToClipboard = async () => {
    if (!shareImageBlob) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": shareImageBlob,
        }),
      ]);
      setCopiedImage(true);
      toast.success("Card image copied! Press Ctrl+V in WhatsApp Web or Messenger to send.");
      setTimeout(() => setCopiedImage(false), 3000);
    } catch (err) {
      toast.error("Could not copy image automatically. Please use Download button.");
    }
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      toast.success("Card link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (err) {
      toast.error("Failed to copy link.");
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
    <div className="flex flex-col w-full h-full font-sans bg-white md:bg-[#F8FAFC] overflow-y-auto relative">
      {/* Top Header */}
      {showHeader && (
        <div className="bg-[#2563EB] py-4 px-6 md:px-8 flex items-center justify-between text-white shrink-0 shadow-sm print:hidden">
          <div className="flex items-center gap-3">
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

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadVCardClick}
              disabled={downloadingVCard}
              className="hidden sm:flex items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25 px-3.5 py-1.5 text-xs font-bold text-white transition-all cursor-pointer border border-white/20"
            >
              {downloadingVCard ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <UserCheck className="h-3.5 w-3.5" />
              )}
              <span>Save Contact (.vcf)</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col items-center justify-center">
        <div className="w-full max-w-[500px] flex flex-col items-center my-auto py-4">
          {/* Digital Card Box */}
          <div
            ref={cardRef}
            className="w-full rounded-[28px] bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#8B5CF6] p-7 md:p-8 text-white shadow-xl shadow-indigo-500/15 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/25 border border-white/10"
          >
            {/* Top Row: Circle Badge & QR Code */}
            <div className="flex items-start justify-between mb-6">
              <div className="h-12 w-12 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center font-bold text-lg text-white shadow-inner border border-white/30 overflow-hidden shrink-0">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span>{circleBadgeText}</span>
                )}
              </div>
              <button
                onClick={() => setIsQrModalOpen(true)}
                title="View & Scan QR Code"
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 transition-all backdrop-blur-md border border-white/20 flex items-center justify-center shadow-sm cursor-pointer group"
              >
                {qrImage ? (
                  <img
                    src={qrImage}
                    alt="QR Code"
                    className="h-9 w-9 rounded-md bg-white p-0.5 group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <QrCode className="h-9 w-9 text-white opacity-95 group-hover:scale-105 transition-transform" strokeWidth={1.5} />
                )}
              </button>
            </div>

            {/* Middle Section: Company & Person Details */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="text-xl md:text-[22px] font-extrabold text-white tracking-tight leading-snug">
                  {companyName}
                </h3>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-400/30 px-2 py-0.5 text-[10px] font-bold text-blue-100 border border-blue-300/30">
                    ✓ Verified
                  </span>
                )}
              </div>
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
                <span className="truncate">{email}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Globe className="h-3.5 w-3.5 text-white/75 shrink-0" strokeWidth={2} />
                <span>{website}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="h-3.5 w-3.5 text-white/75 shrink-0 mt-0.5" strokeWidth={2} />
                <span className="line-clamp-2">{address}</span>
              </div>
            </div>
          </div>

          {/* Edit Button */}
          <div className="mt-6 flex justify-center w-full print:hidden">
            <button
              onClick={handleEditClick}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5 text-slate-500" strokeWidth={2.2} />
              <span>Edit Card Details</span>
            </button>
          </div>

          {/* Action Buttons Grid (2x2) */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full print:hidden">
            <button
              onClick={handleDownloadPNGClick}
              disabled={downloadingPng}
              className="flex items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-xs md:text-sm font-bold text-slate-800 shadow-xs hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
            >
              {downloadingPng ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
              ) : (
                <Download className="h-4 w-4 text-slate-600" strokeWidth={2.2} />
              )}
              <span>Download PNG</span>
            </button>

            <button
              onClick={handleDownloadPDFClick}
              disabled={downloadingPdf}
              className="flex items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-xs md:text-sm font-bold text-slate-800 shadow-xs hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
            >
              {downloadingPdf ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
              ) : (
                <FileText className="h-4 w-4 text-slate-600" strokeWidth={2.2} />
              )}
              <span>Download PDF</span>
            </button>

            <button
              onClick={handleShareClick}
              disabled={sharingCard}
              className="flex items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-xs md:text-sm font-bold text-slate-800 shadow-xs hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
            >
              {sharingCard ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
              ) : (
                <Share2 className="h-4 w-4 text-slate-600" strokeWidth={2.2} />
              )}
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

      {/* Share Card Image Modal */}
      {isShareModalOpen && shareImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in print:hidden">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl flex flex-col items-center relative border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-800 mt-1 flex items-center gap-2">
              <Share2 className="h-5 w-5 text-blue-600" />
              <span>Share Digital Business Card</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 text-center">
              Send the high-resolution card image directly to WhatsApp, Messenger, or Email.
            </p>

            {/* Card Image Preview */}
            <div className="mt-4 w-full rounded-2xl border border-slate-200/80 bg-slate-50 p-3 shadow-inner">
              <img
                src={getOptimizedImageUrl(shareImageUrl)}
                alt="Digital Card Preview"
                className="w-full rounded-xl shadow-md border border-slate-200/60 object-contain max-h-[220px]"
              />
            </div>

            {/* Primary Action Buttons */}
            <div className="mt-5 grid grid-cols-2 gap-2.5 w-full">
              <button
                onClick={handleCopyImageToClipboard}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition-all cursor-pointer"
              >
                {copiedImage ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copiedImage ? "Image Copied!" : "Copy Image"}</span>
              </button>

              <a
                href={shareImageUrl}
                download={`${companyName.replace(/\s+/g, "_")}_Card.png`}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 transition-all cursor-pointer"
              >
                <Download className="h-4 w-4 text-slate-600" />
                <span>Save PNG</span>
              </a>
            </div>

            {/* Quick App Share Grid */}
            <div className="mt-4 w-full">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">
                Send Directly via Apps
              </label>
              <div className="grid grid-cols-3 gap-2 w-full">
                <button
                  onClick={() => {
                    if (shareImageBlob) {
                      navigator.clipboard.write([new ClipboardItem({ "image/png": shareImageBlob })]).catch(() => {});
                    }
                    const waText = `Connect with ${personName} (${companyName}) on CallsChat!\n${shareUrl}`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`, "_blank");
                    toast.success("WhatsApp opened! Press Ctrl+V inside WhatsApp to paste & send the image.");
                  }}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#075E54] transition-all cursor-pointer font-bold text-xs"
                >
                  <MessageSquare className="h-5 w-5 text-[#25D366]" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() => {
                    if (shareImageBlob) {
                      navigator.clipboard.write([new ClipboardItem({ "image/png": shareImageBlob })]).catch(() => {});
                    }
                    window.open(
                      `https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=123456789&redirect_uri=${encodeURIComponent(shareUrl)}`,
                      "_blank"
                    );
                    toast.success("Messenger opened! Press Ctrl+V to paste & send the image.");
                  }}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-[#0084FF]/10 hover:bg-[#0084FF]/20 border border-[#0084FF]/30 text-[#0060BA] transition-all cursor-pointer font-bold text-xs"
                >
                  <Send className="h-5 w-5 text-[#0084FF]" />
                  <span>Messenger</span>
                </button>

                <button
                  onClick={() => {
                    const mailSubject = `${personName} - Digital Business Card`;
                    const mailBody = `Connect with ${personName} (${companyName}) on CallsChat!\n\nView and save my verified contact details:\n${shareUrl}\n\n(Tip: You can also attach the saved PNG card image to this email!)`;
                    window.location.href = `mailto:?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
                  }}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 transition-all cursor-pointer font-bold text-xs"
                >
                  <Mail className="h-5 w-5 text-slate-600" />
                  <span>Email</span>
                </button>
              </div>
            </div>

            {/* Share Link Row */}
            <div className="mt-4 pt-4 border-t border-slate-100 w-full flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600 outline-none truncate"
              />
              <button
                onClick={handleCopyShareLink}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <LinkIcon className="h-3.5 w-3.5 text-slate-500" />}
                <span>{copiedLink ? "Copied" : "Copy Link"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Inspection Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in print:hidden">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl flex flex-col items-center text-center relative border border-slate-100">
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mt-2 mb-4 p-4 rounded-2xl bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-100/60 shadow-inner">
              {qrImage ? (
                <img src={qrImage} alt="Large QR Code" className="w-48 h-48 mx-auto rounded-xl shadow-sm bg-white p-2" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400 bg-white rounded-xl shadow-sm">
                  <QrCode className="h-20 w-20 opacity-40" />
                </div>
              )}
            </div>

            <h4 className="text-lg font-bold text-slate-800">{personName}</h4>
            <p className="text-xs font-semibold text-blue-600 mt-0.5">{companyName}</p>
            <div className="mt-2 bg-slate-50 rounded-xl p-2.5 text-[11px] text-slate-600 text-left border border-slate-200/60 space-y-1 w-full">
              <div className="font-semibold text-slate-800">QR Code Encoded Data:</div>
              <div>🏢 <span className="font-medium">Business:</span> {companyName}</div>
              <div>📧 <span className="font-medium">Email:</span> {email}</div>
              <div>📞 <span className="font-medium">Phone:</span> {phone}</div>
              <div>📍 <span className="font-medium">Address:</span> {address}</div>
            </div>
            <p className="text-xs text-slate-500 mt-2.5 max-w-[260px]">
              Scan with any mobile phone camera to instantly view and save all business contact details.
            </p>

            <div className="mt-5 flex flex-col sm:flex-row gap-2.5 w-full">
              <button
                onClick={handleDownloadPNGClick}
                disabled={downloadingPng}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download QR</span>
              </button>
              <button
                onClick={handleDownloadVCardClick}
                disabled={downloadingVCard}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserCheck className="h-3.5 w-3.5 text-slate-600" />
                <span>Save Contact</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Details Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in print:hidden">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 md:p-8 shadow-2xl relative border border-slate-100 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Pencil className="h-4 w-4 text-blue-600" />
                <span>Edit Digital Card Details</span>
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Company Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.companyName}
                    onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                    placeholder="e.g. Tech Zone"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Role / Title</label>
                  <input
                    type="text"
                    required
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    placeholder="e.g. CEO & Founder"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name / Display Name</label>
                <input
                  type="text"
                  required
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  placeholder="e.g. Alex Johnson"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="e.g. +1 555 000 0000"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="e.g. hello@techzone.com"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Website URL</label>
                  <input
                    type="text"
                    required
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    placeholder="e.g. techzone.com"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Business Address</label>
                  <input
                    type="text"
                    required
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    placeholder="e.g. 123 Business Pkwy, Silicon Valley"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-xl bg-[#2563EB] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {savingEdit ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
