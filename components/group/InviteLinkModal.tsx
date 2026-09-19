"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import { toPng, toBlob } from "html-to-image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Link2,
  Copy,
  RefreshCw,
  Check,
  Share2,
  QrCode,
  Shield,
  Loader2,
  ArrowLeft,
  Download,
  Send,
  AlertTriangle,
  Users,
} from "lucide-react";
import { groupService } from "@/services/group.service";
import { getOptimizedImageUrl } from "@/utils/image";
import { toast } from "sonner";

interface InviteLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  groupAvatar?: string | null;
  isAdmin: boolean;
  joinApprovalMode?: "DIRECT" | "APPROVAL_REQUIRED";
}

export function InviteLinkModal({
  isOpen,
  onClose,
  groupId,
  groupName,
  groupAvatar,
  isAdmin,
  joinApprovalMode = "DIRECT",
}: InviteLinkModalProps) {
  const [activeTab, setActiveTab] = useState<"link" | "qr">("link");
  const [inviteCode, setInviteCode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [resetting, setResetting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);

  const qrCardRef = useRef<HTMLDivElement>(null);

  const inviteUrl =
    typeof window !== "undefined" && inviteCode
      ? `${window.location.origin}/groups/invite/${inviteCode}`
      : "";

  useEffect(() => {
    if (isOpen && groupId) {
      setActiveTab("link");
      setShowConfirmReset(false);
      setLoading(true);

      groupService
        .fetchInviteCode(groupId)
        .then((res) => {
          if (res.success && res.data?.inviteCode) {
            setInviteCode(res.data.inviteCode);
          }
        })
        .catch(() => {
          toast.error("Failed to fetch invite link");
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, groupId]);

  const handleCopyLink = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success("Invite link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleShareLink = async () => {
    if (!inviteUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join "${groupName}" on CallsChat`,
          text: `Follow this link to join my CallsChat group "${groupName}":`,
          url: inviteUrl,
        });
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleSendViaCallsChat = async () => {
    if (!inviteUrl) return;
    const shareMessage = `Follow this link to join my CallsChat group "${groupName}":\n${inviteUrl}`;
    try {
      await navigator.clipboard.writeText(shareMessage);
      toast.success("Invite message copied! Paste it into any CallsChat chat.");
    } catch {
      toast.error("Failed to copy invite message");
    }
  };

  const handleDownloadQr = async () => {
    if (!qrCardRef.current) return;
    try {
      setDownloading(true);
      const dataUrl = await toPng(qrCardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
      });
      const downloadLink = document.createElement("a");
      downloadLink.download = `${groupName.replace(/\s+/g, "_")}_invite_qr.png`;
      downloadLink.href = dataUrl;
      downloadLink.click();
      toast.success("QR code downloaded successfully!");
    } catch {
      toast.error("Failed to download QR code");
    } finally {
      setDownloading(false);
    }
  };

  const handleShareQr = async () => {
    if (!qrCardRef.current) return;
    try {
      const blob = await toBlob(qrCardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
      });

      if (!blob) {
        handleShareLink();
        return;
      }

      const file = new File([blob], `${groupName.replace(/\s+/g, "_")}_qr.png`, {
        type: "image/png",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `QR Code: ${groupName}`,
          text: `Scan this QR code to join "${groupName}" on CallsChat: ${inviteUrl}`,
        });
      } else {
        handleShareLink();
      }
    } catch {
      handleShareLink();
    }
  };

  const handleResetInvite = async () => {
    setResetting(true);
    try {
      const res = await groupService.resetInviteCode(groupId);
      if (res.success && res.data?.inviteCode) {
        setInviteCode(res.data.inviteCode);
        setShowConfirmReset(false);
        toast.success("Previous invite link revoked and new link generated!");
      } else {
        toast.error("Failed to reset invite link");
      }
    } catch {
      toast.error("Failed to reset invite link");
    } finally {
      setResetting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[460px] bg-white dark:bg-[#111B21] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 p-0 overflow-hidden shadow-2xl rounded-2xl">
        {/* Header with WhatsApp styling */}
        <DialogHeader className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            {activeTab === "qr" && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setActiveTab("link")}
                className="h-8 w-8 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#202C33]"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <DialogTitle className="text-base font-semibold text-gray-900 dark:text-white">
              {activeTab === "link" ? "Invite to group via link" : "Group QR code"}
            </DialogTitle>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
            <p className="text-xs text-gray-500">Loading invite information...</p>
          </div>
        ) : (
          <div className="p-5">
            {/* View 1: Link Hub */}
            {activeTab === "link" && (
              <div className="space-y-4">
                {/* Notice text matching WhatsApp */}
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Anyone with CallsChat can follow this link to join this group. Only share it with
                  people you trust.
                </p>

                {/* Approval Mode Badge */}
                {joinApprovalMode === "APPROVAL_REQUIRED" && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs border border-blue-100 dark:border-blue-900/50">
                    <Shield className="w-4 h-4 flex-shrink-0" />
                    <span>Admin approval is required for participants who join using this link.</span>
                  </div>
                )}

                {/* Link Preview Bar */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-[#202C33] border border-gray-200 dark:border-gray-700">
                  <Link2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-xs text-gray-700 dark:text-gray-200 truncate flex-1 font-mono select-all">
                    {inviteUrl || "Generating invite link..."}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyLink}
                    className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex-shrink-0"
                    title="Copy Link"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>

                {/* WhatsApp Action Items Menu */}
                <div className="divide-y divide-gray-100 dark:divide-gray-800/80 pt-1">
                  {/* Option 1: Send via CallsChat */}
                  <button
                    type="button"
                    onClick={handleSendViaCallsChat}
                    className="w-full flex items-center gap-3.5 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#202C33]/60 px-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <Send className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                        Send link via CallsChat
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Share link with your existing contacts or chats
                      </p>
                    </div>
                  </button>

                  {/* Option 2: Copy link */}
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full flex items-center gap-3.5 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#202C33]/60 px-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#202C33] text-gray-600 dark:text-gray-300 flex items-center justify-center flex-shrink-0">
                      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                        {copied ? "Link Copied!" : "Copy link"}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Copy group link to your clipboard
                      </p>
                    </div>
                  </button>

                  {/* Option 3: Share link */}
                  <button
                    type="button"
                    onClick={handleShareLink}
                    className="w-full flex items-center gap-3.5 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#202C33]/60 px-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#202C33] text-gray-600 dark:text-gray-300 flex items-center justify-center flex-shrink-0">
                      <Share2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                        Share link
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Share via external apps and social networks
                      </p>
                    </div>
                  </button>

                  {/* Option 4: QR code */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("qr")}
                    className="w-full flex items-center gap-3.5 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#202C33]/60 px-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#202C33] text-gray-600 dark:text-gray-300 flex items-center justify-center flex-shrink-0">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                        QR code
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Display and share group invite QR code
                      </p>
                    </div>
                  </button>

                  {/* Option 5: Reset link (Admin only) */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setShowConfirmReset(true)}
                      className="w-full flex items-center gap-3.5 py-3 text-left text-sm hover:bg-red-50 dark:hover:bg-red-950/20 px-2 rounded-xl transition-colors cursor-pointer text-red-600 dark:text-red-400"
                    >
                      <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0">
                        <RefreshCw className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-xs sm:text-sm">Reset link</p>
                        <p className="text-[11px] text-red-500/80">
                          Revoke current link and generate a new one
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* View 2: Dedicated QR Code Card */}
            {activeTab === "qr" && (
              <div className="space-y-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed text-center">
                  The group QR code is private. If it is shared with someone, they can scan it with
                  their camera to join this group.
                </p>

                {/* Printable / Shareable Card Container */}
                <div
                  ref={qrCardRef}
                  className="p-6 bg-white dark:bg-[#182229] rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col items-center text-center shadow-xs space-y-4"
                >
                  {/* Top: Group Avatar + Name */}
                  <div className="flex flex-col items-center space-y-1.5">
                    <div className="w-12 h-12 rounded-full overflow-hidden shadow-xs border-2 border-emerald-500">
                      {groupAvatar ? (
                        <img
                          src={getOptimizedImageUrl(groupAvatar, 96, 96)}
                          alt={groupName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                          {groupName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                      {groupName}
                    </h3>
                    <p className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
                      CallsChat Group Invite
                    </p>
                  </div>

                  {/* Center: Vector QR Code with Center Group Badge */}
                  <div className="relative p-4 bg-white rounded-2xl shadow-inner border border-gray-100 flex items-center justify-center">
                    <QRCode
                      value={inviteUrl}
                      size={200}
                      level="Q"
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    />
                    {/* WhatsApp-style center avatar badge */}
                    <div className="absolute inset-0 m-auto w-10 h-10 rounded-full border-2 border-white bg-white shadow-md flex items-center justify-center overflow-hidden">
                      {groupAvatar ? (
                        <img
                          src={getOptimizedImageUrl(groupAvatar, 80, 80)}
                          alt={groupName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center">
                          {groupName.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400">
                    Scan with any camera or CallsChat scanner to join
                  </p>
                </div>

                {/* QR Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleShareQr}
                    className="gap-2 text-xs font-medium border-gray-200 dark:border-gray-700 h-10"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Share QR Code</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadQr}
                    disabled={downloading}
                    className="gap-2 text-xs font-medium border-gray-200 dark:border-gray-700 h-10"
                  >
                    {downloading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    <span>{downloading ? "Saving..." : "Download"}</span>
                  </Button>
                </div>

                {/* Reset QR Code (Admin only) */}
                {isAdmin && (
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowConfirmReset(true)}
                      className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reset QR code</span>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Confirmation Modal for Resetting Invite Code */}
        {showConfirmReset && (
          <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#182229] rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                  Reset invite link?
                </h4>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                If you reset this invite link, the previous link and QR code will no longer work for
                anyone.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfirmReset(false)}
                  disabled={resetting}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleResetInvite}
                  disabled={resetting}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold gap-1.5"
                >
                  {resetting && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>{resetting ? "Resetting..." : "Reset Link"}</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
