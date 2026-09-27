'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { feedbackService } from '@/services/feedback.service';
import type { FeedbackItem, UpdateFeedbackPayload } from '@/types/feedback.types';
import { FeedbackStatusBadge } from './FeedbackStatusBadge';
import { X, Loader2, AlertCircle, Check, Info } from 'lucide-react';
import { toast } from 'sonner';

interface EditFeedbackModalProps {
  ticket: FeedbackItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updated: FeedbackItem) => void;
}

export function EditFeedbackModal({
  ticket,
  isOpen,
  onClose,
  onSuccess,
}: EditFeedbackModalProps) {
  const [prevTicketId, setPrevTicketId] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  // Sync state when ticket prop changes without triggering useEffect setState cascade
  if (ticket && ticket.id !== prevTicketId) {
    setPrevTicketId(ticket.id);
    setSubject(ticket.subject || '');
    setDescription(ticket.description || '');
    setErrorMsg(null);
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !ticket) return null;

  const isSubjectValid = subject.trim().length >= 5 && subject.trim().length <= 200;
  const isDescriptionValid = description.trim().length >= 10 && description.trim().length <= 5000;
  const hasChanges =
    subject.trim() !== ticket.subject.trim() ||
    description.trim() !== ticket.description.trim();

  const canSubmit = isSubjectValid && isDescriptionValid && hasChanges && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const payload: UpdateFeedbackPayload = {};
      if (subject.trim() !== ticket.subject.trim()) {
        payload.subject = subject.trim();
      }
      if (description.trim() !== ticket.description.trim()) {
        payload.description = description.trim();
      }

      const updated = await feedbackService.updateMyFeedback(ticket.id, payload);
      toast.success('Your feedback was updated successfully.');
      onSuccess?.(updated);
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        errorObj.response?.data?.message ||
        errorObj.message ||
        'Failed to update feedback. Please try again.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in-0 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-feedback-title"
        className="relative flex flex-col w-full max-w-xl max-h-[90vh] rounded-2xl bg-white shadow-xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <h2 id="edit-feedback-title" className="text-[17px] font-bold text-[#0F172A]">
              Edit Pending Feedback
            </h2>
            <FeedbackStatusBadge status={ticket.status} />
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Note Banner */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-200/70 text-blue-800 text-[12px]">
            <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
            <span>
              You can edit this ticket while it is in <strong>PENDING</strong> status. Once administrative triage or engineering review begins, the ticket content will be locked to preserve audit history.
            </span>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[12.5px]">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {/* Subject Field */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="edit-feedback-subject" className="text-[12px] font-bold text-[#0F172A] uppercase tracking-wider">
                Subject <span className="text-rose-500">*</span>
              </label>
              <span className={cn('text-[11px]', subject.length > 200 ? 'text-rose-500 font-bold' : 'text-slate-400')}>
                {subject.length}/200
              </span>
            </div>
            <input
              id="edit-feedback-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={cn(
                'w-full h-11 px-3.5 rounded-xl border bg-white text-[13px] font-medium text-[#0F172A] placeholder:text-slate-400 focus:outline-none transition-colors',
                subject.length > 0 && !isSubjectValid
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-200 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20'
              )}
            />
            {subject.length > 0 && subject.length < 5 && (
              <p className="text-[11px] text-rose-500">Subject must be at least 5 characters long.</p>
            )}
          </div>

          {/* Description Field */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="edit-feedback-description" className="text-[12px] font-bold text-[#0F172A] uppercase tracking-wider">
                Detailed Description <span className="text-rose-500">*</span>
              </label>
              <span className={cn('text-[11px]', description.length > 5000 ? 'text-rose-500 font-bold' : 'text-slate-400')}>
                {description.length}/5000
              </span>
            </div>
            <textarea
              id="edit-feedback-description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={cn(
                'w-full p-3.5 rounded-xl border bg-white text-[13px] font-medium text-[#0F172A] placeholder:text-slate-400 focus:outline-none transition-colors resize-y min-h-[120px]',
                description.length > 0 && !isDescriptionValid
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-200 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20'
              )}
            />
            {description.length > 0 && description.length < 10 && (
              <p className="text-[11px] text-rose-500">Description must be at least 10 characters long.</p>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-[13px] font-bold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
