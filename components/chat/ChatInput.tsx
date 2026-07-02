import React, { useRef, useState, useEffect } from "react";
import { Send, Paperclip, Camera, Mic, Square, X, Loader2, Image as ImageIcon, Smile } from "lucide-react";
import { useMediaCapture } from "@/hooks/useMediaCapture";
import { cn } from "@/lib/utils";
import { useQuickReply, QuickReplyDropdown } from "@/components/business/QuickReplyMenu";
import dynamic from "next/dynamic";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface ChatInputProps {
  onSend: (text: string, file: File | null) => void;
  isReady: boolean;
  isUploading: boolean;
}

export function ChatInput({ onSend, isReady, isUploading }: ChatInputProps) {
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

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

  const quickReply = useQuickReply({
    text: inputText,
    onTextChange: setInputText,
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (quickReply.handleKeyDown(e)) {
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
    <div className="bg-white px-4 py-3 shrink-0 relative border-t border-gray-100">
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
              onClick={handleCapturePhoto}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white border-4 border-gray-300 hover:scale-105 transition-transform"
            />
          </div>
        </div>
      )}

      {/* File Preview */}
      {selectedFile && (
        <div className="mb-3 flex items-center bg-white rounded-lg p-2 shadow-sm border border-gray-200 max-w-sm">
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

      <form onSubmit={handleSend} className="flex items-end gap-2">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
        />

        {/* Attachment & Camera Buttons (hidden when recording) */}
        {!isRecording && (
          <div className="flex gap-2 items-center mb-2">
            <button
              type="button"
              disabled={!isReady || isUploading}
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="emoji-toggle-btn flex items-center justify-center text-[#6B7280] hover:text-[#254BCC] transition-colors disabled:opacity-50"
            >
              <Smile className="h-[22px] w-[22px]" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!isReady || isUploading}
              className="flex items-center justify-center text-[#6B7280] hover:text-[#254BCC] transition-colors disabled:opacity-50"
            >
              <Paperclip className="h-[22px] w-[22px]" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => (isCameraOpen ? stopCamera() : startCamera())}
              disabled={!isReady || isUploading}
              className="flex items-center justify-center text-[#6B7280] hover:text-[#254BCC] transition-colors disabled:opacity-50 pr-1"
            >
              <ImageIcon className="h-[22px] w-[22px]" strokeWidth={1.5} />
            </button>
          </div>
        )}

        <div className="flex-1 bg-[#F3F4F6] rounded-full flex items-center px-5 py-2 shadow-sm min-h-[44px] relative">
          <QuickReplyDropdown
            isOpen={quickReply.isOpen}
            replies={quickReply.filteredReplies}
            selectedIndex={quickReply.selectedIndex}
            onSelect={quickReply.selectReply}
            onHover={quickReply.setSelectedIndex}
          />
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
              placeholder={isReady ? "Type a message" : "Setting up encryption..."}
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
              isRecording ? "bg-red-500 text-white" : "bg-[#254BCC] text-white"
            )}
          >
            {isRecording ? (
              <Square className="h-5 w-5 fill-current" strokeWidth={2} />
            ) : (
              <Mic className="h-[20px] w-[20px]" strokeWidth={2.5} />
            )}
          </button>
        ) : (
          /* Send Button */
          <button
            type="submit"
            disabled={!isReady || isUploading || (!inputText.trim() && !selectedFile)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#254BCC] text-white transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-md mb-0.5"
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} />
            ) : (
              <Send className="h-5 w-5 ml-0.5" strokeWidth={2.5} />
            )}
          </button>
        )}
      </form>
    </div>
  );
}
