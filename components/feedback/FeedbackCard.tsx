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
        'group relative flex flex-col p-4 rounded-xl border border-slate-200/90 bg-white hover:border-[#2563EB]/40 hover:shadow-xs transition-all duration-200 cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30',
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
      <h3 className="text-[14px] font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors line-clamp-1">
        {feedback.subject}
      </h3>

      {/* Description Snippet */}
      <p className="text-[12px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
        {feedback.description}
      </p>

      {/* Admin response hint banner if present */}
      {feedback.adminResponse && (
        <div className="mt-2.5 p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/60 flex items-start gap-2">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
              Official Resolution:
            </span>
            <p className="text-[11px] text-emerald-700 line-clamp-1 font-medium">
              {feedback.adminResponse}
            </p>
          </div>
        </div>
      )}

      {/* Bottom Footer Details */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-slate-400" />
            <span>{formatCreatedTime(feedback.createdAt)}</span>
          </span>

          {attachmentCount > 0 && (
            <span
              className="flex items-center gap-1 text-slate-500 font-medium"
              title={`${attachmentCount} attachment(s)`}
            >
              <Paperclip className="h-3 w-3" />
              <span>{attachmentCount}</span>
            </span>
          )}

          {replyCount > 0 && (
            <span
              className="flex items-center gap-1 text-[#2563EB] font-semibold bg-blue-50 px-1.5 py-0.5 rounded-md"
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
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-slate-600 hover:text-[#2563EB] hover:bg-[#EEF2FF] transition-colors border border-transparent hover:border-blue-200"
              title="Edit pending feedback"
            >
              <Pencil className="h-3 w-3" />
              <span>Edit</span>
            </button>
          )}

          <div className="flex items-center text-slate-400 group-hover:text-[#2563EB] transition-colors">
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
