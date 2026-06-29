"use client";

import React, { RefObject } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, MessageSquare, Lock, Send, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import { Ticket } from "@/services/support.service";
import type { ThreadMessage } from "@/app/(dashboard)/business/inbox/page";
import { useQuickReply, QuickReplyDropdown } from "@/components/business/QuickReplyMenu";
import { toast } from "sonner";
import { CollaborationService } from "@/services/collaboration.service";
import { ScheduleSendPopover } from "@/components/business/ScheduleSendPopover";

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

// ---------------------------------------------------------------------------
// Message bubbles
// ---------------------------------------------------------------------------
function CustomerBubble({ text, time }: { text: string; time: string }) {
  return (
    <div className="flex items-end gap-2 justify-start">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-300 text-white text-[10px] font-bold">
        C
      </div>
      <div className="max-w-[60%]">
        <div className="rounded-2xl rounded-bl-sm bg-white border border-[#E6EAFA] px-3.5 py-2 text-sm text-[#1D2A54] shadow-xs">
          {text}
        </div>
        <p className="mt-0.5 text-[10px] text-[#9CA3AF] pl-1">{time}</p>
      </div>
    </div>
  );
}

function AgentBubble({ text, time }: { text: string; time: string }) {
  return (
    <div className="flex items-end gap-2 justify-end">
      <div className="max-w-[60%] text-right">
        <div className="rounded-2xl rounded-br-sm bg-purple-600 px-3.5 py-2 text-sm text-white shadow-sm">
          {text}
        </div>
        <p className="mt-0.5 text-[10px] text-[#9CA3AF] pr-1">{time}</p>
      </div>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white text-[10px] font-bold">
        A
      </div>
    </div>
  );
}

function InternalNoteBubble({ text, time }: { text: string; time: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400 text-white">
        <Lock className="h-3 w-3" />
      </div>
      <div className="flex-1">
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2">
          <div className="flex items-center gap-1.5 mb-1">
            <StickyNote className="h-3 w-3 text-amber-600" />
            <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wide">
              Internal Note — Not visible to customer
            </span>
          </div>
          <p className="text-sm text-amber-900">{text}</p>
        </div>
        <p className="mt-0.5 text-[10px] text-[#9CA3AF] pl-1">{time}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Thread Loading Skeleton
// ---------------------------------------------------------------------------
function ThreadSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6 animate-pulse">
      {[false, true, false].map((isRight, i) => (
        <div key={i} className={cn("flex gap-2 items-end", isRight ? "justify-end" : "justify-start")}>
          {!isRight && <div className="h-7 w-7 rounded-full bg-slate-200 shrink-0" />}
          <div className={cn("h-10 rounded-2xl bg-slate-200", isRight ? "w-40" : "w-56")} />
          {isRight && <div className="h-7 w-7 rounded-full bg-slate-200 shrink-0" />}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------
function ThreadEmptyState({ hasTicket }: { hasTicket: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F4F6FC] border border-[#E6EAFA]">
        <MessageSquare className="h-6 w-6 text-[#D1D5DB]" />
      </div>
      <p className="text-sm font-semibold text-[#9CA3AF]">
        {hasTicket ? "No messages yet in this ticket." : "Select a ticket to start reviewing."}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ThreadPane
// ---------------------------------------------------------------------------
interface ThreadPaneProps {
  ticket: Ticket | null;
  thread: ThreadMessage[];
  threadLoading: boolean;
  threadEndRef: RefObject<HTMLDivElement | null>;
  composeMode: "reply" | "note";
  onComposeModeChange: (m: "reply" | "note") => void;
  composeText: string;
  onComposeTextChange: (v: string) => void;
  onSend: () => void;
  submitting: boolean;
  currentUserId: string;
}

export function ThreadPane({
  ticket,
  thread,
  threadLoading,
  threadEndRef,
  composeMode,
  onComposeModeChange,
  composeText,
  onComposeTextChange,
  onSend,
  submitting,
  currentUserId,
}: ThreadPaneProps) {
  const isNote = composeMode === "note";

  const quickReply = useQuickReply({
    text: composeText,
    onTextChange: onComposeTextChange,
    disabled: isNote,
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (quickReply.handleKeyDown(e)) {
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleScheduleMessage = async (scheduledForIso: string) => {
    if (!composeText.trim() || !ticket?.id || !ticket?.workspaceId) {
      toast.error("Please enter message text to schedule");
      return false;
    }
    try {
      const res = await CollaborationService.scheduleMessage({
        content: composeText.trim(),
        scheduledFor: scheduledForIso,
        ticketId: ticket.id,
        workspaceId: ticket.workspaceId,
      });
      if (res.success) {
        toast.success("Message scheduled successfully");
        onComposeTextChange("");
        return true;
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Failed to schedule message");
    }
    return false;
  };

  return (
    <main className="flex flex-1 flex-col overflow-hidden border-r border-[#E6EAFA] bg-[#F8FAFC]">
      {/* Thread Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 bg-white border-b border-[#E6EAFA] shadow-xs shrink-0">
        {ticket ? (
          <>
            {ticket.customer.avatarUrl ? (
              <img
                src={ticket.customer.avatarUrl}
                alt={ticket.customer.name}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-600 text-white text-sm font-bold shrink-0">
                {ticket.customer.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#11142D] truncate">{ticket.customer.name}</p>
              <p className="text-[11px] font-medium text-[#8F95B2]">
                {ticket.customer.email ?? ticket.customer.phone}
                {ticket.assignedAgent && (
                  <span className="ml-2 text-purple-600 font-semibold">
                    → {ticket.assignedAgent.name}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-1 rounded-full",
                  ticket.status === "OPEN" && "bg-emerald-100 text-emerald-700",
                  ticket.status === "PENDING" && "bg-blue-100 text-blue-700",
                  ticket.status === "CLOSED" && "bg-slate-100 text-slate-500"
                )}
              >
                {ticket.status}
              </span>
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-1 rounded-full",
                  ticket.priority === "HIGH" && "bg-red-100 text-red-700",
                  ticket.priority === "MEDIUM" && "bg-amber-100 text-amber-700",
                  ticket.priority === "LOW" && "bg-slate-100 text-slate-600"
                )}
              >
                {ticket.priority}
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm font-semibold text-[#9CA3AF]">No ticket selected</p>
        )}
      </div>

      {/* Thread Messages */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
        {threadLoading ? (
          <ThreadSkeleton />
        ) : thread.length === 0 ? (
          <ThreadEmptyState hasTicket={!!ticket} />
        ) : (
          thread.map((msg) => {
            if (msg.kind === "note") {
              return (
                <InternalNoteBubble
                  key={msg.data.id}
                  text={msg.data.content}
                  time={relativeTime(msg.data.createdAt)}
                />
              );
            }
            const isAgent = msg.data.senderId === currentUserId;
            return isAgent ? (
              <AgentBubble
                key={msg.data.id}
                text={msg.data.ciphertext ?? ""}
                time={relativeTime(msg.data.createdAt)}
              />
            ) : (
              <CustomerBubble
                key={msg.data.id}
                text={msg.data.ciphertext ?? ""}
                time={relativeTime(msg.data.createdAt)}
              />
            );
          })
        )}
        <div ref={threadEndRef} />
      </div>

      {/* Compose Area */}
      {ticket && (
        <div
          className={cn(
            "shrink-0 border-t transition-colors duration-200",
            isNote ? "border-amber-300 bg-amber-50" : "border-[#E6EAFA] bg-white"
          )}
        >
          {/* Mode Switcher */}
          <div className="flex items-center gap-2 px-4 pt-3 pb-1">
            <button
              onClick={() => onComposeModeChange("reply")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                !isNote
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-[#8F95B2] hover:bg-[#F4F6FC]"
              )}
            >
              <MessageSquare className="h-3 w-3" />
              Reply to Customer
            </button>
            <button
              onClick={() => onComposeModeChange("note")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                isNote
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-[#8F95B2] hover:bg-[#F4F6FC]"
              )}
            >
              <Lock className="h-3 w-3" />
              Internal Note
            </button>
            {isNote && (
              <span className="ml-auto text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                🔒 Private — not sent to customer
              </span>
            )}
          </div>

          {/* Textarea + Send */}
          <div className="flex items-end gap-2 px-4 pb-4 pt-2 relative">
            <QuickReplyDropdown
              isOpen={quickReply.isOpen}
              replies={quickReply.filteredReplies}
              selectedIndex={quickReply.selectedIndex}
              onSelect={quickReply.selectReply}
              onHover={quickReply.setSelectedIndex}
            />
            <textarea
              value={composeText}
              onChange={(e) => onComposeTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isNote
                  ? "Add an internal note (visible to team only)…"
                  : "Reply to customer… (Enter to send, Shift+Enter for newline)"
              }
              rows={3}
              className={cn(
                "flex-1 resize-none rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all duration-200 focus:ring-2",
                isNote
                  ? "border-amber-300 bg-amber-50/80 text-amber-900 placeholder-amber-400 focus:border-amber-400 focus:ring-amber-300/30"
                  : "border-[#E6EAFA] bg-[#F8FAFC] text-[#1D2A54] placeholder-[#8F95B2] focus:border-purple-400 focus:ring-purple-300/20"
              )}
            />
            {!isNote && (
              <ScheduleSendPopover
                disabled={!composeText.trim() || submitting}
                onSchedule={handleScheduleMessage}
              />
            )}
            <button
              onClick={onSend}
              disabled={!composeText.trim() || submitting}
              className={cn(
                "flex items-center justify-center h-10 w-10 rounded-xl text-white shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none cursor-pointer",
                isNote ? "bg-amber-500 hover:bg-amber-600" : "bg-purple-600 hover:bg-purple-700"
              )}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
