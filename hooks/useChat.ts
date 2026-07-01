import { useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { chatService } from "@/services/chat.service";
import { encryptMessage, decryptMessage, generateAndStoreKeyPair } from "@/utils/crypto";
import { toast } from "sonner";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document' | null;
}

export const useChat = (conversationId: string, currentUserId: string, activePeerId: string, isBizChat: boolean = false) => {
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
  const isBizChatRef = useRef<boolean>(isBizChat);

  useEffect(() => {
    isBizChatRef.current = isBizChat;
  }, [isBizChat]);

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
    // If there is no peer (B2C thread or unresolved state) do NOT fetch a key.
    // Fetching with an empty string returns a dummy key which causes "incorrect
    // key pair" errors when the server echoes back the message.
    if (!activePeerId || isBizChat) return;

    const fetchRecipientKey = async () => {
      try {
        const res = await chatService.fetchRecipientKey(activePeerId);
        if (res?.success && res?.data?.publicKey) {
          setRecipientPublicKey(res.data.publicKey);
        } else if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          // Grab the last key in the array (most recently inserted)
          setRecipientPublicKey(res.data[res.data.length - 1].publicKey);
        }
        // Do NOT set a dummy fallback key — absence of key = cannot encrypt = safe
      } catch (err) {
        console.error("Failed to fetch recipient public key", err);
      }
    };

    fetchRecipientKey();
  }, [activePeerId, isBizChat]);

  // ── Load Message History ───────────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId || !myPrivateKey || (!recipientPublicKey && !isBizChat) || !currentUserId || (!activePeerId && !isBizChat)) return;

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
                // ── Plaintext bypass rules ─────────────────────────────────────
                // A message must NOT go through libsodium decryption when ANY of:
                //   1. msg.ticketId is set → B2C support ticket message (plaintext
                //      stored in ciphertext column; TLS + DB encryption protect it).
                //      This covers OLD messages saved before the plaintext-only path
                //      was enforced (they may have a non-null nonce from the E2EE
                //      WebSocket path — ignore it, still render as plaintext).
                //   2. isBizChat flag → the whole conversation is a B2C thread.
                //   3. nonce is absent → plaintext was stored directly.
                //   4. ciphertext is absent → media-only message.
                const isTicketMessage = !!msg.ticketId;
                if (!msg.ciphertext || !msg.nonce || isBizChat || isTicketMessage) {
                  return {
                    id: msg.id,
                    conversationId: msg.conversationId,
                    senderId: msg.senderId,
                    text: msg.ciphertext || "",
                    createdAt: msg.createdAt,
                    mediaUrl: msg.mediaUrl,
                    mediaType: msg.mediaType,
                  };
                }

                try {
                  const targetUserId = msg.senderId === currentUserId ? activePeerId : msg.senderId;
                  
                  let pubKeyToUse = recipientPublicKey;
                  if (!pubKeyToUse || (targetUserId && targetUserId !== activePeerId)) {
                    if (targetUserId) {
                      const res = await chatService.fetchRecipientKey(targetUserId);
                      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
                        pubKeyToUse = res.data[res.data.length - 1].publicKey;
                      } else if (res?.success && res?.data?.publicKey) {
                        pubKeyToUse = res.data.publicKey;
                      }
                    }
                  }

                  if (!pubKeyToUse || !myPrivateKey) {
                    throw new Error("Missing keys for decryption");
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
                      if (!latestKey) {
                        throw new Error("Missing fallback key");
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

      const privKey = myPrivateKeyRef.current;
      const pubKey = recipientPublicKeyRef.current;
      const isBiz = isBizChatRef.current;
      // Treat as B2C/plaintext if: explicitly a biz chat, OR no peer resolved yet,
      // OR nonce is absent, OR the message carries a ticketId (B2C ticket message).
      // The ticketId check covers old DB messages that were accidentally saved with
      // a nonce before the plaintext-only B2C path was enforced.
      const noPeer = !activePeerIdRef.current;
      const isTicket = !!(payload.ticketId);

      if (!isBiz && !noPeer && !isTicket && payload.ciphertext && payload.nonce) {
        if (!privKey) {
          console.error("⚠️ [Socket] Missing myPrivateKey — cannot decrypt");
          return;
        }

        try {
          if (!senderId) {
            console.error("❌ [Socket] Malformed payload: missing senderId. Cannot determine decryption key.", payload);
            throw new Error("Missing senderId in payload");
          }

          // If we sent the message (echoed back), we decrypt with the peer's public key.
          // If the peer sent it, we decrypt with the peer's public key.
          const targetUserId = senderId === currentUser ? peerUser : senderId;

          let pubKeyToUse = pubKey;
          if (!pubKeyToUse || (targetUserId && targetUserId !== peerUser)) {
            if (targetUserId) {
              console.log(`[Socket] Target user (${targetUserId}) key needed, fetching...`);
              const res = await chatService.fetchRecipientKey(targetUserId);
              if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
                pubKeyToUse = res.data[res.data.length - 1].publicKey;
              } else if (res?.success && res?.data?.publicKey) {
                pubKeyToUse = res.data.publicKey;
              }
            }
          }

          if (!pubKeyToUse) {
            throw new Error("Missing public key for decryption");
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
            if (latestKey && latestKey !== pubKeyToUse) {
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
      } else if (payload.ciphertext && (!payload.nonce || isBiz || noPeer || isTicket)) {
        // Plaintext: no nonce, B2C chat, peer not resolved, or ticket message
        console.log("ℹ️ [Socket] Plaintext message received");
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev;
          return [
            ...prev,
            {
              id: payload.id || Date.now().toString(),
              conversationId: payload.conversationId,
              senderId: senderId || "unknown",
              text: payload.ciphertext,
              createdAt: payload.createdAt || new Date().toISOString(),
              mediaUrl: payload.mediaUrl,
              mediaType: payload.mediaType,
            },
          ];
        });
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
      // Remove optimistic messages on error
      setMessages((prev) => prev.filter((m) => !m.id.startsWith("optimistic-")));
      
      const errorMessage = err?.message || "Failed to send message.";
      // Special friendly message for block
      if (err?.code === 'SEND_FAILED' && errorMessage.toLowerCase().includes('block')) {
        toast.error("Message not sent. You cannot reply to this conversation.");
      } else {
        toast.error(errorMessage);
      }
    };

    socket.on("chat:receive_message", handleReceiveMessage);
    socket.on("NEW_MESSAGE", handleReceiveMessage);
    socket.on("chat:error", handleChatError);

    return () => {
      socket.off("chat:receive_message", handleReceiveMessage);
      socket.off("NEW_MESSAGE", handleReceiveMessage);
      socket.off("chat:error", handleChatError);
    };
  }, [socket, isConnected, conversationId]);

  // ── Send Message ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string, currentUserId: string, file: File | null = null, skipEncryption: boolean = false) => {
      if (!socket || !isConnected || !conversationId) {
        console.error("Cannot send: missing socket or conversationId");
        return;
      }
      
      // If there is no resolved peer, this is a B2C-style plaintext send regardless
      // of what the caller requested — never encrypt without a real peer identity.
      const effectiveSkipEncryption = skipEncryption || !activePeerId || isBizChatRef.current;

      // If we are encrypting but missing keys, abort
      if (!effectiveSkipEncryption && (!myPrivateKey || !recipientPublicKey)) {
        console.error("Cannot encrypt send: missing keys");
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
          if (effectiveSkipEncryption) {
            // B2C or no-peer: send as plaintext (stored in ciphertext column, nonce stays null)
            ciphertext = text;
            nonce = null;
          } else {
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

            if (!pubKeyToUse) {
              console.error("Cannot encrypt: no recipient public key available. Aborting send.");
              setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
              return;
            }

            // We know myPrivateKey is non-null here because of the guard above
            const encrypted = await encryptMessage(text, pubKeyToUse, myPrivateKey!);
            ciphertext = encrypted.ciphertext;
            nonce = encrypted.nonce;
          }
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
    setMessages,
    clearMessages: () => setMessages([]),
    sendMessage,
    isUploading,
    isReady: !!(myPrivateKey && (recipientPublicKey || isBizChat) && isConnected && conversationId),
  };
};
