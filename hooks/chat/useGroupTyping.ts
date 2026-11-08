import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Socket } from "socket.io-client";

interface UseGroupTypingParams {
  groupId: string;
  currentUserId: string;
  socket: Socket | null;
  isConnected: boolean;
}

export function useGroupTyping({
  groupId,
  currentUserId,
  socket,
  isConnected,
}: UseGroupTypingParams) {
  const [typingMap, setTypingMap] = useState<Record<string, Map<string, string>>>({});
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const typingUsers = useMemo(
    () => typingMap[groupId] || new Map<string, string>(),
    [typingMap, groupId]
  );

  useEffect(() => {
    const timeouts = typingTimeoutsRef.current;
    return () => {
      timeouts.forEach((t) => clearTimeout(t));
      timeouts.clear();
    };
  }, [groupId]);

  useEffect(() => {
    if (!socket || !groupId) return;

    const handleTypingStart = (payload: { groupId: string; userId: string; userName?: string }) => {
      if (payload.groupId !== groupId) return;
      if (payload.userId === currentUserId) return;

      setTypingMap((prev) => {
        const next = new Map(prev[groupId] || new Map());
        next.set(payload.userId, payload.userName || "Someone");
        return { ...prev, [groupId]: next };
      });

      const existingTimeout = typingTimeoutsRef.current.get(payload.userId);
      if (existingTimeout) clearTimeout(existingTimeout);

      const timeout = setTimeout(() => {
        setTypingMap((prev) => {
          const next = new Map(prev[groupId] || new Map());
          next.delete(payload.userId);
          return { ...prev, [groupId]: next };
        });
      }, 4000);
      typingTimeoutsRef.current.set(payload.userId, timeout);
    };

    const handleTypingStop = (payload: { groupId: string; userId: string }) => {
      if (payload.groupId !== groupId) return;
      setTypingMap((prev) => {
        const next = new Map(prev[groupId] || new Map());
        next.delete(payload.userId);
        return { ...prev, [groupId]: next };
      });
      const existingTimeout = typingTimeoutsRef.current.get(payload.userId);
      if (existingTimeout) clearTimeout(existingTimeout);
    };

    socket.on("group:typing_start", handleTypingStart);
    socket.on("group:typing_stop", handleTypingStop);

    return () => {
      socket.off("group:typing_start", handleTypingStart);
      socket.off("group:typing_stop", handleTypingStop);
    };
  }, [socket, groupId, currentUserId]);

  const startTyping = useCallback(() => {
    if (socket && isConnected && groupId) {
      socket.emit("group:typing_start", { groupId });
    }
  }, [socket, isConnected, groupId]);

  const stopTyping = useCallback(() => {
    if (socket && isConnected && groupId) {
      socket.emit("group:typing_stop", { groupId });
    }
  }, [socket, isConnected, groupId]);

  const typingText = useMemo(() => {
    const names = Array.from(typingUsers.values());
    if (names.length === 0) return "";
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return `${names[0]}, ${names[1]} and ${names.length - 2} others are typing...`;
  }, [typingUsers]);

  return {
    typingUsers,
    typingText,
    startTyping,
    stopTyping,
  };
}

