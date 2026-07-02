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
  mediaType?: 'image' | 'video' | 'audio' | 'document' | 'link' | string | null;
}

export const useChat = (conversationId: string, currentUserId: string, activePeerId: string, isBizChat: boolean = false) => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recipientPublicKey, setRecipientPublicKey] = useState<string | null>(null);
  const [myPrivateKey, setMyPrivateKey] = useState<string | null>(null);
  const [myPublicKey, setMyPublicKey] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Use refs so the receive handler always has the latest key values
  // without needing to re-register every time they change
  const myPrivateKeyRef = useRef<string | null>(null);
  const myPublicKeyRef = useRef<string | null>(null);
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
    myPublicKeyRef.current = myPublicKey;
  }, [myPublicKey]);

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

      // Use a per-user deviceId so different users never overwrite each other's
      // key entry, and so the same user's key is stable across sessions on this
      // browser (keyed by userId, not a global "web-client" constant).
      const deviceId = `web-${currentUserId}`;
      localStorage.setItem("deviceId", deviceId);
      try {
        await chatService.uploadPublicKey(deviceId, pubKey!);
      } catch (e) {
        console.error("Failed to upload public key", e);
      }

      setMyPrivateKey(privKey);
      setMyPublicKey(pubKey);
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
        // Guard: if backend returns empty array (no key registered), do not set any key
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          // Grab the last key in the array (most recently inserted)
          setRecipientPublicKey(res.data[res.data.length - 1].publicKey);
        } else if (res?.success && res?.data?.publicKey) {
          setRecipientPublicKey(res.data.publicKey);
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
                //   1. msg.ticketId is set → B2C support ticket message.
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
                  if (!myPrivateKey) throw new Error("Missing private key");

                  // ── Key selection logic ────────────────────────────────────
                  // NaCl crypto_box_open_easy(cipher, nonce, SENDER_pubKey, MY_privKey)
                  // The shared secret is symmetric: DH(A.priv, B.pub) == DH(B.priv, A.pub)
                  // BUT the ciphertext was created by the sender so we need
                  // the SENDER's public key + OUR private key.
                  //
                  // For messages WE sent (senderId === currentUserId):
                  //   - We encrypted as: crypto_box_easy(msg, nonce, peerPub, myPriv)
                  //   - We decrypt as:   crypto_box_open_easy(cipher, nonce, peerPub, myPriv)
                  //   → senderPublicKey = PEER's public key ✓
                  //
                  // For messages PEER sent (senderId !== currentUserId):
                  //   - Peer encrypted as: crypto_box_easy(msg, nonce, myPub, peerPriv)
                  //   - We decrypt as:     crypto_box_open_easy(cipher, nonce, peerPub, myPriv)
                  //   → senderPublicKey = PEER's public key ✓
                  //
                  // In both cases senderPublicKey = peerPub + our privKey. This is correct.
                  // If decryption fails it means the peer's key changed — try fetching
                  // fresh key. As a last resort try our own public key (alternate DH direction).

                  const isSentByMe = msg.senderId === currentUserId;
                  // targetUserId: the OTHER party in this specific message's crypto context
                  const targetUserId = isSentByMe ? activePeerId : msg.senderId;

                  // Resolve the senderPublicKey to decrypt with
                  const resolvePeerKey = async (uid: string): Promise<string | null> => {
                    if (uid === activePeerId && recipientPublicKey) return recipientPublicKey;
                    try {
                      const res = await chatService.fetchRecipientKey(uid);
                      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
                        return res.data[res.data.length - 1].publicKey;
                      } else if (res?.success && res?.data?.publicKey) {
                        return res.data.publicKey;
                      }
                    } catch { /* ignore */ }
                    return null;
                  };

                  const peerPubKey = await resolvePeerKey(targetUserId);
                  if (!peerPubKey) throw new Error("No public key available for decryption");

                  // ── Attempt 1: peer pub key + my priv key (standard path) ──
                  let text: string;
                  try {
                    text = await decryptMessage(msg.ciphertext, msg.nonce, peerPubKey, myPrivateKey);
                  } catch {
                    // ── Attempt 2: fetch latest peer key (key rotation) ────────
                    console.warn(`[History] Decryption failed for msg ${msg.id}, trying latest key...`);
                    let decrypted = false;

                    try {
                      const res = await chatService.fetchRecipientKey(targetUserId);
                      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
                        const latestKey = res.data[res.data.length - 1].publicKey;
                        if (latestKey && latestKey !== peerPubKey) {
                          text = await decryptMessage(msg.ciphertext, msg.nonce, latestKey, myPrivateKey);
                          console.log(`[History] Decrypted msg ${msg.id} with rotated peer key.`);
                          decrypted = true;
                        }
                      }
                    } catch { /* continue to next attempt */ }

                    // ── Attempt 3: use MY OWN public key as senderPublicKey ────
                    // This handles the case where the local keypair was regenerated
                    // and the message was originally encrypted by the other party
                    // using an older version of our public key that no longer matches.
                    if (!decrypted && myPublicKey) {
                      try {
                        text = await decryptMessage(msg.ciphertext, msg.nonce, myPublicKey, myPrivateKey);
                        console.log(`[History] Decrypted msg ${msg.id} using own public key (key rotation recovery).`);
                        decrypted = true;
                      } catch { /* all attempts exhausted */ }
                    }

                    if (!decrypted) {
                      throw new Error("All decryption attempts failed");
                    }
                  }

                  return {
                    id: msg.id,
                    conversationId: msg.conversationId,
                    senderId: msg.senderId,
                    text: text!,
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
  }, [conversationId, myPrivateKey, myPublicKey, recipientPublicKey, currentUserId, activePeerId]);

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

          let text = "";
          try {
            text = await decryptMessage(
              payload.ciphertext,
              payload.nonce,
              pubKeyToUse,
              privKey
            );
          } catch (initialErr) {
            console.warn("⚠️ [Socket] Initial decryption failed, fetching latest key for peer...");
            let decryptedRealtime = false;

            // Attempt 1: fetch the latest key for the peer (handles key rotation)
            try {
              const res = await chatService.fetchRecipientKey(targetUserId);
              if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
                const latestKey = res.data[res.data.length - 1].publicKey;
                if (latestKey && latestKey !== pubKeyToUse) {
                  text = await decryptMessage(payload.ciphertext, payload.nonce, latestKey, privKey);
                  console.log("✅ [Socket] Successfully decrypted with latest key!");
                  if (targetUserId === peerUser) {
                    setRecipientPublicKey(latestKey);
                    recipientPublicKeyRef.current = latestKey;
                  }
                  decryptedRealtime = true;
                }
              }
            } catch { /* continue to next attempt */ }

            // Attempt 2: try our own public key as the senderPublicKey
            if (!decryptedRealtime && myPublicKeyRef.current) {
              try {
                text = await decryptMessage(payload.ciphertext, payload.nonce, myPublicKeyRef.current, privKey);
                console.log("✅ [Socket] Decrypted with own public key (key rotation recovery).");
                decryptedRealtime = true;
              } catch { /* all attempts exhausted */ }
            }

            if (!decryptedRealtime) {
              throw initialErr;
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
      
      let optimisticMediaType: string | undefined = undefined;
      let optimisticMediaUrl: string | undefined = undefined;
      if (file) {
        optimisticMediaUrl = URL.createObjectURL(file);
        if (file.type.startsWith("image")) optimisticMediaType = "image";
        else if (file.type.startsWith("video")) optimisticMediaType = "video";
        else if (file.type.startsWith("audio")) optimisticMediaType = "audio";
        else optimisticMediaType = "document";
      } else if (text) {
        const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch && urlMatch[0]) {
          optimisticMediaUrl = urlMatch[0];
          optimisticMediaType = "link";
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: optimisticId,
          conversationId,
          senderId: currentUserId,
          text: text,
          createdAt: new Date().toISOString(),
          mediaUrl: optimisticMediaUrl,
          mediaType: optimisticMediaType,
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
        } else if (text) {
          const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
          if (urlMatch && urlMatch[0]) {
            mediaUrl = urlMatch[0];
            mediaType = 'link';
          }
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
