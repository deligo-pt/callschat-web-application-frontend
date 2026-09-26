'use client';

import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { feedbackService } from '@/services/feedback.service';
import type { FeedbackAttachmentInput } from '@/types/feedback.types';
import {
  UploadCloud,
  X,
  FileText,
  FileImage,
  File,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface AttachmentUploaderProps {
  attachments: FeedbackAttachmentInput[];
  onChange: (attachments: FeedbackAttachmentInput[]) => void;
  maxFiles?: number;
  maxSizeBytes?: number;
  disabled?: boolean;
}

export function AttachmentUploader({
  attachments,
  onChange,
  maxFiles = 5,
  maxSizeBytes = 10 * 1024 * 1024, // 10MB
  disabled = false,
}: AttachmentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      const remainingSlots = maxFiles - attachments.length;
      if (remainingSlots <= 0) {
        toast.error(`Maximum of ${maxFiles} attachments allowed.`);
        return;
      }

      const filesToProcess = fileArray.slice(0, remainingSlots);
      if (fileArray.length > remainingSlots) {
        toast.warning(
          `Only the first ${remainingSlots} file(s) will be uploaded to stay within the limit.`
        );
      }

      for (const file of filesToProcess) {
        // Validate file size
        if (file.size > maxSizeBytes) {
          toast.error(
            `"${file.name}" exceeds the ${maxSizeBytes / (1024 * 1024)}MB limit.`
          );
          continue;
        }

        const tempId = `${file.name}-${Date.now()}`;
        setUploadingFiles((prev) => [...prev, tempId]);

        try {
          const uploaded = await feedbackService.uploadAttachment(file);
          onChange([...attachments, uploaded]);
          toast.success(`Attached "${file.name}"`);
        } catch (err: unknown) {
          const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
          const msg =
            errorObj.response?.data?.message ||
            errorObj.message ||
            `Failed to upload ${file.name}`;
          toast.error(msg);
        } finally {
          setUploadingFiles((prev) => prev.filter((id) => id !== tempId));
        }
      }
    },
    [attachments, maxFiles, maxSizeBytes, onChange]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && attachments.length < maxFiles) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    onChange(attachments.filter((_, idx) => idx !== indexToRemove));
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <FileImage className="h-4 w-4 text-blue-600" />;
    if (fileType.includes('pdf') || fileType.includes('text') || fileType.includes('log')) {
      return <FileText className="h-4 w-4 text-emerald-600" />;
    }
    return <File className="h-4 w-4 text-slate-500" />;
  };

  const isAtLimit = attachments.length >= maxFiles;

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.txt,.log"
        className="hidden"
        disabled={disabled || isAtLimit}
        onChange={(e) => {
          if (e.target.files) {
            handleFiles(e.target.files);
            e.target.value = '';
          }
        }}
      />

      {/* Dropzone */}
      {!isAtLimit && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled && !isAtLimit) {
              fileInputRef.current?.click();
            }
          }}
          className={cn(
            'flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 select-none',
            isDragging
              ? 'border-[#2563EB] bg-[#EEF2FF]'
              : 'border-[#E2E8F0] bg-[#F8FAFC] hover:bg-slate-100 hover:border-slate-300',
            disabled && 'opacity-60 cursor-not-allowed'
          )}
        >
          <div className="flex items-center gap-2 text-slate-600">
            <UploadCloud className="h-5 w-5 text-[#2563EB]" />
            <span className="text-[13px] font-semibold text-[#0F172A]">
              Drop files here or click to browse
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Screenshots, logs, or error dumps (Images, PDF, TXT up to 10MB) &bull; Max {maxFiles} attachments ({attachments.length}/{maxFiles})
          </p>
        </div>
      )}

      {/* Uploading indicator */}
      {uploadingFiles.length > 0 && (
        <div className="flex items-center gap-2 p-2.5 bg-blue-50/70 border border-blue-200/60 rounded-lg text-[12px] text-blue-700 animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Uploading {uploadingFiles.length} file(s)...</span>
        </div>
      )}

      {/* Attachment Chips / Thumbnails */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {attachments.map((file, idx) => (
            <div
              key={`${file.fileUrl}-${idx}`}
              className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-white shadow-2xs hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {file.fileType.startsWith('image/') ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={file.fileUrl}
                    alt={file.fileName}
                    className="h-9 w-9 rounded-md object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-md bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                    {getFileIcon(file.fileType)}
                  </div>
                )}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[12px] font-semibold text-[#0F172A] truncate" title={file.fileName}>
                    {file.fileName}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatFileSize(file.fileSize)}
                  </span>
                </div>
              </div>

              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAttachment(idx);
                  }}
                  className="h-6 w-6 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 ml-1"
                  title="Remove file"
                  aria-label={`Remove ${file.fileName}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
