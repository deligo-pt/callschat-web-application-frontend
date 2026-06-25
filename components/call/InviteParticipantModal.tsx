"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { UserPlus, Search, Loader2, Phone, PhoneOff, Check, X, Users } from "lucide-react";
import { useParticipants } from "@livekit/components-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSocket } from "@/components/providers/SocketProvider";
import { useContacts, Contact } from "@/hooks/useContacts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface InviteParticipantModalProps {
  /** Whether the modal is visible */
  open: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** The LiveKit room name of the ongoing call */
  roomId: string;
  /** The media mode of the call, forwarded to the invited participant */
  callType: "AUDIO" | "VIDEO";
}

// ---------------------------------------------------------------------------
// Per-contact invitation status
// ---------------------------------------------------------------------------

type InviteStatus = "idle" | "ringing" | "sent" | "error";

interface ContactInviteState {
  status: InviteStatus;
  errorMessage?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const InviteParticipantModal = ({
  open,
  onClose,
  roomId,
  callType,
}: InviteParticipantModalProps) => {
  const { socket } = useSocket();
  const { contacts, isLoading: contactsLoading } = useContacts();
  const [search, setSearch] = useState("");
  const [inviteStates, setInviteStates] = useState<Record<string, ContactInviteState>>({});
  const errorTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // -----------------------------------------------------------------------
  // LiveKit participant identities currently in the room.
  // useParticipants() is only valid inside a <LiveKitRoom> tree.
  // -----------------------------------------------------------------------
  const participants = useParticipants();
  const participantIdentities = new Set(participants.map((p) => p.identity));

  // Reset state each time the modal opens
  useEffect(() => {
    if (open) {
      setSearch("");
      setInviteStates({});
    }
    return () => {
      // Clear any pending error-reset timers on unmount
      Object.values(errorTimeouts.current).forEach(clearTimeout);
    };
  }, [open]);

  // -----------------------------------------------------------------------
  // Listen for call:error events to reset "Ringing…" state if the invite
  // fails (e.g. target is offline, not a contact, etc.).
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!socket) return;

    const handleCallError = (payload: { code?: string; message?: string }) => {
      // If the error code is INVITE_FAILED we surface it to the button that sent it.
      // Since Socket.IO doesn't carry which contactId caused it, we reset ALL
      // "ringing" states and surface a toast.
      if (payload?.code === "INVITE_FAILED" || payload?.message) {
        const message = payload.message || "Failed to reach this person.";
        toast.error(message);

        setInviteStates((prev) => {
          const next = { ...prev };
          for (const id of Object.keys(next)) {
            if (next[id].status === "ringing") {
              next[id] = { status: "error", errorMessage: message };
            }
          }
          return next;
        });

        // Auto-reset error buttons after 4 s
        const timeout = setTimeout(() => {
          setInviteStates((prev) => {
            const next = { ...prev };
            for (const id of Object.keys(next)) {
              if (next[id].status === "error") {
                next[id] = { status: "idle" };
              }
            }
            return next;
          });
        }, 4000);

        errorTimeouts.current["_last"] = timeout;
      }
    };

    socket.on("call:error", handleCallError);
    return () => {
      socket.off("call:error", handleCallError);
    };
  }, [socket]);

  // -----------------------------------------------------------------------
  // Invite action
  // -----------------------------------------------------------------------
  const handleInvite = useCallback(
    (contact: Contact) => {
      if (!socket) return;

      const targetId = contact.userId;

      // Optimistic UI: set to ringing immediately
      setInviteStates((prev) => ({
        ...prev,
        [targetId]: { status: "ringing" },
      }));

      socket.emit(
        "call:invite_participant",
        { targetId, roomId, callType },
      );

      // Auto-transition "ringing" → "sent" after 2 s if no error arrived.
      // A real ACK would be cleaner but the backend emits no positive ack.
      const sentTimeout = setTimeout(() => {
        setInviteStates((prev) => {
          if (prev[targetId]?.status === "ringing") {
            return { ...prev, [targetId]: { status: "sent" } };
          }
          return prev;
        });
      }, 2000);

      errorTimeouts.current[targetId] = sentTimeout;
    },
    [socket, roomId, callType],
  );

  // -----------------------------------------------------------------------
  // Filtered contact list:
  //   - Exclude participants already in the LiveKit room
  //   - Apply the search filter
  // -----------------------------------------------------------------------
  const filteredContacts = contacts.filter((c) => {
    const isInRoom = participantIdentities.has(c.userId);
    const matchesSearch =
      search.trim() === "" ||
      c.name.toLowerCase().includes(search.toLowerCase());
    return !isInRoom && matchesSearch;
  });

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------
  const renderInviteButton = (contact: Contact) => {
    const targetId = contact.userId;
    const state = inviteStates[targetId] ?? { status: "idle" };

    if (state.status === "ringing") {
      return (
        <button
          disabled
          className="flex items-center gap-2 rounded-full bg-amber-500/20 border border-amber-400/40 px-4 py-2 text-xs font-semibold text-amber-300 cursor-not-allowed"
        >
          <Loader2 className="h-3 w-3 animate-spin" />
          Ringing…
        </button>
      );
    }

    if (state.status === "sent") {
      return (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
          <Check className="h-3.5 w-3.5" />
          Invited
        </span>
      );
    }

    if (state.status === "error") {
      return (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
          <X className="h-3.5 w-3.5" />
          Unreachable
        </span>
      );
    }

    // idle
    return (
      <button
        onClick={() => handleInvite(contact)}
        className="flex items-center gap-2 rounded-full bg-[#3B58F5]/20 border border-[#3B58F5]/40 px-4 py-2 text-xs font-semibold text-[#7B96FF] transition-all hover:bg-[#3B58F5]/30 hover:text-white active:scale-95"
      >
        <Phone className="h-3.5 w-3.5" />
        Invite
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent overlayClassName="z-[150]" className="z-[200] w-[420px] max-h-[600px] overflow-hidden flex flex-col bg-[#111936] border border-white/10 rounded-3xl p-0 shadow-[0_0_80px_rgba(0,0,0,0.6)] text-white gap-0">

        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3B58F5]/20 border border-[#3B58F5]/30">
              <UserPlus className="h-5 w-5 text-[#7B96FF]" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white">
                Add to call
              </DialogTitle>
              <p className="text-xs text-white/40 mt-0.5">
                Invite a contact to join this {callType.toLowerCase()} call
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="text"
              placeholder="Search contacts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#3B58F5]/50 transition-colors"
            />
          </div>
        </DialogHeader>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 min-h-0">
          {contactsLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-white/30">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm">Loading contacts…</span>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-white/30">
              <Users className="h-10 w-10 opacity-40" />
              <p className="text-sm font-medium">
                {search ? "No contacts match your search" : "All contacts are already in the call"}
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {filteredContacts.map((contact) => {
                const avatarUrl =
                  contact.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=3B58F5&color=fff&size=96`;

                return (
                  <li
                    key={contact.userId}
                    className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/5 transition-colors"
                  >
                    {/* Avatar + online indicator */}
                    <div className="relative shrink-0">
                      <img
                        src={avatarUrl}
                        alt={contact.name}
                        className="h-11 w-11 rounded-full object-cover border-2 border-white/10"
                      />
                      {contact.isOnline && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#111936]" />
                      )}
                    </div>

                    {/* Name + status */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {contact.name}
                      </p>
                      <p className={cn(
                        "text-xs font-medium",
                        contact.isOnline ? "text-emerald-400" : "text-white/30",
                      )}>
                        {contact.isOnline ? "Online" : "Offline"}
                      </p>
                    </div>

                    {/* Invite button */}
                    <div className="shrink-0">
                      {renderInviteButton(contact)}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5">
          <p className="text-xs text-white/25 text-center">
            Contacts already in the call are hidden · Offline users cannot be invited
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
