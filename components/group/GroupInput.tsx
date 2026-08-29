import React, { useRef, useState, useEffect } from "react";
import { Send, Paperclip, Camera, Mic, Square, X, Loader2, Image as ImageIcon, Smile, Video, FileText } from "lucide-react";
import { useMediaCapture } from "@/hooks/useMediaCapture";
import { cn } from "@/lib/utils";
import { getOptimizedImageUrl } from "@/utils/image";
import dynamic from "next/dynamic";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface GroupInputProps {
  onSend: (text: string, file: File | null) => void;
  isReady: boolean;
  isUploading: boolean;
  replyingTo?: {
    id: string;
    senderName?: string;
    text: string;
    mediaType?: string | null;
    mediaUrl?: string | null;
  } | null;
  onCancelReply?: () => void;
}

export function GroupInput({ onSend, isReady, isUploading, replyingTo, onCancelReply }: GroupInputProps) {
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Don't close if clicking the emoji toggle button itself
      const target = event.target as Element;
      if (target.closest('.emoji-toggle-btn')) return;
      
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
    if (!isReady || isUploading) return;
    if (!inputText.trim() && !selectedFile) return;

    onSend(inputText, selectedFile);
    setInputText("");
    setSelectedFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
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
    // Reset both inputs so the same file can be selected again if needed
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      const audioFile = await stopRecording();
      if (audioFile) {
        setSelectedFile(audioFile);
      }
    } else {
      await startRecording();
    }
  };

  const handleCapturePhoto = () => {
    const photoFile = capturePhoto();
    if (photoFile) {
      setSelectedFile(photoFile);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white px-4 py-3 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] relative z-20">
      {/* Emoji Picker Modal */}
      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute bottom-full left-4 mb-2 z-50 shadow-2xl rounded-xl">
          <EmojiPicker
            onEmojiClick={(emojiData) => {
              setInputText((prev) => prev + emojiData.emoji);
            }}
          />
        </div>
      )}

      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="absolute bottom-full left-4 mb-2 bg-black rounded-xl overflow-hidden shadow-xl z-50 border border-gray-800">
          <div className="flex justify-between items-center px-4 py-2 bg-gray-900 text-white">
            <span className="text-sm font-semibold">Camera</span>
            <button onClick={stopCamera} className="hover:text-red-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <video ref={videoRef} autoPlay playsInline muted className="w-[320px] h-[240px] object-cover" />
            <button
              type="button"
              onClick={handleCapturePhoto}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white border-4 border-gray-300 hover:scale-105 transition-transform"
            />
          </div>
        </div>
      )}

      {/* WhatsApp-style Quoted Reply Preview Bar */}
      {replyingTo && (
        <div className="mb-2.5 mx-auto max-w-4xl flex items-center justify-between rounded-2xl border border-[#E9EDEF] bg-[#F0F2F5] p-2.5 shadow-xs transition-all animate-in slide-in-from-bottom-2 duration-150 dark:border-[#222E35] dark:bg-[#202C33]">
          {/* Left Vertical WhatsApp Green Accent Bar + Content */}
          <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1 pl-0.5">
            <div className="h-9 w-1 shrink-0 rounded-full bg-[#00A884] dark:bg-[#25D366]" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[13px] font-bold tracking-tight text-[#008069] dark:text-[#25D366] truncate">
                {replyingTo.senderName || "Replying to message"}
              </span>
              <div className="flex items-center gap-1.5 text-[12.5px] text-[#54656F] dark:text-[#8696A0] truncate">
                {replyingTo.mediaType === "image" && <Camera className="h-3.5 w-3.5 shrink-0 text-[#00A884] dark:text-[#25D366]" />}
                {replyingTo.mediaType === "video" && <Video className="h-3.5 w-3.5 shrink-0 text-[#00A884] dark:text-[#25D366]" />}
                {replyingTo.mediaType === "audio" && <Mic className="h-3.5 w-3.5 shrink-0 text-[#00A884] dark:text-[#25D366]" />}
                {replyingTo.mediaType === "document" && <FileText className="h-3.5 w-3.5 shrink-0 text-[#00A884] dark:text-[#25D366]" />}
                <span className="truncate">
                  {replyingTo.text ||
                    (replyingTo.mediaType
                      ? replyingTo.mediaType === "image"
                        ? "Photo"
                        : replyingTo.mediaType === "video"
                        ? "Video"
                        : replyingTo.mediaType === "audio"
                        ? "Voice message"
                        : "Document"
                      : "")}
                </span>
              </div>
            </div>
          </div>

          {/* Right Thumbnail Preview (if media exists) & Dismiss Button */}
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {replyingTo.mediaUrl && replyingTo.mediaType?.startsWith("image") && (
              <img
                src={getOptimizedImageUrl(replyingTo.mediaUrl, 40, 40)}
                alt="Reply preview"
                className="h-10 w-10 rounded-lg object-cover ring-1 ring-black/5"
              />
            )}
            <button
              type="button"
              onClick={onCancelReply}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#54656F] transition-colors hover:bg-black/10 hover:text-[#111B21] dark:text-[#8696A0] dark:hover:bg-white/10 dark:hover:text-white"
              title="Cancel reply (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* File Preview */}
      {selectedFile && (
        <div className="mb-3 mx-auto max-w-4xl flex items-center bg-white rounded-lg p-2 shadow-sm border border-gray-200">
          <div className="flex-1 flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-blue-50 rounded flex items-center justify-center shrink-0">
              {selectedFile.type.startsWith("image/") ? (
                <ImageIcon className="w-5 h-5 text-blue-500" />
              ) : selectedFile.type.startsWith("video/") ? (
                <Camera className="w-5 h-5 text-blue-500" />
              ) : selectedFile.type.startsWith("audio/") ? (
                <Mic className="w-5 h-5 text-blue-500" />
              ) : (
                <Paperclip className="w-5 h-5 text-blue-500" />
              )}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-gray-800 truncate">
                {selectedFile.name}
              </span>
              <span className="text-xs text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          </div>
          <button
            onClick={() => setSelectedFile(null)}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 transition-colors ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-end gap-3 w-full max-w-4xl mx-auto">
        {/* Hidden File Inputs */}
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

        {/* Attachment Buttons (hidden when recording) */}
        {!isRecording && (
          <div className="flex gap-3 items-center mb-2.5 shrink-0 pr-1">
            <button
              type="button"
              disabled={!isReady || isUploading}
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="emoji-toggle-btn flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 hidden sm:block"
            >
              <Smile className="h-5 w-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={!isReady || isUploading}
              className="flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 hidden sm:block"
            >
              <ImageIcon className="h-5 w-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => docInputRef.current?.click()}
              disabled={!isReady || isUploading}
              className="flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
            >
              <Paperclip className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        )}

        <div className="flex-1 bg-[#F8FAFC] border border-[#E6EAFA] rounded-full flex items-center px-4 py-1.5 shadow-sm min-h-[44px]">
          {isRecording ? (
            <div className="flex-1 flex items-center gap-3 h-6">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-500 font-medium tracking-wide">
                {formatDuration(recordingDuration)}
              </span>
              <span className="text-gray-400 text-sm ml-2">Recording audio...</span>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              disabled={!isReady || isUploading}
              placeholder={isReady ? "Type a message..." : "Setting up encryption..."}
              className="flex-1 bg-transparent text-[15px] text-[#111B21] placeholder-[#8F95B2] focus:outline-none resize-none overflow-y-auto min-h-[24px] py-1 disabled:opacity-70"
              rows={1}
              style={{ maxHeight: "120px" }}
            />
          )}
        </div>

        {/* Mic / Stop Recording Button */}
        {inputText.trim() === "" && !selectedFile && !isUploading ? (
          <button
            type="button"
            onClick={handleToggleRecording}
            disabled={!isReady}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-md mb-0.5",
              isRecording ? "bg-red-500 text-white" : "bg-[#2563EB] text-white"
            )}
          >
            {isRecording ? (
              <Square className="h-5 w-5 fill-current" strokeWidth={2} />
            ) : (
              <Mic className="h-5 w-5" strokeWidth={2} />
            )}
          </button>
        ) : (
          /* Send Button */
          <button
            type="submit"
            disabled={!isReady || isUploading || (!inputText.trim() && !selectedFile)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-white transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-md mb-0.5"
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} />
            ) : (
              <Send className="h-4 w-4 ml-0.5" strokeWidth={2.5} />
            )}
          </button>
        )}
      </form>
    </div>
  );
}
