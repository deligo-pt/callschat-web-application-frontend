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
      <DialogContent className="bg-white sm:max-w-[420px] rounded-2xl p-0 overflow-hidden border-0 shadow-2xl">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#EEF2FF] bg-gradient-to-br from-[#F5F0FF] to-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C3AED]/10">
              <Flame className="h-5 w-5 text-[#7C3AED]" strokeWidth={2.5} />
            </div>
            <div>
              <DialogTitle className="text-[16px] font-bold text-[#11142D]">
                Disappearing Messages
              </DialogTitle>
              <DialogDescription className="text-[12px] text-[#8F95B2] mt-0.5">
                {isCurrentlyEphemeral
                  ? "Choose a new timer or turn off disappearing messages."
                  : "When turned on, messages sent in this chat will vanish automatically."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ── Info Banner ──────────────────────────────────────────────────── */}
        <div className="mx-4 mt-4 flex items-start gap-3 rounded-xl bg-purple-50 border border-purple-100 px-4 py-3">
          <Lock className="h-4 w-4 text-[#7C3AED] mt-0.5 shrink-0" strokeWidth={2.5} />
          <p className="text-[12px] font-medium text-[#6B3FC0] leading-relaxed">
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
                  "flex items-center justify-between w-full rounded-xl px-4 py-3.5 text-left transition-all",
                  isActive
                    ? "bg-[#F0E9FF] border border-[#C9B3FF]"
                    : "hover:bg-[#F8FAFC] border border-transparent",
                )}
              >
                <div className="flex flex-col">
                  <span
                    className={cn(
                      "text-[14px] font-bold",
                      isActive ? "text-[#7C3AED]" : "text-[#1D2A54]",
                    )}
                  >
                    {opt.label}
                  </span>
                  <span className="text-[11px] font-medium text-[#8F95B2]">
                    {opt.sublabel}
                  </span>
                </div>
                {isActive && (
                  <CheckCircle2
                    className="h-5 w-5 text-[#7C3AED] shrink-0"
                    strokeWidth={2.5}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 h-11 rounded-xl border border-[#EEF2FF] bg-[#F8FAFC] text-[14px] font-bold text-[#1D2A54] transition-colors hover:bg-[#EEF2FF] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || selected === currentValue}
            className="flex-1 h-11 rounded-xl bg-[#7C3AED] text-[14px] font-bold text-white transition-colors hover:bg-[#6D28CC] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {selected === null ? "Turning off…" : "Starting…"}
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
