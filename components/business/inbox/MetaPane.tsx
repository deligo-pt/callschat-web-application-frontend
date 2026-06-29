"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Loader2, Tag, UserCheck, ChevronDown, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Ticket, TicketStatus } from "@/services/support.service";
import { WorkspaceService } from "@/services/workspace.service";
import apiClient from "@/services/api.client";

// ---------------------------------------------------------------------------
// Workspace members helper type
// ---------------------------------------------------------------------------
interface WorkspaceMember {
  id: string;
  userId: string;
  role: string;
  user?: {
    id: string;
    profile?: { displayName?: string; username?: string; avatarUrl?: string | null };
  };
}

// ---------------------------------------------------------------------------
// StatusDropdown
// ---------------------------------------------------------------------------
const STATUS_OPTIONS: TicketStatus[] = ["OPEN", "PENDING", "CLOSED"];

const STATUS_STYLES: Record<TicketStatus, string> = {
  OPEN: "bg-emerald-100 text-emerald-700 border-emerald-200",
  PENDING: "bg-blue-100 text-blue-700 border-blue-200",
  CLOSED: "bg-slate-100 text-slate-500 border-slate-200",
};

function StatusDropdown({
  current,
  disabled,
  onChange,
}: {
  current: TicketStatus;
  disabled: boolean;
  onChange: (s: TicketStatus) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition-all focus:outline-none",
          STATUS_STYLES[current],
          disabled && "opacity-60 cursor-not-allowed"
        )}
      >
        {current}
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#E6EAFA] bg-white shadow-lg overflow-hidden">
          {STATUS_OPTIONS.filter((s) => s !== current).map((s) => (
            <button
              key={s}
              onClick={() => { onChange(s); setOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-2 text-xs font-bold transition-colors hover:bg-[#F4F6FC]",
                STATUS_STYLES[s]
              )}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AgentAssignDropdown
// ---------------------------------------------------------------------------
function AgentAssignDropdown({
  members,
  currentAgentId,
  disabled,
  onAssign,
}: {
  members: WorkspaceMember[];
  currentAgentId: string | null;
  disabled: boolean;
  onAssign: (userId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = members.filter((m) => {
    const name =
      m.user?.profile?.displayName ?? m.user?.profile?.username ?? m.userId;
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const currentMember = members.find((m) => m.userId === currentAgentId);
  const currentLabel = currentMember
    ? (currentMember.user?.profile?.displayName ??
      currentMember.user?.profile?.username ??
      "Agent")
    : "Unassigned";

  return (
    <div className="relative">
      <button
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-[#E6EAFA] bg-[#F8FAFC] px-3 py-2 text-xs font-bold text-[#1D2A54] transition-all hover:border-purple-300 focus:outline-none",
          disabled && "opacity-60 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <UserCheck className="h-3 w-3 text-purple-500 shrink-0" />
          <span className="truncate">{currentLabel}</span>
        </div>
        <ChevronDown className={cn("h-3 w-3 shrink-0 text-[#8F95B2] transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#E6EAFA] bg-white shadow-xl overflow-hidden">
          <div className="p-2 border-b border-[#E6EAFA]">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agents…"
              className="w-full rounded-md border border-[#E6EAFA] bg-[#F8FAFC] px-2 py-1.5 text-xs outline-none focus:border-purple-400"
            />
          </div>
          <div className="max-h-40 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-[11px] text-[#9CA3AF]">No agents found</p>
            ) : (
              filtered.map((m) => {
                const name =
                  m.user?.profile?.displayName ??
                  m.user?.profile?.username ??
                  m.userId;
                const isSelected = m.userId === currentAgentId;
                return (
                  <button
                    key={m.userId}
                    onClick={() => { onAssign(m.userId); setOpen(false); setSearch(""); }}
                    className={cn(
                      "w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-colors hover:bg-purple-50",
                      isSelected && "bg-purple-50 text-purple-700"
                    )}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-[9px] font-bold">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate">{name}</span>
                    <span className="ml-auto text-[9px] text-[#9CA3AF]">{m.role}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MetaPane
// ---------------------------------------------------------------------------
interface MetaPaneProps {
  ticket: Ticket | null;
  loading: boolean;
  workspaceId: string;
  onAssign: (ticketId: string, agentId: string) => void;
  onStatusChange: (ticketId: string, status: TicketStatus) => void;
}

export function MetaPane({
  ticket,
  loading,
  workspaceId,
  onAssign,
  onStatusChange,
}: MetaPaneProps) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!workspaceId) return;
    setMembersLoading(true);
    try {
      const res = await apiClient.get(`/business/workspaces/me`);
      // Workspace service doesn't expose members list directly yet.
      // We use the workspace data and attempt a members endpoint if available.
      // Graceful fallback: empty list shown.
      const data = res.data;
      if (data?.success && Array.isArray(data?.data?.members)) {
        setMembers(data.data.members);
      }
    } catch {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  if (!ticket) {
    return (
      <aside className="flex h-full w-[260px] shrink-0 flex-col items-center justify-center gap-2 bg-white p-6 text-center">
        <Settings2 className="h-8 w-8 text-[#D1D5DB]" />
        <p className="text-xs font-semibold text-[#9CA3AF]">Select a ticket to view details</p>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col overflow-y-auto bg-white border-l border-[#E6EAFA]">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[#E6EAFA] shrink-0">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-purple-600" />
          <h3 className="text-xs font-bold text-[#11142D] uppercase tracking-wide">Ticket Details</h3>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-4">
        {/* Customer Info */}
        <section>
          <p className="text-[10px] font-bold text-[#8F95B2] uppercase tracking-wide mb-2">Customer</p>
          <div className="flex items-center gap-2">
            {ticket.customer.avatarUrl ? (
              <img src={ticket.customer.avatarUrl} alt={ticket.customer.name} className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-sm font-bold shrink-0">
                {ticket.customer.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#11142D] truncate">{ticket.customer.name}</p>
              <p className="text-[10px] text-[#8F95B2] truncate">{ticket.customer.email ?? ticket.customer.phone}</p>
            </div>
          </div>
        </section>

        {/* Status */}
        <section>
          <p className="text-[10px] font-bold text-[#8F95B2] uppercase tracking-wide mb-2">Status</p>
          <StatusDropdown
            current={ticket.status}
            disabled={loading}
            onChange={(s) => onStatusChange(ticket.id, s)}
          />
        </section>

        {/* Priority */}
        <section>
          <p className="text-[10px] font-bold text-[#8F95B2] uppercase tracking-wide mb-2">Priority</p>
          <div
            className={cn(
              "rounded-lg border px-3 py-2 text-xs font-bold",
              ticket.priority === "HIGH" && "bg-red-50 border-red-200 text-red-700",
              ticket.priority === "MEDIUM" && "bg-amber-50 border-amber-200 text-amber-700",
              ticket.priority === "LOW" && "bg-slate-50 border-slate-200 text-slate-600"
            )}
          >
            {ticket.priority}
          </div>
        </section>

        {/* Agent Assignment */}
        <section>
          <p className="text-[10px] font-bold text-[#8F95B2] uppercase tracking-wide mb-2">Assigned Agent</p>
          {membersLoading ? (
            <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading team…
            </div>
          ) : (
            <AgentAssignDropdown
              members={members}
              currentAgentId={ticket.assignedAgentId}
              disabled={loading}
              onAssign={(userId) => onAssign(ticket.id, userId)}
            />
          )}
          {members.length === 0 && !membersLoading && (
            <p className="mt-1.5 text-[10px] text-[#9CA3AF]">
              No workspace members loaded. The members endpoint may need to be extended.
            </p>
          )}
        </section>

        {/* Tags */}
        {ticket.tags.length > 0 && (
          <section>
            <p className="text-[10px] font-bold text-[#8F95B2] uppercase tracking-wide mb-2">
              <Tag className="h-3 w-3 inline mr-1" />
              Tags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ticket.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: tag.colorCode }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Ticket Meta */}
        <section className="border-t border-[#E6EAFA] pt-4">
          <p className="text-[10px] font-bold text-[#8F95B2] uppercase tracking-wide mb-2">Timeline</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-[#9CA3AF]">Created</span>
              <span className="font-semibold text-[#6B7280]">
                {new Date(ticket.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-[#9CA3AF]">Updated</span>
              <span className="font-semibold text-[#6B7280]">
                {new Date(ticket.updatedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-[#9CA3AF]">Ticket ID</span>
              <span className="font-mono text-[9px] text-[#9CA3AF] truncate max-w-[100px]" title={ticket.id}>
                {ticket.id.slice(0, 8)}…
              </span>
            </div>
          </div>
        </section>
      </div>
    </aside>
  );
}
