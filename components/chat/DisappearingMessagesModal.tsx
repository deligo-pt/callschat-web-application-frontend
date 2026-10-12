"use client";

import React, { useState } from "react";
import { Timer, CheckCircle2, Loader2, Flame, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { chatService } from "@/services/chat.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// Timer option type
// ---------------------------------------------------------------------------

interface TimerOption {
  label: string;
  sublabel: string;
  value: number | null;
}

const TIMER_OPTIONS: TimerOption[] = [
  { label: "Off",     sublabel: "Messages stay forever",     value: null    },
  { label: "24 hours", sublabel: "Messages disappear after 1 day",  value: 86400   },
  { label: "7 days",  sublabel: "Messages disappear after 1 week", value: 604800  },
  { label: "90 days", sublabel: "Messages disappear after 90 days", value: 7776000 },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DisappearingMessagesModalProps {
  open: boolean;
  onClose: () => void;
  conversationId: string;
  /** The peer user ID — needed to start a new ephemeral conversation. */
  peerId: string;
  /** Current setting fetched from the server (null = off). */
  currentValue: number | null;
  /** Called after a successful save so the parent can update its local state. */
  onUpdated: (newValue: number | null) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DisappearingMessagesModal({
  open,
  onClose,
  conversationId,
  peerId,
  currentValue,
  onUpdated,
}: DisappearingMessagesModalProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(currentValue);
  const [isSaving, setIsSaving] = useState(false);

  // Keep local selection in sync when the modal re-opens with a fresh value
  React.useEffect(() => {
    if (open) setSelected(currentValue);
  }, [open, currentValue]);

  const handleSave = async () => {
    if (selected === currentValue) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      await chatService.setDisappearSettings(conversationId, selected);
      const label = TIMER_OPTIONS.find((o) => o.value === selected)?.label ?? "";
      onUpdated(selected);
      if (selected === null) {
        toast.success("Disappearing messages turned off.");
      } else {
        toast.success(`Disappearing messages set to ${label}.`);
      }
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to update disappearing messages.";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Are we currently inside an ephemeral conversation?
  const isCurrentlyEphemeral = currentValue !== null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent 
        overlayClassName="bg-black/50 dark:bg-black/75 backdrop-blur-xs"
        className="bg-white dark:bg-[#111B21] sm:max-w-[420px] rounded-2xl p-0 overflow-hidden border border-slate-200/80 dark:border-[#222D34] shadow-2xl"
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#EEF2FF] dark:border-[#222D34] bg-gradient-to-br from-[#F5F0FF] to-white dark:from-purple-950/30 dark:via-[#111B21] dark:to-[#111B21]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C3AED]/10 dark:bg-purple-950/50">
              <Flame className="h-5 w-5 text-[#7C3AED] dark:text-purple-400" strokeWidth={2.5} />
            </div>
            <div>
              <DialogTitle className="text-[16px] font-bold text-[#11142D] dark:text-[#E9EDEF]">
                Disappearing Messages
              </DialogTitle>
              <DialogDescription className="text-[12px] text-[#8F95B2] dark:text-[#8696A0] mt-0.5">
                {isCurrentlyEphemeral
                  ? "Choose a new timer or turn off disappearing messages."
                  : "When turned on, messages sent in this chat will vanish automatically."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ── Info Banner ──────────────────────────────────────────────────── */}
        <div className="mx-4 mt-4 flex items-start gap-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 px-4 py-3">
          <Lock className="h-4 w-4 text-[#7C3AED] dark:text-purple-400 mt-0.5 shrink-0" strokeWidth={2.5} />
          <p className="text-[12px] font-medium text-[#6B3FC0] dark:text-purple-300 leading-relaxed">
            When turned on, new messages sent in this chat will disappear after the selected duration.
          </p>
        </div>

        {/* ── Options ────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1 px-4 py-4">
          {TIMER_OPTIONS.map((opt) => {
            const isActive = selected === opt.value;
            return (
              <button
                key={String(opt.value)}
                onClick={() => setSelected(opt.value)}
                className={cn(
                  "flex items-center justify-between w-full rounded-xl px-4 py-3.5 text-left transition-all cursor-pointer",
                  isActive
                    ? "bg-[#F0E9FF] dark:bg-purple-950/40 border border-[#C9B3FF] dark:border-purple-800/60"
                    : "hover:bg-[#F8FAFC] dark:hover:bg-[#202C33] border border-transparent",
                )}
              >
                <div className="flex flex-col">
                  <span
                    className={cn(
                      "text-[14px] font-bold",
                      isActive ? "text-[#7C3AED] dark:text-purple-300" : "text-[#1D2A54] dark:text-[#E9EDEF]",
                    )}
                  >
                    {opt.label}
                  </span>
                  <span className="text-[11px] font-medium text-[#8F95B2] dark:text-[#8696A0]">
                    {opt.sublabel}
                  </span>
                </div>
                {isActive && (
                  <CheckCircle2
                    className="h-5 w-5 text-[#7C3AED] dark:text-purple-400 shrink-0"
                    strokeWidth={2.5}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="flex gap-3 px-6 pb-6 border-t border-slate-100 dark:border-[#222D34] pt-4">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 h-11 rounded-xl border border-[#EEF2FF] dark:border-[#2A3942] bg-[#F8FAFC] dark:bg-[#202C33] text-[14px] font-bold text-[#1D2A54] dark:text-[#E9EDEF] transition-colors hover:bg-[#EEF2FF] dark:hover:bg-[#2A3942] disabled:opacity-60 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || selected === currentValue}
            className="flex-1 h-11 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-[14px] font-bold text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{selected === null ? "Turning off…" : "Starting…"}</span>
              </>
            ) : selected === null ? (
              "Turn Off"
            ) : (
              "Start Ephemeral Chat"
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Helpers (used by the chat page for client-side expiry)
// ---------------------------------------------------------------------------

/**
 * Returns true when a message has expired based on the conversation timer.
 *
 * @param createdAt          - ISO string of the message's createdAt timestamp.
 * @param disappearAfterSeconds - Conversation timer in seconds, or null if off.
 */
export function isMessageExpired(
  createdAt: string,
  disappearAfterSeconds: number | null,
): boolean {
  if (!disappearAfterSeconds) return false;
  const expiresAt = new Date(createdAt).getTime() + disappearAfterSeconds * 1000;
  return Date.now() >= expiresAt;
}

/**
 * Returns the number of milliseconds until a message expires.
 * Returns 0 if the message has already expired or the feature is off.
 */
export function msUntilExpiry(
  createdAt: string,
  disappearAfterSeconds: number | null,
): number {
  if (!disappearAfterSeconds) return 0;
  const expiresAt = new Date(createdAt).getTime() + disappearAfterSeconds * 1000;
  return Math.max(0, expiresAt - Date.now());
}
