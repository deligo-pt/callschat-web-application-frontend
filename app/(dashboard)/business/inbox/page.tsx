"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SupportService, Ticket, TicketStatus, InternalNote } from "@/services/support.service";
import { useUser } from "@/context/UserContext";
import { useSocket } from "@/components/providers/SocketProvider";
import { TicketListPane } from "@/components/business/inbox/TicketListPane";
import { ThreadPane } from "@/components/business/inbox/ThreadPane";
import { MetaPane } from "@/components/business/inbox/MetaPane";
import { decryptMessage } from "@/utils/crypto";
import { chatService } from "@/services/chat.service";

// ---------------------------------------------------------------------------
// Types shared across panes
// ---------------------------------------------------------------------------
export type InboxFilter = "all" | "unassigned" | "mine" | "closed";

export type ThreadMessage =
  | { kind: "note"; data: InternalNote }
  | { kind: "message"; data: { id: string; senderId: string; ciphertext: string | null; mediaType: string | null; createdAt: string } };

/**
 * Resolves the display text for a ticket thread message.
 *
 * B2C support messages are stored as PLAINTEXT in the `ciphertext` / `content`
 * column and are protected by TLS in transit and DB-level encryption at rest.
 * Client-side libsodium E2EE is intentionally NOT used for ticket messages
 * because: (a) multiple agents need to read them, and (b) the Automation Engine
 * reads the raw text to evaluate auto-reply rules.
 *
 * Rule:
 *   - If `isEncrypted === false`  → return content directly (no decryption).
 *   - If `nonce` is null/absent   → return ciphertext directly (plaintext path).
 *   - Otherwise                   → attempt libsodium decryption (P2P chat path,
 *                                   should never happen for ticket messages).
 */
async function resolveTicketMessageText(
  item: {
    content?: string | null;
    ciphertext?: string | null;
    nonce?: string | null;
    isEncrypted?: boolean;
  },
  peerUserId?: string,
  currentUserId?: string,
): Promise<string> {
  // Fast-path 0: legacy encrypted message (old row with real nonce, encrypted by
  // mistake via WebSocket before the plaintext-only B2C path was enforced).
  // The dummy key pair used then is unrecoverable on the business side.
  // Show a human-readable placeholder rather than garbled base64.
  if (item.isEncrypted === true) {
    return "[Message sent before encryption bypass — not readable]";
  }

  // Fast-path 1: backend explicitly declared this is not E2EE-encrypted.
  if (item.isEncrypted === false) {
    return item.content ?? item.ciphertext ?? "";
  }

  // Fast-path 2: no nonce means the ciphertext column holds plaintext.
  if (!item.nonce) {
    return item.ciphertext ?? item.content ?? "";
  }

  // Slow-path: this message was encrypted with libsodium (P2P chat overlap).
  // This should not normally occur for ticket messages but is handled
  // defensively to avoid a blank UI.
  if (!item.ciphertext || !peerUserId) return item.ciphertext ?? "";

  let myPriv: string | null = null;
  if (typeof window !== "undefined") {
    if (currentUserId) myPriv = localStorage.getItem(`privateKey_${currentUserId}`);
    if (!myPriv) myPriv = localStorage.getItem("privateKey");
    if (!myPriv) myPriv = localStorage.getItem("chat_private_key");
  }
  if (!myPriv) return item.ciphertext;

  try {
    const res = await chatService.fetchRecipientKey(peerUserId);
    let pubKeys: string[] = [];
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      pubKeys = res.data.map((k: any) => k.publicKey).reverse();
    } else if (res?.success && res?.data?.publicKey) {
      pubKeys = [res.data.publicKey];
    }
    for (const pubKey of pubKeys) {
      if (!pubKey) continue;
      try {
        const decrypted = await decryptMessage(item.ciphertext, item.nonce, pubKey, myPriv);
        if (decrypted) return decrypted;
      } catch {
        // try next key
      }
    }
  } catch (e) {
    console.warn("[Inbox] Fallback decryption attempt failed:", e);
  }
  return item.ciphertext;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function InboxPage() {
  const { user, workspace } = useUser();
  const { socket, isConnected } = useSocket();

  // --- Ticket List State ---
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<InboxFilter>("all");
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  // --- Thread State ---
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);

  // --- Compose State ---
  const [composeMode, setComposeMode] = useState<"reply" | "note">("reply");
  const [composeText, setComposeText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // --- Meta State ---
  const [metaLoading, setMetaLoading] = useState(false);

  const threadEndRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // Fetch inbox
  // ---------------------------------------------------------------------------
  const fetchInbox = useCallback(async () => {
    setTicketsLoading(true);
    try {
      const filters: Parameters<typeof SupportService.getInbox>[0] = {};
      if (activeFilter === "mine" && user?.id) filters.assignedTo = user.id;
      if (activeFilter === "closed") filters.status = "CLOSED";

      const res = await SupportService.getInbox(filters);
      if (res.success) {
        let data = res.data;
        if (activeFilter === "unassigned") {
          data = data.filter((t) => t.assignedAgentId === null && t.status !== "CLOSED");
        }
        for (const t of data) {
          if (t.lastMessage) {
            // B2C ticket previews are always plaintext — read content directly,
            // never attempt libsodium decryption.
            if (t.lastMessage.isEncrypted === false || !t.lastMessage.nonce) {
              t.lastMessage.ciphertext = t.lastMessage.content ?? t.lastMessage.ciphertext ?? "";
            }
          }
        }
        setTickets(data);
      }
    } catch {
      toast.error("Failed to load inbox.");
    } finally {
      setTicketsLoading(false);
    }
  }, [activeFilter, user?.id]);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  // Join workspace room for socket events
  useEffect(() => {
    if (socket && isConnected && workspace?.id) {
      socket.emit("business:join_workspace", { workspaceId: workspace.id });
    }
  }, [socket, isConnected, workspace?.id]);

  // Listen for NEW_TICKET_MESSAGE
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewTicketMessage = async (payload: any) => {
      // payload could be the result from contactBusiness or chat.gateway
      const ticketId = payload.ticketId || payload.message?.ticketId;
      const msg = payload.message;
      if (!ticketId || !msg) return;

      // B2C ticket messages are always plaintext — no libsodium decryption.
      // Use content directly; nonce is always null for ticket messages.
      let decryptedText = msg.content ?? msg.ciphertext ?? "";
      if (msg.isEncrypted !== false && msg.nonce) {
        // Defensive: if somehow a nonce crept in, try to resolve it
        // but this should never happen for properly sent ticket messages.
        const peerId = msg.senderId === user?.id ? payload.customerId : msg.senderId;
        decryptedText = await resolveTicketMessageText(
          { content: msg.content, ciphertext: msg.ciphertext, nonce: msg.nonce, isEncrypted: msg.isEncrypted },
          peerId,
          user?.id,
        );
      }

      // Update thread if it's the active ticket
      if (activeTicketId === ticketId) {
        setThread((prev) => {
          if (prev.some((m) => m.kind === "message" && m.data.id === msg.id)) return prev;
          return [
            ...prev,
            {
              kind: "message",
              data: {
                id: msg.id,
                senderId: msg.senderId,
                ciphertext: decryptedText,
                mediaType: msg.mediaType || null,
                createdAt: msg.createdAt,
              },
            },
          ];
        });
      }

      // Update the ticket list with the latest message
      let needsRefetch = false;
      setTickets((prev) => {
        const ticketIdx = prev.findIndex((t) => t.id === ticketId);
        if (ticketIdx > -1) {
          const updated = [...prev];
          updated[ticketIdx] = {
            ...updated[ticketIdx],
            lastMessage: {
              id: msg.id,
              senderId: msg.senderId,
              ciphertext: msg.ciphertext ?? null,
              preview: decryptedText?.substring(0, 80) || "",
              mediaType: msg.mediaType || null,
              createdAt: msg.createdAt,
              fromCustomer: msg.senderId !== user?.id,
            },
          };
          // Move to top
          const [t] = updated.splice(ticketIdx, 1);
          return [t, ...updated];
        } else if (activeFilter === "all" || activeFilter === "unassigned") {
          // If we don't have it, flag it to fetch after state update
          needsRefetch = true;
        }
        return prev;
      });

      if (needsRefetch) {
        fetchInbox();
      }
    };

    socket.on("NEW_TICKET_MESSAGE", handleNewTicketMessage);
    return () => {
      socket.off("NEW_TICKET_MESSAGE", handleNewTicketMessage);
    };
  }, [socket, isConnected, activeTicketId, user?.id, activeFilter, fetchInbox]);

  // Reset thread when ticket changes
  useEffect(() => {
    if (!activeTicketId) return;
    setThread([]);
    setThreadLoading(true);
    setComposeMode("reply");
    setComposeText("");

    let isMounted = true;
    const loadThread = async () => {
      try {
        const res = await SupportService.getTicketMessages(activeTicketId);
        if (!res.success) {
          throw new Error("Failed to fetch ticket messages");
        }
        if (isMounted) {
          const items: ThreadMessage[] = [];
          for (const item of res.data) {
            if (item.type === "note") {
              items.push({
                kind: "note",
                data: {
                  id: item.id,
                  ticketId: activeTicketId,
                  authorId: item.senderId,
                  content: item.content,
                  createdAt: item.createdAt,
                },
              });
            } else {
              const decryptedText = await resolveTicketMessageText(
                {
                  content: item.content,
                  ciphertext: item.ciphertext,
                  nonce: item.nonce,
                  // isEncrypted from backend signals this is a plaintext B2C message
                  isEncrypted: item.isEncrypted,
                },
                // peerUserId / currentUserId only matter for the slow P2P path,
                // which should never trigger for ticket messages.
                undefined,
                user?.id,
              );
              items.push({
                kind: "message",
                data: {
                  id: item.id,
                  senderId: item.senderId,
                  ciphertext: decryptedText,
                  mediaType: item.mediaType,
                  createdAt: item.createdAt,
                },
              });
            }
          }
          setThread(items);
        }
      } catch (err) {
        console.error("Failed to fetch ticket messages", err);
        if (isMounted) {
          setActiveTicketId(null);
          toast.error("Failed to load ticket messages.");
        }
      } finally {
        if (isMounted) {
          setThreadLoading(false);
        }
      }
    };

    loadThread();
    return () => { isMounted = false; };
  }, [activeTicketId]);

  // Scroll to thread bottom when new messages arrive
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  // ---------------------------------------------------------------------------
  // Active ticket derived value
  // ---------------------------------------------------------------------------
  const activeTicket = tickets.find((t) => t.id === activeTicketId) ?? null;

  // ---------------------------------------------------------------------------
  // Optimistic: patch a ticket in state list
  // ---------------------------------------------------------------------------
  const patchTicket = useCallback((ticketId: string, patch: Partial<Ticket>) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, ...patch } : t))
    );
  }, []);

  // Remove from list (used when filtered view no longer matches)
  const removeTicket = useCallback((ticketId: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    setActiveTicketId((prev) => (prev === ticketId ? null : prev));
  }, []);

  // ---------------------------------------------------------------------------
  // Handler: Assign ticket
  // ---------------------------------------------------------------------------
  const handleAssign = useCallback(async (ticketId: string, agentId: string) => {
    setMetaLoading(true);
    // Optimistic update
    patchTicket(ticketId, { assignedAgentId: agentId });
    try {
      const res = await SupportService.assignTicket(ticketId, agentId);
      if (res.success) {
        patchTicket(ticketId, res.data);
        toast.success("Ticket assigned successfully.");
        // If we're in "unassigned" filter, remove it from view
        if (activeFilter === "unassigned") {
          setTimeout(() => removeTicket(ticketId), 400);
        }
      }
    } catch {
      toast.error("Failed to assign ticket.");
      fetchInbox(); // revert
    } finally {
      setMetaLoading(false);
    }
  }, [patchTicket, removeTicket, fetchInbox, activeFilter]);

  // ---------------------------------------------------------------------------
  // Handler: Update status
  // ---------------------------------------------------------------------------
  const handleStatusChange = useCallback(async (ticketId: string, status: TicketStatus) => {
    setMetaLoading(true);
    patchTicket(ticketId, { status });
    try {
      const res = await SupportService.updateTicketStatus(ticketId, status);
      if (res.success) {
        patchTicket(ticketId, res.data);
        toast.success(`Ticket marked as ${status}.`);
        // Remove from view if closed and not in "closed" filter
        if (status === "CLOSED" && activeFilter !== "closed") {
          setTimeout(() => removeTicket(ticketId), 400);
        }
      }
    } catch {
      toast.error("Failed to update status.");
      fetchInbox();
    } finally {
      setMetaLoading(false);
    }
  }, [patchTicket, removeTicket, fetchInbox, activeFilter]);

  // ---------------------------------------------------------------------------
  // Handler: Send reply / internal note
  // ---------------------------------------------------------------------------
  const handleComposeSend = useCallback(async () => {
    if (!composeText.trim() || !activeTicketId) return;
    const text = composeText.trim();
    setComposeText("");
    setSubmitting(true);

    if (composeMode === "note") {
      // Optimistic note
      const optimisticNote: InternalNote = {
        id: `optimistic-${Date.now()}`,
        ticketId: activeTicketId,
        authorId: user?.id ?? "",
        content: text,
        createdAt: new Date().toISOString(),
      };
      setThread((prev) => [...prev, { kind: "note", data: optimisticNote }]);
      try {
        const res = await SupportService.createInternalNote(activeTicketId, text);
        if (res.success) {
          setThread((prev) =>
            prev.map((m) =>
              m.kind === "note" && m.data.id === optimisticNote.id
                ? { kind: "note", data: res.data }
                : m
            )
          );
          toast.success("Internal note added.");
        }
      } catch {
        toast.error("Failed to save internal note.");
        setThread((prev) => prev.filter((m) => !(m.kind === "note" && m.data.id === optimisticNote.id)));
      }
    } else {
      // Agent reply — use the dedicated replyToTicket endpoint.
      // The backend resolves the linked conversation and delivers
      // the message directly into the customer's chat thread.
      const optimisticMsg: ThreadMessage = {
        kind: "message",
        data: {
          id: `optimistic-${Date.now()}`,
          senderId: user?.id ?? "",
          ciphertext: text,
          mediaType: null,
          createdAt: new Date().toISOString(),
        },
      };
      setThread((prev) => [...prev, optimisticMsg]);

      try {
        const res = await SupportService.replyToTicket(activeTicketId, text);
        if (res.success) {
          // Replace the optimistic placeholder with the confirmed message
          setThread((prev) =>
            prev.map((m) =>
              m.kind === "message" && m.data.id === optimisticMsg.data.id
                ? {
                    kind: "message",
                    data: {
                      id: res.data.id,
                      senderId: res.data.senderId,
                      ciphertext: res.data.ciphertext ?? text,
                      mediaType: null,
                      createdAt: res.data.createdAt,
                    },
                  }
                : m
            )
          );
          toast.success("Reply sent.");
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.error?.message || "Failed to send reply.");
        // Roll back the optimistic message on failure
        setThread((prev) =>
          prev.filter((m) => !(m.kind === "message" && m.data.id === optimisticMsg.data.id))
        );
      }
    }
    setSubmitting(false);
  }, [composeText, composeMode, activeTicketId, user?.id]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex h-full w-full overflow-hidden bg-[#F8FAFC]">
      {/* LEFT PANE */}
      <TicketListPane
        tickets={tickets}
        loading={ticketsLoading}
        activeFilter={activeFilter}
        onFilterChange={(f) => { setActiveFilter(f); setActiveTicketId(null); }}
        activeTicketId={activeTicketId}
        onSelectTicket={setActiveTicketId}
        currentUserId={user?.id ?? ""}
      />

      {/* CENTER PANE */}
      <ThreadPane
        ticket={activeTicket}
        thread={thread}
        threadLoading={threadLoading}
        threadEndRef={threadEndRef}
        composeMode={composeMode}
        onComposeModeChange={setComposeMode}
        composeText={composeText}
        onComposeTextChange={setComposeText}
        onSend={handleComposeSend}
        submitting={submitting}
        currentUserId={user?.id ?? ""}
      />

      {/* RIGHT PANE */}
      <MetaPane
        ticket={activeTicket}
        loading={metaLoading}
        workspaceId={workspace?.id ?? ""}
        onAssign={handleAssign}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
