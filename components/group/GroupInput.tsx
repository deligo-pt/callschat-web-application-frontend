import React, { useRef, useState, useEffect } from "react";
import { Send, Paperclip, Camera, Mic, Square, X, Loader2, Image as ImageIcon, Smile, Video, FileText, BarChart2, Lock } from "lucide-react";
import { useMediaCapture } from "@/hooks/useMediaCapture";
import { cn } from "@/lib/utils";
import { getOptimizedImageUrl } from "@/utils/image";
import dynamic from "next/dynamic";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface GroupInputProps {
  onSend: (text: string, file: File | null) => void;
  isReady: boolean;
  isUploading: boolean;
  isAnnouncementOnly?: boolean;
  onStartTyping?: () => void;
  onStopTyping?: () => void;
  onOpenCreatePoll?: () => void;
  replyingTo?: {
    id: string;
    senderName?: string;
    text: string;
    mediaType?: string | null;
    mediaUrl?: string | null;
  } | null;
  onCancelReply?: () => void;
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

export function GroupInput({
  onSend,
  isReady,
  isUploading,
  isAnnouncementOnly = false,
  onStartTyping,
  onStopTyping,
  onOpenCreatePoll,
  replyingTo,
  onCancelReply,
}: GroupInputProps) {
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      if (target.closest(".emoji-toggle-btn")) return;

      if (emojiPickerRef.current && !emojiPickerRef.current.contains(target)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    isCameraOpen,
    videoRef,
    startCamera,
    stopCamera,
    capturePhoto,
  } = useMediaCapture();

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isReady || isUploading || isAnnouncementOnly) return;
    if (!inputText.trim() && !selectedFile) return;

    if (onStopTyping) onStopTyping();
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    onSend(inputText, selectedFile);
    setInputText("");
    setSelectedFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;

    if (onStartTyping) {
      onStartTyping();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        if (onStopTyping) onStopTyping();
      }, 2500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape" && replyingTo) {
      e.preventDefault();
      onCancelReply?.();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      const audioFile = await stopRecording();
      if (audioFile) {
        onSend("", audioFile);
      }
    } else {
      await startRecording();
    }
  };

  if (isAnnouncementOnly) {
    return (
      <div className="bg-[#f0f2f5] dark:bg-[#202c33] px-4 py-3 flex items-center justify-center border-t border-[#e9edef] dark:border-[#222d34]">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-white/70 dark:bg-black/20 px-4 py-2 rounded-full shadow-xs border border-gray-200/50 dark:border-gray-800">
          <Lock className="w-3.5 h-3.5 text-amber-500" />
          <span>Only administrators can send messages in this group.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-[#f0f2f5] dark:bg-[#202c33] px-3 py-2 border-t border-[#e9edef] dark:border-[#222d34]">
      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-full left-4 mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <EmojiPicker
            onEmojiClick={(emojiData) => {
              setInputText((prev) => prev + emojiData.emoji);
              if (textareaRef.current) {
                textareaRef.current.focus();
              }
            }}
            theme={"auto" as any}
            searchPlaceHolder="Search emoji..."
            width={320}
            height={380}
          />
        </div>
      )}

      {/* Replying banner */}
      {replyingTo && (
        <div className="mb-2 flex items-center justify-between rounded-xl bg-white dark:bg-[#182229] p-2.5 shadow-xs border-l-4 border-l-[#00A884] border-gray-200 dark:border-[#2A3942] animate-in fade-in duration-150">
          <div className="flex flex-col truncate pr-2">
            <span className="text-xs font-semibold text-[#00A884]">
              {replyingTo.senderName || "Replying to"}
            </span>
            <span className="text-xs text-[#54656F] dark:text-[#8696A0] truncate">
              {replyingTo.text || (replyingTo.mediaType ? `Attachment (${replyingTo.mediaType})` : "")}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#54656F] transition-colors hover:bg-black/10 hover:text-[#111B21] dark:text-[#8696A0] dark:hover:bg-white/10 dark:hover:text-white"
            title="Cancel reply (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* File Preview */}
      {selectedFile && (
        <div className="mb-2.5 flex items-center bg-white dark:bg-[#182229] rounded-xl p-2 shadow-xs border border-gray-200 dark:border-[#2A3942] max-w-sm">
          <div className="flex-1 flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg flex items-center justify-center shrink-0">
              {selectedFile.type.startsWith("image/") ? (
                <ImageIcon className="w-5 h-5 text-[#00A884]" />
              ) : selectedFile.type.startsWith("video/") ? (
                <Video className="w-5 h-5 text-[#00A884]" />
              ) : selectedFile.type.startsWith("audio/") ? (
                <Mic className="w-5 h-5 text-[#00A884]" />
              ) : (
                <FileText className="w-5 h-5 text-[#00A884]" />
              )}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-[#111B21] dark:text-[#E9EDEF] truncate">
                {selectedFile.name}
              </span>
              <span className="text-xs text-[#667781] dark:text-[#8696A0]">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          </div>
          <button
            onClick={() => setSelectedFile(null)}
            className="w-7 h-7 flex items-center justify-center text-[#8696A0] hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-2">
        <input
          type="file"
          ref={galleryInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept="image/*,video/*"
        />
        <input
          type="file"
          ref={docInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.eml,.msg,*/*"
        />

        {!isRecording && (
          <div className="flex gap-0.5 items-center">
            <button
              type="button"
              disabled={!isReady || isUploading}
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="emoji-toggle-btn flex h-10 w-10 items-center justify-center rounded-full text-[#54656F] dark:text-[#8696A0] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#00A884] dark:hover:text-[#00A884] transition-colors disabled:opacity-50"
              title="Emoji"
            >
              <Smile className="h-[22px] w-[22px]" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={!isReady || isUploading}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#54656F] dark:text-[#8696A0] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#00A884] dark:hover:text-[#00A884] transition-colors disabled:opacity-50"
              title="Photos & Videos"
            >
              <ImageIcon className="h-[22px] w-[22px]" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => docInputRef.current?.click()}
              disabled={!isReady || isUploading}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#54656F] dark:text-[#8696A0] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#00A884] dark:hover:text-[#00A884] transition-colors disabled:opacity-50"
              title="Document"
            >
              <Paperclip className="h-[22px] w-[22px]" strokeWidth={1.75} />
            </button>
            {onOpenCreatePoll && (
              <button
                type="button"
                onClick={onOpenCreatePoll}
                disabled={!isReady || isUploading}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#54656F] dark:text-[#8696A0] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#00A884] dark:hover:text-[#00A884] transition-colors disabled:opacity-50"
                title="Create Poll"
              >
                <BarChart2 className="h-[22px] w-[22px]" strokeWidth={1.75} />
              </button>
            )}
          </div>
        )}

        <div className="flex-1 bg-white dark:bg-[#2A3942] rounded-[22px] flex items-center px-4 py-1.5 shadow-xs min-h-[42px] border border-black/[0.04] dark:border-white/[0.04] relative">
          {isRecording ? (
            <div className="flex-1 flex items-center gap-3 h-6">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-500 font-semibold tracking-wide text-[14px]">
                {formatDuration(recordingDuration)}
              </span>
              <span className="text-[#8696A0] text-[13px] ml-2">Recording voice note...</span>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={!isReady || isUploading}
              placeholder={isReady ? "Type a group message" : "Unlocking group keys..."}
              className="flex-1 bg-transparent text-[14.5px] text-[#111B21] dark:text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none resize-none overflow-y-auto min-h-[22px] py-1 disabled:opacity-70"
              rows={1}
              style={{ maxHeight: "120px" }}
            />
          )}
        </div>

        {inputText.trim() === "" && !selectedFile && !isUploading ? (
          <button
            type="button"
            onClick={handleToggleRecording}
            disabled={!isReady}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-xs",
              isRecording ? "bg-red-500 text-white animate-pulse" : "bg-[#00A884] hover:bg-[#008069] text-white"
            )}
            title={isRecording ? "Stop recording" : "Record voice message"}
          >
            {isRecording ? (
              <Square className="h-4.5 w-4.5 fill-current" strokeWidth={2} />
            ) : (
              <Mic className="h-5 w-5" strokeWidth={2} />
            )}
          </button>
        ) : (
          <button
            type="submit"
            disabled={!isReady || isUploading || (!inputText.trim() && !selectedFile)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00A884] hover:bg-[#008069] text-white transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-xs"
            title="Send message"
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2} />
            ) : (
              <Send className="h-4.5 w-4.5 ml-0.5" strokeWidth={2.5} />
            )}
          </button>
        )}
      </form>
    </div>
  );
}
