import { useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { chatService } from "@/services/chat.service";
import { encryptMessage, decryptMessage, generateAndStoreKeyPair } from "@/utils/crypto";
import { playNotificationSound } from "@/utils/sounds";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document' | null;
}

export const useChat = (conversationId: string, currentUserId: string, activePeerId: string) => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recipientPublicKey, setRecipientPublicKey] = useState<string | null>(null);
  const [myPrivateKey, setMyPrivateKey] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
      }

      const deviceId = localStorage.getItem("deviceId") || "web-client";
      localStorage.setItem("deviceId", deviceId);
      try {
        await chatService.uploadPublicKey(deviceId, pubKey!);
      } catch (e) {
        console.error("Failed to upload public key", e);
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
                // Media-only message — skip decryption, return as-is
                if (!msg.ciphertext || !msg.nonce) {
                  return {
                    id: msg.id,
                    conversationId: msg.conversationId,
                    senderId: msg.senderId,
                    text: "",
                    createdAt: msg.createdAt,
                    mediaUrl: msg.mediaUrl,
                    mediaType: msg.mediaType,
                  };
                }

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
                    mediaUrl: msg.mediaUrl,
                    mediaType: msg.mediaType,
                  };
                } catch {
                  return {
                    id: msg.id,
                    conversationId: msg.conversationId,
                    senderId: msg.senderId,
                    text: "🔒 Encrypted Message",
                    createdAt: msg.createdAt,
                    mediaUrl: msg.mediaUrl,
                    mediaType: msg.mediaType,
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

      const currentUser = currentUserIdRef.current;
      const peerUser = activePeerIdRef.current;
      const senderId = payload.senderId || payload.sender?.id;

      // Play sound if we received a message from someone else
      if (senderId && senderId !== currentUser) {
        playNotificationSound("message");
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
          if (!senderId) {
            console.error("❌ [Socket] Malformed payload: missing senderId. Cannot determine decryption key.", payload);
            throw new Error("Missing senderId in payload");
          }

          // If we sent the message (echoed back), we decrypt with the peer's public key.
          // If the peer sent it, we decrypt with the peer's public key.
          const targetUserId = senderId === currentUser ? peerUser : senderId;

          let pubKeyToUse = pubKey;
          if (targetUserId !== peerUser) {
            console.log(`[Socket] Target user (${targetUserId}) is not active peer (${peerUser}), fetching their key...`);
            const res = await chatService.fetchRecipientKey(targetUserId);
            if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
              pubKeyToUse = res.data[res.data.length - 1].publicKey;
            } else if (res?.success && res?.data?.publicKey) {
              pubKeyToUse = res.data.publicKey;
            }
          }

          console.log(`[Socket] Attempting decryption. Sender: ${senderId}, Decrypting with Public Key of: ${targetUserId}`);

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
              // Update the ref so future messages don't fail!
              if (targetUserId === peerUser) {
                setRecipientPublicKey(latestKey);
                recipientPublicKeyRef.current = latestKey;
              }
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
                mediaUrl: payload.mediaUrl,
                mediaType: payload.mediaType,
              };
              return updated;
            }

            return [
              ...prev,
              {
                id: payload.id || Date.now().toString(),
                conversationId: payload.conversationId,
                senderId: senderId,
                text,
                createdAt: payload.createdAt || new Date().toISOString(),
                mediaUrl: payload.mediaUrl,
                mediaType: payload.mediaType,
              },
            ];
          });
        } catch (err) {
          console.error("❌ [Socket] Failed to decrypt message:", err);
          
          const fallbackSenderId = payload.senderId || payload.sender?.id || "unknown";

          // Still add the message as unreadable rather than losing it
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.id)) return prev;
            return [
              ...prev,
              {
                id: payload.id || Date.now().toString(),
                conversationId: payload.conversationId,
                senderId: fallbackSenderId,
                text: "🔒 Encrypted message (Decryption Failed)",
                createdAt: payload.createdAt || new Date().toISOString(),
                mediaUrl: payload.mediaUrl,
                mediaType: payload.mediaType,
              },
            ];
          });
        }
      } else if (payload.mediaType || payload.mediaUrl) {
        // Media-only messages (no text)
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev;
          return [
            ...prev,
            {
              id: payload.id || Date.now().toString(),
              conversationId: payload.conversationId,
              senderId: payload.senderId || payload.sender?.id || "unknown",
              text: "",
              createdAt: payload.createdAt || new Date().toISOString(),
              mediaUrl: payload.mediaUrl,
              mediaType: payload.mediaType,
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
    async (text: string, currentUserId: string, file: File | null = null) => {
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
          text: file ? "Uploading media..." : text,
          createdAt: new Date().toISOString(),
          // We don't have the mediaUrl yet for optimistic update
        },
      ]);

      try {
        let mediaUrl;
        let mediaType;
        
        if (file) {
          setIsUploading(true);
          const uploadRes = await chatService.uploadMedia(conversationId, file);
          if (uploadRes.success) {
            mediaUrl = uploadRes.data.mediaUrl;
            mediaType = uploadRes.data.mediaType;
            
            // Update the optimistic message to show the media preview (if it's local URL we could use ObjectURL, but we just wait for real msg)
          }
          setIsUploading(false);
        }

        let ciphertext, nonce;
        if (text) {
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

          const encrypted = await encryptMessage(text, pubKeyToUse, myPrivateKey);
          ciphertext = encrypted.ciphertext;
          nonce = encrypted.nonce;
        }

        const payload = { conversationId, ciphertext, nonce, mediaUrl, mediaType };
        socket.emit("chat:send_message", payload);
        
        // Remove optimistic message if no text, as server will echo it back
        if (!text) {
          setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        }
      } catch (err) {
        console.error("Failed to encrypt and send message:", err);
        // Roll back optimistic update on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setIsUploading(false);
      }
    },
    [socket, isConnected, conversationId, myPrivateKey, recipientPublicKey, activePeerId]
  );

  return {
    messages,
    sendMessage,
    isUploading,
    isReady: !!(myPrivateKey && recipientPublicKey && isConnected && conversationId),
  };
};
