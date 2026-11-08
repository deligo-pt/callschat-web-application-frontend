import { useCallback, useEffect } from "react";
import { Socket } from "socket.io-client";
import { groupService } from "@/services/group.service";
import { GroupMessage, GroupMessageReactionItem } from "../useGroupChat";

interface UseGroupReactionsParams {
  groupId: string;
  currentUserId: string;
  messages: GroupMessage[];
  setMessages: React.Dispatch<React.SetStateAction<GroupMessage[]>>;
  socket: Socket | null;
}

export function useGroupReactions({
  groupId,
  currentUserId,
  messages,
  setMessages,
  socket,
}: UseGroupReactionsParams) {
  useEffect(() => {
    if (!socket || !groupId) return;

    const handleReactionsUpdated = (payload: {
      groupId: string;
      messageId: string;
      reactions: GroupMessageReactionItem[];
    }) => {
      if (payload.groupId !== groupId) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === payload.messageId ? { ...m, reactions: payload.reactions } : m))
      );
    };

    socket.on("group:reaction_updated", handleReactionsUpdated);

    return () => {
      socket.off("group:reaction_updated", handleReactionsUpdated);
    };
  }, [socket, groupId, setMessages]);

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      const msg = messages.find((m) => m.id === messageId);
      const existing = msg?.reactions?.find((r) => r.userId === currentUserId && r.emoji === emoji);

      if (existing) {
        await groupService.removeReaction(groupId, messageId);
      } else {
        await groupService.addReaction(groupId, messageId, emoji);
      }
    },
    [groupId, messages, currentUserId]
  );

  return {
    toggleReaction,
  };
}

