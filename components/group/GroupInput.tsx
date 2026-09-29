import React, { useRef, useState, useEffect } from "react";
import { Send, Paperclip, Camera, Mic, Square, X, Loader2, Image as ImageIcon, Smile, Video, FileText, BarChart2, Lock } from "lucide-react";
import { useMediaCapture } from "@/hooks/useMediaCapture";
import { cn } from "@/lib/utils";
import { getOptimizedImageUrl } from "@/utils/image";
import dynamic from "next/dynamic";
import { toast } from "sonner";

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
  members?: Array<{
    userId?: string;
    user?: {
      id?: string;
      name?: string;
      email?: string;
      profile?: {
        displayName?: string;
        avatarUrl?: string | null;
      } | null;
    };
    role?: string;
  }>;
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
  members = [],
}: GroupInputProps) {
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionCursorIndex, setMentionCursorIndex] = useState<number>(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState<number>(0);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);

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
      if (mentionDropdownRef.current && !mentionDropdownRef.current.contains(target)) {
        setMentionQuery(null);
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

  const matchingMembers = React.useMemo(() => {
    if (mentionQuery === null || !members) return [];
    return members
      .map((m) => {
        const name =
          m.user?.profile?.displayName ||
          m.user?.name ||
          (m.user?.email ? m.user.email.split("@")[0] : "Member");
        const avatar = m.user?.profile?.avatarUrl;
        const id = m.userId || m.user?.id || "";
        return { id, name, avatar, role: m.role };
      })
      .filter((m) => m.name.toLowerCase().includes(mentionQuery))
      .slice(0, 6);
  }, [mentionQuery, members]);

  const insertMention = (memberName: string) => {
    if (!textareaRef.current) return;
    const cleanName = memberName.replace(/\s+/g, "_");
    const beforeMention = inputText.slice(0, mentionCursorIndex);
    const afterCursor = inputText.slice(textareaRef.current.selectionStart || inputText.length);
    const newText = `${beforeMention}@${cleanName} ${afterCursor}`;
    setInputText(newText);
    setMentionQuery(null);

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = beforeMention.length + cleanName.length + 2;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    });
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isReady || isUploading || isAnnouncementOnly) return;
    if (!inputText.trim() && !selectedFile) return;

    if (onStopTyping) onStopTyping();
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    onSend(inputText, selectedFile);
    setInputText("");
    setSelectedFile(null);
    setMentionQuery(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;

    const cursorPos = e.target.selectionStart || 0;
    const textBeforeCursor = val.slice(0, cursorPos);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_.-]*)$/);
    if (match) {
      setMentionQuery(match[1].toLowerCase());
      setMentionCursorIndex(match.index ?? cursorPos - match[0].length);
      setSelectedMentionIndex(0);
    } else {
      setMentionQuery(null);
    }

    if (onStartTyping) {
      onStartTyping();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        if (onStopTyping) onStopTyping();
      }, 2500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && matchingMembers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev + 1) % matchingMembers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev - 1 + matchingMembers.length) % matchingMembers.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(matchingMembers[selectedMentionIndex].name);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }

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

  const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB max limit

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error("File size exceeds the 25MB maximum limit.");
        if (galleryInputRef.current) galleryInputRef.current.value = "";
        if (docInputRef.current) docInputRef.current.value = "";
        return;
      }
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
      {/* Mentions Autocomplete Dropdown */}
      {mentionQuery !== null && matchingMembers.length > 0 && (
        <div
          ref={mentionDropdownRef}
          className="absolute bottom-full left-12 mb-2 z-50 w-64 bg-white dark:bg-[#233138] rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-white/5">
            Group Members
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {matchingMembers.map((member, idx) => (
              <button
                key={member.id || idx}
                type="button"
                onClick={() => insertMention(member.name)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left transition-colors cursor-pointer text-xs",
                  idx === selectedMentionIndex
                    ? "bg-[#00A884]/15 dark:bg-[#00A884]/25 text-[#00A884] dark:text-[#25D366] font-medium"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
                )}
              >
                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0 overflow-hidden text-[10px] font-bold text-[#00A884]">
                  {member.avatar ? (
                    <img src={getOptimizedImageUrl(member.avatar)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    member.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col truncate flex-1">
                  <span className="truncate">{member.name}</span>
                  {member.role === "ADMIN" && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Admin</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

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
