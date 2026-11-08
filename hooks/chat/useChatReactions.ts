import { useCallback, useEffect } from "react";
import { Socket } from "socket.io-client";
import { chatService } from "@/services/chat.service";
import { ChatMessage, MessageReactionItem } from "../useChat";

interface UseChatReactionsParams {
  conversationId: string;
  currentUserId: string;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  socket: Socket | null;
}

export function useChatReactions({
  conversationId,
  currentUserId,
  messages,
  setMessages,
  socket,
}: UseChatReactionsParams) {
  // Listen for real-time reaction updates from peers
  useEffect(() => {
    if (!socket || !conversationId) return;

    const handleReactionsUpdated = (payload: {
      conversationId?: string;
      messageId: string;
      reactions: MessageReactionItem[];
    }) => {
      if (payload.conversationId && payload.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === payload.messageId ? { ...m, reactions: payload.reactions || [] } : m
        )
      );
    };

    socket.on("chat:reaction_updated", handleReactionsUpdated);

    return () => {
      socket.off("chat:reaction_updated", handleReactionsUpdated);
    };
  }, [socket, conversationId, setMessages]);

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!conversationId) return;
      const msg = messages.find((m) => m.id === messageId);
      const existing = msg?.reactions?.find(
        (r) => r.userId === currentUserId && r.emoji === emoji
      );

      // Optimistic update
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const currentReactions = m.reactions || [];
          if (existing) {
            return {
              ...m,
              reactions: currentReactions.filter(
                (r) => !(r.userId === currentUserId && r.emoji === emoji)
              ),
            };
          } else {
            const filtered = currentReactions.filter((r) => r.userId !== currentUserId);
            return {
              ...m,
              reactions: [
                ...filtered,
                {
                  id: `optimistic-${Date.now()}`,
                  emoji,
                  userId: currentUserId || "",
                  createdAt: new Date().toISOString(),
                },
              ],
            };
          }
        })
      );

      try {
        if (existing) {
          await chatService.removeReaction(conversationId, messageId);
        } else {
          await chatService.addReaction(conversationId, messageId, emoji);
        }
      } catch (err) {
        console.error("[useChatReactions] Failed to toggle reaction", err);
      }
    },
    [conversationId, currentUserId, messages, setMessages]
  );

  return {
    toggleReaction,
  };
}

