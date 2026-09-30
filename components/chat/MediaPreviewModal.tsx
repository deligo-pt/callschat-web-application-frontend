"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Loader2,
  Smile,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Music,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

export interface MediaPreviewModalProps {
  isOpen: boolean;
  file: File | null;
  initialCaption?: string;
  isUploading: boolean;
  replyingTo?: {
    id: string;
    senderName?: string;
    text: string;
    mediaType?: string | null;
  } | null;
  onClose: () => void;
  onSend: (file: File, caption: string) => Promise<void> | void;
}

export function MediaPreviewModal({
  isOpen,
  file,
  initialCaption = "",
  isUploading,
  replyingTo,
  onClose,
  onSend,
}: MediaPreviewModalProps) {
  const [caption, setCaption] = useState(initialCaption);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Generate and cleanup preview object URL
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setCaption(initialCaption || "");

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, initialCaption]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close emoji picker on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      if (target.closest(".preview-emoji-toggle")) return;
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(target)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard events (Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape" && !isUploading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isUploading, onClose]);

  if (!isOpen || !file) return null;

  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  const isAudio = file.type.startsWith("audio/");

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSend = () => {
    if (isUploading) return;
    onSend(file, caption);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col bg-[#0b141a]/95 backdrop-blur-md text-white select-none"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-gray-100">
                {isImage
                  ? "Send Photo"
                  : isVideo
                  ? "Send Video"
                  : isAudio
                  ? "Send Audio"
                  : "Send Document"}
              </span>
              <span className="text-xs text-gray-400">
                {file.name} • {formatFileSize(file.size)}
              </span>
            </div>
          </div>
        </div>

        {/* Media Preview Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden relative">
          {isImage && previewUrl ? (
            <img
              src={previewUrl}
              alt={file.name}
              className="max-h-[62vh] max-w-full md:max-w-3xl object-contain rounded-xl shadow-2xl ring-1 ring-white/10"
            />
          ) : isVideo && previewUrl ? (
            <video
              src={previewUrl}
              controls
              autoPlay
              className="max-h-[62vh] max-w-full md:max-w-3xl rounded-xl shadow-2xl ring-1 ring-white/10"
            />
          ) : isAudio && previewUrl ? (
            <div className="flex flex-col items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-[#00A884]/20 flex items-center justify-center text-[#00A884]">
                <Music className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm text-white truncate max-w-xs">{file.name}</p>
                <p className="text-xs text-gray-400 mt-1">{formatFileSize(file.size)}</p>
              </div>
              <audio src={previewUrl} controls className="w-full mt-2" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-[#00A884]/20 flex items-center justify-center text-[#00A884]">
                <FileText className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm text-white truncate max-w-xs">{file.name}</p>
                <p className="text-xs text-gray-400 mt-1">{formatFileSize(file.size)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Replying Banner (if active) */}
        {replyingTo && (
          <div className="max-w-2xl mx-auto w-full px-4 mb-2">
            <div className="bg-white/10 border-l-4 border-l-[#00A884] rounded-lg p-2.5 flex items-center justify-between text-xs text-gray-200">
              <div className="flex flex-col truncate pr-2">
                <span className="font-semibold text-[#00A884]">
                  {replyingTo.senderName || "Replying to"}
                </span>
                <span className="text-gray-300 truncate">{replyingTo.text}</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Input & Send Bar */}
        <div className="p-4 md:px-8 pb-6 border-t border-white/10 bg-[#111b21] shrink-0">
          <div className="max-w-2xl mx-auto flex items-center gap-3 relative">
            {/* Emoji Picker Popup */}
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-full left-0 mb-3 z-50 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150"
              >
                <EmojiPicker
                  onEmojiClick={(emojiData) => {
                    setCaption((prev) => prev + emojiData.emoji);
                    inputRef.current?.focus();
                  }}
                  theme={"dark" as any}
                  searchPlaceHolder="Search emoji..."
                  width={320}
                  height={360}
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="preview-emoji-toggle p-2.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-[#00A884] transition-colors cursor-pointer"
              title="Add emoji"
            >
              <Smile className="w-6 h-6" />
            </button>

            <div className="flex-1 bg-[#202c33] rounded-2xl px-4 py-2 border border-white/5 focus-within:border-[#00A884]/50 transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isUploading}
                placeholder="Add a caption... (Press Enter to send)"
                className="w-full bg-transparent text-sm text-white placeholder-gray-400 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleSend}
              disabled={isUploading}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg transition-transform active:scale-95",
                isUploading
                  ? "bg-[#00A884]/70 cursor-not-allowed"
                  : "bg-[#00A884] hover:bg-[#008069] text-white cursor-pointer"
              )}
              title="Send message"
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              ) : (
                <Send className="w-5 h-5 ml-0.5" />
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
