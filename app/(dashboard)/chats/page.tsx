"use client";

import React from "react";
import { MessageSquare } from "lucide-react";

export default function ChatsEmptyStatePage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl shadow-blue-500/5 mb-6">
        <MessageSquare className="h-10 w-10 text-[#3B58F5]" strokeWidth={1.5} />
      </div>
      <h2 className="text-[24px] font-bold text-[#1D2A54]">Your Messages</h2>
      <p className="mt-2 text-[15px] font-medium text-[#8F95B2] max-w-sm">
        Select a conversation from the sidebar or start a new chat to begin messaging securely.
      </p>
      <button className="mt-8 rounded-2xl bg-[#3B58F5] px-8 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-[#3B58F5]/25 transition-all hover:bg-[#2C48B8] active:scale-95">
        Start a New Conversation
      </button>
    </div>
  );
}

