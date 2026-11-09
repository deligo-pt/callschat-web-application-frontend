import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Socket } from "socket.io-client";

interface UseChatTypingParams {
  conversationId: string;
  currentUserId: string;
  socket: Socket | null;
  isConnected: boolean;
}

export function useChatTyping({
  conversationId,
  currentUserId,
  socket,
  isConnected,
}: UseChatTypingParams) {
  const [typingMap, setTypingMap] = useState<Record<string, Set<string>>>({});
  const isTypingLocallyRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const typingUsers = useMemo(
    () => typingMap[conversationId] || new Set<string>(),
    [typingMap, conversationId]
  );

  useEffect(() => {
    return () => {
      isTypingLocallyRef.current = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId]);

  useEffect(() => {
    if (!socket || !conversationId) return;

    const handleTypingStart = (payload: { conversationId: string; userId: string }) => {
      if (payload.conversationId !== conversationId) return;
      if (payload.userId === currentUserId) return;

      setTypingMap((prev) => {
        const next = new Set(prev[conversationId] || []);
        next.add(payload.userId);
        return { ...prev, [conversationId]: next };
      });
    };

    const handleTypingStop = (payload: { conversationId: string; userId: string }) => {
      if (payload.conversationId !== conversationId) return;

      setTypingMap((prev) => {
        const next = new Set(prev[conversationId] || []);
        next.delete(payload.userId);
        return { ...prev, [conversationId]: next };
      });
    };

    socket.on("chat:typing_start", handleTypingStart);
    socket.on("chat:typing_stop", handleTypingStop);

    return () => {
      socket.off("chat:typing_start", handleTypingStart);
      socket.off("chat:typing_stop", handleTypingStop);
    };
  }, [socket, conversationId, currentUserId]);

  const handleTyping = useCallback(() => {
    if (!socket || !isConnected || !conversationId) return;

    if (!isTypingLocallyRef.current) {
      isTypingLocallyRef.current = true;
      socket.emit("chat:typing_start", { conversationId });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingLocallyRef.current = false;
      socket.emit("chat:typing_stop", { conversationId });
    }, 3000);
  }, [socket, isConnected, conversationId]);

  return {
    typingUsers,
    handleTyping,
  };
}

