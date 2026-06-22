import { useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { chatService } from "@/services/chat.service";
import { encryptMessage, decryptMessage, generateAndStoreKeyPair } from "@/utils/crypto";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export const useChat = (conversationId: string, currentUserId: string, activePeerId: string) => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recipientPublicKey, setRecipientPublicKey] = useState<string | null>(null);
  const [myPrivateKey, setMyPrivateKey] = useState<string | null>(null);

  // Use refs so the receive handler always has the latest key values
  // without needing to re-register every time they change
  const myPrivateKeyRef = useRef<string | null>(null);
  const recipientPublicKeyRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string>(currentUserId);
  const activePeerIdRef = useRef<string>(activePeerId);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    activePeerIdRef.current = activePeerId;
  }, [activePeerId]);

  useEffect(() => {
    myPrivateKeyRef.current = myPrivateKey;
  }, [myPrivateKey]);

  useEffect(() => {
    recipientPublicKeyRef.current = recipientPublicKey;
  }, [recipientPublicKey]);

  // ── Key Setup ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const setupKeys = async () => {
      if (typeof window === "undefined" || !currentUserId) return;

      const privKeyName = `privateKey_${currentUserId}`;
      const pubKeyName = `publicKey_${currentUserId}`;

      let privKey = localStorage.getItem(privKeyName);
      let pubKey = localStorage.getItem(pubKeyName);

      if (!privKey || !pubKey) {
        pubKey = await generateAndStoreKeyPair(currentUserId);
        privKey = localStorage.getItem(privKeyName);

        const deviceId = localStorage.getItem("deviceId") || "web-client";
        localStorage.setItem("deviceId", deviceId);
        try {
          await chatService.uploadPublicKey(deviceId, pubKey!);
        } catch (e) {
          console.error("Failed to upload public key", e);
        }
      }

      setMyPrivateKey(privKey);
    };

    setupKeys();
  }, [currentUserId]);

  // ── Fetch Recipient Public Key ─────────────────────────────────────────────
  useEffect(() => {
    if (!activePeerId) return;

    const fetchRecipientKey = async () => {
      try {
        const res = await chatService.fetchRecipientKey(activePeerId);
        if (res?.success && res?.data?.publicKey) {
          setRecipientPublicKey(res.data.publicKey);
        } else if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          // Grab the last key in the array (most recently inserted)
          setRecipientPublicKey(res.data[res.data.length - 1].publicKey);
        }
      } catch (err) {
        console.error("Failed to fetch recipient public key", err);
      }
    };

    fetchRecipientKey();
  }, [activePeerId]);

  // ── Load Message History ───────────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId || !myPrivateKey || !recipientPublicKey || !currentUserId || !activePeerId) return;

    const loadHistory = async () => {
      try {
        const historyRes = await chatService.fetchHistory(conversationId);
        if (historyRes?.success && historyRes?.data) {
          const rawMessages = Array.isArray(historyRes.data)
            ? historyRes.data
            : historyRes.data.messages;

          if (Array.isArray(rawMessages)) {
            const decryptedHistory = await Promise.all(
              rawMessages.map(async (msg: any) => {
                try {
                  const targetUserId = msg.senderId === currentUserId ? activePeerId : msg.senderId;
                  
                  let pubKeyToUse = recipientPublicKey;
                  if (targetUserId !== activePeerId) {
                    const res = await chatService.fetchRecipientKey(targetUserId);
                    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
                      pubKeyToUse = res.data[res.data.length - 1].publicKey;
                    } else if (res?.success && res?.data?.publicKey) {
                      pubKeyToUse = res.data.publicKey;
                    }
                  }

                  let text: string;
                  try {
                    text = await decryptMessage(
                      msg.ciphertext,
                      msg.nonce,
                      pubKeyToUse,
                      myPrivateKey
                    );
                  } catch (err) {
                    console.warn(`[History] Decryption failed for msg ${msg.id}, trying latest key...`);
                    // Fallback: fetch the latest key for the target user in case it changed
                    try {
                      const res = await chatService.fetchRecipientKey(targetUserId);
                      let latestKey = pubKeyToUse;
                      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
                        latestKey = res.data[res.data.length - 1].publicKey;
                      }
                      text = await decryptMessage(msg.ciphertext, msg.nonce, latestKey, myPrivateKey);
                      console.log(`[History] Successfully decrypted msg ${msg.id} with latest key!`);
                    } catch (fallbackErr) {
                      throw new Error("Final decryption failed");
                    }
                  }
                  return {
                    id: msg.id,
                    conversationId: msg.conversationId,
                    senderId: msg.senderId,
                    text,
                    createdAt: msg.createdAt,
                  };
                } catch {
                  return {
                    id: msg.id,
                    conversationId: msg.conversationId,
                    senderId: msg.senderId,
                    text: "🔒 Encrypted Message",
                    createdAt: msg.createdAt,
                  };
                }
              })
            );
            // Sort ascending (oldest first)
            decryptedHistory.sort(
              (a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            setMessages(decryptedHistory);
          }
        }
      } catch (err) {
        console.error("Failed to load history", err);
      }
    };

    loadHistory();
  }, [conversationId, myPrivateKey, recipientPublicKey, currentUserId, activePeerId]);

  // ── Socket: Join Room ──────────────────────────────────────────────────────
  // Separate effect so room join doesn't re-fire when keys change
  useEffect(() => {
    if (!socket || !isConnected || !conversationId) return;

    console.log("🔌 [Socket] Joining room:", conversationId);
    socket.emit("chat:join_room", { conversationId });

    const handleJoinedRoom = (payload: any) => {
      console.log("✅ [Socket] Successfully joined room:", payload);
    };

    socket.on("chat:joined_room", handleJoinedRoom);

    return () => {
      socket.off("chat:joined_room", handleJoinedRoom);
    };
  }, [socket, isConnected, conversationId]);

  // ── Socket: Receive Messages ───────────────────────────────────────────────
  // Uses refs to always access current keys without re-registering
  useEffect(() => {
    if (!socket || !isConnected || !conversationId) return;

    const handleReceiveMessage = async (payload: any) => {
      console.log("📥 [Socket] Received chat:receive_message:", payload);

      if (payload.conversationId !== conversationId) {
        console.log(
          "⚠️ [Socket] Ignored message for different conversation:",
          payload.conversationId,
          "Expected:",
          conversationId
        );
        return;
      }

      const privKey = myPrivateKeyRef.current;
      const pubKey = recipientPublicKeyRef.current;

      if (!privKey) {
        console.error("⚠️ [Socket] Missing myPrivateKey — cannot decrypt");
        return;
      }
      if (!pubKey) {
        console.error("⚠️ [Socket] Missing recipientPublicKey — cannot decrypt");
        return;
      }

      if (payload.ciphertext && payload.nonce) {
        try {
          const currentUser = currentUserIdRef.current;
          const peerUser = activePeerIdRef.current;
          const targetUserId = payload.senderId === currentUser ? peerUser : payload.senderId;

          let pubKeyToUse = pubKey;
          if (targetUserId !== peerUser) {
            const res = await chatService.fetchRecipientKey(targetUserId);
            if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
              pubKeyToUse = res.data[res.data.length - 1].publicKey;
            } else if (res?.success && res?.data?.publicKey) {
              pubKeyToUse = res.data.publicKey;
            }
          }

          let text: string;
          try {
            text = await decryptMessage(
              payload.ciphertext,
              payload.nonce,
              pubKeyToUse,
              privKey
            );
          } catch (initialErr) {
            console.warn("⚠️ [Socket] Initial decryption failed, fetching latest key for peer...");
            const res = await chatService.fetchRecipientKey(targetUserId);
            let latestKey = pubKeyToUse;
            if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
              latestKey = res.data[res.data.length - 1].publicKey;
            }
            if (latestKey !== pubKeyToUse) {
              text = await decryptMessage(payload.ciphertext, payload.nonce, latestKey, privKey);
              console.log("✅ [Socket] Successfully decrypted with latest key!");
            } else {
              throw initialErr; // Key didn't change, rethrow
            }
          }

          console.log("✅ [Socket] Decrypted message:", text);

          setMessages((prev) => {
            // Replace an existing optimistic placeholder if present,
            // otherwise deduplicate by real server ID
            const hasRealId = prev.some((m) => m.id === payload.id);
            if (hasRealId) {
              console.log("🔄 [Socket] Duplicate message by server ID, skipping");
              return prev;
            }

            // Look for an optimistic placeholder to replace (last optimistic msg
            // from the same conversation that hasn't been confirmed yet)
            const optimisticIdx = prev.map((m) => m.id).lastIndexOf(
              prev.slice().reverse().find((m) => m.id.startsWith("optimistic-"))?.id ?? ""
            );
            if (optimisticIdx !== -1) {
              const updated = [...prev];
              updated[optimisticIdx] = {
                id: payload.id,
                conversationId: payload.conversationId,
                senderId: payload.senderId,
                text,
                createdAt: payload.createdAt || new Date().toISOString(),
              };
              return updated;
            }

            return [
              ...prev,
              {
                id: payload.id || Date.now().toString(),
                conversationId: payload.conversationId,
                senderId: payload.senderId,
                text,
                createdAt: payload.createdAt || new Date().toISOString(),
              },
            ];
          });
        } catch (err) {
          console.error("❌ [Socket] Failed to decrypt message:", err);
          // Still add the message as unreadable rather than losing it
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.id)) return prev;
            return [
              ...prev,
              {
                id: payload.id || Date.now().toString(),
                conversationId: payload.conversationId,
                senderId: payload.senderId,
                text: "🔒 Encrypted message",
                createdAt: payload.createdAt || new Date().toISOString(),
              },
            ];
          });
        }
      } else if (payload.mediaType || payload.mediaUrl) {
        // Media-only messages
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev;
          const mediaLabel =
            payload.mediaType === "image"
              ? "📷 Photo"
              : payload.mediaType === "video"
              ? "🎥 Video"
              : payload.mediaType === "audio"
              ? "🎤 Voice message"
              : "📎 Media";
          return [
            ...prev,
            {
              id: payload.id || Date.now().toString(),
              conversationId: payload.conversationId,
              senderId: payload.senderId,
              text: mediaLabel,
              createdAt: payload.createdAt || new Date().toISOString(),
            },
          ];
        });
      }
    };

    const handleChatError = (err: any) => {
      console.error("🚨 [Socket] Chat Error:", err);
    };

    socket.on("chat:receive_message", handleReceiveMessage);
    socket.on("chat:error", handleChatError);

    return () => {
      socket.off("chat:receive_message", handleReceiveMessage);
      socket.off("chat:error", handleChatError);
    };
  }, [socket, isConnected, conversationId]);

  // ── Send Message ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string, currentUserId: string) => {
      if (!socket || !isConnected || !myPrivateKey || !recipientPublicKey || !conversationId) {
        console.error("Cannot send: missing keys, socket, or conversationId");
        return;
      }

      // Optimistic local update with a temporary ID
      const optimisticId = `optimistic-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: optimisticId,
          conversationId,
          senderId: currentUserId,
          text,
          createdAt: new Date().toISOString(),
        },
      ]);

      try {
        let pubKeyToUse = recipientPublicKey;
        try {
          const res = await chatService.fetchRecipientKey(activePeerId);
          if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
            pubKeyToUse = res.data[res.data.length - 1].publicKey;
          } else if (res?.success && res?.data?.publicKey) {
            pubKeyToUse = res.data.publicKey;
          }
        } catch (e) {
          console.warn("Failed to fetch latest key before sending, using cached", e);
        }

        const { ciphertext, nonce } = await encryptMessage(
          text,
          pubKeyToUse,
          myPrivateKey
        );

        const payload = { conversationId, ciphertext, nonce };
        socket.emit("chat:send_message", payload);
      } catch (err) {
        console.error("Failed to encrypt and send message:", err);
        // Roll back optimistic update on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      }
    },
    [socket, isConnected, conversationId, myPrivateKey, recipientPublicKey, activePeerId]
  );

  return {
    messages,
    sendMessage,
    isReady: !!(myPrivateKey && recipientPublicKey && isConnected && conversationId),
  };
};
