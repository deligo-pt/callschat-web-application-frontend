"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import { Send, ArrowLeft, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ChatRoomPage() {
  const params = useParams();
  const chatId = params.chatId as string;
  const [recipientId, setRecipientId] = useState<string>("target-user-id");
  const [currentUserId, setCurrentUserId] = useState<string>("my-user-id");
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
       // In reality, this would be derived from JWT or profile API
       setCurrentUserId("user-1");
       setRecipientId("user-2"); // And recipientId from conversation API
    }
  }, []);

  const { messages, sendMessage, isReady } = useChat(chatId, recipientId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    sendMessage(inputText, currentUserId);
    setInputText("");
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex items-center gap-4 bg-white px-6 py-4 border-b border-[#E6EAFA] shadow-sm z-10 shrink-0">
        <Link href="/chats" className="md:hidden rounded-full p-1.5 transition-colors hover:bg-[#F4F6FC]">
          <ArrowLeft className="h-5 w-5 text-[#8F95B2]" strokeWidth={2.5} />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E6EAFA] overflow-hidden shrink-0 text-[#8F95B2] font-bold">
            R
          </div>
          <div className="flex flex-col">
            <h2 className="text-[15px] font-bold text-[#1D2A54]">Chat {chatId}</h2>
            <span className="flex items-center gap-1 text-[12px] font-medium text-[#8F95B2]">
              {isReady ? <><Lock className="h-3 w-3 text-green-500" /> Encrypted E2EE</> : "Connecting..."}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#8F95B2]">
            {isReady ? "No messages yet. Send a message to start." : <Loader2 className="h-8 w-8 animate-spin text-[#3B58F5]" />}
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[70%] rounded-2xl px-5 py-3 text-[14px] shadow-sm",
                  isMe ? "bg-[#3B58F5] text-white rounded-tr-sm" : "bg-white text-[#1D2A54] border border-[#E6EAFA] rounded-tl-sm"
                )}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Form */}
      <div className="bg-white p-4 border-t border-[#E6EAFA] shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={!isReady}
            placeholder={isReady ? "Type your secure message..." : "Setting up encryption..."}
            className="flex-1 h-12 rounded-2xl bg-[#F4F6FC] px-5 text-[14px] font-medium text-[#11142D] placeholder-[#8F95B2] focus:outline-none focus:ring-1 focus:ring-[#3B58F5]/50"
          />
          <button 
            type="submit" 
            disabled={!isReady || !inputText.trim()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#3B58F5] text-white transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-md shadow-[#3B58F5]/25"
          >
            <Send className="h-5 w-5 ml-1" strokeWidth={2.5} />
          </button>
        </form>
      </div>
    </div>
  );
}
