import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { chatService } from "@/services/chat.service";
import { getUserPrivateKey, getUserPublicKey, migrateKeysFromLocalStorage } from "@/utils/keyStore";
import { encryptMessage, decryptMessage, generateAndStoreKeyPair } from "@/utils/crypto";
import { compressImage } from "@/utils/image";
import { toast } from "sonner";

export interface MessageReceipt {
  id: string;
  userId: string;
  deliveredAt: string | null;
  seenAt: string | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document' | 'link' | string | null;
  isEdited?: boolean;
  isDeleted?: boolean;
  /** Per-message disappear timer in seconds, stamped at send time. */
  disappearAfterSeconds?: number | null;
  receipts?: MessageReceipt[];
}

export interface PinnedMessage {
  messageId: string;
  pinnedAt: number;
  pinnedUntil: number | null;
  pinnerName: string;
  previewText?: string;
  previewMedia?: string;
  originalMessage?: ChatMessage;
}

const parseEditedText = (rawText: string) => {
  if (rawText && rawText.startsWith("__EDITED__:")) {
    return { text: rawText.substring("__EDITED__:".length), isEdited: true };
  }
  return { text: rawText, isEdited: false };
};

export const useChat = (conversationId: string, currentUserId: string, activePeerId: string, isBizChat: boolean = false) => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recipientPublicKey, setRecipientPublicKey] = useState<string | null>(null);
  const [myPrivateKey, setMyPrivateKey] = useState<string | null>(null);
  const [myPublicKey, setMyPublicKey] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Typing indicator state
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const isTypingLocallyRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    if (typeof window === "undefined" || !currentUserId) return;
    const loadKeys = async () => {
      await migrateKeysFromLocalStorage(currentUserId);
      const privKey = await getUserPrivateKey(currentUserId);
      const pubKey = await getUserPublicKey(currentUserId);
      setMyPrivateKey(privKey);
      setMyPublicKey(pubKey);
    };
    loadKeys();
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
        // Guard: if backend returns empty array (no key registered), do not set any key.
        // Keys are ordered ascending by createdAt — the LAST entry is the newest/active key.
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
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
                  const parsed = parseEditedText(msg.ciphertext || "");
                  return {
                    id: msg.id,
                    conversationId: msg.conversationId,
                    senderId: msg.senderId,
                    text: parsed.text,
                    isEdited: parsed.isEdited,
                    createdAt: msg.createdAt,
                    mediaUrl: msg.mediaUrl,
                    mediaType: msg.mediaType,
                    isDeleted: msg.isDeleted,
                    disappearAfterSeconds: msg.disappearAfterSeconds ?? null,
                  };
                }

                try {
                  if (!myPrivateKey) throw new Error("Missing private key");

                  // ── Key selection logic ────────────────────────────────────
                  const isSentByMe = msg.senderId === currentUserId;
                  const targetUserId = isSentByMe ? activePeerId : msg.senderId;

                  // Resolve ALL public keys for this peer (for key-rotation-aware decryption)
                  const resolvePeerKeys = async (uid: string): Promise<string[]> => {
                    try {
                      const res = await chatService.fetchRecipientKey(uid);
                      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
                        // Backend returns keys newest-first (desc); keep that order
                        return res.data.map((d: { publicKey: string }) => d.publicKey);
                      } else if (res?.success && res?.data?.publicKey) {
                        return [res.data.publicKey];
                      }
                    } catch { /* ignore */ }
                    return [];
                  };

                  const peerKeys = await resolvePeerKeys(targetUserId);
                  if (peerKeys.length === 0) throw new Error("No public key available for decryption");

                  // ── Try every registered key for the peer (handles key rotation) ──
                  let text: string | undefined;
                  let decrypted = false;

                  for (const candidateKey of peerKeys) {
                    try {
                      text = await decryptMessage(msg.ciphertext, msg.nonce, candidateKey, myPrivateKey);
                      decrypted = true;
                      break;
                    } catch { /* try next key */ }
                  }

                  // ── Final fallback: use MY OWN public key ─────────────────────
                  if (!decrypted && myPublicKey) {
                    try {
                      text = await decryptMessage(msg.ciphertext, msg.nonce, myPublicKey, myPrivateKey);
                      console.log(`[History] Decrypted msg ${msg.id} using own public key (key rotation recovery).`);
                      decrypted = true;
                    } catch { /* all attempts exhausted */ }
                  }

                  if (!decrypted || text === undefined) {
                    throw new Error("All decryption attempts failed");
                  }

                  const parsed = parseEditedText(text!);
                  return {
                    id: msg.id,
                    conversationId: msg.conversationId,
                    senderId: msg.senderId,
                    text: parsed.text,
                    isEdited: parsed.isEdited,
                    createdAt: msg.createdAt,
                    mediaUrl: msg.mediaUrl,
                    mediaType: msg.mediaType,
                    isDeleted: msg.isDeleted,
                    disappearAfterSeconds: msg.disappearAfterSeconds ?? null,
                  };
                } catch {
                  return {
                    id: msg.id,
                    conversationId: msg.conversationId,
                    senderId: msg.senderId,
                    text: "🔒 Encrypted Message",
                    isEdited: false,
                    createdAt: msg.createdAt,
                    mediaUrl: msg.mediaUrl,
                    mediaType: msg.mediaType,
                    isDeleted: msg.isDeleted,
                    disappearAfterSeconds: msg.disappearAfterSeconds ?? null,
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

          // Fetch ALL registered public keys for the target user (newest first)
          let allPeerKeys: string[] = [];
          try {
            // Use cached key as the first candidate if it matches the target
            if (pubKey && (!targetUserId || targetUserId === peerUser)) {
              allPeerKeys.push(pubKey);
            }
            if (targetUserId) {
              const res = await chatService.fetchRecipientKey(targetUserId);
              if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
                // Keys ordered asc by createdAt — reverse so newest is tried first
                const fetchedKeys = res.data.map((d: { publicKey: string }) => d.publicKey).reverse();
                // Merge without duplicates
                for (const k of fetchedKeys) {
                  if (!allPeerKeys.includes(k)) allPeerKeys.push(k);
                }
                // Also update the cached key to the newest one
                if (targetUserId === peerUser && fetchedKeys.length > 0) {
                  setRecipientPublicKey(fetchedKeys[0]);
                  recipientPublicKeyRef.current = fetchedKeys[0];
                }
              } else if (res?.success && res?.data?.publicKey) {
                if (!allPeerKeys.includes(res.data.publicKey)) allPeerKeys.push(res.data.publicKey);
              }
            }
          } catch { /* use whatever we have */ }

          if (allPeerKeys.length === 0) {
            throw new Error("Missing public key for decryption");
          }

          console.log(`[Socket] Attempting decryption. Sender: ${senderId}, trying ${allPeerKeys.length} key(s) for: ${targetUserId}`);

          let text = "";
          let decryptedRealtime = false;

          // Try all peer keys (handles key rotation between devices)
          for (const candidateKey of allPeerKeys) {
            try {
              text = await decryptMessage(payload.ciphertext, payload.nonce, candidateKey, privKey);
              decryptedRealtime = true;
              break;
            } catch { /* try next key */ }
          }

          // Final fallback: try our own public key (in case peer used our old key)
          if (!decryptedRealtime && myPublicKeyRef.current) {
            try {
              text = await decryptMessage(payload.ciphertext, payload.nonce, myPublicKeyRef.current, privKey);
              console.log("✅ [Socket] Decrypted with own public key (key rotation recovery).");
              decryptedRealtime = true;
            } catch { /* all attempts exhausted */ }
          }

          if (!decryptedRealtime) {
            throw new Error("All decryption attempts exhausted");
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
              const parsed = parseEditedText(text);
              updated[optimisticIdx] = {
                id: payload.id,
                conversationId: payload.conversationId,
                senderId: payload.senderId,
                text: parsed.text,
                isEdited: parsed.isEdited,
                createdAt: payload.createdAt || new Date().toISOString(),
                mediaUrl: payload.mediaUrl,
                mediaType: payload.mediaType,
                disappearAfterSeconds: payload.disappearAfterSeconds,
                receipts: payload.receipts || [],
              };
              return updated;
            }

            const parsed = parseEditedText(text);
            return [
              ...prev,
              {
                id: payload.id || Date.now().toString(),
                conversationId: payload.conversationId,
                senderId: senderId,
                text: parsed.text,
                isEdited: parsed.isEdited,
                createdAt: payload.createdAt || new Date().toISOString(),
                mediaUrl: payload.mediaUrl,
                mediaType: payload.mediaType,
                disappearAfterSeconds: payload.disappearAfterSeconds,
                receipts: payload.receipts || [],
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
                isEdited: false,
                createdAt: payload.createdAt || new Date().toISOString(),
                mediaUrl: payload.mediaUrl,
                mediaType: payload.mediaType,
                disappearAfterSeconds: payload.disappearAfterSeconds,
                receipts: payload.receipts || [],
              },
            ];
          });
        }
      } else if (payload.ciphertext && (!payload.nonce || isBiz || noPeer || isTicket)) {
        // Plaintext: no nonce, B2C chat, peer not resolved, or ticket message
        console.log("ℹ️ [Socket] Plaintext message received");
        const parsed = parseEditedText(payload.ciphertext || "");
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev;
          return [
            ...prev,
            {
              id: payload.id || Date.now().toString(),
              conversationId: payload.conversationId,
              senderId: senderId || "unknown",
              text: parsed.text,
              isEdited: parsed.isEdited,
              createdAt: payload.createdAt || new Date().toISOString(),
              mediaUrl: payload.mediaUrl,
              mediaType: payload.mediaType,
              disappearAfterSeconds: payload.disappearAfterSeconds,
              receipts: payload.receipts || [],
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
              disappearAfterSeconds: payload.disappearAfterSeconds,
              receipts: payload.receipts || [],
            },
          ];
        });
      }
      
      // Note: chat:mark_delivered is now handled globally in SocketProvider
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

    const handleMessageEdited = async (payload: any) => {
      if (payload.conversationId !== conversationId) return;
      const privKey = myPrivateKeyRef.current;
      const pubKey = recipientPublicKeyRef.current;
      const isBiz = isBizChatRef.current;
      const noPeer = !activePeerIdRef.current;
      let text = payload.ciphertext || "";
      if (!isBiz && !noPeer && payload.ciphertext && payload.nonce && privKey && pubKey) {
        try {
          text = await decryptMessage(payload.ciphertext, payload.nonce, pubKey, privKey);
        } catch {
          try {
            if (myPublicKeyRef.current) {
              text = await decryptMessage(payload.ciphertext, payload.nonce, myPublicKeyRef.current, privKey);
            }
          } catch {}
        }
      }
      const parsed = parseEditedText(text);
      setMessages((prev) =>
        prev.map((m) => (m.id === payload.id ? { ...m, text: parsed.text, isEdited: parsed.isEdited } : m))
      );
    };

    const handleMessageUnsent = (payload: any) => {
      if (payload.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === payload.messageId
            ? { ...m, isDeleted: true, text: "", mediaUrl: undefined, mediaType: undefined }
            : m
        )
      );
    };

    const handleStatusUpdate = (payload: any) => {
      if (payload.conversationId !== conversationId) return;
      
      setMessages((prev) => prev.map((msg) => {
        if (msg.id === payload.messageId) {
          const receipts = [...(msg.receipts || [])];
          const existing = receipts.find((r) => r.userId === payload.userId);
          
          if (existing) {
            if (payload.status === 'DELIVERED') existing.deliveredAt = payload.timestamp;
            if (payload.status === 'SEEN') existing.seenAt = payload.timestamp;
          } else {
            receipts.push({
              id: Math.random().toString(), // local fallback ID
              userId: payload.userId,
              deliveredAt: payload.status === 'DELIVERED' ? payload.timestamp : null,
              seenAt: payload.status === 'SEEN' ? payload.timestamp : null,
            });
          }
          
          return { ...msg, receipts };
        }
        return msg;
      }));
    };

    const handleConversationStatusUpdate = (payload: any) => {
      if (payload.conversationId !== conversationId) return;
      if (payload.status !== 'SEEN') return;

      const updatedReceiptsMap = new Map(payload.receipts.map((r: any) => [r.messageId, r.timestamp]));

      setMessages((prev) => prev.map((msg) => {
        const seenAtStr = updatedReceiptsMap.get(msg.id) as string;
        if (seenAtStr) {
          const receipts = [...(msg.receipts || [])];
          const existing = receipts.find((r) => r.userId === payload.userId);
          
          if (existing) {
            existing.seenAt = seenAtStr;
          } else {
            receipts.push({
              id: Math.random().toString(),
              userId: payload.userId,
              deliveredAt: null,
              seenAt: seenAtStr,
            });
          }
          return { ...msg, receipts };
        }
        return msg;
      }));
    };

    const handleTypingStart = (payload: { conversationId: string; userId: string }) => {
      if (payload.conversationId !== conversationId) return;
      if (payload.userId === currentUserIdRef.current) return;
      
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.add(payload.userId);
        return newSet;
      });
    };

    const handleTypingStop = (payload: { conversationId: string; userId: string }) => {
      if (payload.conversationId !== conversationId) return;
      
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(payload.userId);
        return newSet;
      });
    };

    socket.on("chat:receive_message", handleReceiveMessage);
    socket.on("NEW_MESSAGE", handleReceiveMessage);
    socket.on("chat:message_edited", handleMessageEdited);
    socket.on("chat:message_unsent", handleMessageUnsent);
    socket.on("chat:message_status_update", handleStatusUpdate);
    socket.on("chat:conversation_status_update", handleConversationStatusUpdate);
    socket.on("chat:typing_start", handleTypingStart);
    socket.on("chat:typing_stop", handleTypingStop);
    socket.on("chat:error", handleChatError);

    return () => {
      socket.off("chat:receive_message", handleReceiveMessage);
      socket.off("NEW_MESSAGE", handleReceiveMessage);
      socket.off("chat:message_edited", handleMessageEdited);
      socket.off("chat:message_unsent", handleMessageUnsent);
      socket.off("chat:message_status_update", handleStatusUpdate);
      socket.off("chat:conversation_status_update", handleConversationStatusUpdate);
      socket.off("chat:typing_start", handleTypingStart);
      socket.off("chat:typing_stop", handleTypingStop);
      socket.off("chat:error", handleChatError);
    };
  }, [socket, isConnected, conversationId]);

  // ── Mark Messages as Seen ──────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !isConnected || !conversationId || !messages.length) return;

    const currentUser = currentUserIdRef.current;
    let visibilityTimeout: NodeJS.Timeout;
    
    const checkAndMarkSeen = () => {
      // Only mark as seen if the document is focused and visible
      if (document.visibilityState !== 'visible' || !document.hasFocus()) {
        return;
      }

      // Find if we have any messages not sent by us that don't have a seenAt receipt
      const hasUnread = messages.some(m => {
        if (m.senderId === currentUser) return false;
        const myReceipt = m.receipts?.find(r => r.userId === currentUser);
        return !myReceipt?.seenAt;
      });

      if (hasUnread) {
        socket.emit("chat:mark_conversation_seen", {
          conversationId,
        });
      }
    };

    // Check initially (with slight delay to allow rendering/focus changes)
    visibilityTimeout = setTimeout(checkAndMarkSeen, 500);

    // Also check when window regains focus or visibility changes
    window.addEventListener("focus", checkAndMarkSeen);
    document.addEventListener("visibilitychange", checkAndMarkSeen);

    return () => {
      clearTimeout(visibilityTimeout);
      window.removeEventListener("focus", checkAndMarkSeen);
      document.removeEventListener("visibilitychange", checkAndMarkSeen);
    };
  }, [messages, socket, isConnected, conversationId]);

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

      // If we are encrypting but missing our own keys, abort
      if (!effectiveSkipEncryption && !myPrivateKey) {
        console.error("Cannot encrypt send: missing myPrivateKey");
        toast.error("Security setup incomplete. Please refresh the page.");
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
          let finalFile = file;
          if (file.type.startsWith('image/') && !file.type.includes('svg')) {
            finalFile = await compressImage(file, 1920, 0.8);
          }
          const uploadRes = await chatService.uploadMedia(conversationId, finalFile);
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
                // Keys are ordered asc by createdAt — last entry is the newest/active key
                pubKeyToUse = res.data[res.data.length - 1].publicKey;
              } else if (res?.success && res?.data?.publicKey) {
                pubKeyToUse = res.data.publicKey;
              }
            } catch (e) {
              console.warn("Failed to fetch latest key before sending, using cached", e);
            }

            if (!pubKeyToUse) {
              console.error("Cannot encrypt: no recipient public key available. Aborting send.");
              toast.error("Recipient has not set up secure messaging yet.");
              setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
              return;
            }

            // We know myPrivateKey is non-null here because of the guard above
            const encrypted = await encryptMessage(text, pubKeyToUse, myPrivateKey!);
            ciphertext = encrypted.ciphertext;
            nonce = encrypted.nonce;
          }
        }

        let previewText = null;
        if (text) {
          previewText = text.substring(0, 100); // Send first 100 chars as preview
        }

        if (!nonce) {
          nonce = crypto.randomUUID();
        }

        const payload = { conversationId, ciphertext, nonce, mediaUrl, mediaType, previewText };
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

  const editMessage = useCallback(
    async (messageId: string, newText: string) => {
      if (!socket || !isConnected || !conversationId) return;
      const formattedText = `__EDITED__:${newText}`;
      const effectiveSkipEncryption = !activePeerId || isBizChatRef.current;
      let ciphertext, nonce;
      if (effectiveSkipEncryption) {
        ciphertext = formattedText;
        nonce = null;
      } else {
        if (!myPrivateKey || !recipientPublicKey) return;
        const encrypted = await encryptMessage(formattedText, recipientPublicKey, myPrivateKey);
        ciphertext = encrypted.ciphertext;
        nonce = encrypted.nonce;
      }
      socket.emit("chat:edit_message", { messageId, conversationId, ciphertext, nonce });
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, text: newText, isEdited: true } : m))
      );
    },
    [socket, isConnected, conversationId, myPrivateKey, recipientPublicKey, activePeerId]
  );

  const pinnedMessages = useMemo(() => {
    const map = new Map<string, PinnedMessage>();
    const now = Date.now();

    for (const msg of messages) {
      if (msg.text && msg.text.startsWith("__PIN_EVENT__:")) {
        try {
          const payload = JSON.parse(msg.text.substring("__PIN_EVENT__:".length));
          if (payload && payload.messageId && payload.action) {
            if (payload.action === "pin") {
              const timestamp = payload.timestamp || new Date(msg.createdAt).getTime();
              const pinnedUntil = payload.durationSeconds ? timestamp + payload.durationSeconds * 1000 : null;
              
              if (!pinnedUntil || pinnedUntil > now) {
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
        } catch (e) {
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
  }, [messages]);

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
      sendMessage(`__PIN_EVENT__:${JSON.stringify(payload)}`, currentUserIdRef.current);
    },
    [sendMessage]
  );

  const unsendMessage = useCallback(
    async (messageId: string) => {
      try {
        await chatService.unsendMessage(conversationId, messageId);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, isDeleted: true, text: "", mediaUrl: undefined, mediaType: undefined }
              : m
          )
        );
      } catch (err) {
        console.error("Failed to unsend message", err);
        toast.error("Failed to unsend message");
      }
    },
    [conversationId]
  );

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
    messages,
    setMessages,
    clearMessages: () => setMessages([]),
    sendMessage,
    editMessage,
    pinnedMessages,
    pinMessage,
    unsendMessage,
    isUploading,
    typingUsers,
    handleTyping,
    // UI considers the chat ready as long as we have our own keys and a valid connection
    isReady: !!(myPrivateKey && isConnected && conversationId),
  };
};
