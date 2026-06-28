"use client";

import React, { useState } from "react";
import { Zap, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function BusinessQuickRepliesPage() {
  const router = useRouter();
  const [replies, setReplies] = useState([
    { id: "1", shortcut: "/hello", title: "Greeting", content: "Hello! Thank you for reaching out to our business workspace. How can we help you today?" },
    { id: "2", shortcut: "/hours", title: "Business Hours", content: "Our team operates Monday to Friday, 9:00 AM - 6:00 PM EST. We will respond shortly!" },
    { id: "3", shortcut: "/meeting", title: "Schedule Call", content: "Please pick a convenient time on our workspace calendar to schedule a quick sync." },
  ]);

  const handleDelete = (id: string) => {
    setReplies(prev => prev.filter(r => r.id !== id));
    toast.success("Quick reply removed");
  };

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-[#F8FAFC] p-6 md:p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/business/dashboard")}
            className="rounded-full p-2 bg-white border border-[#E6EAFA] hover:bg-gray-50 transition-colors shadow-xs"
          >
            <ArrowLeft className="h-5 w-5 text-[#1D2A54]" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#1D2A54]">Quick Replies</h1>
            <p className="text-xs text-[#8F95B2]">Manage automated template shortcuts for faster customer communication</p>
          </div>
        </div>
        <button
          onClick={() => toast.info("Create template dialog coming soon")}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#8B5CF6] px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#7C3AED]"
        >
          <Plus className="h-4 w-4" /> Add Shortcut
        </button>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 gap-4 max-w-4xl">
        {replies.map((reply) => (
          <div key={reply.id} className="bg-white p-6 rounded-2xl border border-[#E6EAFA] shadow-xs flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2.5 py-1 rounded-md bg-purple-100 text-purple-700 font-mono text-xs font-bold">
                  {reply.shortcut}
                </span>
                <h3 className="font-bold text-[#1D2A54] text-sm">{reply.title}</h3>
              </div>
              <p className="text-sm text-[#8F95B2] leading-relaxed">{reply.content}</p>
            </div>
            <button
              onClick={() => handleDelete(reply.id)}
              className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
