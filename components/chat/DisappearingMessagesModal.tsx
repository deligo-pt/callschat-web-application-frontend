"use client";

import React, { useState } from "react";
import { Timer, CheckCircle2, XCircle, Loader2 } from "lucide-react";
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

// ---------------------------------------------------------------------------
// Timer option type
// ---------------------------------------------------------------------------

interface TimerOption {
  label: string;
  sublabel: string;
  value: number | null;
}

const TIMER_OPTIONS: TimerOption[] = [
  { label: "Off",      sublabel: "Messages stay forever",  value: null   },
  { label: "30s",      sublabel: "30 seconds (testing)",   value: 30     },
  { label: "5 min",    sublabel: "5 minutes",              value: 300    },
  { label: "1 hour",   sublabel: "60 minutes",             value: 3600   },
  { label: "24 hours", sublabel: "Disappear after a day",  value: 86400  },
  { label: "7 days",   sublabel: "Disappear after a week", value: 604800 },
  { label: "90 days",  sublabel: "Disappear after 90 days",value: 2592000},
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DisappearingMessagesModalProps {
  open: boolean;
  onClose: () => void;
  conversationId: string;
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
  currentValue,
  onUpdated,
}: DisappearingMessagesModalProps) {
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

      onUpdated(selected);

      const label = TIMER_OPTIONS.find((o) => o.value === selected)?.label ?? "Off";
      toast.success(
        selected === null
          ? "Disappearing messages turned off."
          : `Messages will disappear after ${label}.`,
      );
      onClose();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to update disappearing messages.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-white sm:max-w-[400px] rounded-2xl p-0 overflow-hidden border-0 shadow-2xl">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#EEF2FF] bg-gradient-to-br from-[#F0F4FF] to-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3B58F5]/10">
              <Timer className="h-5 w-5 text-[#3B58F5]" strokeWidth={2.5} />
            </div>
            <div>
              <DialogTitle className="text-[16px] font-bold text-[#11142D]">
                Disappearing Messages
              </DialogTitle>
              <DialogDescription className="text-[12px] text-[#8F95B2] mt-0.5">
                Messages auto-delete after the chosen time.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

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
                    ? "bg-[#EEF2FF] border border-[#C7D2FF]"
                    : "hover:bg-[#F8FAFC] border border-transparent",
                )}
              >
                <div className="flex flex-col">
                  <span
                    className={cn(
                      "text-[14px] font-bold",
                      isActive ? "text-[#3B58F5]" : "text-[#1D2A54]",
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
                    className="h-5 w-5 text-[#3B58F5] shrink-0"
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
            className="flex-1 h-11 rounded-xl bg-[#3B58F5] text-[14px] font-bold text-white transition-colors hover:bg-[#2C48CC] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save"
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
