"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link2, Copy, RefreshCw, Check, Share2, QrCode, Shield, Loader2 } from "lucide-react";
import { groupService } from "@/services/group.service";
import { toast } from "sonner";

interface InviteLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  isAdmin: boolean;
  joinApprovalMode?: "DIRECT" | "APPROVAL_REQUIRED";
}

export function InviteLinkModal({
  isOpen,
  onClose,
  groupId,
  groupName,
  isAdmin,
  joinApprovalMode = "DIRECT",
}: InviteLinkModalProps) {
  const [inviteCode, setInviteCode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const inviteUrl = typeof window !== "undefined" && inviteCode
    ? `${window.location.origin}/groups/invite/${inviteCode}`
    : "";

  useEffect(() => {
    if (isOpen && groupId) {
      setLoading(true);
      groupService
        .fetchInviteCode(groupId)
        .then((res) => {
          if (res.success && res.data?.inviteCode) {
            setInviteCode(res.data.inviteCode);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, groupId]);

  const handleCopy = async () => {
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

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset the invite link? The previous link will no longer work.")) {
      return;
    }
    setResetting(true);
    try {
      const res = await groupService.resetInviteCode(groupId);
      if (res.success && res.data?.inviteCode) {
        setInviteCode(res.data.inviteCode);
        toast.success("Invite link has been reset!");
      }
    } catch {
      toast.error("Failed to reset invite link");
    } finally {
      setResetting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[460px] bg-white dark:bg-[#111b21] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-gray-100 dark:border-gray-800">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <Link2 className="w-5 h-5 text-emerald-500" />
            <span>Invite to &quot;{groupName}&quot;</span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : (
            <>
              {/* Approval Notice Badge */}
              {joinApprovalMode === "APPROVAL_REQUIRED" && (
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs border border-blue-100 dark:border-blue-900/50">
                  <Shield className="w-4 h-4 flex-shrink-0" />
                  <span>Admin approval is required for participants who join using this link.</span>
                </div>
              )}

              {/* Link Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Group Link
                </label>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-[#202c33] border border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-700 dark:text-gray-200 truncate flex-1 font-mono">
                    {inviteUrl || "Generating invite link..."}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* QR Code preview */}
              {showQR && inviteUrl && (
                <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-[#182229] rounded-xl border border-gray-100 dark:border-gray-800 space-y-2">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(inviteUrl)}`}
                    alt="Group Invite QR Code"
                    className="w-44 h-44 rounded-lg shadow-xs"
                  />
                  <p className="text-[11px] text-gray-500">Scan to join &quot;{groupName}&quot;</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-2 text-xs font-medium border-gray-200 dark:border-gray-700"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? "Copied" : "Copy Link"}</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQR(!showQR)}
                  className="gap-2 text-xs font-medium border-gray-200 dark:border-gray-700"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{showQR ? "Hide QR" : "QR Code"}</span>
                </Button>
              </div>

              {/* Admin Reset Link Button */}
              {isAdmin && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    disabled={resetting}
                    className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resetting ? "animate-spin" : ""}`} />
                    <span>Reset invite link</span>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
