"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  Building2,
  CheckCircle2,
  MessageSquare,
  User,
  Loader2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BusinessService } from "@/services/business.service";
import { CustomerService } from "@/services/customer-support.service";
import { chatService } from "@/services/chat.service";
import { useUser } from "@/context/UserContext";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Contact {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  isOnline: boolean;
  conversationId?: string;
}

interface BusinessResult {
  workspaceId: string;
  name: string;
  businessId: string; // the @handle
  isVerified: boolean;
  avatarUrl: string | null;
  description: string | null;
}

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-3 pt-3 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-[#8F95B2]">
      {label}
    </p>
  );
}

function ResultRow({
  leading,
  primary,
  secondary,
  badge,
  trailing,
  onClick,
  loading,
}: {
  leading: React.ReactNode;
  primary: string;
  secondary?: string;
  badge?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 hover:bg-[#F0F3FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B58F5] disabled:opacity-60"
    >
      <div className="shrink-0">{leading}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[14px] font-bold text-[#1D2A54] truncate">{primary}</span>
          {badge}
        </div>
        {secondary && (
          <p className="text-[12px] font-medium text-[#8F95B2] truncate">{secondary}</p>
        )}
      </div>
      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#3B58F5]" />
      ) : (
        <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {trailing ?? (
            <ArrowRight className="h-4 w-4 text-[#3B58F5]" />
          )}
        </div>
      )}
    </button>
  );
}

function Avatar({
  src,
  name,
  size = "md",
  verified = false,
}: {
  src: string | null;
  name: string;
  size?: "sm" | "md";
  verified?: boolean;
}) {
  const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const text = size === "sm" ? "text-[10px]" : "text-xs";
  return (
    <div className="relative">
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${dim} rounded-full object-cover border border-[#E6EAFA]`}
        />
      ) : (
        <div
          className={`${dim} rounded-full bg-gradient-to-br from-[#EEF2FB] to-[#DCE6FF] border border-[#3B58F5]/20 flex items-center justify-center ${text} font-bold text-[#3B58F5]`}
        >
          {name.substring(0, 2).toUpperCase()}
        </div>
      )}
      {verified && (
        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center border-2 border-white">
          <CheckCircle2 className="h-2.5 w-2.5 text-white fill-white" />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component: NewMessageModal
// ---------------------------------------------------------------------------

export function NewMessageModal({ isOpen, onClose }: NewMessageModalProps) {
  const router = useRouter();
  const { user } = useUser();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 280);

  // -- Contact state --
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [initiatingContactId, setInitiatingContactId] = useState<string | null>(null);

  // -- Business state --
  const [businesses, setBusinesses] = useState<BusinessResult[]>([]);
  const [bizLoading, setBizLoading] = useState(false);
  const [initiatingBizId, setInitiatingBizId] = useState<string | null>(null);

  // ── Reset when modal opens ─────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setContacts([]);
      setBusinesses([]);
      setTimeout(() => inputRef.current?.focus(), 80);
      // Pre-load the business directory so the list is ready instantly
      fetchAllBusinesses();
      fetchContacts();
    }
  }, [isOpen]);

  // ── Load full business directory (used as initial list + filter source) ───
  const fetchAllBusinesses = async () => {
    setBizLoading(true);
    try {
      const res = await BusinessService.getDirectory();
      if (res.success && res.data) {
        // Map the directory shape to BusinessResult (businessId is missing from
        // the directory endpoint, so we derive the handle from the name for now)
        setBusinesses(
          res.data.map((b) => ({
            workspaceId: b.workspaceId,
            name: b.name,
            businessId: b.workspaceId, // will be replaced by real handle below
            isVerified: b.isVerified,
            avatarUrl: b.avatarUrl,
            description: b.description,
          }))
        );
      }
    } catch {
      // Non-fatal
    } finally {
      setBizLoading(false);
    }
  };

  // ── Fetch contacts ──────────────────────────────────────────────────────────
  const fetchContacts = async () => {
    setContactsLoading(true);
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
          name:
            c.customName ||
            profile.displayName ||
            profile.username ||
            "Unknown",
          username: profile.username || "",
          avatarUrl: profile.avatarUrl || null,
          isOnline: profile.isOnline || false,
        };
      });
      setContacts(parsed);
    } catch {
      // Non-fatal
    } finally {
      setContactsLoading(false);
    }
  };

  // ── Filtered results (derived, no extra network calls needed) ─────────────
  const isBusinessQuery = debouncedQuery.startsWith("@");
  const normalQ = debouncedQuery.replace(/^@/, "").toLowerCase();

  const filteredContacts = contacts.filter(
    (c) =>
      !isBusinessQuery &&
      (c.name.toLowerCase().includes(normalQ) ||
        c.username.toLowerCase().includes(normalQ))
  );

  const filteredBusinesses = businesses.filter(
    (b) =>
      b.name.toLowerCase().includes(normalQ) ||
      b.businessId.toLowerCase().includes(normalQ) ||
      (b.description || "").toLowerCase().includes(normalQ)
  );

  const showAll = debouncedQuery === "";

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSelectContact = async (contact: Contact) => {
    if (initiatingContactId) return;
    setInitiatingContactId(contact.id);
    try {
      const res = await chatService.initiateConversation(contact.id);
      const convId = res?.data?.conversationId ?? res?.conversationId ?? res?.data?.id;
      if (convId) {
        onClose();
        router.push(`/chats/${convId}?recipientId=${contact.id}`);
      } else {
        toast.error("Could not start conversation.");
      }
    } catch {
      toast.error("Failed to start chat.");
    } finally {
      setInitiatingContactId(null);
    }
  };

  /**
   * When a business is selected, we call contactBusiness which creates the
   * Ticket + Conversation atomically and returns the conversationId.
   * The user is then routed to the existing chat page — it renders identically
   * to a normal DM because the Message record has a real conversationId.
   */
  const handleSelectBusiness = async (biz: BusinessResult) => {
    if (initiatingBizId) return;
    setInitiatingBizId(biz.workspaceId);
    try {
      // Use a placeholder greeting so we never send an empty first message.
      // The actual message UI will be in the chat window immediately after.
      const placeholder = "👋 Hi! I'd like to get in touch.";
      const res = await CustomerService.contactBusiness(biz.businessId, placeholder);
      if (res.success && res.data?.conversationId) {
        toast.success(`Connected to ${biz.name}!`);
        onClose();
        router.push(
          `/chats/${res.data.conversationId}?recipientId=&bizHandle=${encodeURIComponent(biz.businessId)}&bizName=${encodeURIComponent(biz.name)}&bizVerified=${biz.isVerified}`
        );
      } else {
        toast.error("Could not connect to business.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Failed to contact business.");
    } finally {
      setInitiatingBizId(null);
    }
  };

  // ── Keyboard shortcut: Escape closes ──────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // ── Section visibility ─────────────────────────────────────────────────────
  const showContacts = !isBusinessQuery && filteredContacts.length > 0;
  const showBusinesses = filteredBusinesses.length > 0;
  const isEmpty = !showContacts && !showBusinesses && !contactsLoading && !bizLoading;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-[#1D2A54]/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -16 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-[12%] z-50 w-full max-w-[560px] -translate-x-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl border border-[#E6EAFA] flex flex-col"
            style={{ maxHeight: "76vh" }}
          >
            {/* ── Search Input ─────────────────────────────────────────── */}
            <div className="flex items-center gap-3 border-b border-[#E6EAFA] px-4 py-3.5">
              <Search className="h-5 w-5 shrink-0 text-[#8F95B2]" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search contacts or type @handle to find a business…"
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
              <button
                onClick={onClose}
                className="shrink-0 rounded-full p-1.5 text-[#8F95B2] hover:bg-[#F4F6FC] hover:text-[#1D2A54] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ── @-hint banner ─────────────────────────────────────────── */}
            <AnimatePresence>
              {!isBusinessQuery && query === "" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#EEF2FF] to-[#F0F9FF] px-4 py-2.5 text-[12px] font-semibold text-[#3B58F5] border-b border-[#E6EAFA]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>
                    Tip: Type <kbd className="font-mono bg-[#3B58F5]/10 px-1.5 py-0.5 rounded text-[11px]">@handle</kbd> to find and message a business directly
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Results ───────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto py-2 px-2">
              {/* Loading skeletons */}
              {(contactsLoading || bizLoading) && query === "" ? (
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
              ) : isEmpty ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F4F6FC] mb-3">
                    <Search className="h-6 w-6 text-[#B0B8D4]" />
                  </div>
                  <p className="text-[14px] font-bold text-[#1D2A54]">No results found</p>
                  <p className="mt-1 text-[12px] text-[#8F95B2] max-w-xs">
                    {isBusinessQuery
                      ? `No business found matching "@${normalQ}". Check the handle and try again.`
                      : `No contacts matching "${query}". Try @handle to search businesses.`}
                  </p>
                </div>
              ) : (
                <>
                  {/* Contacts section */}
                  {showContacts && (
                    <div>
                      <SectionLabel label="Contacts" />
                      {filteredContacts.slice(0, 6).map((c) => (
                        <ResultRow
                          key={c.id}
                          leading={
                            <div className="relative">
                              <Avatar src={c.avatarUrl} name={c.name} />
                              {c.isOnline && (
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white" />
                              )}
                            </div>
                          }
                          primary={c.name}
                          secondary={c.username ? `@${c.username}` : undefined}
                          onClick={() => handleSelectContact(c)}
                          loading={initiatingContactId === c.id}
                          trailing={<MessageSquare className="h-4 w-4 text-[#3B58F5]" />}
                        />
                      ))}
                    </div>
                  )}

                  {/* Businesses section */}
                  {showBusinesses && (
                    <div>
                      <SectionLabel
                        label={isBusinessQuery ? `Businesses matching "@${normalQ}"` : "Businesses"}
                      />
                      {filteredBusinesses.slice(0, 8).map((b) => (
                        <ResultRow
                          key={b.workspaceId}
                          leading={
                            <Avatar
                              src={b.avatarUrl}
                              name={b.name}
                              verified={b.isVerified}
                            />
                          }
                          primary={b.name}
                          secondary={b.description?.substring(0, 55) || "Official Business Workspace"}
                          badge={
                            b.isVerified ? (
                              <span className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold border border-blue-200 shrink-0">
                                <CheckCircle2 className="h-2.5 w-2.5 fill-blue-600 text-white" />
                                Verified
                              </span>
                            ) : undefined
                          }
                          onClick={() => handleSelectBusiness(b)}
                          loading={initiatingBizId === b.workspaceId}
                          trailing={<Building2 className="h-4 w-4 text-[#3B58F5]" />}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Footer ────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between border-t border-[#E6EAFA] bg-[#F8FAFC] px-5 py-3">
              <div className="flex items-center gap-3 text-[11px] font-semibold text-[#B0B8D4]">
                <span className="flex items-center gap-1">
                  <kbd className="font-mono bg-white border border-[#E6EAFA] rounded px-1">↑↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="font-mono bg-white border border-[#E6EAFA] rounded px-1">↵</kbd>
                  select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="font-mono bg-white border border-[#E6EAFA] rounded px-1">esc</kbd>
                  close
                </span>
              </div>
              <span className="text-[11px] font-bold text-[#3B58F5]">
                {contacts.length} contacts · {businesses.length} businesses
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
