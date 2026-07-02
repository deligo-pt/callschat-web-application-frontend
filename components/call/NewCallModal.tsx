"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Phone, Video, Loader2 } from "lucide-react";
import { useCallContext } from "@/components/providers/CallContext";

interface Contact {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  isOnline: boolean;
}

interface NewCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callType: "AUDIO" | "VIDEO";
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function NewCallModal({ isOpen, onClose, callType }: NewCallModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { initiateCall } = useCallContext();

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 280);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setContacts([]);
      setTimeout(() => inputRef.current?.focus(), 80);
      fetchContacts();
    }
  }, [isOpen]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1";
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const res = await fetch(`${baseUrl}/contacts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const arr =
        data.data?.contacts ||
        (Array.isArray(data.data) ? data.data : []) ||
        (Array.isArray(data) ? data : []);

      const parsed: Contact[] = arr.map((c: any) => {
        const peer = c.addressee || c.contact || c;
        const profile = peer.profile || c.profile || {};
        return {
          id: peer.id || c.id,
          name: c.customName || profile.displayName || profile.username || "Unknown",
          username: profile.username || "",
          avatarUrl: profile.avatarUrl || null,
          isOnline: profile.isOnline || false,
        };
      });
      const uniqueContacts = Array.from(new Map(parsed.map((c) => [c.id, c])).values());
      setContacts(uniqueContacts);
    } catch {
      // Non-fatal
    } finally {
      setLoading(false);
    }
  };

  const normalQ = debouncedQuery.toLowerCase();
  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(normalQ) ||
      c.username.toLowerCase().includes(normalQ)
  );

  const handleSelectContact = (contact: Contact) => {
    initiateCall(contact.id, callType, contact.name, contact.avatarUrl || undefined);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-[#1D2A54]/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -16 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-[12%] z-[100] w-full max-w-[560px] -translate-x-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl border border-[#E6EAFA] flex flex-col"
            style={{ maxHeight: "76vh" }}
          >
            <div className="flex items-center justify-between border-b border-[#E6EAFA] px-4 py-3 bg-[#F8FAFC]">
              <h2 className="text-[16px] font-bold text-[#1D2A54]">
                Start {callType === "VIDEO" ? "Video" : "Audio"} Call
              </h2>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-[#8F95B2] hover:bg-[#F4F6FC] hover:text-[#1D2A54] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 border-b border-[#E6EAFA] px-4 py-3.5">
              <Search className="h-5 w-5 shrink-0 text-[#8F95B2]" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search contacts to call..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-[15px] font-medium text-[#1D2A54] placeholder-[#B0B8D4] outline-none"
                autoComplete="off"
                spellCheck={false}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="shrink-0 rounded-full p-1 text-[#8F95B2] hover:bg-[#F4F6FC] hover:text-[#1D2A54] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto py-2 px-2">
              {loading && query === "" ? (
                <div className="flex flex-col gap-2 p-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="h-10 w-10 rounded-full bg-slate-100 shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-32 rounded bg-slate-100" />
                        <div className="h-2.5 w-20 rounded bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F4F6FC] mb-3">
                    <Search className="h-6 w-6 text-[#B0B8D4]" />
                  </div>
                  <p className="text-[14px] font-bold text-[#1D2A54]">No contacts found</p>
                  <p className="mt-1 text-[12px] text-[#8F95B2] max-w-xs">
                    Try searching with a different name.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {filteredContacts.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectContact(c)}
                      className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 hover:bg-[#F0F3FF] focus:outline-none"
                    >
                      <div className="relative shrink-0">
                        {c.avatarUrl ? (
                          <img
                            src={c.avatarUrl}
                            alt={c.name}
                            className="h-10 w-10 rounded-full object-cover border border-[#E6EAFA]"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#EEF2FB] to-[#DCE6FF] border border-[#3B58F5]/20 flex items-center justify-center text-xs font-bold text-[#3B58F5]">
                            {c.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        {c.isOnline && (
                          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[14px] font-bold text-[#1D2A54] truncate block">
                          {c.name}
                        </span>
                        {c.username && (
                          <p className="text-[12px] font-medium text-[#8F95B2] truncate">
                            @{c.username}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {callType === "VIDEO" ? (
                          <Video className="h-4 w-4 text-[#3B58F5]" />
                        ) : (
                          <Phone className="h-4 w-4 text-[#3B58F5]" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
