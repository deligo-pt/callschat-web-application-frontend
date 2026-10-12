'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFeedback } from '@/hooks/useFeedback';
import type { FeedbackItem, FeedbackStatus } from '@/types/feedback.types';
import { FeedbackCard } from '@/components/feedback/FeedbackCard';
import { CreateFeedbackModal } from '@/components/feedback/CreateFeedbackModal';
import { FeedbackDetailModal } from '@/components/feedback/FeedbackDetailModal';
import { EditFeedbackModal } from '@/components/feedback/EditFeedbackModal';
import {
  ArrowLeft,
  Plus,
  RefreshCcw,
  MessageSquarePlus,
  Sparkles,
  LifeBuoy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_FILTERS: { label: string; value?: FeedbackStatus }[] = [
  { label: 'All' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Resolved', value: 'RESOLVED' },
];

export default function UserFeedbackPage() {
  const router = useRouter();

  const {
    feedbacks,
    loading,
    query,
    setStatusFilter,
    refetch,
  } = useFeedback({ page: 1, limit: 30 });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [editingTicket, setEditingTicket] = useState<FeedbackItem | null>(null);

  return (
    <div className="flex h-full flex-col bg-[#F8FAFC] dark:bg-[#0C1317]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E6EAFA] dark:border-[#222D34] bg-white dark:bg-[#111B21] px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-[#202C33] text-slate-600 dark:text-[#8696A0] hover:text-slate-800 dark:hover:text-[#E9EDEF] transition-colors cursor-pointer"
            aria-label="Back to profile"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#0F172A] dark:text-[#E9EDEF] leading-tight">
              Help & Feedback
            </h1>
            <p className="text-[12px] text-slate-500 dark:text-[#8696A0]">
              Report bugs, suggest improvements, and view replies from support
            </p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          disabled={loading}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-[#202C33] text-slate-600 dark:text-[#8696A0] hover:text-slate-800 dark:hover:text-[#E9EDEF] transition-colors disabled:opacity-50 cursor-pointer"
          title="Refresh tickets"
          aria-label="Refresh tickets"
        >
          <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl flex flex-col gap-6">
          {/* User Feedback Callout Banner */}
          <div className="rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 dark:from-blue-950/30 dark:via-[#111B21] dark:to-blue-950/20 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2563EB] text-white shrink-0 shadow-sm shadow-blue-500/20">
                <LifeBuoy className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-[15px] font-bold text-[#0F172A] dark:text-[#E9EDEF]">
                  Encountered an issue or have an idea?
                </h2>
                <p className="text-[12.5px] text-slate-500 dark:text-[#8696A0] mt-0.5 leading-relaxed">
                  Submit a bug report or feature suggestion. Our team directly reviews your reports.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-[13px] transition-colors shrink-0 shadow-xs cursor-pointer w-full sm:w-auto justify-center"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              <span>Submit Feedback</span>
            </button>
          </div>

          {/* Section: My Submitted Feedback */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-slate-500 dark:text-[#8696A0] uppercase tracking-wider">
                My Submitted Reports ({feedbacks.length})
              </h3>

              {/* Status Filter Pills */}
              {feedbacks.length > 0 && (
                <div className="flex items-center gap-1">
                  {STATUS_FILTERS.map((tab) => {
                    const isActive = (query.status || undefined) === tab.value;
                    return (
                      <button
                        key={tab.label}
                        type="button"
                        onClick={() => setStatusFilter(tab.value)}
                        className={cn(
                          'px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer border',
                          isActive
                            ? 'bg-[#2563EB] text-white border-[#2563EB]'
                            : 'bg-white dark:bg-[#202C33] text-slate-600 dark:text-[#8696A0] border-slate-200 dark:border-[#2A3942] hover:bg-slate-50 dark:hover:bg-[#2A3942]/60 dark:hover:text-[#E9EDEF]'
                        )}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* List / Empty States */}
            {loading && feedbacks.length === 0 ? (
              // Loading Shimmer Skeletons
              <div className="flex flex-col gap-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-slate-200 dark:border-[#222D34] bg-white dark:bg-[#111B21] animate-pulse flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-[#202C33]" />
                      <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-[#202C33]" />
                    </div>
                    <div className="h-4 w-2/3 rounded-md bg-slate-200 dark:bg-[#202C33]" />
                    <div className="h-3 w-1/2 rounded-md bg-slate-100 dark:bg-[#202C33]/60" />
                  </div>
                ))}
              </div>
            ) : feedbacks.length === 0 ? (
              // Empty State
              <div className="flex flex-col items-center justify-center p-10 bg-white dark:bg-[#111B21] rounded-2xl border border-dashed border-slate-200 dark:border-[#222D34] text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF2FF] dark:bg-blue-950/50 text-[#2563EB] dark:text-[#38BDF8] mb-3">
                  <MessageSquarePlus className="h-6 w-6" strokeWidth={1.8} />
                </div>
                <h4 className="text-[15px] font-bold text-[#0F172A] dark:text-[#E9EDEF]">
                  No feedback reports yet
                </h4>
                <p className="text-[12.5px] text-slate-500 dark:text-[#8696A0] max-w-sm mt-1 mb-4">
                  Whenever you submit a bug report or idea, you can track its progress and read replies from our team right here.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-[12.5px] transition-colors shadow-xs cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Send Your First Feedback</span>
                </button>
              </div>
            ) : (
              // Tickets List
              feedbacks.map((item) => (
                <FeedbackCard
                  key={item.id}
                  feedback={item}
                  onSelect={(ticket) => setSelectedTicketId(ticket.id)}
                  onEdit={(ticket) => setEditingTicket(ticket)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* 1. Create Feedback Modal */}
      <CreateFeedbackModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmitSuccess={() => {
          refetch();
        }}
      />

      {/* 2. Detail Feedback Modal */}
      <FeedbackDetailModal
        feedbackId={selectedTicketId}
        isOpen={Boolean(selectedTicketId)}
        onClose={() => setSelectedTicketId(null)}
        onEdit={(ticket) => setEditingTicket(ticket)}
      />

      {/* 3. Edit Feedback Modal */}
      <EditFeedbackModal
        ticket={editingTicket}
        isOpen={Boolean(editingTicket)}
        onClose={() => setEditingTicket(null)}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
}
