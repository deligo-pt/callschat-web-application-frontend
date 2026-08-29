"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, BarChart2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (question: string, options: string[], allowMultiple: boolean) => Promise<any>;
}

export function CreatePollModal({ isOpen, onClose, onSubmit }: CreatePollModalProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAddOption = () => {
    if (options.length >= 12) {
      toast.error("Maximum 12 options allowed");
      return;
    }
    setOptions([...options, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      toast.error("At least 2 options are required");
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, val: string) => {
    const next = [...options];
    next[index] = val;
    setOptions(next);
  };

  const handleSubmit = async () => {
    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      toast.error("Please provide at least 2 non-empty options");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(question.trim(), cleanOptions, allowMultiple);
      toast.success("Poll created successfully!");
      setQuestion("");
      setOptions(["", ""]);
      setAllowMultiple(false);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create poll");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !submitting && onClose()}>
      <DialogContent className="sm:max-w-[460px] bg-white dark:bg-[#111b21] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-gray-100 dark:border-gray-800">
          <DialogTitle className="text-base font-semibold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <BarChart2 className="w-5 h-5" />
            <span>Create Poll</span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Question Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              Question
            </label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
              maxLength={300}
              className="bg-gray-50 dark:bg-[#202c33] border-gray-200 dark:border-gray-700 text-sm focus-visible:ring-emerald-500"
            />
          </div>

          {/* Options Input List */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              Options
            </label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    maxLength={150}
                    className="bg-gray-50 dark:bg-[#202c33] border-gray-200 dark:border-gray-700 text-sm focus-visible:ring-emerald-500"
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(idx)}
                      className="h-9 w-9 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 12 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="w-full mt-2 border-dashed border-gray-300 dark:border-gray-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 gap-1.5 text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Option</span>
              </Button>
            )}
          </div>

          {/* Allow Multiple Answers Switch */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                Allow multiple answers
              </p>
              <p className="text-[11px] text-gray-500">
                Participants can select more than one option
              </p>
            </div>
            <Switch
              checked={allowMultiple}
              onCheckedChange={setAllowMultiple}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
        </div>

        <DialogFooter className="p-4 bg-gray-50 dark:bg-[#182229] border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={submitting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || !question.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Poll"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
