"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Search, Loader2, Star, Bell } from "lucide-react";
import { useParticipants } from "@livekit/components-react";
import { useSocket } from "@/components/providers/SocketProvider";
import { useContacts, Contact } from "@/hooks/useContacts";
import { toast } from "sonner";

interface InviteParticipantSidebarProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
  callType: "AUDIO" | "VIDEO";
}

type InviteStatus = "idle" | "ringing" | "sent" | "error";

interface ContactInviteState {
  status: InviteStatus;
  errorMessage?: string;
}

export const InviteParticipantSidebar = ({
  open,
  onClose,
  roomId,
  callType,
}: InviteParticipantSidebarProps) => {
  const { socket } = useSocket();
  const { contacts, isLoading: contactsLoading } = useContacts();
  const [search, setSearch] = useState("");
  const [inviteStates, setInviteStates] = useState<Record<string, ContactInviteState>>({});
  const errorTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const participants = useParticipants();
  const participantIdentities = new Set(participants.map((p) => p.identity));

  useEffect(() => {
    if (open) {
      setSearch("");
      setInviteStates({});
    }
    return () => {
      Object.values(errorTimeouts.current).forEach(clearTimeout);
    };
  }, [open]);

  useEffect(() => {
    if (!socket) return;
    const handleCallError = (payload: { code?: string; message?: string }) => {
      const isInviteError = payload?.code === "INVITE_FAILED" || payload?.code === "INVITE_TIMEOUT";
      if (isInviteError || payload?.message) {
        const message = payload.code === "INVITE_TIMEOUT" ? "No answer." : (payload.message || "Failed.");
        if (payload.code === "INVITE_TIMEOUT") {
          setInviteStates((prev) => {
            const next = { ...prev };
            for (const id of Object.keys(next)) {
              if (next[id].status === "ringing") next[id] = { status: "idle" };
            }
            return next;
          });
        } else {
          toast.error(message);
          setInviteStates((prev) => {
            const next = { ...prev };
            for (const id of Object.keys(next)) {
              if (next[id].status === "ringing") next[id] = { status: "error", errorMessage: message };
            }
            return next;
          });
          const timeout = setTimeout(() => {
            setInviteStates((prev) => {
              const next = { ...prev };
              for (const id of Object.keys(next)) {
                if (next[id].status === "error") next[id] = { status: "idle" };
              }
              return next;
            });
          }, 4000);
          errorTimeouts.current["_last"] = timeout;
        }
      }
    };
    socket.on("call:error", handleCallError);
    return () => {
      socket.off("call:error", handleCallError);
    };
  }, [socket]);

  const handleInvite = useCallback(
    (contact: Contact) => {
      if (!socket) return;
      const targetId = contact.userId;
      setInviteStates((prev) => ({ ...prev, [targetId]: { status: "ringing" } }));
      socket.emit("call:invite_participant", { targetId, roomId, callType });
      const sentTimeout = setTimeout(() => {
        setInviteStates((prev) => {
          if (prev[targetId]?.status === "ringing") return { ...prev, [targetId]: { status: "idle" } };
          return prev;
        });
      }, 46000);
      errorTimeouts.current[targetId] = sentTimeout;
    },
    [socket, roomId, callType],
  );

  if (!open) return null;

  const filteredContacts = contacts.filter((c) => {
    const isInRoom = participantIdentities.has(c.userId);
    const matchesSearch = search.trim() === "" || c.name.toLowerCase().includes(search.toLowerCase());
    return !isInRoom && matchesSearch;
  });

  // Group by letter
  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    const letter = contact.name.charAt(0).toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(contact);
    return acc;
  }, {} as Record<string, Contact[]>);
  const sortedLetters = Object.keys(groupedContacts).sort();

  return (
    <div className="w-[360px] h-full bg-white flex flex-col border-r border-[#E6EAFA] shrink-0 z-50">
      <div className="p-6 border-b border-transparent shrink-0">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[24px] font-bold text-[#3B58F5]">Add Friends</h1>
          <div className="flex items-center gap-4 text-[#8F95B2]">
            <Star className="h-5 w-5 text-[#F59E0B] fill-[#F59E0B]" />
            <Bell className="h-5 w-5 text-[#3B58F5]" />
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#B0B8D4]" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-11 pr-4 bg-[#F4F6FC] rounded-full text-[14px] font-medium text-[#1D2A54] placeholder-[#B0B8D4] focus:outline-none focus:ring-2 focus:ring-[#3B58F5]/20"
          />
        </div>
        
        <button className="h-8 px-4 bg-[#3B58F5] text-white rounded-full text-[13px] font-bold hover:bg-blue-600 transition-colors">
          From Contacts
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {contactsLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-[#3B58F5]" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-[#B0B8D4]">
            <p className="text-[14px] font-medium">{search ? "No matches found" : "All contacts are in call"}</p>
          </div>
        ) : (
          sortedLetters.map((letter) => (
            <div key={letter} className="mb-2">
              <div className="px-6 py-2 bg-[#F8FAFC] border-y border-[#E6EAFA] text-[13px] font-bold text-[#1D2A54]">
                {letter}
              </div>
              <ul className="py-1">
                {groupedContacts[letter].map((contact) => {
                  const avatarUrl = contact.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=3B58F5&color=fff`;
                  const state = inviteStates[contact.userId] ?? { status: "idle" };

                  return (
                    <li key={contact.userId} className="flex items-center justify-between px-6 py-3 hover:bg-[#F4F7FE] transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <img src={avatarUrl} alt={contact.name} className="h-10 w-10 rounded-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-bold text-[#1D2A54] truncate">{contact.name}</p>
                          <p className="text-[13px] font-medium text-[#8F95B2] truncate">
                            {contact.phone || "+1 (555) xxx-xxxx"}
                          </p>
                        </div>
                      </div>

                      {state.status === "ringing" ? (
                        <span className="text-[14px] font-bold text-amber-500">Ringing...</span>
                      ) : state.status === "sent" ? (
                        <span className="text-[14px] font-bold text-emerald-500">Sent</span>
                      ) : (
                        <button
                          onClick={() => handleInvite(contact)}
                          className="text-[14px] font-bold text-[#3B58F5] hover:text-blue-700 active:scale-95 transition-all"
                        >
                          Add
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
