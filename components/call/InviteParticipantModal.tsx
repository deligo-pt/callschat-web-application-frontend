"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { UserPlus, Search, Loader2, Phone, Check, X, Users, PhoneCall, Sparkles } from "lucide-react";
import { useParticipants, useLocalParticipant } from "@livekit/components-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSocket } from "@/components/providers/SocketProvider";
import { useContacts, Contact } from "@/hooks/useContacts";
import { UserService, SearchUserItem } from "@/services/user.service";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getOptimizedImageUrl } from "@/utils/image";

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

type InviteStatus = "idle" | "ringing" | "joined" | "error";

interface ContactInviteState {
  status: InviteStatus;
  errorMessage?: string;
}

export interface UnifiedUserItem {
  id: string;
  userId: string;
  name: string;
  username?: string;
  phone?: string;
  avatarUrl: string | null;
  isOnline: boolean;
  isContact: boolean;
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
  const { localParticipant } = useLocalParticipant();
  
  const [search, setSearch] = useState("");
  const [remoteUsers, setRemoteUsers] = useState<UnifiedUserItem[]>([]);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);
  const [inviteStates, setInviteStates] = useState<Record<string, ContactInviteState>>({});
  const errorTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -----------------------------------------------------------------------
  // LiveKit participant identities currently in the room
  // -----------------------------------------------------------------------
  const participants = useParticipants();
  const participantIdentities = new Set(participants.map((p) => p.identity));

  // Current user's identity to exclude
  const currentUserId = localParticipant?.identity || "";

  // Reset state each time the modal opens
  useEffect(() => {
    if (open) {
      setSearch("");
      setRemoteUsers([]);
      setIsSearchingRemote(false);
      setInviteStates({});
    }
    return () => {
      Object.values(errorTimeouts.current).forEach(clearTimeout);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [open]);

  // -----------------------------------------------------------------------
  // Listen for call:error events (INVITE_TIMEOUT, INVITE_FAILED, etc.)
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!socket) return;

    const handleCallError = (payload: { code?: string; message?: string; targetId?: string }) => {
      const code = payload?.code;
      const targetId = payload?.targetId;

      if (code === "INVITE_TIMEOUT") {
        setInviteStates((prev) => {
          const next = { ...prev };
          if (targetId && next[targetId]) {
            next[targetId] = { status: "idle" };
          } else {
            for (const id of Object.keys(next)) {
              if (next[id].status === "ringing") {
                next[id] = { status: "idle" };
              }
            }
          }
          return next;
        });
      } else if (code === "INVITE_FAILED" || payload?.message) {
        const message = payload.message || "Failed to reach this user.";
        toast.error(message);

        setInviteStates((prev) => {
          const next = { ...prev };
          if (targetId) {
            next[targetId] = { status: "error", errorMessage: message };
          } else {
            for (const id of Object.keys(next)) {
              if (next[id].status === "ringing") {
                next[id] = { status: "error", errorMessage: message };
              }
            }
          }
          return next;
        });

        // Auto-reset error buttons after 4 seconds
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
  // Whenever room participants change, clear ringing states for anyone joined
  // -----------------------------------------------------------------------
  useEffect(() => {
    setInviteStates((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        if (participantIdentities.has(id)) {
          delete next[id];
          if (errorTimeouts.current[id]) {
            clearTimeout(errorTimeouts.current[id]);
            delete errorTimeouts.current[id];
          }
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [participantIdentities]);

  // -----------------------------------------------------------------------
  // Remote search across CallsChat when query >= 2 characters
  // -----------------------------------------------------------------------
  useEffect(() => {
    const trimmed = search.trim();
    if (!trimmed || trimmed.length < 2) {
      setRemoteUsers([]);
      setIsSearchingRemote(false);
      return;
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(async () => {
      setIsSearchingRemote(true);
      try {
        const response = await UserService.searchUsers(trimmed, 20);
        if (response.success && Array.isArray(response.data)) {
          const mapped: UnifiedUserItem[] = response.data.map((u: SearchUserItem) => ({
            id: u.id,
            userId: u.id,
            name: u.displayName || u.username || "CallsChat User",
            username: u.username || undefined,
            phone: u.phone || undefined,
            avatarUrl: u.avatarUrl,
            isOnline: u.isOnline,
            isContact: u.isContact,
          }));
          setRemoteUsers(mapped);
        }
      } catch (err) {
        console.error("Failed to search users remotely", err);
      } finally {
        setIsSearchingRemote(false);
      }
    }, 280);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [search]);

  // -----------------------------------------------------------------------
  // Invite action
  // -----------------------------------------------------------------------
  const handleInvite = useCallback(
    (user: UnifiedUserItem) => {
      if (!socket || !user.userId) return;

      const targetId = user.userId;

      // Optimistic UI: set to ringing immediately
      setInviteStates((prev) => ({
        ...prev,
        [targetId]: { status: "ringing" },
      }));

      socket.emit("call:invite_participant", {
        targetId,
        roomId,
        callType,
      });

      // 46-second safety net timer to reset ringing if socket drops
      const sentTimeout = setTimeout(() => {
        setInviteStates((prev) => {
          if (prev[targetId]?.status === "ringing") {
            return { ...prev, [targetId]: { status: "idle" } };
          }
          return prev;
        });
      }, 46_000);

      errorTimeouts.current[targetId] = sentTimeout;
    },
    [socket, roomId, callType],
  );

  // -----------------------------------------------------------------------
  // Merge and filter contacts & search results
  // -----------------------------------------------------------------------
  // Base contacts who have CallsChat accounts
  const validContacts: UnifiedUserItem[] = contacts
    .filter((c) => !c.isUnregistered && Boolean(c.userId))
    .map((c) => ({
      id: c.id,
      userId: c.userId,
      name: c.name,
      phone: c.phone,
      avatarUrl: c.avatarUrl,
      isOnline: c.isOnline,
      isContact: true,
    }));

  const cleanSearch = search.trim().toLowerCase();
  const searchDigits = cleanSearch.replace(/\D/g, "");

  // Local filter
  const locallyFilteredContacts = validContacts.filter((c) => {
    if (!cleanSearch) return true;
    const nameMatches = c.name.toLowerCase().includes(cleanSearch);
    const phoneMatches = c.phone ? c.phone.replace(/\D/g, "").includes(searchDigits) : false;
    const usernameMatches = c.username ? c.username.toLowerCase().includes(cleanSearch) : false;
    return nameMatches || (searchDigits.length > 2 && phoneMatches) || usernameMatches;
  });

  // Combined unique list (local contacts first, then remote search results)
  const combinedMap = new Map<string, UnifiedUserItem>();
  for (const c of locallyFilteredContacts) {
    if (c.userId && c.userId !== currentUserId) {
      combinedMap.set(c.userId, c);
    }
  }

  for (const r of remoteUsers) {
    if (r.userId && r.userId !== currentUserId && !combinedMap.has(r.userId)) {
      combinedMap.set(r.userId, r);
    }
  }

  const allDisplayUsers = Array.from(combinedMap.values());

  // -----------------------------------------------------------------------
  // Render Action Button
  // -----------------------------------------------------------------------
  const renderActionButton = (user: UnifiedUserItem) => {
    const targetId = user.userId;
    const isInRoom = participantIdentities.has(targetId);
    const state = inviteStates[targetId] ?? { status: "idle" };

    if (isInRoom) {
      return (
        <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-xs font-semibold text-emerald-400">
          <Check className="h-3.5 w-3.5" />
          In call
        </span>
      );
    }

    if (state.status === "ringing") {
      return (
        <button
          disabled
          className="flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 px-3.5 py-1.5 text-xs font-semibold text-amber-300 cursor-not-allowed shadow-inner"
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
          Ringing…
        </button>
      );
    }

    if (state.status === "error") {
      return (
        <button
          onClick={() => handleInvite(user)}
          className="flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-400/40 px-3.5 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/30 transition-colors"
        >
          <Phone className="h-3 w-3" />
          Retry
        </button>
      );
    }

    // Default: Add / Invite button
    return (
      <button
        onClick={() => handleInvite(user)}
        className="flex items-center gap-1.5 rounded-full bg-[#3B58F5] hover:bg-blue-600 active:scale-95 px-4 py-1.5 text-xs font-bold text-white shadow-[0_4px_14px_rgba(59,88,245,0.4)] transition-all cursor-pointer"
      >
        <UserPlus className="h-3.5 w-3.5" />
        Add
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent 
        overlayClassName="z-[150] bg-black/60 backdrop-blur-xs" 
        className="z-[200] w-[95vw] max-w-[440px] max-h-[85vh] h-[640px] overflow-hidden flex flex-col bg-[#111936] border border-white/10 rounded-3xl p-0 shadow-[0_20px_70px_rgba(0,0,0,0.7)] text-white gap-0 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10 bg-[#152042]/80 backdrop-blur-md shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#3B58F5]/20 border border-[#3B58F5]/30 text-[#7B96FF] shadow-inner">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-[17px] font-bold text-white tracking-tight">
                  Add people to call
                </DialogTitle>
                <p className="text-xs text-white/50 mt-0.5">
                  Invite friends to join this active {callType.toLowerCase()} call
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              title="Close"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              placeholder="Search by name, @username, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl bg-white/5 border border-white/10 pl-10 pr-9 py-2.5 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#3B58F5]/60 focus:bg-white/[0.08] transition-all"
              autoFocus
            />
            {isSearchingRemote && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7B96FF] animate-spin" />
            )}
            {search && !isSearchingRemote && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </DialogHeader>

        {/* User list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0 custom-scrollbar">
          {contactsLoading && allDisplayUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-white/40">
              <Loader2 className="h-8 w-8 animate-spin text-[#3B58F5]" />
              <span className="text-sm">Loading contacts…</span>
            </div>
          ) : allDisplayUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-white/40 text-center px-4">
              <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/30 mb-1 border border-white/5">
                <Users className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-white/80">
                {search ? "No users found" : "No contacts available"}
              </p>
              <p className="text-xs text-white/40 max-w-xs">
                {search
                  ? "Try searching with a different name, username, or phone number."
                  : "All your contacts are already in this call or offline."}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {allDisplayUsers.map((user) => {
                const avatarUrl =
                  user.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3B58F5&color=fff&size=96`;

                const subtext =
                  user.username ? `@${user.username}` : user.phone || (user.isContact ? "Contact" : "CallsChat user");

                return (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-white/5 transition-colors group"
                  >
                    {/* Avatar & Online status */}
                    <div className="relative shrink-0">
                      <img
                        src={getOptimizedImageUrl(avatarUrl)}
                        alt={user.name}
                        className="h-11 w-11 rounded-full object-cover border border-white/10 group-hover:border-[#3B58F5]/50 transition-colors shadow-sm"
                      />
                      {user.isOnline && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#111936] shadow-sm" />
                      )}
                    </div>

                    {/* Name & Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-white truncate">
                          {user.name}
                        </p>
                        {user.isContact && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-white/60 font-medium shrink-0">
                            Contact
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-white/50 truncate">
                        {subtext}
                      </p>
                    </div>

                    {/* Action button */}
                    <div className="shrink-0">
                      {renderActionButton(user)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-[#152042]/50 backdrop-blur-md shrink-0 flex items-center justify-between text-xs text-white/40">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#7B96FF]" />
            WhatsApp-style live join invitation
          </span>
          <span>45s ring guardrail</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
