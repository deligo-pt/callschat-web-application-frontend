"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Inbox, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Ticket } from "@/services/support.service";
import type { InboxFilter } from "@/app/(dashboard)/business/inbox/page";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function relativeTime(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "";
  }
}

const PRIORITY_CLASSES: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-slate-100 text-slate-600",
};

const STATUS_CLASSES: Record<string, string> = {
  OPEN: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-blue-100 text-blue-700",
  CLOSED: "bg-slate-100 text-slate-500",
};

const FILTERS: { key: InboxFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unassigned", label: "Unassigned" },
  { key: "mine", label: "Mine" },
  { key: "closed", label: "Closed" },
];

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function TicketSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-3 border-b border-[#E6EAFA] animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-slate-200 shrink-0" />
        <div className="flex-1 space-y-1">
          <div className="h-3 w-2/3 rounded bg-slate-200" />
          <div className="h-2.5 w-1/3 rounded bg-slate-100" />
        </div>
      </div>
      <div className="h-2.5 w-full rounded bg-slate-100" />
      <div className="h-2.5 w-3/4 rounded bg-slate-100" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ticket Card
// ---------------------------------------------------------------------------
interface TicketCardProps {
  ticket: Ticket;
  isActive: boolean;
  onSelect: () => void;
  currentUserId: string;
}

function TicketCard({ ticket, isActive, onSelect, currentUserId }: TicketCardProps) {
  const initial = ticket.customer.name?.charAt(0).toUpperCase() ?? "?";
  const snippet = ticket.lastMessage?.ciphertext?.slice(0, 72) ?? "No messages yet";
  const isMine = ticket.assignedAgentId === currentUserId;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left flex flex-col gap-1.5 px-3 py-3 border-b border-[#E6EAFA] transition-all duration-150 focus:outline-none",
        isActive
          ? "bg-purple-50 border-l-2 border-l-purple-500"
          : "hover:bg-[#F4F6FC] border-l-2 border-l-transparent"
      )}
    >
      {/* Row 1: Avatar + Name + Time */}
      <div className="flex items-center gap-2">
        {ticket.customer.avatarUrl ? (
          <img
            src={ticket.customer.avatarUrl}
            alt={ticket.customer.name}
            className="h-8 w-8 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white text-xs font-bold">
            {initial}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-[#11142D] truncate">{ticket.customer.name}</p>
          <p className="text-[10px] font-medium text-[#8F95B2]">
            {relativeTime(ticket.updatedAt)}
          </p>
        </div>
        {isMine && (
          <span className="shrink-0 text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full border border-purple-200">
            Mine
          </span>
        )}
      </div>

      {/* Row 2: Message snippet */}
      <p className="text-[11px] font-medium text-[#6B7280] line-clamp-2 pl-10">{snippet}</p>

      {/* Row 3: Badges */}
      <div className="flex items-center gap-1.5 pl-10 flex-wrap">
        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", PRIORITY_CLASSES[ticket.priority] ?? "bg-slate-100 text-slate-500")}>
          {ticket.priority}
        </span>
        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", STATUS_CLASSES[ticket.status] ?? "bg-slate-100 text-slate-500")}>
          {ticket.status}
        </span>
        {ticket.tags.slice(0, 2).map((tag) => (
          <span
            key={tag.id}
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
            style={{ backgroundColor: tag.colorCode }}
          >
            {tag.name}
          </span>
        ))}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// TicketListPane
// ---------------------------------------------------------------------------
interface TicketListPaneProps {
  tickets: Ticket[];
  loading: boolean;
  activeFilter: InboxFilter;
  onFilterChange: (f: InboxFilter) => void;
  activeTicketId: string | null;
  onSelectTicket: (id: string) => void;
  currentUserId: string;
}

export function TicketListPane({
  tickets,
  loading,
  activeFilter,
  onFilterChange,
  activeTicketId,
  onSelectTicket,
  currentUserId,
}: TicketListPaneProps) {
  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-[#E6EAFA] bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[#E6EAFA]">
        <div className="flex items-center gap-2 mb-3">
          <Inbox className="h-4 w-4 text-purple-600" />
          <h2 className="text-sm font-bold text-[#11142D]">Support Inbox</h2>
        </div>

        {/* Filter tabs */}
        <div className="grid grid-cols-4 gap-0.5 rounded-lg bg-[#F4F6FC] p-0.5">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onFilterChange(key)}
              className={cn(
                "py-1 rounded-md text-[10px] font-bold transition-all duration-150",
                activeFilter === key
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-[#8F95B2] hover:text-[#11142D]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <TicketSkeleton key={i} />)
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
            <User className="h-8 w-8 text-[#D1D5DB]" />
            <p className="text-xs font-semibold text-[#9CA3AF]">No tickets in this view</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              isActive={ticket.id === activeTicketId}
              onSelect={() => onSelectTicket(ticket.id)}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>

      {/* Footer count */}
      {!loading && (
        <div className="px-4 py-2 border-t border-[#E6EAFA]">
          <p className="text-[10px] font-semibold text-[#9CA3AF]">
            {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </aside>
  );
}
