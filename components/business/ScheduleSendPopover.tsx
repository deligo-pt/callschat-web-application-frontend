"use client";

import React, { useState } from "react";
import { Clock, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface ScheduleSendPopoverProps {
  disabled?: boolean;
  onSchedule: (scheduledForIso: string) => Promise<boolean | void> | boolean | void;
}

export function ScheduleSendPopover({ disabled, onSchedule }: ScheduleSendPopoverProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Default to 1 hour from now
  const getDefaultDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    return now.toISOString().slice(0, 16);
  };

  const [dateTime, setDateTime] = useState<string>(getDefaultDateTime);

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 2); // At least 2 minutes in the future
    return now.toISOString().slice(0, 16);
  };

  const handleScheduleClick = async () => {
    if (!dateTime) {
      toast.error("Please select a date and time");
      return;
    }

    const selectedDate = new Date(dateTime);
    const now = new Date();

    if (selectedDate.getTime() <= now.getTime() + 60000) {
      toast.error("Scheduled time must be at least 1 minute in the future");
      return;
    }

    setLoading(true);
    try {
      const result = await onSchedule(selectedDate.toISOString());
      if (result !== false) {
        setOpen(false);
      }
    } catch (err) {
      console.error("Failed to schedule message", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          title="Schedule Send"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E6EAFA] bg-white text-purple-600 shadow-xs hover:bg-purple-50 hover:border-purple-300 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <Clock className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" side="top" className="w-72 p-3.5 shadow-xl border-[#E6EAFA]">
        <div className="flex items-center gap-2 border-b border-[#E6EAFA] pb-2 mb-3">
          <Calendar className="h-4 w-4 text-purple-600" />
          <h4 className="text-xs font-extrabold text-[#11142D] uppercase tracking-wider">
            Schedule Message
          </h4>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              Select Delivery Date & Time
            </label>
            <input
              type="datetime-local"
              value={dateTime}
              min={getMinDateTime()}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full rounded-lg border border-[#E6EAFA] bg-[#F8FAFC] px-2.5 py-2 text-xs font-semibold text-[#11142D] outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Message will be dispatched automatically by the background worker at the scheduled time.
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-7 text-xs px-2.5"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={loading || !dateTime}
              onClick={handleScheduleClick}
              className="h-7 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3 shadow-xs"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Clock className="h-3.5 w-3.5 mr-1" />}
              Schedule
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
