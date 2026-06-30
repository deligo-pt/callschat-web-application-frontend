"use client";

import React, { useRef, useState } from "react";
import { Send, Paperclip, Mic, Square, X, Loader2, Image as ImageIcon, Smile, Camera } from "lucide-react";
import { useMediaCapture } from "@/hooks/useMediaCapture";
import { cn } from "@/lib/utils";
import { ScheduleSendPopover } from "@/components/business/ScheduleSendPopover";

interface ChannelInputProps {
  channelName: string;
  onSend: (content: string, file: File | null) => Promise<void> | void;
  onSchedule: (content: string, file: File | null, scheduledForIso: string) => Promise<boolean>;
  disabled?: boolean;
}

export function ChannelInput({ channelName, onSend, onSchedule, disabled }: ChannelInputProps) {
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (disabled || isUploading) return;
    if (!inputText.trim() && !selectedFile) return;

    setIsUploading(true);
    try {
      await onSend(inputText.trim(), selectedFile);
      setInputText("");
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleScheduleMessage = async (scheduledForIso: string) => {
    if (!inputText.trim() && !selectedFile) return false;
    setIsUploading(true);
    try {
      const success = await onSchedule(inputText.trim(), selectedFile, scheduledForIso);
      if (success) {
        setInputText("");
        setSelectedFile(null);
      }
      return success;
    } finally {
      setIsUploading(false);
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

  const hasContent = !!inputText.trim() || !!selectedFile;

  return (
    <div className="p-4 bg-white border-t border-[#E6EAFA] relative">
      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="absolute bottom-full left-4 mb-2 bg-black rounded-xl overflow-hidden shadow-xl z-50 border border-gray-800">
          <div className="flex justify-between items-center px-4 py-2 bg-gray-900 text-white">
            <span className="text-sm font-semibold">Camera</span>
            <button type="button" onClick={stopCamera} className="hover:text-red-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <video ref={videoRef} autoPlay playsInline muted className="w-[320px] h-[240px] object-cover" />
            <button
              type="button"
              onClick={handleCapturePhoto}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white border-4 border-gray-300 hover:scale-105 transition-transform cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* File Preview Banner */}
      {selectedFile && (
        <div className="mb-3 flex items-center bg-[#F4F6FC] rounded-xl p-2.5 shadow-xs border border-[#D8E2FF] max-w-sm">
          <div className="flex-1 flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
              {selectedFile.type.startsWith("image/") ? (
                <ImageIcon className="w-5 h-5 text-purple-600" />
              ) : selectedFile.type.startsWith("video/") ? (
                <Camera className="w-5 h-5 text-purple-600" />
              ) : selectedFile.type.startsWith("audio/") ? (
                <Mic className="w-5 h-5 text-purple-600" />
              ) : (
                <Paperclip className="w-5 h-5 text-purple-600" />
              )}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-bold text-[#11142D] truncate">
                {selectedFile.name}
              </span>
              <span className="text-xs font-semibold text-[#6B7280]">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedFile(null)}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-full hover:bg-white transition-colors ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.xlsx,.csv"
      />

      <form onSubmit={handleSend} className="flex items-center gap-2 rounded-2xl border border-[#E6EAFA] bg-[#F8FAFC] px-4 py-2 focus-within:border-purple-600 focus-within:ring-3 focus-within:ring-purple-600/15 transition-all">
        {!isRecording && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="p-1.5 text-[#8F95B2] hover:text-purple-600 transition-colors disabled:opacity-50 cursor-pointer"
              title="Attach File"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => (isCameraOpen ? stopCamera() : startCamera())}
              disabled={disabled || isUploading}
              className="p-1.5 text-[#8F95B2] hover:text-purple-600 transition-colors disabled:opacity-50 cursor-pointer"
              title="Capture Photo"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {isRecording ? (
          <div className="flex-1 flex items-center gap-3 py-1">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-500 font-bold text-sm tracking-wide">
              {formatDuration(recordingDuration)}
            </span>
            <span className="text-gray-500 text-xs font-semibold">Recording voice note...</span>
          </div>
        ) : (
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={disabled || isUploading}
            placeholder={`Message #${channelName}`}
            className="flex-1 bg-transparent text-sm font-medium text-[#11142D] placeholder-[#8F95B2] outline-none py-1.5 disabled:opacity-60"
          />
        )}

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mic / Stop Recording Button */}
          {!hasContent && !isUploading ? (
            <button
              type="button"
              onClick={handleToggleRecording}
              disabled={disabled}
              className={cn(
                "p-2 rounded-xl transition-all cursor-pointer shadow-sm",
                isRecording ? "bg-red-500 text-white animate-pulse" : "bg-purple-100 text-purple-600 hover:bg-purple-200"
              )}
              title={isRecording ? "Stop Recording" : "Record Voice Note"}
            >
              {isRecording ? (
                <Square className="h-4 w-4 fill-current" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
          ) : null}

          <ScheduleSendPopover
            disabled={!hasContent || isUploading}
            onSchedule={handleScheduleMessage}
          />

          <button
            type="submit"
            disabled={!hasContent || isUploading || disabled}
            className="p-2 rounded-xl bg-purple-600 text-white font-bold shadow-md shadow-purple-500/20 hover:bg-purple-700 disabled:opacity-50 disabled:shadow-none transition-all cursor-pointer flex items-center justify-center min-w-[36px] min-h-[36px]"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
