"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { chatService } from "@/services/chat.service";
import { usePresence } from "@/context/PresenceContext";
import { Loader2 } from "lucide-react";

// =============================================================================
// ActiveNowTray
// Location: components/chat/ActiveNowTray.tsx
//
// A horizontally-scrolling strip of online contact avatars.
// Clicking an avatar initiates/resumes a 1-on-1 conversation and navigates
// the user to the chat room.
//
// Data source: usePresence().activeUsers — hydrated from the REST endpoint
// on mount and kept live by socket user:online / user:offline events.
// =============================================================================

export function ActiveNowTray() {
  const router = useRouter();
  const { activeUsers, isLoading } = usePresence();

  // Open a 1-on-1 conversation with the tapped contact.
  const handleUserClick = async (userId: string) => {
    try {
      const res = await chatService.initiateConversation(userId);
      const convId = res?.data?.conversationId ?? res?.conversationId;
      if (convId) {
        router.push(`/chats/${convId}?recipientId=${userId}`);
      }
    } catch (err) {
      console.error("[ActiveNowTray] Failed to open conversation:", err);
    }
  };

  // Show a spinner only during the very first load.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4 px-4">
        <Loader2 className="h-5 w-5 animate-spin text-[#3B58F5]" />
      </div>
    );
  }

  // Nothing to render when no contacts are online.
  if (activeUsers.length === 0) return null;

  return (
    <section aria-label="Active Now" className="mt-2 px-6">
      {/* Section Label */}
      <h2 className="text-[14px] font-bold text-[#1D2A54]">Active Now</h2>

      {/* Horizontal scroll strip */}
      <div className="mt-3 flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
        {activeUsers.map((user) => {
          // Build a fallback avatar URL using ui-avatars so we never show a
          // broken <img> when the user has not set a profile photo.
          const avatarSrc =
            user.avatar ??
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=EEF2FB&color=3B58F5&bold=true`;

          // Show only the first name to keep the label compact.
          const firstName = user.name.split(" ")[0];

          return (
            <button
              key={user.id}
              type="button"
              onClick={() => handleUserClick(user.id)}
              className="relative flex shrink-0 flex-col items-center gap-1.5 focus:outline-none"
              aria-label={`Chat with ${user.name}`}
            >
              {/* Avatar wrapper with green ring */}
              <div className="relative">
                <img
                  src={avatarSrc}
                  alt={user.name}
                  width={52}
                  height={52}
                  className="h-[52px] w-[52px] rounded-full object-cover bg-[#EEF2FB] transition-transform hover:scale-105"
                  onError={(e) => {
                    // Graceful fallback: swap to ui-avatars if the CDN URL 404s.
                    const el = e.currentTarget;
                    el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=EEF2FB&color=3B58F5&bold=true`;
                  }}
                />

                {/* Green presence dot — always shown because every user in
                    activeUsers is by definition online right now. */}
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500"
                />
              </div>

              {/* First name label */}
              <span className="max-w-[56px] truncate text-center text-[11px] font-medium text-[#8F95B2]">
                {firstName}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
