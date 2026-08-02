import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { groupService } from "@/services/group.service";
import { chatService } from "@/services/chat.service";
import { generateGroupKey, encryptMessage, encryptGroupMessage, decryptGroupMessage, decryptMessage, generateAndStoreKeyPair } from "@/utils/crypto";

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  text: string;
  createdAt: string;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "audio" | "document" | null;
  sender?: {
    profile?: {
      displayName: string;
      avatarUrl: string | null;
    } | null;
  };
  isEdited?: boolean;
  isDeleted?: boolean;
  receipts?: {
    id: string;
    userId: string;
    deliveredAt: string | null;
    seenAt: string | null;
  }[];
}

const parseEditedText = (rawText: string) => {
  if (rawText && rawText.startsWith("__EDITED__:")) {
    return { text: rawText.substring("__EDITED__:".length), isEdited: true };
  }
  return { text: rawText, isEdited: false };
};

export interface PinnedMessage {
  messageId: string;
  pinnedAt: number;
  pinnedUntil: number | null;
  pinnerName: string;
  previewText?: string;
  previewMedia?: string;
  originalMessage?: GroupMessage;
}

export const useGroupChat = (groupId: string, currentUserId: string) => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Keep plaintext group key in a ref so listeners always have it
  const groupKeyRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string>(currentUserId);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  // ── Setup: Fetch & Decrypt Symmetric Group Key ─────────────────────────────
  useEffect(() => {
    if (!groupId || !currentUserId) return;

    const setupGroupKey = async () => {
      try {
        setIsReady(false);
        setError(null);

        // 0. Ensure local keypair exists before checking or creating group keys
        const privKeyName = `privateKey_${currentUserId}`;
        const pubKeyName = `publicKey_${currentUserId}`;
        let localPrivKey = localStorage.getItem(privKeyName) || localStorage.getItem("privateKey");
        let localPubKey = localStorage.getItem(pubKeyName) || localStorage.getItem("publicKey");

        if (!localPrivKey || !localPubKey) {
          console.log("[useGroupChat] Local keypair missing, generating new keypair for user:", currentUserId);
          localPubKey = await generateAndStoreKeyPair(currentUserId);
          localPrivKey = localStorage.getItem(privKeyName) || localStorage.getItem("privateKey");
          const deviceId = `web-${currentUserId}`;
          localStorage.setItem("deviceId", deviceId);
          try {
            if (localPubKey) {
              await chatService.uploadPublicKey(deviceId, localPubKey);
            }
          } catch (e) {
            console.warn("Failed to upload public key during group setup", e);
          }
        }

        // 1. Fetch group details to find the creator
        const groupRes = await groupService.fetchGroupDetails(groupId);
        if (!groupRes.success || !groupRes.data) {
          throw new Error("Failed to load group details");
        }
        const creatorId = groupRes.data.createdBy;

        // 2. Fetch the user's encrypted group key
        const keyRes = await groupService.fetchGroupKey(groupId);
        let encryptedGroupKey = keyRes.data?.encryptedGroupKey;
        let keyNonce = keyRes.data?.keyNonce;

        if (!encryptedGroupKey || !keyNonce) {
          // If encryptedGroupKey is missing (e.g. for auto-created community groups or newly added groups),
          // check if we can auto-initialize
          const myRoleRes = await groupService.fetchGroupDetails(groupId);
          const isCreatorOrAdmin = currentUserId === creatorId || myRoleRes.data?.myRole === 'ADMIN' || myRoleRes.data?.myRole === 'OWNER';
          if (isCreatorOrAdmin && currentUserId) {
            console.log("[useGroupChat] Auto-initializing E2EE group key for group:", groupId);
            const myPrivKey = localStorage.getItem(privKeyName) || localStorage.getItem("privateKey") || localPrivKey;
            if (!myPrivKey) {
              throw new Error("Local private key missing for group key initialization");
            }
            const freshGroupKey = await generateGroupKey();
            const membersRes = await groupService.fetchGroupMembers(groupId);
            const memberList = membersRes.success && membersRes.data?.members ? membersRes.data.members : [{ userId: currentUserId }];

            const rekeyPayload = [];
            for (const m of memberList) {
              const uId = (m as any).userId || (m as any).id;
              if (!uId) continue;
              const rKeyRes = await chatService.fetchRecipientKey(uId);
              let pubKey = "";
              if (rKeyRes?.data && Array.isArray(rKeyRes.data) && rKeyRes.data.length > 0) {
                pubKey = rKeyRes.data[0].publicKey;
              } else if (rKeyRes?.success && rKeyRes?.data?.publicKey) {
                pubKey = rKeyRes.data.publicKey;
              }
              if (!pubKey && uId === currentUserId) {
                pubKey = localStorage.getItem(`publicKey_${currentUserId}`) || localStorage.getItem("publicKey") || "";
              }
              if (pubKey) {
                try {
                  const enc = await encryptMessage(freshGroupKey, pubKey, myPrivKey);
                  rekeyPayload.push({
                    userId: uId,
                    encryptedGroupKey: enc.ciphertext,
                    keyNonce: enc.nonce,
                  });
                  if (uId === currentUserId) {
                    encryptedGroupKey = enc.ciphertext;
                    keyNonce = enc.nonce;
                  }
                } catch (encErr) {
                  console.warn(`[useGroupChat] Could not encrypt key for member ${uId}:`, encErr);
                }
              }
            }

            if (rekeyPayload.length > 0) {
              await groupService.rekeyGroup(groupId, rekeyPayload);
              console.log("[useGroupChat] Group successfully re-keyed automatically.");
              groupKeyRef.current = freshGroupKey;
              setIsReady(true);
              // Directly fetch history now that key is set
              const msgsRes = await groupService.fetchGroupMessages(groupId);
              if (msgsRes.success && msgsRes.data) {
                const decrypted = [];
                for (const msg of msgsRes.data) {
                  if (!msg.ciphertext || !msg.nonce) continue;
                  try {
                    const text = await decryptGroupMessage(msg.ciphertext, msg.nonce, freshGroupKey);
                    decrypted.push({
                      id: msg.id,
                      groupId: msg.groupId,
                      senderId: msg.senderId,
                      text,
                      createdAt: msg.createdAt,
                      mediaUrl: msg.mediaUrl,
                      mediaType: msg.mediaType,
                      sender: msg.sender,
                    });
                  } catch (e) {
                    console.warn("Could not decrypt history item:", msg.id);
                  }
                }
                setMessages(decrypted);
              } else {
                setMessages([]);
              }
              return;
            }
          }

          if (!encryptedGroupKey || !keyNonce) {
            throw new Error("You do not have a cryptographic key for this group. An admin needs to initialize encryption.");
          }
        }

        // 3. Fetch creator's ALL public keys (key history) — newest last
        const creatorKeyRes = await chatService.fetchRecipientKey(creatorId);
        let creatorPubKeys: string[] = [];

        if (creatorKeyRes?.data && Array.isArray(creatorKeyRes.data) && creatorKeyRes.data.length > 0) {
          // Collect all known public keys; try newest first (most likely match)
          creatorPubKeys = [...creatorKeyRes.data]
            .reverse()
            .map((k: any) => k.publicKey)
            .filter(Boolean);
        } else if (creatorKeyRes?.success && creatorKeyRes?.data?.publicKey) {
          creatorPubKeys = [creatorKeyRes.data.publicKey];
        }

        // Also include the current user's own public key as a fallback
        // (in case the current user IS the creator and the key is self-encrypted
        // with an older keypair stored locally)
        const myPubKeyLocal = localStorage.getItem(`publicKey_${currentUserId}`) || localStorage.getItem("publicKey");
        if (myPubKeyLocal && !creatorPubKeys.includes(myPubKeyLocal)) {
          creatorPubKeys.push(myPubKeyLocal);
        }

        if (creatorPubKeys.length === 0) {
          throw new Error("Could not find creator's public key to decrypt group key");
        }

        // 4. Fetch my private key
        const myPrivKey = localStorage.getItem(privKeyName) || localStorage.getItem("privateKey") || localPrivKey;
        if (!myPrivKey) {
          throw new Error("Missing local private key");
        }

        // 5. Try decrypting with each creator public key (newest → oldest)
        //    This handles the case where the creator regenerated their keypair
        //    after the group was created (key rotation).
        let plaintextGroupKey: string | null = null;
        let lastDecryptError: any = null;

        for (const pubKey of creatorPubKeys) {
          try {
            plaintextGroupKey = await decryptMessage(
              encryptedGroupKey,
              keyNonce,
              pubKey,
              myPrivKey
            );
            // If we reach here, decryption succeeded
            console.log("[useGroupChat] Group key decrypted successfully.");
            break;
          } catch (err) {
            lastDecryptError = err;
            console.warn("[useGroupChat] Decryption attempt failed with a public key, trying next...");
          }
        }

        if (!plaintextGroupKey) {
          console.error("[useGroupChat] All public key attempts exhausted.", lastDecryptError);
          throw new Error(
            "Failed to decrypt group key. The encryption keys may be out of sync. " +
            "Try re-logging in to regenerate your keypair."
          );
        }

        groupKeyRef.current = plaintextGroupKey;

        // 6. Load History
        const historyRes = await groupService.fetchGroupMessages(groupId);
        if (historyRes.success && Array.isArray(historyRes.data)) {
          const decryptedHistory = await Promise.all(
            historyRes.data.map(async (msg: any) => {
              try {
                if (!msg.ciphertext || !msg.nonce) {
                  return {
                    ...msg,
                    text: msg.mediaUrl ? "" : "🔒 Missing cipher data",
                    groupId: msg.groupId || msg.conversationId,
                  };
                }
                const decrypted = await decryptGroupMessage(
                  msg.ciphertext,
                  msg.nonce,
                  plaintextGroupKey
                );
                const parsed = parseEditedText(decrypted);
                return {
                  id: msg.id,
                  groupId: msg.groupId || msg.conversationId,
                  senderId: msg.senderId,
                  text: parsed.text,
                  isEdited: parsed.isEdited,
                  createdAt: msg.createdAt,
                  mediaUrl: msg.mediaUrl,
                  mediaType: msg.mediaType,
                  sender: msg.sender,
                  isDeleted: msg.isDeleted,
                };
              } catch (err) {
                return {
                  id: msg.id,
                  groupId: msg.groupId || msg.conversationId,
                  senderId: msg.senderId,
                  text: "🔒 Encrypted Message (Decryption Failed)",
                  isEdited: false,
                  createdAt: msg.createdAt,
                  mediaUrl: msg.mediaUrl,
                  mediaType: msg.mediaType,
                  sender: msg.sender,
                  isDeleted: msg.isDeleted,
                };
              }
            })
          );
          
          decryptedHistory.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          setMessages(decryptedHistory);
        }

        setIsReady(true);
      } catch (err: any) {
        console.error("Failed to setup group chat:", err);
        setError(err.message || "Failed to unlock group keys");
      }
    };

    setupGroupKey();
  }, [groupId, currentUserId]);

  // ── Socket: Join Room ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !isConnected || !groupId) return;

    console.log("🔌 [Socket] Joining group room:", groupId);
    socket.emit("group:join_room", { groupId });

    const handleJoinedRoom = (payload: any) => {
      console.log("✅ [Socket] Successfully joined group room:", payload);
    };

    socket.on("group:joined_room", handleJoinedRoom);

    return () => {
      socket.off("group:joined_room", handleJoinedRoom);
    };
  }, [socket, isConnected, groupId]);

  // ── Socket: Receive Messages ───────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !isConnected || !groupId) return;

    const handleReceiveMessage = async (payload: any) => {
      console.log("📥 [Socket] Received group:receive_message:", payload);

      if (payload.groupId !== groupId) return;

      const senderId = payload.senderId || payload.sender?.id || "unknown";

      // Helper to append a message, deduplicating by ID
      const appendMessage = (msg: GroupMessage) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;

          // Replace an optimistic placeholder from this user if present
          if (msg.senderId === currentUserIdRef.current) {
            const optimisticIdx = prev.map((m) => m.id).lastIndexOf(
              prev.slice().reverse().find((m) => m.id.startsWith("optimistic-"))?.id ?? ""
            );
            if (optimisticIdx !== -1) {
              const updated = [...prev];
              updated[optimisticIdx] = msg;
              return updated;
            }
          }

          return [...prev, msg];
        });
      };

      const baseMsg: GroupMessage = {
        id: payload.id || Date.now().toString(),
        groupId: payload.groupId,
        senderId,
        text: "",
        createdAt: payload.createdAt || new Date().toISOString(),
        mediaUrl: payload.mediaUrl ?? undefined,
        mediaType: payload.mediaType ?? undefined,
        sender: payload.sender,
        receipts: payload.receipts || [],
      };

      // Case 1: Pure media message — no ciphertext, skip decryption entirely
      if (!payload.ciphertext && !payload.nonce) {
        if (payload.mediaUrl || payload.mediaType) {
          appendMessage(baseMsg);
        }
      } else {
        // Case 2: Has ciphertext — need group key to decrypt
        const gKey = groupKeyRef.current;
        if (!gKey) {
          console.warn("⚠️ [Socket] Missing group key — cannot decrypt incoming message. Rendering media only.");
          // Still render the media if present rather than silently dropping
          if (payload.mediaUrl) {
            appendMessage(baseMsg);
          }
        } else {
          try {
            const decrypted = await decryptGroupMessage(
              payload.ciphertext,
              payload.nonce,
              gKey
            );
            const parsed = parseEditedText(decrypted);
            appendMessage({ ...baseMsg, text: parsed.text, isEdited: parsed.isEdited });
          } catch (err) {
            console.error("❌ [Socket] Failed to decrypt group message:", err);
            appendMessage({
              ...baseMsg,
              text: payload.mediaUrl ? "" : "🔒 Encrypted group message (Decryption Failed)",
              isEdited: false,
            });
          }
        }
      }

      // Automatically mark as delivered if the message is from someone else
      if (senderId !== currentUserIdRef.current) {
        socket.emit("group:mark_delivered", {
          groupId: payload.groupId,
          messageId: payload.id,
        });
      }
    };

    const handleGroupError = (err: any) => {
      console.error("🚨 [Socket] Group Chat Error:", err);
    };

    const handleMessageEdited = async (payload: any) => {
      if (payload.groupId !== groupId) return;
      const gKey = groupKeyRef.current;
      let text = payload.ciphertext || "";
      if (payload.ciphertext && payload.nonce && gKey) {
        try {
          text = await decryptGroupMessage(payload.ciphertext, payload.nonce, gKey);
        } catch {}
      }
      const parsed = parseEditedText(text);
      setMessages((prev) =>
        prev.map((m) => (m.id === payload.id ? { ...m, text: parsed.text, isEdited: parsed.isEdited } : m))
      );
    };

    const handleMessageUnsent = (payload: any) => {
      if (payload.groupId !== groupId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === payload.messageId
            ? { ...m, isDeleted: true, text: "", mediaUrl: undefined, mediaType: undefined }
            : m
        )
      );
    };

    const handleStatusUpdate = (payload: any) => {
      if (payload.groupId !== groupId) return;
      
      setMessages((prev) => prev.map((msg) => {
        if (msg.id === payload.messageId) {
          const receipts = [...(msg.receipts || [])];
          const existing = receipts.find((r) => r.userId === payload.userId);
          
          if (existing) {
            if (payload.status === 'DELIVERED') existing.deliveredAt = payload.timestamp;
            if (payload.status === 'SEEN') existing.seenAt = payload.timestamp;
          } else {
            receipts.push({
              id: Math.random().toString(),
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

    socket.on("group:receive_message", handleReceiveMessage);
    socket.on("group:message_edited", handleMessageEdited);
    socket.on("group:message_unsent", handleMessageUnsent);
    socket.on("group:message_status_update", handleStatusUpdate);
    socket.on("group:error", handleGroupError);

    return () => {
      socket.off("group:receive_message", handleReceiveMessage);
      socket.off("group:message_edited", handleMessageEdited);
      socket.off("group:message_unsent", handleMessageUnsent);
      socket.off("group:message_status_update", handleStatusUpdate);
      socket.off("group:error", handleGroupError);
    };
  }, [socket, isConnected, groupId]);

  // ── Mark Messages as Seen ──────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !isConnected || !groupId || !messages.length) return;

    const currentUser = currentUserIdRef.current;
    
    // Find messages not sent by us, where our receipt doesn't have a seenAt
    const unreadMessages = messages.filter(m => {
      if (m.senderId === currentUser) return false;
      const myReceipt = m.receipts?.find(r => r.userId === currentUser);
      return !myReceipt?.seenAt;
    });

    if (unreadMessages.length > 0) {
      unreadMessages.forEach(m => {
        socket.emit("group:mark_seen", {
          groupId,
          messageId: m.id,
        });
      });
    }
  }, [messages, socket, isConnected, groupId]);

  // ── Send Message ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string, file: File | null = null) => {
      const gKey = groupKeyRef.current;
      if (!socket || !isConnected || !gKey || !groupId) {
        console.error("Cannot send: missing group key, socket, or groupId");
        return;
      }

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
          groupId,
          senderId: currentUserIdRef.current,
          text: file ? "Uploading media..." : text,
          createdAt: new Date().toISOString(),
          mediaUrl: optimisticMediaUrl,
          mediaType: optimisticMediaType as any,
          // Don't populate sender so it looks like "You"
        },
      ]);

      try {
        let mediaUrl;
        let mediaType;

        if (file) {
          setIsUploading(true);
          const uploadRes = await groupService.uploadGroupMedia(groupId, file);
          if (uploadRes.success && uploadRes.data) {
            mediaUrl = uploadRes.data.mediaUrl;
            mediaType = uploadRes.data.mediaType;
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
          const encrypted = await encryptGroupMessage(text, gKey);
          ciphertext = encrypted.ciphertext;
          nonce = encrypted.nonce;
        }

        let previewText = null;
        if (text) {
          previewText = text.substring(0, 100);
        }

        const payload = { groupId, ciphertext, nonce, mediaUrl, mediaType, previewText };
        socket.emit("group:send_message", payload);
        
        if (!text) {
          // If media only, optimistic message will be replaced by socket echo
          setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        }
      } catch (err) {
        console.error("Failed to encrypt and send group message:", err);
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setIsUploading(false);
      }
    },
    [socket, isConnected, groupId]
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
                  pinnerName: payload.pinnerName || "A member",
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
      pinnerName: string = "A member"
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
      sendMessage(`__PIN_EVENT__:${JSON.stringify(payload)}`);
    },
    [sendMessage]
  );

  const editMessage = useCallback(
    async (messageId: string, newText: string) => {
      if (!socket || !isConnected || !groupId) return;
      const formattedText = `__EDITED__:${newText}`;
      const groupKey = groupKeyRef.current;
      if (!groupKey) return;
      const encrypted = await encryptGroupMessage(formattedText, groupKey);
      socket.emit("group:edit_message", {
        messageId,
        groupId,
        ciphertext: encrypted.ciphertext,
        nonce: encrypted.nonce,
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, text: newText, isEdited: true } : m))
      );
    },
    [socket, isConnected, groupId]
  );

  const unsendMessage = useCallback(
    async (messageId: string) => {
      try {
        await groupService.unsendMessage(groupId, messageId);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, isDeleted: true, text: "", mediaUrl: undefined, mediaType: undefined }
              : m
          )
        );
      } catch (err) {
        console.error("Failed to unsend message", err);
      }
    },
    [groupId]
  );

  return {
    messages,
    sendMessage,
    editMessage,
    unsendMessage,
    isReady,
    error,
    isUploading,
    pinnedMessages,
    pinMessage,
    getGroupKey: () => groupKeyRef.current,
  };
};
