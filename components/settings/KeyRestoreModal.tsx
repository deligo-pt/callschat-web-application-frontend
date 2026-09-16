"use client";

import React, { useState } from "react";
import { decryptKeyVault } from "@/utils/crypto";
import { restoreLocalKeyBundle, LocalKeyBundle } from "@/utils/keyStore";
import { ShieldCheck, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface KeyRestoreModalProps {
  isOpen: boolean;
  userId: string;
  backupData: {
    encryptedVault: string;
    nonce: string;
    salt: string;
    kdfAlgorithm?: string;
    kdfIterations?: number;
    updatedAt?: string;
  };
  onRestored: () => void;
  onSkip: () => void;
}

export function KeyRestoreModal({
  isOpen,
  userId,
  backupData,
  onRestored,
  onSkip,
}: KeyRestoreModalProps) {
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;

    try {
      setLoading(true);
      setErrorMsg(null);

      const iterations = backupData.kdfIterations || 100000;
      const bundle = decryptKeyVault(
        backupData.encryptedVault,
        backupData.nonce,
        backupData.salt,
        pin,
        iterations
      ) as LocalKeyBundle;

      if (!bundle || !bundle.privateKey || !bundle.publicKey) {
        throw new Error("Corrupted backup data");
      }

      await restoreLocalKeyBundle(userId, bundle);
      toast.success("Encryption keys and conversations restored successfully!");
      onRestored();
    } catch (err: any) {
      console.error("Failed to restore key vault:", err);
      setErrorMsg("Incorrect Security PIN. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col p-6 sm:p-8 animate-in zoom-in-95 duration-200">
        {/* Shield Icon Header */}
        <div className="flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center mb-4 shadow-xs">
            <ShieldCheck className="h-9 w-9" />
          </div>
          <h2 className="text-[20px] font-bold text-slate-900">
            Restore Encrypted Chats
          </h2>
          <p className="text-[13px] text-slate-500 mt-1.5 max-w-xs leading-relaxed">
            An End-to-End Encrypted key vault was found for your account. Enter your Security PIN to unlock your previous messages.
          </p>
        </div>

        {/* PIN Form */}
        <form onSubmit={handleRestore} className="mt-6 space-y-4">
          <div>
            <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Enter 6-Digit Security PIN
            </label>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Enter your backup PIN"
                autoFocus
                className="w-full h-12 px-4 pr-11 rounded-xl border border-slate-200 text-[15px] text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] tracking-wider"
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPin ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-[12.5px] border border-red-100">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !pin}
            className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-[14px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-blue-500/10"
          >
            {loading ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                Decrypting Key Vault...
              </>
            ) : (
              "Restore Messages & Keys"
            )}
          </button>
        </form>

        {/* Skip Option */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => {
              toast.warning(
                "New encryption keys will be generated. Messages sent before this session cannot be self-recovered until the sender re-syncs.",
                { duration: 6000 }
              );
              onSkip();
            }}
            className="text-[12.5px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            Skip and start as a new session
          </button>
          <p className="text-[11px] text-slate-400 mt-1">
            Note: Skipping will create new keys. Historical messages will remain locked until restored.
          </p>
        </div>
      </div>
    </div>
  );
}
