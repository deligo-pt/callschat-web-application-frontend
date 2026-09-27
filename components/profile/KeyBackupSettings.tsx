"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { chatService } from "@/services/chat.service";
import { exportLocalKeyBundle, storeVaultSessionPin, clearVaultSessionPin } from "@/utils/keyStore";
import { populateAllConversationsCache } from "@/utils/vaultSync";
import { encryptKeyVault } from "@/utils/crypto";
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  Trash2,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Cpu,
  Database,
  Clock,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface KeyBackupSettingsProps {
  onBack?: () => void;
}

export function KeyBackupSettings({ onBack }: KeyBackupSettingsProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [backupData, setBackupData] = useState<{
    updatedAt: string;
    kdfAlgorithm: string;
    kdfIterations: number;
  } | null>(null);

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await chatService.fetchKeyBackup();
      if (res) {
        setBackupData({
          updatedAt: res.updatedAt,
          kdfAlgorithm: res.kdfAlgorithm,
          kdfIterations: res.kdfIterations,
        });
      } else {
        setBackupData(null);
      }
    } catch (e) {
      console.error("Failed to load key backup status", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (pin.length < 6) {
      toast.error("PIN must be at least 6 characters");
      return;
    }

    if (pin !== confirmPin) {
      toast.error("PINs do not match");
      return;
    }

    try {
      setSubmitting(true);
      setStatusText("Scanning all conversations & message history...");
      toast.loading("Preparing full chat history backup...", { id: "vault-backup" });
      await populateAllConversationsCache(user.id, (msg) => {
        setStatusText(msg);
      });
      setStatusText("Encrypting complete key vault bundle...");
      toast.loading("Encrypting key vault bundle...", { id: "vault-backup" });
      const localBundle = await exportLocalKeyBundle(user.id);
      if (!localBundle || !localBundle.privateKey) {
        toast.error("Local encryption keys not found on this device.", { id: "vault-backup" });
        return;
      }

      // Encrypt client-side using zero-knowledge PBKDF2 + XChaCha20-Poly1305
      const encrypted = encryptKeyVault(localBundle, pin, 100000);

      await chatService.uploadKeyBackup({
        encryptedVault: encrypted.encryptedVault,
        nonce: encrypted.nonce,
        salt: encrypted.salt,
        kdfAlgorithm: "PBKDF2-SHA256",
        kdfIterations: encrypted.kdfIterations,
        version: 1,
      });

      await storeVaultSessionPin(user.id, pin);

      toast.success("E2EE key vault securely backed up with full conversation history!", { id: "vault-backup" });
      setPin("");
      setConfirmPin("");
      await fetchStatus();
    } catch (err: any) {
      console.error("Failed to back up key vault", err);
      toast.error(err?.message || "Failed to create encrypted backup", { id: "vault-backup" });
    } finally {
      setSubmitting(false);
      setStatusText(null);
    }
  };

  const handleDeleteBackup = async () => {
    try {
      setSubmitting(true);
      await chatService.deleteKeyBackup();
      if (user?.id) {
        await clearVaultSessionPin(user.id);
      }
      toast.success("Cloud key vault backup deleted");
      setBackupData(null);
      setShowDeleteConfirm(false);
    } catch (err: any) {
      console.error("Failed to delete key backup", err);
      toast.error("Failed to delete backup");
    } finally {
      setSubmitting(false);
    }
  };

  const isPinValid = pin.length >= 6;
  const isPinMatching = isPinValid && confirmPin.length > 0 && pin === confirmPin;
  const isPinMismatch = confirmPin.length > 0 && pin !== confirmPin;

  return (
    <div className="flex flex-col h-full w-full bg-[#F8FAFC] overflow-y-auto">
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#E6EAFA] bg-white/95 px-6 py-4 backdrop-blur-md transition-all shadow-xs">
        <div className="flex items-center gap-3.5">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Go back"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#2563EB]">
                Security & Privacy
              </span>
            </div>
            <h1 className="text-[18px] md:text-[20px] font-bold text-[#0F172A] tracking-tight">
              E2EE Key Backup Vault
            </h1>
          </div>
        </div>

        {/* Status Pill & Refresh Action */}
        <div className="flex items-center gap-2.5">
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium animate-pulse">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#2563EB]" />
              <span>Checking vault...</span>
            </div>
          ) : backupData ? (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[12px] font-semibold shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
              </span>
              <ShieldCheck className="h-3.5 w-3.5 text-[#00A884]" />
              <span>Vault Active</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-[12px] font-semibold shadow-2xs">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
              <span>Backup Inactive</span>
            </div>
          )}

          <button
            onClick={fetchStatus}
            disabled={loading}
            aria-label="Refresh vault status"
            title="Refresh vault status"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin text-[#2563EB]")} />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Status Hero Card */}
          {backupData ? (
            <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 via-white to-slate-50/60 p-6 md:p-7 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[#00A884] shadow-xs">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">
                        Zero-Knowledge Key Vault is Active
                      </h2>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        Protected
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-600 mt-1 leading-relaxed max-w-xl">
                      Your Signal-protocol private keys are encrypted on-device and safely backed up. When you log in from another browser or device, your PIN will unlock and restore your encrypted messages.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cryptographic Spec Chips */}
              <div className="mt-6 pt-5 border-t border-emerald-200/60 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2.5 rounded-xl bg-white/80 p-3 border border-emerald-100 shadow-2xs">
                  <Cpu className="h-4 w-4 text-[#00A884] shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Cipher Suite
                    </span>
                    <span className="text-[12.5px] font-semibold text-slate-800 truncate">
                      XChaCha20-Poly1305
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 rounded-xl bg-white/80 p-3 border border-emerald-100 shadow-2xs">
                  <Database className="h-4 w-4 text-[#00A884] shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Key Derivation
                    </span>
                    <span className="text-[12.5px] font-semibold text-slate-800 truncate">
                      {backupData.kdfAlgorithm} ({backupData.kdfIterations?.toLocaleString() || "100,000"} r)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 rounded-xl bg-white/80 p-3 border border-emerald-100 shadow-2xs">
                  <Clock className="h-4 w-4 text-[#00A884] shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Last Updated
                    </span>
                    <span className="text-[12px] font-semibold text-slate-800 truncate" title={new Date(backupData.updatedAt).toLocaleString()}>
                      {new Date(backupData.updatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-slate-50/60 p-6 md:p-7 shadow-xs">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 shadow-xs">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">
                      No Encrypted Backup Found
                    </h2>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                      Vulnerable
                    </span>
                  </div>
                  <p className="text-[13px] text-slate-600 mt-1 leading-relaxed">
                    Your private identity and pre-keys currently only exist in this browser&apos;s local cache. If you clear browsing data, change computers, or log in on a new device, you will permanently lose access to previous conversation history unless a backup PIN is configured.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Architecture Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-[#E6EAFA] bg-white p-4.5 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] mb-3 border border-blue-100">
                <KeyRound className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-[13.5px] font-bold text-slate-900">
                Client-Side Derivation
              </h3>
              <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
                Your PIN derives a 256-bit AES master key entirely inside your browser using 100,000 PBKDF2 iterations.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E6EAFA] bg-white p-4.5 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-[#00A884] mb-3 border border-emerald-100">
                <Lock className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-[13.5px] font-bold text-slate-900">
                Zero-Knowledge Cloud
              </h3>
              <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
                CallsChat servers only store ciphertext and random salts. We cannot view your PIN or decrypt your messages.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E6EAFA] bg-white p-4.5 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 mb-3 border border-purple-100">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-[13.5px] font-bold text-slate-900">
                Seamless Multi-Device
              </h3>
              <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
                Enter your PIN on any new tablet, phone, or laptop to instantly restore full cryptographic access.
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl border border-[#E6EAFA] bg-white p-6 md:p-8 shadow-xs">
            <div className="flex flex-col mb-6">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB]">
                  {backupData ? "Re-encryption & Password Update" : "Vault Setup"}
                </span>
              </div>
              <h3 className="text-[16px] md:text-[18px] font-bold text-slate-900 mt-0.5">
                {backupData ? "Update Security PIN" : "Create Security PIN"}
              </h3>
              <p className="text-[13px] text-slate-500 mt-1">
                Choose a memorable PIN or passphrase of at least 6 characters. Make sure you remember it—there is no &quot;Forgot PIN&quot; reset due to zero-knowledge encryption.
              </p>
            </div>

            <form onSubmit={handleCreateOrUpdateBackup} className="space-y-5">
              {/* Field 1: PIN */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-slate-700">
                    Security PIN / Passphrase
                  </label>
                  {pin.length > 0 && (
                    <span
                      className={cn(
                        "text-[11px] font-medium flex items-center gap-1",
                        isPinValid ? "text-emerald-600" : "text-amber-600"
                      )}
                    >
                      {isPinValid ? (
                        <>
                          <Check className="h-3 w-3" /> Valid length
                        </>
                      ) : (
                        `At least ${6 - pin.length} more characters required`
                      )}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPin ? "text" : "password"}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter at least 6 digits or passphrase"
                    className="w-full h-11.5 pl-10 pr-11 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white text-[14px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    aria-label={showPin ? "Hide PIN" : "Show PIN"}
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Field 2: Confirm PIN */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-slate-700">
                    Confirm Security PIN
                  </label>
                  {confirmPin.length > 0 && (
                    <span
                      className={cn(
                        "text-[11px] font-medium flex items-center gap-1",
                        isPinMatching ? "text-emerald-600" : "text-red-500"
                      )}
                    >
                      {isPinMatching ? (
                        <>
                          <Check className="h-3 w-3" /> PINs match
                        </>
                      ) : (
                        "PINs do not match"
                      )}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <input
                    type={showConfirmPin ? "text" : "password"}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="Re-enter your PIN"
                    className={cn(
                      "w-full h-11.5 pl-10 pr-11 rounded-xl border bg-slate-50/50 hover:bg-white text-[14px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none transition-all",
                      isPinMismatch
                        ? "border-red-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        : "border-slate-200 focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                    )}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    aria-label={showConfirmPin ? "Hide PIN" : "Show PIN"}
                  >
                    {showConfirmPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || !isPinValid || !isPinMatching}
                  className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-[#2563EB] hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-[14px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer shadow-xs hover:shadow-md"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      <span>{statusText || "Encrypting & Uploading Key Vault..."}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4.5 w-4.5" />
                      <span>{backupData ? "Update & Re-encrypt Vault" : "Enable Encrypted Backup"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Danger Zone: Delete Cloud Backup */}
          {backupData && (
            <div className="rounded-2xl border border-red-200/80 bg-red-50/30 p-6 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 border border-red-200">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-red-950">
                      Delete Cloud Key Vault
                    </h4>
                    <p className="text-[12px] text-red-700/80 mt-0.5 leading-relaxed max-w-lg">
                      Permanently wipes your encrypted vault from CallsChat servers. Your local device keys remain active, but you won&apos;t be able to restore chats on another device.
                    </p>
                  </div>
                </div>

                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="self-start sm:self-center shrink-0 px-4 py-2 rounded-xl text-[13px] font-semibold text-red-600 hover:bg-red-100/80 border border-red-200 bg-white transition-all cursor-pointer hover:border-red-300 active:scale-95 shadow-2xs"
                  >
                    Delete Backup
                  </button>
                ) : (
                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={handleDeleteBackup}
                      disabled={submitting}
                      className="px-3.5 py-2 rounded-xl text-[12.5px] font-bold bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {submitting ? "Deleting..." : "Confirm Delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={submitting}
                      className="px-3.5 py-2 rounded-xl text-[12.5px] font-semibold text-slate-700 hover:bg-slate-200/80 bg-white border border-slate-200 transition-all cursor-pointer active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
