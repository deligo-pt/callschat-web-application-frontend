'use client';

import React, { useState, useEffect, useRef } from 'react';
import { feedbackService } from '@/services/feedback.service';
import type { FeedbackItem } from '@/types/feedback.types';
import {
  FeedbackPriorityBadge,
  FeedbackStatusBadge,
  FeedbackTypeBadge,
} from './FeedbackStatusBadge';
import {
  X,
  Calendar,
  Pencil,
  Paperclip,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Loader2,
  AlertCircle,
  MonitorSmartphone,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';

interface FeedbackDetailModalProps {
  feedbackId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (feedback: FeedbackItem) => void;
}

export function FeedbackDetailModal({
  feedbackId,
  isOpen,
  onClose,
  onEdit,
}: FeedbackDetailModalProps) {
  const [prevId, setPrevId] = useState<string | null>(null);
  const [ticket, setTicket] = useState<FeedbackItem | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(feedbackId));
  const [error, setError] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);

  const modalRef = useRef<HTMLDivElement>(null);

  // Sync state when selected ticket id changes
  if (feedbackId !== prevId) {
    setPrevId(feedbackId);
    setTicket(null);
    setLoading(Boolean(feedbackId));
    setError(null);
  }

  useEffect(() => {
    let isMounted = true;
    if (!isOpen || !feedbackId) return;

    feedbackService
      .getMyFeedbackDetails(feedbackId)
      .then((data) => {
        if (isMounted) setTicket(data);
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
          const msg =
            errorObj.response?.data?.message ||
            errorObj.message ||
            'Failed to load feedback ticket details';
          setError(msg);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, feedbackId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      return format(new Date(isoString), "MMM d, yyyy 'at' h:mm a");
    } catch {
      return isoString;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isPending = ticket?.status === 'PENDING';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in-0 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className="relative flex flex-col w-full max-w-2xl max-h-[92vh] rounded-2xl bg-white shadow-xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
              Ticket #{ticket?.id.slice(-8) || '...'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-[#2563EB]" />
              <span className="text-[13px] font-medium">Loading ticket details...</span>
            </div>
          ) : error || !ticket ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[13px]">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error || 'Unable to display this ticket.'}</span>
            </div>
          ) : (
            <>
              {/* Badges & Meta */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <FeedbackTypeBadge type={ticket.type} />
                  <FeedbackPriorityBadge priority={ticket.priority} />
                  <FeedbackStatusBadge status={ticket.status} />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Submitted {formatDate(ticket.createdAt)}</span>
                </div>
              </div>

              {/* Subject Title */}
              <div>
                <h1 className="text-[18px] font-bold text-[#0F172A] leading-snug">
                  {ticket.subject}
                </h1>
                {ticket.resolvedAt && (
                  <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Resolved on {formatDate(ticket.resolvedAt)}</span>
                  </div>
                )}
              </div>

              {/* Full Description */}
              <div className="flex flex-col gap-1.5">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Description
                </h3>
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200/80 text-[13px] text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {ticket.description}
                </div>
              </div>

              {/* Official Resolution if present */}
              {ticket.adminResponse && (
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Official Resolution Note
                  </h3>
                  <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-[13px] text-emerald-900 leading-relaxed font-medium">
                    {ticket.adminResponse}
                  </div>
                </div>
              )}

              {/* Attachments Section */}
              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5" />
                    <span>Attachments ({ticket.attachments.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {ticket.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-2xs transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {att.fileType.startsWith('image/') ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={att.fileUrl}
                              alt={att.fileName}
                              className="h-10 w-10 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 text-slate-500">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                          )}
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[12.5px] font-semibold text-[#0F172A] truncate" title={att.fileName}>
                              {att.fileName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatFileSize(att.fileSize)}
                            </span>
                          </div>
                        </div>

                        <a
                          href={att.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-[#2563EB] hover:bg-[#EEF2FF] transition-colors ml-2 shrink-0"
                          title="View / Download file"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Threaded Support Replies */}
              <div className="flex flex-col gap-3">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-[#2563EB]" />
                  <span>Support Communication ({ticket.replies?.length || 0})</span>
                </h3>

                {ticket.replies && ticket.replies.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {ticket.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="p-3.5 rounded-xl border border-blue-100 bg-[#F0F5FF] flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2563EB] text-white text-[10px] font-bold">
                              <ShieldCheck className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-[12px] font-bold text-[#0F172A]">
                              {reply.sender?.profile?.displayName || 'CallsChat Support Staff'}
                            </span>
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-[#2563EB] text-white">
                              {reply.sender?.role || 'Staff'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {formatDate(reply.createdAt)}
                          </span>
                        </div>
                        <p className="text-[13px] text-slate-700 whitespace-pre-wrap leading-relaxed pl-8">
                          {reply.message}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-slate-200/80 bg-[#F8FAFC] text-center text-slate-500 text-[12.5px]">
                    No staff replies yet. Our engineering and support team will reply here once your ticket has been reviewed.
                  </div>
                )}
              </div>

              {/* Device Telemetry Block (Collapsible) */}
              {ticket.userDeviceInfo && (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-[#F8FAFC]">
                  <button
                    type="button"
                    onClick={() => setShowDiagnostics(!showDiagnostics)}
                    className="flex items-center justify-between w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MonitorSmartphone className="h-4 w-4 text-slate-500" />
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Submitted Device Telemetry
                      </span>
                    </div>
                    {showDiagnostics ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </button>

                  {showDiagnostics && (
                    <div className="p-3 border-t border-slate-200 bg-white">
                      <pre className="font-mono text-[11px] text-slate-600 whitespace-pre-wrap overflow-x-auto">
                        {ticket.userDeviceInfo}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
          <div>
            {isPending && onEdit && ticket && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(ticket);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-bold text-[#2563EB] bg-[#EEF2FF] hover:bg-blue-100 border border-blue-200 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Edit Ticket</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
