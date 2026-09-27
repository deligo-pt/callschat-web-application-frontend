'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { feedbackService } from '@/services/feedback.service';
import { detectDeviceDiagnostics } from '@/hooks/useFeedback';
import type {
  CreateFeedbackPayload,
  FeedbackAttachmentInput,
  FeedbackItem,
  FeedbackPriority,
  FeedbackType,
} from '@/types/feedback.types';
import { AttachmentUploader } from './AttachmentUploader';
import {
  X,
  Bug,
  Lightbulb,
  ShieldAlert,
  HelpCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  MonitorSmartphone,
  AlertCircle,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

interface CreateFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess?: (created: FeedbackItem) => void;
  initialType?: FeedbackType;
}

const TYPE_OPTIONS: { type: FeedbackType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'BUG', label: 'Bug Report', icon: Bug },
  { type: 'IMPROVEMENT', label: 'Feature Idea', icon: Lightbulb },
  { type: 'REPORT', label: 'User Report', icon: ShieldAlert },
  { type: 'OTHER', label: 'General', icon: HelpCircle },
];

const PRIORITY_OPTIONS: { priority: FeedbackPriority; label: string; desc: string }[] = [
  { priority: 'LOW', label: 'Low', desc: 'Cosmetic / minor' },
  { priority: 'MEDIUM', label: 'Medium', desc: 'Normal issue' },
  { priority: 'HIGH', label: 'High', desc: 'Major hindrance' },
  { priority: 'CRITICAL', label: 'Critical', desc: 'Crash / blocker' },
];

export function CreateFeedbackModal({
  isOpen,
  onClose,
  onSubmitSuccess,
  initialType = 'BUG',
}: CreateFeedbackModalProps) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>(initialType);
  const [priority, setPriority] = useState<FeedbackPriority>('MEDIUM');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<FeedbackAttachmentInput[]>([]);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  // Sync state cleanly when modal opens
  if (isOpen && !prevOpen) {
    setPrevOpen(true);
    setType(initialType);
    setPriority('MEDIUM');
    setSubject('');
    setDescription('');
    setAttachments([]);
    setErrorMsg(null);
    setDeviceInfo(detectDeviceDiagnostics());
  } else if (!isOpen && prevOpen) {
    setPrevOpen(false);
  }

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const isSubjectValid = subject.trim().length >= 5 && subject.trim().length <= 200;
  const isDescriptionValid = description.trim().length >= 10 && description.trim().length <= 5000;
  const canSubmit = isSubjectValid && isDescriptionValid && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const payload: CreateFeedbackPayload = {
        type,
        priority,
        subject: subject.trim(),
        description: description.trim(),
        userDeviceInfo: deviceInfo.trim() || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      const created = await feedbackService.createFeedback(payload);
      toast.success('Thank you! Your feedback has been submitted.');
      onSubmitSuccess?.(created);
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        errorObj.response?.data?.message ||
        errorObj.message ||
        'Failed to submit feedback. Please try again.';
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
        aria-labelledby="create-feedback-title"
        className="relative flex flex-col w-full max-w-2xl max-h-[92vh] rounded-2xl bg-white shadow-xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div>
            <h2 id="create-feedback-title" className="text-[17px] font-bold text-[#0F172A]">
              Submit Feedback or Bug Report
            </h2>
            <p className="text-[12px] text-slate-500">
              Help us improve CallsChat. Your feedback goes directly to our product team.
            </p>
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Error Banner */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[12.5px]">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {/* 1. Category / Type Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold text-[#0F172A] uppercase tracking-wider">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = type === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setType(opt.type)}
                    className={cn(
                      'flex items-center gap-2 p-2.5 rounded-xl border text-[13px] font-semibold transition-all cursor-pointer text-left',
                      isSelected
                        ? 'border-[#2563EB] bg-[#EEF2FF] text-[#2563EB] shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', isSelected ? 'text-[#2563EB]' : 'text-slate-400')} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Priority Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold text-[#0F172A] uppercase tracking-wider">
              Severity / Priority
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRIORITY_OPTIONS.map((opt) => {
                const isSelected = priority === opt.priority;
                return (
                  <button
                    key={opt.priority}
                    type="button"
                    onClick={() => setPriority(opt.priority)}
                    className={cn(
                      'flex flex-col p-2.5 rounded-xl border transition-all cursor-pointer text-left',
                      isSelected
                        ? 'border-[#2563EB] bg-[#EEF2FF] text-[#2563EB] shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    )}
                  >
                    <span className={cn('text-[13px] font-bold', isSelected ? 'text-[#2563EB]' : 'text-[#0F172A]')}>
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Subject Input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="feedback-subject" className="text-[12px] font-bold text-[#0F172A] uppercase tracking-wider">
                Subject <span className="text-rose-500">*</span>
              </label>
              <span className={cn('text-[11px]', subject.length > 200 ? 'text-rose-500 font-bold' : 'text-slate-400')}>
                {subject.length}/200
              </span>
            </div>
            <input
              id="feedback-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Call audio disconnects when switching to Bluetooth"
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

          {/* 4. Description Textarea */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="feedback-description" className="text-[12px] font-bold text-[#0F172A] uppercase tracking-wider">
                Detailed Description <span className="text-rose-500">*</span>
              </label>
              <span className={cn('text-[11px]', description.length > 5000 ? 'text-rose-500 font-bold' : 'text-slate-400')}>
                {description.length}/5000
              </span>
            </div>
            <textarea
              id="feedback-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened, steps to reproduce, or why this feature would help..."
              className={cn(
                'w-full p-3.5 rounded-xl border bg-white text-[13px] font-medium text-[#0F172A] placeholder:text-slate-400 focus:outline-none transition-colors resize-y min-h-[110px]',
                description.length > 0 && !isDescriptionValid
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-200 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20'
              )}
            />
            {description.length > 0 && description.length < 10 && (
              <p className="text-[11px] text-rose-500">Description must be at least 10 characters long.</p>
            )}
          </div>

          {/* 5. Attachment Dropzone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold text-[#0F172A] uppercase tracking-wider">
              Attachments (Screenshots / Logs)
            </label>
            <AttachmentUploader
              attachments={attachments}
              onChange={setAttachments}
              maxFiles={5}
              disabled={isSubmitting}
            />
          </div>

          {/* 6. Device Diagnostics Telemetry (Collapsible) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-[#F8FAFC]">
            <button
              type="button"
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="flex items-center justify-between w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MonitorSmartphone className="h-4 w-4 text-[#2563EB]" />
                <span className="text-[12px] font-bold text-[#0F172A]">
                  Device Diagnostics (Auto-Detected)
                </span>
              </div>
              {showDiagnostics ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>

            {showDiagnostics && (
              <div className="p-3.5 border-t border-slate-200 bg-white">
                <p className="text-[11px] text-slate-400 mb-2">
                  This system information is shared to help developers reproduce and fix bugs accurately.
                </p>
                <textarea
                  rows={4}
                  value={deviceInfo}
                  onChange={(e) => setDeviceInfo(e.target.value)}
                  className="w-full font-mono text-[11px] p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:bg-white resize-y"
                />
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
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
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-[13px] font-bold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Submit Feedback</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
