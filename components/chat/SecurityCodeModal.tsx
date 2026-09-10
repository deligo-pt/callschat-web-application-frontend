"use client";

import React, { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShieldCheck,
  Copy,
  Check,
  QrCode,
  KeyRound,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { computeSafetyNumber, type SafetyNumberResult } from "@/utils/crypto";
import {
  getUserPublicKey,
  storeSafetyNumberVerification,
  getSafetyNumberVerification,
} from "@/utils/keyStore";
import { chatService } from "@/services/chat.service";

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export interface SecurityCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  peerId: string;
  peerName: string;
  peerAvatar?: string;
  peerPublicKey?: string;
}

export function SecurityCodeModal({
  isOpen,
  onClose,
  peerId,
  peerName,
  peerPublicKey: directPeerPublicKey,
}: SecurityCodeModalProps) {
  const [activeTab, setActiveTab] = useState<"qr" | "digits">("qr");
  const [isLoading, setIsLoading] = useState(true);
  const [safetyData, setSafetyData] = useState<SafetyNumberResult | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !peerId) return;

    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);

    const loadKeysAndCompute = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        let myUid = "";
        if (token) {
          const decoded = parseJwt(token);
          if (decoded) myUid = decoded.sub || decoded.id || "";
        }
        if (isMounted) setCurrentUserId(myUid);

        // 1. Get my identity public key from IndexedDB
        let myKey = await getUserPublicKey(myUid);
        if (!myKey && myUid) {
          // Fallback to local storage if not in IndexedDB
          myKey = localStorage.getItem(`publicKey_${myUid}`) || localStorage.getItem("publicKey");
        }

        // 2. Get peer's identity public key
        let peerKey = directPeerPublicKey;
        if (!peerKey) {
          try {
            const keysRes = await chatService.fetchRecipientKey(peerId);
            if (keysRes?.success && keysRes.data?.length > 0) {
              peerKey = keysRes.data[0].publicKey;
            }
          } catch (fetchErr) {
            console.warn("Could not fetch peer public key for safety number:", fetchErr);
          }
        }

        if (!myKey) {
          throw new Error("Your E2EE identity keys are not loaded yet. Send or receive a message first.");
        }
        if (!peerKey) {
          throw new Error(`Public keys for ${peerName} are not published yet.`);
        }

        // 3. Compute 60-digit safety number
        const result = computeSafetyNumber(myKey, peerKey);
        if (!isMounted) return;

        setSafetyData(result);

        // 4. Check verification status
        if (myUid) {
          const verification = await getSafetyNumberVerification(myUid, peerId, result.raw);
          if (isMounted) {
            setIsVerified(verification.isVerified);
            setVerifiedAt(verification.verifiedAt || null);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err.message || "Failed to calculate safety number");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadKeysAndCompute();

    return () => {
      isMounted = false;
    };
  }, [isOpen, peerId, peerName, directPeerPublicKey]);

  const handleCopyCode = async () => {
    if (!safetyData) return;
    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(safetyData.formatted);
      toast.success("60-digit safety number copied to clipboard");
      setTimeout(() => setIsCopying(false), 2000);
    } catch {
      toast.error("Failed to copy safety number");
      setIsCopying(false);
    }
  };

  const handleToggleVerified = async () => {
    if (!safetyData || !currentUserId || !peerId) return;
    const nextState = !isVerified;
    setIsVerified(nextState);
    if (nextState) {
      const now = new Date().toISOString();
      setVerifiedAt(now);
      await storeSafetyNumberVerification(currentUserId, peerId, safetyData.raw, true);
      toast.success(`Marked as verified with ${peerName}`);
    } else {
      setVerifiedAt(null);
      await storeSafetyNumberVerification(currentUserId, peerId, safetyData.raw, false);
      toast.info(`Removed verification status for ${peerName}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-[#111B21] border border-[#E2E8F0] dark:border-[#222D34] p-0 rounded-3xl overflow-hidden shadow-2xl">
        {/* Header with emerald E2EE theme */}
        <div className="bg-gradient-to-br from-[#00A884]/15 via-[#00A884]/5 to-transparent dark:from-[#00A884]/20 dark:via-[#111B21] px-6 pt-6 pb-4 border-b border-[#E2E8F0] dark:border-[#222D34]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#00A884] text-white shadow-md shadow-[#00A884]/25">
                <ShieldCheck className="h-6 w-6" strokeWidth={2.2} />
              </div>
              <div className="text-left">
                <DialogTitle className="text-lg font-bold text-[#111B21] dark:text-[#E9EDEF]">
                  Verify Security Code
                </DialogTitle>
                <p className="text-xs text-[#667781] dark:text-[#8696A0] mt-0.5">
                  End-to-End Encrypted with {peerName}
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Verification Badge */}
          {isVerified && (
            <div className="mt-4 flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold">Marked as Verified</span>
              </div>
              {verifiedAt && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  {new Date(verifiedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="px-6 py-5">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#00A884]" />
              <p className="text-xs text-[#667781] dark:text-[#8696A0]">
                Computing cryptographic safety numbers...
              </p>
            </div>
          ) : errorMessage ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3 text-center px-4">
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-[#111B21] dark:text-[#E9EDEF]">
                Security Code Unavailable
              </p>
              <p className="text-xs text-[#667781] dark:text-[#8696A0] max-w-xs">
                {errorMessage}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="mt-2 rounded-xl text-xs"
              >
                Close
              </Button>
            </div>
          ) : safetyData ? (
            <div>
              {/* Tab Selector */}
              <div className="flex rounded-xl bg-[#F0F2F5] dark:bg-[#182229] p-1 mb-5">
                <button
                  onClick={() => setActiveTab("qr")}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "qr"
                      ? "bg-white dark:bg-[#202C33] text-[#111B21] dark:text-[#E9EDEF] shadow-xs"
                      : "text-[#667781] dark:text-[#8696A0] hover:text-[#111B21] dark:hover:text-[#E9EDEF]"
                  }`}
                >
                  <QrCode className="h-3.5 w-3.5" />
                  QR Code
                </button>
                <button
                  onClick={() => setActiveTab("digits")}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "digits"
                      ? "bg-white dark:bg-[#202C33] text-[#111B21] dark:text-[#E9EDEF] shadow-xs"
                      : "text-[#667781] dark:text-[#8696A0] hover:text-[#111B21] dark:hover:text-[#E9EDEF]"
                  }`}
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  60-Digit Code
                </button>
              </div>

              {/* View 1: QR Code */}
              {activeTab === "qr" && (
                <div className="flex flex-col items-center">
                  <div className="p-4 bg-white rounded-2xl shadow-inner border border-slate-200 dark:border-slate-800">
                    <QRCode
                      value={safetyData.qrData}
                      size={180}
                      level="M"
                    />
                  </div>
                  <p className="text-[12px] text-center text-[#667781] dark:text-[#8696A0] mt-4 leading-relaxed max-w-xs">
                    Scan this QR code from <strong>{peerName}</strong>'s device or have them scan yours to confirm your encryption is untampered.
                  </p>
                </div>
              )}

              {/* View 2: 60-Digit Monospace Fingerprint */}
              {activeTab === "digits" && (
                <div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {safetyData.blocks.map((block, idx) => (
                      <div
                        key={idx}
                        className="px-2 py-2 rounded-xl bg-[#F0F2F5] dark:bg-[#182229] border border-black/5 dark:border-white/5 font-mono text-[13px] font-bold tracking-widest text-center text-[#111B21] dark:text-[#E9EDEF] select-all shadow-2xs"
                      >
                        {block}
                      </div>
                    ))}
                  </div>

                  <p className="text-[12px] text-[#667781] dark:text-[#8696A0] mt-4 leading-relaxed text-center">
                    Compare this 60-digit number with the security code on <strong>{peerName}</strong>'s device.
                  </p>
                </div>
              )}

              {/* Footer Actions */}
              <div className="mt-6 pt-4 border-t border-[#E2E8F0] dark:border-[#222D34] flex flex-col gap-2.5">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCopyCode}
                    className="flex-1 rounded-xl h-10 text-xs font-semibold gap-2 border-[#E2E8F0] dark:border-[#222D34] hover:bg-[#F0F2F5] dark:hover:bg-[#182229]"
                  >
                    {isCopying ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-[#00A884]" />
                        Copy 60 Digits
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleToggleVerified}
                    className={`flex-1 rounded-xl h-10 text-xs font-semibold gap-2 transition-colors ${
                      isVerified
                        ? "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700"
                        : "bg-[#00A884] hover:bg-[#008f6f] text-white shadow-md shadow-[#00A884]/20"
                    }`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {isVerified ? "Clear Verification" : "Mark as Verified"}
                  </Button>
                </div>

                <p className="text-[11px] text-center text-[#8696A0] dark:text-[#667781]">
                  All messages and calls are protected with end-to-end encryption. No third party, not even CallsChat, can read or listen to them.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
