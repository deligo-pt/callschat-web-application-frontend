"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { chatService } from "@/services/chat.service";
import { usePresence } from "@/context/PresenceContext";
import { Loader2 } from "lucide-react";
import { getOptimizedImageUrl } from "@/utils/image";

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
        <Loader2 className="h-4 w-4 animate-spin text-[#00A884]" />
      </div>
    );
  }

  // Nothing to render when no contacts are online.
  if (activeUsers.length === 0) return null;

  return (
    <section aria-label="Active Now" className="mt-3 px-4">
      {/* ── Header row with live green dot ── */}
      <div className="flex items-center justify-between px-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#25D366] animate-pulse" />
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#54656F] dark:text-[#8696A0]">
            Active Now
          </h2>
          <span className="text-[11px] font-semibold text-[#8696A0] ml-0.5">
            ({activeUsers.length})
          </span>
        </div>
      </div>

      {/* ── Horizontal avatar strip with clean online indicator ── */}
      <div className="flex items-center gap-3.5 overflow-x-auto px-2 pb-2 scrollbar-none">
        {activeUsers.map((user) => {
          const avatarSrc =
            user.avatar
              ? getOptimizedImageUrl(user.avatar, 48, 48)
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=E0F2FE&color=0284C7&bold=true`;

          const firstName = user.name?.split(" ")[0] || "User";

          return (
            <button
              key={user.id}
              type="button"
              onClick={() => handleUserClick(user.id)}
              className="flex flex-col items-center gap-1 shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00A884] rounded-xl p-1 transition-all"
              aria-label={`Chat with ${user.name}`}
            >
              <div className="relative">
                <div className="h-[46px] w-[46px] rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-[#00A884] transition-all bg-[#F0F2F5] shadow-xs">
                  <img
                    src={getOptimizedImageUrl(avatarSrc)}
                    alt={user.name}
                    width={46}
                    height={46}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    onError={(e) => {
                      const el = e.currentTarget;
                      el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=E0F2FE&color=0284C7&bold=true`;
                    }}
                  />
                </div>
                {/* Clean WhatsApp-style online green badge with white border ring */}
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-[#25D366] border-2 border-white dark:border-[#111B21] shadow-xs"
                />
              </div>
              <span className="text-[11px] font-medium text-[#111B21] dark:text-[#E9EDEF] max-w-[54px] truncate text-center group-hover:text-[#00A884] transition-colors">
                {firstName}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

