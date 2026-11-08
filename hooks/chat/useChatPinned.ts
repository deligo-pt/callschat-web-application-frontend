import { useState, useEffect, useMemo, useCallback } from "react";
import { ChatMessage, PinnedMessage } from "../useChat";

interface UseChatPinnedParams {
  messages: ChatMessage[];
  sendMessage: (text: string, recipientId: string) => Promise<void> | void;
  currentUserId: string;
}

export function useChatPinned({
  messages,
  sendMessage,
  currentUserId,
}: UseChatPinnedParams) {
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const pinnedMessages = useMemo(() => {
    const map = new Map<string, PinnedMessage>();

    for (const msg of messages) {
      if (msg.text && msg.text.startsWith("__PIN_EVENT__:")) {
        try {
          const payload = JSON.parse(msg.text.substring("__PIN_EVENT__:".length));
          if (payload && payload.messageId && payload.action) {
            if (payload.action === "pin") {
              const timestamp = payload.timestamp || new Date(msg.createdAt).getTime();
              const pinnedUntil = payload.durationSeconds ? timestamp + payload.durationSeconds * 1000 : null;

              if (!pinnedUntil || currentTime === 0 || pinnedUntil > currentTime) {
                map.set(payload.messageId, {
                  messageId: payload.messageId,
                  pinnedAt: timestamp,
                  pinnedUntil,
                  pinnerName: payload.pinnerName || "You",
                  previewText: payload.previewText,
                  previewMedia: payload.previewMedia,
                });
              } else {
                map.delete(payload.messageId);
              }
            } else if (payload.action === "unpin") {
              map.delete(payload.messageId);
            }
          }
        } catch {
          // Ignore malformed pin events
        }
      }
    }

    const result: PinnedMessage[] = [];
    for (const pin of map.values()) {
      const orig = messages.find((m) => m.id === pin.messageId);
      result.push({
        ...pin,
        originalMessage: orig,
      });
    }

    return result.sort((a, b) => b.pinnedAt - a.pinnedAt);
  }, [messages, currentTime]);

  const pinMessage = useCallback(
    (
      messageId: string,
      action: "pin" | "unpin",
      durationSeconds?: number,
      previewText?: string,
      previewMedia?: string,
      pinnerName: string = "You"
    ) => {
      const payload = {
        messageId,
        action,
        durationSeconds: durationSeconds || null,
        timestamp: Date.now(),
        pinnerName,
        previewText: previewText || "",
        previewMedia: previewMedia || "",
      };
      sendMessage(`__PIN_EVENT__:${JSON.stringify(payload)}`, currentUserId);
    },
    [sendMessage, currentUserId]
  );

  return {
    pinnedMessages,
    pinMessage,
  };
}

