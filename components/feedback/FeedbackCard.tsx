'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { FeedbackItem } from '@/types/feedback.types';
import {
  FeedbackPriorityBadge,
  FeedbackStatusBadge,
  FeedbackTypeBadge,
} from './FeedbackStatusBadge';
import {
  Paperclip,
  MessageSquare,
  Pencil,
  ChevronRight,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FeedbackCardProps {
  feedback: FeedbackItem;
  onSelect: (feedback: FeedbackItem) => void;
  onEdit?: (feedback: FeedbackItem) => void;
  className?: string;
}

export function FeedbackCard({
  feedback,
  onSelect,
  onEdit,
  className,
}: FeedbackCardProps) {
  const attachmentCount =
    feedback.attachments?.length ?? feedback._count?.attachments ?? 0;
  const replyCount =
    feedback.replies?.length ?? feedback._count?.replies ?? 0;

  const isPending = feedback.status === 'PENDING';

  const formatCreatedTime = (isoString: string) => {
    try {
      return formatDistanceToNow(new Date(isoString), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(feedback)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(feedback);
        }
      }}
      className={cn(
        'group relative flex flex-col p-4 rounded-xl border border-slate-200/90 dark:border-[#222D34] bg-white dark:bg-[#111B21] hover:border-[#2563EB]/40 dark:hover:border-[#38BDF8]/40 hover:shadow-xs transition-all duration-200 cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 dark:focus-visible:ring-[#38BDF8]/30',
        className
      )}
    >
      {/* Top Meta Header: Type + Priority + Status */}
      <div className="flex items-center justify-between gap-2 flex-wrap mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <FeedbackTypeBadge type={feedback.type} />
          <FeedbackPriorityBadge priority={feedback.priority} />
        </div>
        <FeedbackStatusBadge status={feedback.status} />
      </div>

      {/* Subject */}
      <h3 className="text-[14px] font-bold text-[#0F172A] dark:text-[#E9EDEF] group-hover:text-[#2563EB] dark:group-hover:text-[#38BDF8] transition-colors line-clamp-1">
        {feedback.subject}
      </h3>

      {/* Description Snippet */}
      <p className="text-[12px] text-slate-500 dark:text-[#8696A0] line-clamp-2 mt-1 leading-relaxed">
        {feedback.description}
      </p>

      {/* Admin response hint banner if present */}
      {feedback.adminResponse && (
        <div className="mt-2.5 p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 flex items-start gap-2">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
              Official Resolution:
            </span>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-200 line-clamp-1 font-medium">
              {feedback.adminResponse}
            </p>
          </div>
        </div>
      )}

      {/* Bottom Footer Details */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-[#222D34] text-[11px] text-slate-400 dark:text-[#8696A0]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-slate-400 dark:text-[#8696A0]" />
            <span>{formatCreatedTime(feedback.createdAt)}</span>
          </span>

          {attachmentCount > 0 && (
            <span
              className="flex items-center gap-1 text-slate-500 dark:text-[#8696A0] font-medium"
              title={`${attachmentCount} attachment(s)`}
            >
              <Paperclip className="h-3 w-3" />
              <span>{attachmentCount}</span>
            </span>
          )}

          {replyCount > 0 && (
            <span
              className="flex items-center gap-1 text-[#2563EB] dark:text-[#38BDF8] font-semibold bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded-md"
              title={`${replyCount} staff reply(ies)`}
            >
              <MessageSquare className="h-3 w-3" />
              <span>{replyCount}</span>
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {isPending && onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(feedback);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-slate-600 dark:text-[#8696A0] hover:text-[#2563EB] dark:hover:text-[#38BDF8] hover:bg-[#EEF2FF] dark:hover:bg-[#202C33] transition-colors border border-transparent hover:border-blue-200 dark:hover:border-[#2A3942]"
              title="Edit pending feedback"
            >
              <Pencil className="h-3 w-3" />
              <span>Edit</span>
            </button>
          )}

          <div className="flex items-center text-slate-400 dark:text-[#8696A0] group-hover:text-[#2563EB] dark:group-hover:text-[#38BDF8] transition-colors">
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
