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
// A horizontally-scrolling strip of online contact avatars matching the
// Facebook Messenger-style design: blue "Active Now" + "See all" header,
// circular avatars with a thick emerald border ring, no name labels.
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
      <div className="flex items-center justify-center py-4 px-6">
        <Loader2 className="h-5 w-5 animate-spin text-[#3B58F5]" />
      </div>
    );
  }

  // Nothing to render when no contacts are online.
  if (activeUsers.length === 0) return null;

  return (
    <section aria-label="Active Now" className="mt-4">
      {/* ── Header row: "Active Now" (blue) + "See all" (blue) ── */}
      <div className="flex items-center justify-between px-6 mb-3">
        <h2 className="text-[14px] font-bold text-[#3B58F5]">Active Now</h2>
        <button
          className="text-[13px] font-semibold text-[#3B58F5] hover:underline focus:outline-none"
          aria-label="See all active users"
        >
          See all
        </button>
      </div>

      {/* ── Horizontal avatar strip — no name labels ── */}
      <div className="flex items-center gap-3 overflow-x-auto px-6 pb-3 scrollbar-none">
        {activeUsers.map((user) => {
          const avatarSrc =
            user.avatar ??
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=EEF2FB&color=3B58F5&bold=true`;

          return (
            <button
              key={user.id}
              type="button"
              onClick={() => handleUserClick(user.id)}
              className="shrink-0 rounded-full transition-transform hover:scale-105 focus:outline-none"
              aria-label={`Chat with ${user.name}`}
            >
              {/* Thick emerald ring = online indicator (matches image) */}
              <div className="rounded-full border-[3px] border-emerald-500 p-[2.5px] bg-white shadow-sm">
                <img
                  src={avatarSrc}
                  alt={user.name}
                  width={52}
                  height={52}
                  className="h-[52px] w-[52px] rounded-full object-cover bg-[#EEF2FB]"
                  onError={(e) => {
                    const el = e.currentTarget;
                    el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=EEF2FB&color=3B58F5&bold=true`;
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
