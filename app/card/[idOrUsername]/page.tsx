"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Phone,
  Mail,
  Globe,
  Download,
  Share2,
  QrCode,
  Loader2,
  UserCheck,
  FileText,
  ArrowLeft,
  Building2,
  X,
  Copy,
  Check,
  MessageSquare,
  Send,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import { CardService, type DigitalCardData } from "@/services/card.service";
import { toBlob } from "html-to-image";

export default function PublicDigitalCardPage() {
  const params = useParams();
  const router = useRouter();
  const idOrUsername = (params?.idOrUsername as string) || "";

  const cardRef = useRef<HTMLDivElement>(null);

  const [cardData, setCardData] = useState<DigitalCardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [downloadingPng, setDownloadingPng] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [downloadingVCard, setDownloadingVCard] = useState<boolean>(false);
  const [sharingCard, setSharingCard] = useState<boolean>(false);

  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareImageBlob, setShareImageBlob] = useState<Blob | null>(null);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [copiedImage, setCopiedImage] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    if (!idOrUsername) return;
    let isMounted = true;

    const fetchCard = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await CardService.getPublicCard(idOrUsername);
        if (isMounted && response.success && response.data) {
          setCardData(response.data);
        } else if (isMounted) {
          setError("Card not found");
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.response?.data?.message || "Digital Business Card not found or no longer active.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCard();
    return () => {
      isMounted = false;
    };
  }, [idOrUsername]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F8FAFC] p-6 font-sans">
        <div className="flex flex-col items-center gap-3 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-slate-600">Loading Digital Business Card...</p>
        </div>
      </div>
    );
  }

  if (error || !cardData) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F8FAFC] p-6 font-sans">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-md text-center border border-slate-100 flex flex-col items-center">
          <div className="h-14 w-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
            <Building2 className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Card Unavailable</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            {error || "The digital business card you are looking for does not exist or has been removed."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 rounded-2xl bg-[#2563EB] px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition-all cursor-pointer"
          >
            Go to CallsChat
          </button>
        </div>
      </div>
    );
  }

  const {
    companyName,
    displayName: personName,
    role: roleTitle,
    phone,
    email,
    website,
    avatarUrl,
    isVerified,
    qrCodeDataUrl: qrImage,
    shareUrl,
  } = cardData;

  const circleBadgeText = personName ? personName.charAt(0).toUpperCase() : "M";

  const handleDownloadPNGClick = async () => {
    try {
      setDownloadingPng(true);
      const url = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1"}/user/card/public/${idOrUsername}/qrcode`;
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", `${companyName.replace(/\s+/g, "_")}_QR.png`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("QR Code downloaded!");
    } catch (err) {
      toast.error("Failed to download QR Code image.");
    } finally {
      setDownloadingPng(false);
    }
  };

  const handleDownloadPDFClick = async () => {
    try {
      setDownloadingPdf(true);
      const url = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1"}/user/card/public/${idOrUsername}/pdf`;
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", `${personName.replace(/\s+/g, "_")}_Business_Card.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Business Card PDF downloaded!");
    } catch (err) {
      toast.error("Failed to download PDF document.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadVCardClick = async () => {
    try {
      setDownloadingVCard(true);
      const url = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1"}/user/card/public/${idOrUsername}/vcard`;
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", `${personName.replace(/\s+/g, "_")}.vcf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Contact file (.vcf) downloaded!");
    } catch (err) {
      toast.error("Failed to save contact.");
    } finally {
      setDownloadingVCard(false);
    }
  };

  const handleShareClick = async () => {
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
      const targetUrl = shareUrl || window.location.href;

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `${personName} - Digital Business Card`,
            text: `Connect with ${personName} (${companyName}) on CallsChat!\n${targetUrl}`,
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
      toast.error("Could not copy image automatically. Please use Save PNG button.");
    }
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl || window.location.href);
      setCopiedLink(true);
      toast.success("Card link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (err) {
      toast.error("Failed to copy link.");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="w-full max-w-[480px] flex flex-col items-center my-auto py-4">
        {/* Top brand header */}
        <div className="w-full flex items-center justify-between mb-4 px-2">
          <div
            onClick={() => router.push("/")}
            className="text-sm font-extrabold tracking-tight text-blue-600 cursor-pointer flex items-center gap-1.5"
          >
            <span className="bg-blue-600 text-white rounded-lg px-2 py-0.5 text-xs">CallsChat</span>
            <span>Card Verification</span>
          </div>
          <button
            onClick={handleDownloadVCardClick}
            disabled={downloadingVCard}
            className="flex items-center gap-1.5 rounded-full bg-blue-600 hover:bg-blue-700 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
          >
            {downloadingVCard ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <UserCheck className="h-3.5 w-3.5" />
            )}
            <span>Save Contact (.vcf)</span>
          </button>
        </div>

        {/* Digital Card Box */}
        <div
          ref={cardRef}
          className="w-full rounded-[28px] bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#8B5CF6] p-7 md:p-8 text-white shadow-xl shadow-indigo-500/15 relative overflow-hidden transition-all duration-300 border border-white/10"
        >
          {/* Top Row: Circle Badge & QR Code */}
          <div className="flex items-start justify-between mb-6">
            <div className="h-12 w-12 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center font-bold text-lg text-white shadow-inner border border-white/30 overflow-hidden shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span>{circleBadgeText}</span>
              )}
            </div>
            <button
              onClick={() => setIsQrModalOpen(true)}
              title="View QR Code"
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
            <a href={`tel:${phone}`} className="flex items-center gap-2.5 hover:text-white transition-colors">
              <Phone className="h-3.5 w-3.5 text-white/75 shrink-0" strokeWidth={2} />
              <span>{phone}</span>
            </a>
            <a href={`mailto:${email}`} className="flex items-center gap-2.5 hover:text-white transition-colors">
              <Mail className="h-3.5 w-3.5 text-white/75 shrink-0" strokeWidth={2} />
              <span className="truncate">{email}</span>
            </a>
            <a
              href={website.startsWith("http") ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 hover:text-white transition-colors"
            >
              <Globe className="h-3.5 w-3.5 text-white/75 shrink-0" strokeWidth={2} />
              <span>{website}</span>
            </a>
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
          <button
            onClick={handleDownloadPNGClick}
            disabled={downloadingPng}
            className="flex items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-xs md:text-sm font-bold text-slate-800 shadow-xs hover:bg-slate-50 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
          >
            {downloadingPng ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
            ) : (
              <Download className="h-4 w-4 text-slate-600" strokeWidth={2.2} />
            )}
            <span>Download QR PNG</span>
          </button>

          <button
            onClick={handleDownloadPDFClick}
            disabled={downloadingPdf}
            className="flex items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-xs md:text-sm font-bold text-slate-800 shadow-xs hover:bg-slate-50 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
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
            className="flex items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-xs md:text-sm font-bold text-slate-800 shadow-xs hover:bg-slate-50 transition-all active:scale-[0.99] cursor-pointer sm:col-span-2 disabled:opacity-60"
          >
            {sharingCard ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
            ) : (
              <Share2 className="h-4 w-4 text-slate-600" strokeWidth={2.2} />
            )}
            <span>Share This Card</span>
          </button>
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
                src={shareImageUrl}
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
                    const waText = `Connect with ${personName} (${companyName}) on CallsChat!\n${shareUrl || window.location.href}`;
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
                    const targetUrl = shareUrl || window.location.href;
                    window.open(
                      `https://www.facebook.com/dialog/send?link=${encodeURIComponent(targetUrl)}&app_id=123456789&redirect_uri=${encodeURIComponent(targetUrl)}`,
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
                    const mailBody = `Connect with ${personName} (${companyName}) on CallsChat!\n\nView and save my verified contact details:\n${shareUrl || window.location.href}\n\n(Tip: You can also attach the saved PNG card image to this email!)`;
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
                value={shareUrl || window.location.href}
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

      {/* QR Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl flex flex-col items-center text-center relative border border-slate-100">
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
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
            <p className="text-xs text-slate-500 mt-2 max-w-[240px]">
              Scan with any mobile phone camera or QR reader to instantly import contact details.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-2.5 w-full">
              <button
                onClick={handleDownloadPNGClick}
                disabled={downloadingPng}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download QR</span>
              </button>
              <button
                onClick={handleDownloadVCardClick}
                disabled={downloadingVCard}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-1.5"
              >
                <UserCheck className="h-3.5 w-3.5 text-slate-600" />
                <span>Save Contact</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
