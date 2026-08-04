"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Zap } from "lucide-react";
import { useUser } from "@/context/UserContext";
import type { QuickReply } from "@/services/automation.service";
import { cn } from "@/lib/utils";

export function useQuickReply({
  text,
  onTextChange,
  disabled = false,
}: {
  text: string;
  onTextChange: (newText: string) => void;
  disabled?: boolean;
}) {
  const { quickReplies } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [filteredReplies, setFilteredReplies] = useState<QuickReply[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Evaluate query at the end of text
  useEffect(() => {
    if (disabled || !quickReplies || quickReplies.length === 0) {
      setIsOpen(false);
      return;
    }

    // Match if the string currently ends with a slash command or prefix (e.g., "/pr" or "Hello /pr")
    const match = text.match(/(?:^|\s)(\/[a-zA-Z0-9_-]*)$/);
    if (!match) {
      setIsOpen(false);
      return;
    }

    const slashToken = match[1].toLowerCase();
    const matches = quickReplies.filter((qr) =>
      qr.shortcut.toLowerCase().startsWith(slashToken)
    );

    if (matches.length > 0) {
      setFilteredReplies(matches);
      setSelectedIndex((prev) => (prev >= matches.length ? 0 : prev));
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [text, quickReplies, disabled]);

  const selectReply = useCallback(
    (qr: QuickReply) => {
      // Replace the matched slash token at the end of text with the quick reply content
      const match = text.match(/(?:^|\s)(\/[a-zA-Z0-9_-]*)$/);
      if (match) {
        const slashToken = match[1];
        const lastIndex = text.lastIndexOf(slashToken);
        const prefix = text.substring(0, lastIndex);
        const newText = prefix + qr.content + " ";
        onTextChange(newText);
      } else {
        onTextChange(qr.content + " ");
      }
      setIsOpen(false);
    },
    [text, onTextChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>): boolean => {
      if (!isOpen || filteredReplies.length === 0) return false;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredReplies.length);
        return true;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredReplies.length) % filteredReplies.length);
        return true;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const item = filteredReplies[selectedIndex];
        if (item) {
          selectReply(item);
        }
        return true;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
        return true;
      }
      return false;
    },
    [isOpen, filteredReplies, selectedIndex, selectReply]
  );

  return {
    isOpen,
    filteredReplies,
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    selectReply,
  };
}

interface QuickReplyDropdownProps {
  isOpen: boolean;
  replies: QuickReply[];
  selectedIndex: number;
  onSelect: (qr: QuickReply) => void;
  onHover?: (index: number) => void;
  className?: string;
}

export function QuickReplyDropdown({
  isOpen,
  replies,
  selectedIndex,
  onSelect,
  onHover,
  className,
}: QuickReplyDropdownProps) {
  if (!isOpen || replies.length === 0) return null;

  return (
    <div
      className={cn(
        "absolute bottom-full left-4 mb-2 z-50 w-80 max-h-60 overflow-y-auto rounded-2xl bg-white border border-[#E6EAFA] p-1.5 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150",
        className
      )}
    >
      <div className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold text-[#8F95B2] uppercase tracking-wider border-b border-slate-100 mb-1">
        <Zap className="h-3.5 w-3.5 text-purple-600 shrink-0" />
        Quick Reply Shortcuts (↑↓ to navigate, Enter to expand)
      </div>
      <div className="flex flex-col gap-0.5">
        {replies.map((qr, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={qr.id}
              type="button"
              onMouseEnter={() => onHover?.(idx)}
              onClick={() => onSelect(qr)}
              className={cn(
                "flex flex-col items-start gap-1 w-full rounded-xl px-3 py-2 text-left transition-colors cursor-pointer",
                isSelected ? "bg-purple-50 border border-purple-200/60" : "hover:bg-slate-50"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-mono font-bold text-xs text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-md">
                  {qr.shortcut}
                </span>
                <span className="text-[10px] text-slate-400">Shortcut</span>
              </div>
              <p className="text-xs text-[#1D2A54] line-clamp-2 leading-relaxed font-medium">
                {qr.content}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
