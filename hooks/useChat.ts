import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { useE2EE } from "@/context/E2EEContext";
import { chatService } from "@/services/chat.service";
import {
  getUserPrivateKey,
  getUserPublicKey,
  migrateKeysFromLocalStorage,
  getPreKeyPrivate,
  getSignedPreKeyPrivate,
  storeDecryptedMessage,
  getDecryptedMessage,
} from "@/utils/keyStore";
import {
  encryptMessage,
  decryptMessage,
  generateAndStoreKeyPair,
  performX3DHInitiator,
  performX3DHReceiver,
  encryptWithSessionKey,
  decryptWithSessionKey,
  bytesToBase64,
  base64ToBytes,
  encryptMultiDeviceMessage,
  decryptMultiDeviceMessage,
} from "@/utils/crypto";
import {
  encrypt1to1Message,
  decrypt1to1Message,
  hasActiveSignalSession,
  buildSessionFromBundle,
  getSignalProtocolStore,
  createSignalAddress,
} from "@/utils/signalCrypto";
import { compressImage } from "@/utils/image";
import { queueVaultSync } from "@/utils/vaultSync";
import { toast } from "sonner";

export interface MessageReceipt {
  id: string;
  userId: string;
  deliveredAt: string | null;
  seenAt: string | null;
}

export interface MessageReactionItem {
  id: string;
  emoji: string;
  userId: string;
  createdAt?: string;
  user?: {
    profile?: {
      displayName?: string;
      avatarUrl?: string;
    };
  };
}

export interface QuotedMessage {
  id: string;
  senderId: string;
  senderName?: string;
  text: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
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
  reactions?: MessageReactionItem[];
  replyToId?: string | null;
  replyTo?: QuotedMessage | null;
  isDecryptionPending?: boolean;
  rawCiphertext?: string | null;
  rawNonce?: string | null;
  rawMessageType?: number | null;
  rawEncryptedKeys?: any | null;
  recipientRegistrationId?: string | null;
  senderRegistrationId?: string | null;
  isSystem?: boolean;
  systemType?: string;
  isRetryExpired?: boolean;
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

const resolveQuotedMessage = async (
  replyToRaw: any,
  currentUid: string,
  privKey?: string | null,
  peerKeys?: string[],
  myPub?: string | null,
  isBiz: boolean = false,
  knownDecryptedMap?: Map<string, string>
): Promise<QuotedMessage | null> => {
  if (!replyToRaw || !replyToRaw.id) return null;
  const senderName =
    replyToRaw.senderId === currentUid || replyToRaw.senderName === "You"
      ? "You"
      : replyToRaw.sender?.profile?.displayName ||
        replyToRaw.sender?.profile?.username ||
        replyToRaw.senderName ||
        "Contact";

  if (replyToRaw.isDeleted) {
    return {
      id: replyToRaw.id,
      senderId: replyToRaw.senderId,
      senderName,
      text: "ðŸš« This message was deleted",
      mediaUrl: null,
      mediaType: null,
    };
  }

  let text = replyToRaw.text || "";

  // 1. Check known decrypted map first if available
  if (!text && knownDecryptedMap && knownDecryptedMap.has(replyToRaw.id)) {
    text = knownDecryptedMap.get(replyToRaw.id)!;
  }

  // 1b. Check durable IndexedDB plaintext cache
  if (!text && replyToRaw.id) {
    try {
      const cached = await getDecryptedMessage(currentUid, replyToRaw.id);
      if (cached) {
        text = parseEditedText(cached).text;
      }
    } catch {}
  }

  // 2. Libsignal decryption if messageType is 2 or 3
  const isSignalMsg = replyToRaw.messageType === 3 || replyToRaw.messageType === 2;
  if (!text && replyToRaw.ciphertext && isSignalMsg && replyToRaw.senderId) {
    try {
      const dec = await decrypt1to1Message(
        currentUid,
        replyToRaw.senderId,
        replyToRaw.ciphertext,
        replyToRaw.messageType,
        1
      );
      if (dec) text = parseEditedText(dec).text;
    } catch {}
  }

  // 3. If plaintext (B2C or missing nonce without being Signal ciphertext), extract directly
  if (!text && replyToRaw.ciphertext && (!replyToRaw.nonce || isBiz) && !isSignalMsg) {
    text = parseEditedText(replyToRaw.ciphertext).text;
  }

  // 4. If legacy E2EE ciphertext, decrypt with candidate keys
  if (!text && replyToRaw.ciphertext && replyToRaw.nonce && privKey) {
    let keysToTry = peerKeys && peerKeys.length > 0 ? [...peerKeys] : [];
    if (keysToTry.length === 0 && replyToRaw.senderId) {
      try {
        const res = await chatService.fetchRecipientKey(replyToRaw.senderId);
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          keysToTry = res.data.map((d: any) => d.publicKey);
        } else if (res?.success && res?.data?.publicKey) {
          keysToTry = [res.data.publicKey];
        }
      } catch {}
    }
    for (const k of keysToTry) {
      try {
        const dec = await decryptMessage(replyToRaw.ciphertext, replyToRaw.nonce, k, privKey);
        text = parseEditedText(dec).text;
        break;
      } catch {}
    }
    if (!text && myPub) {
      try {
        const dec = await decryptMessage(replyToRaw.ciphertext, replyToRaw.nonce, myPub, privKey);
        text = parseEditedText(dec).text;
      } catch {}
    }
  }

  // 4. Media fallback text
  if (!text && replyToRaw.mediaType) {
    if (replyToRaw.mediaType === "image") text = "Photo";
    else if (replyToRaw.mediaType === "video") text = "Video";
    else if (replyToRaw.mediaType === "audio") text = "Voice message";
    else if (replyToRaw.mediaType === "document") text = "Document";
  }

  return {
    id: replyToRaw.id,
    senderId: replyToRaw.senderId,
    senderName,
    text,
    mediaUrl: replyToRaw.mediaUrl || null,
    mediaType: replyToRaw.mediaType || null,
  };
};

export const useChat = (conversationId: string, currentUserId: string, activePeerId: string, isBizChat: boolean = false) => {
  const { socket, isConnected } = useSocket();
  // E2EE readiness signal from E2EEProvider â€” true once initKeys() has fully completed.
  const { keysReady } = useE2EE();
  const [keysRestoredVersion, setKeysRestoredVersion] = useState(0);
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
  const recipientRegistrationIdRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string>(currentUserId);
  const activePeerIdRef = useRef<string>(activePeerId);
  const isBizChatRef = useRef<boolean>(isBizChat);
  const pendingReceiptsRef = useRef<Map<string, MessageReceipt[]>>(new Map());

  // E2EE Resilient Retry Protocol State & Caches
  const messagesRef = useRef<ChatMessage[]>([]);
  const sentPlaintextCacheRef = useRef<Map<string, string>>(new Map());
  const recentSentPlaintextsRef = useRef<{ text: string; nonce?: string | null; ciphertext?: string | null; timestamp: number }[]>([]);
  const retryRequestedMessagesRef = useRef<Set<string>>(new Set());

  // â”€â”€ Pending Decrypt Queue â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Messages that arrived via socket BEFORE the private key was ready are held
  // here and replayed automatically once myPrivateKey / keysReady is set.
  // Max size guard prevents unbounded growth if key never loads.
  const pendingDecryptQueueRef = useRef<any[]>([]);
  const MAX_PENDING_QUEUE_SIZE = 50;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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

  // â”€â”€ Drain Pending Decrypt Queue â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // When myPrivateKey becomes available (E2EEProvider finished initKeys),
  // replay every socket message that arrived while the key was absent.
  // This eliminates the "â³ Waiting for this message" flash caused by the
  // session-clear / fresh-login timing race.
  useEffect(() => {
    if (!myPrivateKey || pendingDecryptQueueRef.current.length === 0) return;
    const queue = [...pendingDecryptQueueRef.current];
    pendingDecryptQueueRef.current = [];
    console.log(`[E2EE] Key ready â€” draining ${queue.length} queued message(s)`);
    // handleReceiveMessage is registered on the socket inside the socket useEffect.
    // We dispatch a synthetic socket event so the existing handler picks it up,
    // OR we call it directly since it closes over refs. We trigger re-delivery
    // by emitting the payloads through the socket's own listener map via a small
    // trick: push them back through the socket event system next tick so refs
    // are already updated.
    queue.forEach((payload) => {
      // Re-emit to the active socket so handleReceiveMessage processes them with
      // the now-available private key. setTimeout(0) ensures ref updates above
      // have propagated before handling.
      setTimeout(() => {
        if (socket) {
          socket.emit("__e2ee_internal_replay__", payload);
        }
      }, 0);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPrivateKey]);

  // â”€â”€ Re-Decrypt Pending Messages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // If any message already in state is marked isDecryptionPending (e.g. it
  // arrived before the queue mechanism was in place, or via the retry path),
  // attempt decryption now that we have the key.
  useEffect(() => {
    if (!myPrivateKey) return;
    const privKey = myPrivateKeyRef.current;
    if (!privKey) return;

    const pendingMsgs = messagesRef.current.filter(
      (m) => m.isDecryptionPending && m.rawCiphertext
    );
    if (pendingMsgs.length === 0) return;

    void (async () => {
      const decryptedMap = new Map<string, string>();
      for (const m of pendingMsgs) {
        // 1. Check persistent IndexedDB cache first (e.g. restored from vault by ID, nonce, or ciphertext)
        let locallyStored = await getDecryptedMessage(currentUserIdRef.current, m.id);
        if (!locallyStored && m.rawNonce) {
          locallyStored = await getDecryptedMessage(currentUserIdRef.current, `nonce_${m.rawNonce}`);
        }
        if (!locallyStored && m.rawCiphertext) {
          locallyStored =
            (await getDecryptedMessage(currentUserIdRef.current, m.rawCiphertext)) ||
            (await getDecryptedMessage(currentUserIdRef.current, `cipher_${m.rawCiphertext}`));
        }
        if (locallyStored) {
          decryptedMap.set(m.id, locallyStored);
          continue;
        }

        const isSignal = m.rawMessageType === 2 || m.rawMessageType === 3 || m.rawEncryptedKeys?.protocol === 'libsignal';

        // 2. If self-sent message with selfEncryptedSessionKey
        if (m.senderId === currentUserIdRef.current && m.rawEncryptedKeys?.selfEncryptedSessionKey) {
          try {
            const selfEnc = m.rawEncryptedKeys.selfEncryptedSessionKey;
            const myPub = myPublicKeyRef.current || myPublicKey;
            if (myPub && privKey) {
              const decSelf = await decryptMessage(selfEnc.ciphertext, selfEnc.nonce, myPub, privKey);
              if (decSelf) {
                const t = parseEditedText(decSelf).text;
                decryptedMap.set(m.id, t);
                void storeDecryptedMessage(currentUserIdRef.current, m.id, t);
                if (m.rawNonce) void storeDecryptedMessage(currentUserIdRef.current, `nonce_${m.rawNonce}`, t);
                if (m.rawCiphertext) {
                  void storeDecryptedMessage(currentUserIdRef.current, m.rawCiphertext, t);
                  void storeDecryptedMessage(currentUserIdRef.current, `cipher_${m.rawCiphertext}`, t);
                }
                continue;
              }
            }
          } catch {}
        }

        // 3. Libsignal decryption if peer message
        if (isSignal && m.senderId && m.senderId !== currentUserIdRef.current) {
          try {
            const dec = await decrypt1to1Message(
              currentUserIdRef.current,
              m.senderId,
              m.rawCiphertext!,
              m.rawMessageType ?? 2,
              1
            );
            if (dec) {
              const t = parseEditedText(dec).text;
              decryptedMap.set(m.id, t);
              void storeDecryptedMessage(currentUserIdRef.current, m.id, t);
              if (m.rawNonce) void storeDecryptedMessage(currentUserIdRef.current, `nonce_${m.rawNonce}`, t);
              if (m.rawCiphertext) {
                void storeDecryptedMessage(currentUserIdRef.current, m.rawCiphertext, t);
                void storeDecryptedMessage(currentUserIdRef.current, `cipher_${m.rawCiphertext}`, t);
              }
              continue;
            }
          } catch { /* try next key candidate */ }
        }
      }

      if (decryptedMap.size > 0) {
        setMessages((prev) =>
          prev.map((m) => {
            const t = decryptedMap.get(m.id);
            return t ? { ...m, text: t, isDecryptionPending: false } : m;
          })
        );
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPrivateKey]);

  // —— Auto-Retry Dispatcher (Receiver-Side) —————————————————————————————
  const requestRetryForMessage = useCallback(
    (messageId: string, convId: string) => {
      if (!socket || !isConnected) return;
      if (retryRequestedMessagesRef.current.has(messageId)) return;
      retryRequestedMessagesRef.current.add(messageId);

      const myRegId =
        localStorage.getItem("registrationId") ||
        localStorage.getItem(`calls_registration_id_${currentUserIdRef.current}`) ||
        null;

      socket.emit("e2ee:retry_request", {
        conversationId: convId,
        messageId,
        recipientRegistrationId: myRegId,
      });
      console.log("ðŸ”„ [E2EE] Dispatched silent retry request for message:", messageId);
    },
    [socket, isConnected]
  );

  // â”€â”€ Key Setup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const loadKeys = useCallback(async () => {
    if (typeof window === "undefined" || !currentUserId) return;
    await migrateKeysFromLocalStorage(currentUserId);
    const privKey = await getUserPrivateKey(currentUserId);
    const pubKey = await getUserPublicKey(currentUserId);
    setMyPrivateKey(privKey);
    setMyPublicKey(pubKey);
    myPrivateKeyRef.current = privKey;
    myPublicKeyRef.current = pubKey;
  }, [currentUserId]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys, keysReady, keysRestoredVersion]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleKeysRestored = () => {
      console.log("[useChat] Detected e2ee:keys_restored event, re-loading keys and triggering re-decryption...");
      loadKeys();
      setKeysRestoredVersion((v) => v + 1);
    };
    window.addEventListener("e2ee:keys_restored", handleKeysRestored);
    return () => window.removeEventListener("e2ee:keys_restored", handleKeysRestored);
  }, [loadKeys]);

  // â”€â”€ Fetch Recipient Public Key â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    // If there is no peer (B2C thread or unresolved state) do NOT fetch a key.
    // Fetching with an empty string returns a dummy key which causes "incorrect
    // key pair" errors when the server echoes back the message.
    if (!activePeerId || isBizChat) return;

    const fetchRecipientKey = async () => {
      try {
        const res = await chatService.fetchRecipientKey(activePeerId);
        // Guard: if backend returns empty array (no key registered), do not set any key.
        // Keys are ordered descending by updatedAt â€” the FIRST entry (index 0) is the newest/active key.
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setRecipientPublicKey(res.data[0].publicKey);
        } else if (res?.success && res?.data?.publicKey) {
          setRecipientPublicKey(res.data.publicKey);
        }
        // Do NOT set a dummy fallback key â€” absence of key = cannot encrypt = safe
      } catch (err) {
        console.error("Failed to fetch recipient public key", err);
      }
    };

    fetchRecipientKey();
  }, [activePeerId, isBizChat]);

  // â”€â”€ Load Message History â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Gated on keysReady (from E2EEContext) so we never attempt to decrypt history
  // before E2EEProvider has finished initialising keys â€” prevents partial-state
  // decryption failures on fresh-login page loads.
  useEffect(() => {
    if (!conversationId || !keysReady || !myPrivateKey || (!recipientPublicKey && !isBizChat) || !currentUserId || (!activePeerId && !isBizChat)) return;

    const loadHistory = async () => {
      try {
        const historyRes = await chatService.fetchHistory(conversationId);
        if (historyRes?.success && historyRes?.data) {
          const rawMessages = Array.isArray(historyRes.data)
            ? historyRes.data
            : historyRes.data.messages;

          if (Array.isArray(rawMessages)) {
            // Resolve ALL public keys for this peer
            const resolvePeerKeys = async (uid: string): Promise<string[]> => {
              try {
                const res = await chatService.fetchRecipientKey(uid);
                if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
                  return res.data.map((d: { publicKey: string }) => d.publicKey);
                } else if (res?.success && res?.data?.publicKey) {
                  return [res.data.publicKey];
                }
              } catch { /* ignore */ }
              return [];
            };

            const peerKeys = activePeerId ? await resolvePeerKeys(activePeerId) : [];

            // Step 1: Pre-decrypt all message texts and build a lookup map
            const decryptedTextsMap = new Map<string, string>();
            for (const msg of rawMessages) {
              const isTicketMessage = !!msg.ticketId;
              let rawEncKeys = msg.encryptedKeys as any;
              if (typeof rawEncKeys === "string") {
                try { rawEncKeys = JSON.parse(rawEncKeys); } catch {}
              }
              const isLibsignal =
                (msg.messageType === 3 || msg.messageType === 2 || rawEncKeys?.protocol === 'libsignal') &&
                rawEncKeys?.protocol !== 'pairwise' &&
                rawEncKeys?.protocol !== 'x3dh' &&
                rawEncKeys?.protocol !== 'multi-device' &&
                !msg.nonce;

              if (!msg.ciphertext || (!msg.nonce && !isLibsignal) || isBizChat || isTicketMessage) {
                if (msg.ciphertext) {
                  decryptedTextsMap.set(msg.id, parseEditedText(msg.ciphertext).text);
                }
                continue;
              }

              // Check persistent IndexedDB cache first (by message ID, nonce, or ciphertext)
              let locallyStored =
                (msg.id ? sentPlaintextCacheRef.current.get(msg.id) : null) ||
                (msg.nonce ? sentPlaintextCacheRef.current.get(msg.nonce) : null) ||
                (msg.ciphertext ? sentPlaintextCacheRef.current.get(msg.ciphertext) : null);

              if (!locallyStored && msg.id) {
                locallyStored = await getDecryptedMessage(currentUserId, msg.id);
              }
              if (!locallyStored && msg.nonce) {
                locallyStored = await getDecryptedMessage(currentUserId, `nonce_${msg.nonce}`);
              }
              if (!locallyStored && msg.ciphertext) {
                locallyStored =
                  (await getDecryptedMessage(currentUserId, msg.ciphertext)) ||
                  (await getDecryptedMessage(currentUserId, `cipher_${msg.ciphertext}`));
              }
              if (locallyStored) {
                decryptedTextsMap.set(msg.id, locallyStored);
                sentPlaintextCacheRef.current.set(msg.id, locallyStored);
                if (msg.nonce) sentPlaintextCacheRef.current.set(msg.nonce, locallyStored);
                if (msg.ciphertext) sentPlaintextCacheRef.current.set(msg.ciphertext, locallyStored);
                continue;
              }

              if (myPrivateKey) {
                let encKeys = msg.encryptedKeys as any;
                if (typeof encKeys === "string") {
                  try {
                    encKeys = JSON.parse(encKeys);
                  } catch {}
                }

                // â”€â”€ HISTORY SENDER KEY PRIORITY FIX â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                // Prepend the sender's embedded public key so historical messages
                // encrypted with an older key are decryptable even after rotation.
                let effectivePeerKeys = peerKeys;
                if (encKeys?.senderPublicKey && typeof encKeys.senderPublicKey === 'string') {
                  effectivePeerKeys = [
                    encKeys.senderPublicKey,
                    ...peerKeys.filter(k => k !== encKeys.senderPublicKey),
                  ];
                }

                const activeMyPubKey = myPublicKeyRef.current || myPublicKey;
                const activeMyPrivKey = myPrivateKeyRef.current || myPrivateKey;

                if (msg.senderId === currentUserId) {
                  // Message sent by self: check plaintext cache or self-encrypted session key
                  if (sentPlaintextCacheRef.current.has(msg.id)) {
                    const t = sentPlaintextCacheRef.current.get(msg.id)!;
                    decryptedTextsMap.set(msg.id, t);
                    void storeDecryptedMessage(currentUserId, msg.id, t);
                  } else if (msg.nonce && sentPlaintextCacheRef.current.has(msg.nonce)) {
                    const t = sentPlaintextCacheRef.current.get(msg.nonce)!;
                    decryptedTextsMap.set(msg.id, t);
                    void storeDecryptedMessage(currentUserId, msg.id, t);
                  } else if (encKeys?.selfEncryptedSessionKey && activeMyPubKey && activeMyPrivKey) {
                    try {
                      const decRaw = await decryptMessage(
                        encKeys.selfEncryptedSessionKey.ciphertext,
                        encKeys.selfEncryptedSessionKey.nonce,
                        activeMyPubKey,
                        activeMyPrivKey
                      );
                      if (decRaw) {
                        let t: string;
                        if (encKeys.selfEncryptedSessionKey.type === 'plaintext') {
                          // Multi-device path: decRaw IS the plaintext
                          t = parseEditedText(decRaw).text;
                        } else {
                          // X3DH path: decRaw is a base64 session key, decrypt message body
                          const sessionKey = base64ToBytes(decRaw);
                          const dec = await decryptWithSessionKey(msg.ciphertext, msg.nonce, sessionKey);
                          t = parseEditedText(dec).text;
                        }
                        decryptedTextsMap.set(msg.id, t);
                        sentPlaintextCacheRef.current.set(msg.id, t);
                        if (msg.nonce) sentPlaintextCacheRef.current.set(msg.nonce, t);
                        void storeDecryptedMessage(currentUserId, msg.id, t);
                        if (msg.nonce) void storeDecryptedMessage(currentUserId, `nonce_${msg.nonce}`, t);
                      }
                    } catch {}
                  } else if (encKeys?.devices && myPrivateKey) {
                    const myDeviceId = localStorage.getItem("deviceId");
                    // Use effectivePeerKeys (senderPublicKey first) for the sender-side multi-device case
                    const keysToTry = activeMyPubKey ? [activeMyPubKey, ...effectivePeerKeys] : effectivePeerKeys;
                    for (const candidateKey of keysToTry) {
                      try {
                        const dec = await decryptMultiDeviceMessage(
                          msg.ciphertext,
                          msg.nonce,
                          encKeys.devices,
                          candidateKey,
                          myPrivateKey,
                          myDeviceId
                        );
                        if (dec) {
                          const t = parseEditedText(dec).text;
                          decryptedTextsMap.set(msg.id, t);
                          sentPlaintextCacheRef.current.set(msg.id, t);
                          if (msg.nonce) sentPlaintextCacheRef.current.set(msg.nonce, t);
                          void storeDecryptedMessage(currentUserId, msg.id, t);
                          if (msg.nonce) void storeDecryptedMessage(currentUserId, `nonce_${msg.nonce}`, t);
                          break;
                        }
                      } catch { console.debug('[E2EE] history self-device multi-device unwrap failed for key:', (candidateKey || '').slice(0, 8) + 'â€¦'); }
                    }
                  } else if (effectivePeerKeys.length > 0) {
                    // Legacy pairwise fallback â€” use effectivePeerKeys (senderPublicKey first)
                    for (const candidateKey of effectivePeerKeys) {
                      try {
                        const dec = await decryptMessage(msg.ciphertext, msg.nonce, candidateKey, myPrivateKey);
                        const t = parseEditedText(dec).text;
                        decryptedTextsMap.set(msg.id, t);
                        sentPlaintextCacheRef.current.set(msg.id, t);
                        if (msg.nonce) sentPlaintextCacheRef.current.set(msg.nonce, t);
                        void storeDecryptedMessage(currentUserId, msg.id, t);
                        if (msg.nonce) void storeDecryptedMessage(currentUserId, `nonce_${msg.nonce}`, t);
                        break;
                      } catch { console.debug('[E2EE] history pairwise fallback failed for key:', (candidateKey || '').slice(0, 8) + 'â€¦'); }
                    }
                  }
                } else {
                  // Message sent by peer: Multi-Device, X3DH receiver, or pairwise fallback
                  if (encKeys?.devices && myPrivateKey && effectivePeerKeys.length > 0) {
                    const myDeviceId = localStorage.getItem("deviceId");
                    for (const senderKey of effectivePeerKeys) {
                      try {
                        const dec = await decryptMultiDeviceMessage(
                          msg.ciphertext,
                          msg.nonce,
                          encKeys.devices,
                          senderKey,
                          myPrivateKey,
                          myDeviceId
                        );
                        if (dec) {
                          const t = parseEditedText(dec).text;
                          decryptedTextsMap.set(msg.id, t);
                          sentPlaintextCacheRef.current.set(msg.id, t);
                          if (msg.nonce) sentPlaintextCacheRef.current.set(msg.nonce, t);
                          void storeDecryptedMessage(currentUserId, msg.id, t);
                          if (msg.nonce) void storeDecryptedMessage(currentUserId, `nonce_${msg.nonce}`, t);
                          break;
                        }
                      } catch { console.debug('[E2EE] history peer multi-device unwrap failed for senderKey:', (senderKey || '').slice(0, 8) + 'â€¦'); }
                    }
                  }

                  // Libsignal history decryption (Double Ratchet SessionCipher)
                  if (!decryptedTextsMap.has(msg.id) && (msg.messageType === 3 || msg.messageType === 2 || encKeys?.protocol === 'libsignal') && msg.senderId) {
                    try {
                      const dec = await decrypt1to1Message(
                        currentUserId,
                        msg.senderId,
                        msg.ciphertext,
                        msg.messageType ?? 2,
                        1
                      );
                      if (dec) {
                        const t = parseEditedText(dec).text;
                        decryptedTextsMap.set(msg.id, t);
                        sentPlaintextCacheRef.current.set(msg.id, t);
                        void storeDecryptedMessage(currentUserId, msg.id, t);
                      }
                    } catch {}
                  }

                  if (!decryptedTextsMap.has(msg.id) && encKeys?.ephemeralPublicKey) {
                    try {
                      const spkPriv = await getSignedPreKeyPrivate(currentUserId, encKeys.signedPreKeyId || 1);
                      const opkPriv = encKeys.oneTimePreKeyId
                        ? await getPreKeyPrivate(currentUserId, encKeys.oneTimePreKeyId)
                        : null;
                      if (spkPriv) {
                        // Use effectivePeerKeys (embedded senderPublicKey first) for X3DH
                        for (const senderKey of effectivePeerKeys) {
                          try {
                            const sessionKey = await performX3DHReceiver(
                              myPrivateKey,
                              spkPriv,
                              opkPriv,
                              senderKey,
                              encKeys.ephemeralPublicKey
                            );
                            const dec = await decryptWithSessionKey(msg.ciphertext, msg.nonce, sessionKey);
                            const t = parseEditedText(dec).text;
                            decryptedTextsMap.set(msg.id, t);
                            sentPlaintextCacheRef.current.set(msg.id, t);
                            void storeDecryptedMessage(currentUserId, msg.id, t);
                            break;
                          } catch {}
                        }
                      }
                    } catch {}
                  }

                  // Pairwise fallback if not decrypted by X3DH â€” use effectivePeerKeys
                  if (!decryptedTextsMap.has(msg.id) && effectivePeerKeys.length > 0) {
                    for (const candidateKey of effectivePeerKeys) {
                      try {
                        const dec = await decryptMessage(msg.ciphertext, msg.nonce, candidateKey, myPrivateKey);
                        const t = parseEditedText(dec).text;
                        decryptedTextsMap.set(msg.id, t);
                        sentPlaintextCacheRef.current.set(msg.id, t);
                        void storeDecryptedMessage(currentUserId, msg.id, t);
                        break;
                      } catch { console.debug('[E2EE] history X3DH pairwise fallback failed for key:', (candidateKey || '').slice(0, 8) + 'â€¦'); }
                    }
                  }
                }
              }
            }

            // Step 2: Build final decrypted messages with fully resolved quoted replies
            const decryptedHistory = await Promise.all(
              rawMessages.map(async (msg: any) => {
                const isTicketMessage = !!msg.ticketId;
                const replyTo = await resolveQuotedMessage(
                  msg.replyTo,
                  currentUserId,
                  myPrivateKey,
                  peerKeys,
                  myPublicKey,
                  isBizChat || isTicketMessage,
                  decryptedTextsMap
                );

                let msgEncKeys = msg.encryptedKeys as any;
                if (typeof msgEncKeys === "string") {
                  try { msgEncKeys = JSON.parse(msgEncKeys); } catch {}
                }
                const isSignalMsg =
                  msg.messageType === 2 ||
                  msg.messageType === 3 ||
                  msgEncKeys?.protocol === 'libsignal';

                const isPendingDecryption =
                  !decryptedTextsMap.has(msg.id) &&
                  !!msg.ciphertext &&
                  !isBizChat &&
                  !isTicketMessage &&
                  (!!msg.nonce || isSignalMsg);

                const text =
                  decryptedTextsMap.get(msg.id) ??
                  (msg.ciphertext
                    ? isBizChat || (!msg.nonce && !isSignalMsg)
                      ? parseEditedText(msg.ciphertext).text
                      : "⏳ Waiting for this message. This may take a while."
                    : "");

                return {
                  id: msg.id,
                  conversationId: msg.conversationId,
                  senderId: msg.senderId,
                  text: text,
                  isEdited: msg.isEdited ?? false,
                  createdAt: msg.createdAt,
                  mediaUrl: msg.mediaUrl,
                  mediaType: msg.mediaType,
                  isDeleted: msg.isDeleted,
                  disappearAfterSeconds: msg.disappearAfterSeconds ?? null,
                  replyToId: msg.replyToId ?? null,
                  replyTo,
                  receipts: msg.receipts || [],
                  reactions: msg.reactions || [],
                  isDecryptionPending: isPendingDecryption,
                  rawCiphertext: msg.ciphertext,
                  rawNonce: msg.nonce,
                  rawMessageType: (msg.messageType as number | null) ?? null,
                  rawEncryptedKeys: (msg.encryptedKeys as any) ?? null,
                  recipientRegistrationId: (msg.encryptedKeys as any)?.recipientRegistrationId ?? null,
                  senderRegistrationId: (msg.encryptedKeys as any)?.senderRegistrationId ?? null,
                };
              })
            );
            // Sort ascending (oldest first)
            decryptedHistory.sort(
              (a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            setMessages(decryptedHistory);

            // Populate sent plaintext cache and dispatch silent retries for pending items
            decryptedHistory.forEach((m) => {
              if (m.senderId === currentUserId && m.text && !m.isDecryptionPending) {
                sentPlaintextCacheRef.current.set(m.id, m.text);
              }
              if (m.senderId !== currentUserId && m.isDecryptionPending) {
                requestRetryForMessage(m.id, m.conversationId);
              }
            });

            // Proactively acknowledge delivery for any messages not yet marked as delivered
            if (socket && isConnected) {
              const undelivered = rawMessages.filter(
                (m) =>
                  m.senderId !== currentUserId &&
                  (!m.receipts ||
                    !m.receipts.some(
                      (r: any) => r.userId === currentUserId && r.deliveredAt
                    ))
              );
              undelivered.forEach((m) => {
                socket.emit("chat:mark_delivered", {
                  conversationId,
                  messageId: m.id,
                });
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to load history", err);
      }
    };

    loadHistory();
  }, [conversationId, myPrivateKey, myPublicKey, recipientPublicKey, currentUserId, activePeerId, keysReady, keysRestoredVersion]);

  // â”€â”€ Socket: Join Room â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Separate effect so room join doesn't re-fire when keys change
  useEffect(() => {
    if (!socket || !isConnected || !conversationId) return;

    console.log("ðŸ”Œ [Socket] Joining room:", conversationId);
    socket.emit("chat:join_room", { conversationId });

    const handleJoinedRoom = (payload: any) => {
      console.log("âœ… [Socket] Successfully joined room:", payload);
    };

    socket.on("chat:joined_room", handleJoinedRoom);

    return () => {
      socket.off("chat:joined_room", handleJoinedRoom);
    };
  }, [socket, isConnected, conversationId]);

  // â”€â”€ Socket: Receive Messages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Uses refs to always access current keys without re-registering
  useEffect(() => {
    if (!socket || !isConnected || !conversationId) return;

    const handleReceiveMessage = async (payload: any) => {
      console.log("ðŸ“¥ [Socket] Received chat:receive_message:", payload);

      if (payload.conversationId !== conversationId) {
        console.log(
          "âš ï¸ [Socket] Ignored message for different conversation:",
          payload.conversationId,
          "Expected:",
          conversationId
        );
        return;
      }

      // â”€â”€ FAST PATH: IndexedDB persistent cache â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      // If this message was already decrypted in this session (or a previous
      // one), resolve it instantly without any async crypto or network calls.
      // This eliminates the "Waitingâ€¦" flash for every cached message.
      if (payload.id || payload.nonce) {
        const myId = currentUserIdRef.current;
        let cached: string | null = null;
        if (payload.id) {
          cached = await getDecryptedMessage(myId, payload.id);
        }
        if (!cached && payload.nonce) {
          cached = await getDecryptedMessage(myId, `nonce_${payload.nonce}`);
        }
        if (cached) {
          const parsed = parseEditedText(cached);
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.id)) return prev;
            const optimisticIdx = prev.map((m) => m.id).lastIndexOf(
              prev.slice().reverse().find((m) => m.id.startsWith("optimistic-"))?.id ?? ""
            );
            if (optimisticIdx !== -1) {
              const updated = [...prev];
              const existingOpt = prev[optimisticIdx];
              updated[optimisticIdx] = {
                ...existingOpt,
                id: payload.id,
                text: parsed.text,
                isEdited: parsed.isEdited,
                isDecryptionPending: false,
                createdAt: payload.createdAt || existingOpt.createdAt,
                receipts: payload.receipts || existingOpt.receipts || [],
                reactions: payload.reactions || existingOpt.reactions || [],
              };
              return updated;
            }
            const senderId = payload.senderId || payload.sender?.id;
            return [
              ...prev,
              {
                id: payload.id || Date.now().toString(),
                conversationId: payload.conversationId,
                senderId,
                text: parsed.text,
                isEdited: parsed.isEdited,
                isDecryptionPending: false,
                createdAt: payload.createdAt || new Date().toISOString(),
                mediaUrl: payload.mediaUrl,
                mediaType: payload.mediaType,
                disappearAfterSeconds: payload.disappearAfterSeconds,
                receipts: payload.receipts || [],
                reactions: payload.reactions || [],
                replyToId: payload.replyToId ?? null,
                replyTo: null,
              },
            ];
          });
          return; // skip all crypto
        }
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
      // Start with an empty set â€” we'll populate uniquely below
      let allPeerKeys: string[] = [];

      let encKeys = payload.encryptedKeys;
      if (typeof encKeys === "string") {
        try {
          encKeys = JSON.parse(encKeys);
        } catch {}
      }
      const isLibsignalMsg =
        (payload.messageType === 3 || payload.messageType === 2 || encKeys?.protocol === 'libsignal') &&
        encKeys?.protocol !== 'pairwise' &&
        encKeys?.protocol !== 'x3dh' &&
        encKeys?.protocol !== 'multi-device' &&
        !payload.nonce;

      if (!isBiz && !noPeer && !isTicket && payload.ciphertext && (payload.nonce || isLibsignalMsg)) {
        if (!privKey) {
          // Key not yet ready (fresh login / new session). Queue the message and
          // replay it once myPrivateKey / keysReady becomes available.
          console.warn("âš ï¸ [Socket] Key not ready â€” queuing message for later decryption:", payload.id);
          if (pendingDecryptQueueRef.current.length < MAX_PENDING_QUEUE_SIZE) {
            pendingDecryptQueueRef.current.push(payload);
          } else {
            console.warn("[E2EE] Pending queue full â€” dropping oldest message to make room.");
            pendingDecryptQueueRef.current.shift();
            pendingDecryptQueueRef.current.push(payload);
          }
          return;
        }

        try {
          if (!senderId) {
            console.error("âŒ [Socket] Malformed payload: missing senderId. Cannot determine decryption key.", payload);
            throw new Error("Missing senderId in payload");
          }

          // If we sent the message (echoed back), we decrypt with the peer's public key.
          // If the peer sent it, we decrypt with the peer's public key.
          const targetUserId = senderId === currentUser ? peerUser : senderId;

          // Seed with cached key (only once, without duplication)
          if (pubKey) allPeerKeys.push(pubKey);

          // Fetch ALL registered public keys for the target user (newest first)
          try {
            if (targetUserId) {
              const res = await chatService.fetchRecipientKey(targetUserId);
              if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
                // Backend returns keys ordered desc by updatedAt (newest first)
                const fetchedKeys = res.data.map((d: { publicKey: string }) => d.publicKey);
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

          // isMyMessage: trust senderId match first; cache check is the race-condition fallback
          const isMyMessage =
            (!!senderId && !!currentUser && senderId === currentUser) ||
            (!!payload.nonce && sentPlaintextCacheRef.current.has(payload.nonce)) ||
            (!!payload.ciphertext && sentPlaintextCacheRef.current.has(payload.ciphertext));

          if (allPeerKeys.length === 0 && !isMyMessage) {
            throw new Error("Missing public key for decryption");
          }

          console.log(`[Socket] Attempting decryption â€” senderId: ${senderId}, currentUser: ${currentUser}, isMyMessage: ${isMyMessage}, keys: ${allPeerKeys.length}, target: ${targetUserId}`);

          let text = "";
          let decryptedRealtime = false;

          let encKeys = payload.encryptedKeys;
          if (typeof encKeys === "string") {
            try {
              encKeys = JSON.parse(encKeys);
            } catch {}
          }

          // â”€â”€ KEY PRIORITY FIX â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          // If the sender embedded their public key in encryptedKeys, prepend it
          // to allPeerKeys so it is tried FIRST in every decryption path.
          // This guarantees we always use the exact key that was used to encrypt
          // the message, regardless of any subsequent key rotations by the sender.
          if (encKeys?.senderPublicKey && typeof encKeys.senderPublicKey === 'string') {
            if (!allPeerKeys.includes(encKeys.senderPublicKey)) {
              allPeerKeys.unshift(encKeys.senderPublicKey);
            } else {
              // Move it to front so it's tried first
              allPeerKeys = [encKeys.senderPublicKey, ...allPeerKeys.filter(k => k !== encKeys.senderPublicKey)];
            }
          }

          if (isMyMessage) {
            // 1. Recover our own sent message from local memory cache
            if (payload.id && sentPlaintextCacheRef.current.has(payload.id)) {
              text = sentPlaintextCacheRef.current.get(payload.id)!;
              decryptedRealtime = true;
            } else if (payload.nonce && sentPlaintextCacheRef.current.has(payload.nonce)) {
              text = sentPlaintextCacheRef.current.get(payload.nonce)!;
              decryptedRealtime = true;
            } else if (payload.ciphertext && sentPlaintextCacheRef.current.has(payload.ciphertext)) {
              text = sentPlaintextCacheRef.current.get(payload.ciphertext)!;
              decryptedRealtime = true;
            } else {
              // 2. Recover from pending optimistic message in state or ref
              const optMsg = messagesRef.current
                .slice()
                .reverse()
                .find((m) => m.id.startsWith("optimistic-") && (m.senderId === currentUser || !m.senderId));
              if (optMsg?.text && optMsg.text !== "â³ Waiting for this message. This may take a while.") {
                text = optMsg.text;
                decryptedRealtime = true;
              } else if (optMsg && sentPlaintextCacheRef.current.has(optMsg.id)) {
                text = sentPlaintextCacheRef.current.get(optMsg.id)!;
                decryptedRealtime = true;
              } else if (recentSentPlaintextsRef.current.length > 0) {
                // Check recent sent ring buffer
                const recent = recentSentPlaintextsRef.current[recentSentPlaintextsRef.current.length - 1];
                if (recent?.text) {
                  text = recent.text;
                  decryptedRealtime = true;
                }
              }
            }

            // 3. Check IndexedDB persistent store for nonce, ID, or ciphertext
            if (!decryptedRealtime) {
              let stored =
                (payload.id ? sentPlaintextCacheRef.current.get(payload.id) : null) ||
                (payload.nonce ? sentPlaintextCacheRef.current.get(payload.nonce) : null) ||
                (payload.ciphertext ? sentPlaintextCacheRef.current.get(payload.ciphertext) : null);

              if (!stored && payload.id) {
                stored = await getDecryptedMessage(currentUserIdRef.current, payload.id);
              }
              if (!stored && payload.nonce) {
                stored = await getDecryptedMessage(currentUserIdRef.current, `nonce_${payload.nonce}`);
              }
              if (!stored && payload.ciphertext) {
                stored =
                  (await getDecryptedMessage(currentUserIdRef.current, payload.ciphertext)) ||
                  (await getDecryptedMessage(currentUserIdRef.current, `cipher_${payload.ciphertext}`));
              }
              if (stored) {
                text = stored;
                decryptedRealtime = true;
              }
            }

            // 4. If cache missed, check self-encrypted session key
            const activeMyPubKey = myPublicKeyRef.current || myPublicKey;
            const activeMyPrivKey = privKey || myPrivateKeyRef.current;
            if (!decryptedRealtime && encKeys?.selfEncryptedSessionKey && activeMyPrivKey && activeMyPubKey) {
              try {
                const decRaw = await decryptMessage(
                  encKeys.selfEncryptedSessionKey.ciphertext,
                  encKeys.selfEncryptedSessionKey.nonce,
                  activeMyPubKey,
                  activeMyPrivKey
                );
                if (decRaw) {
                  if (encKeys.selfEncryptedSessionKey.type === 'plaintext') {
                    // Multi-device path: decRaw IS the plaintext
                    text = parseEditedText(decRaw).text;
                  } else {
                    // X3DH path: decRaw is a base64 session key, decrypt message body
                    const sessionKey = base64ToBytes(decRaw);
                    text = await decryptWithSessionKey(payload.ciphertext, payload.nonce, sessionKey);
                  }
                  decryptedRealtime = true;
                }
              } catch {}
            }

            // 5. If self-message was sent from another device of mine, decrypt via Multi-Device envelope
            if (!decryptedRealtime && encKeys?.devices && privKey) {
              const myDeviceId = localStorage.getItem("deviceId") || (currentUser ? `web-${currentUser}` : null);
              const keysToTry = activeMyPubKey ? [activeMyPubKey, ...allPeerKeys] : allPeerKeys;
              for (const senderKey of keysToTry) {
                try {
                  const dec = await decryptMultiDeviceMessage(
                    payload.ciphertext,
                    payload.nonce,
                    encKeys.devices,
                    senderKey,
                    privKey,
                    myDeviceId
                  );
                  if (dec) {
                    text = parseEditedText(dec).text;
                    decryptedRealtime = true;
                    break;
                  }
                } catch {}
              }
            }
          } else {
            // Message sent by peer: Libsignal (Double Ratchet), Multi-Device, X3DH receiver, or pairwise fallback
            if (!decryptedRealtime && isLibsignalMsg && senderId) {
              try {
                const dec = await decrypt1to1Message(
                  currentUser,
                  senderId,
                  payload.ciphertext,
                  payload.messageType ?? 2,
                  1
                );
                if (dec) {
                  text = parseEditedText(dec).text;
                  decryptedRealtime = true;
                }
              } catch (signalErr) {
                console.warn('[useChat] Libsignal real-time decrypt attempt failed, falling back:', signalErr);
              }
            }

            if (!decryptedRealtime && encKeys?.devices && privKey) {
              const myDeviceId = localStorage.getItem("deviceId") || (currentUser ? `web-${currentUser}` : null);
              for (const senderIdentityKey of allPeerKeys) {
                try {
                  const dec = await decryptMultiDeviceMessage(
                    payload.ciphertext,
                    payload.nonce,
                    encKeys.devices,
                    senderIdentityKey,
                    privKey,
                    myDeviceId
                  );
                  if (dec) {
                    text = parseEditedText(dec).text;
                    decryptedRealtime = true;
                    break;
                  }
                } catch (e) {
                  console.debug('[E2EE] Multi-device unwrap failed for senderKey:', (senderIdentityKey || '').slice(0, 8) + 'â€¦');
                }
              }
            }

            if (!decryptedRealtime && encKeys?.ephemeralPublicKey && privKey) {
              try {
                const spkPriv = await getSignedPreKeyPrivate(currentUser, encKeys.signedPreKeyId || 1);
                const opkPriv = encKeys.oneTimePreKeyId
                  ? await getPreKeyPrivate(currentUser, encKeys.oneTimePreKeyId)
                  : null;
                if (spkPriv) {
                  for (const senderIdentityKey of allPeerKeys) {
                    try {
                      const sessionKey = await performX3DHReceiver(
                        privKey,
                        spkPriv,
                        opkPriv,
                        senderIdentityKey,
                        encKeys.ephemeralPublicKey
                      );
                      text = await decryptWithSessionKey(payload.ciphertext, payload.nonce, sessionKey);
                      decryptedRealtime = true;
                      console.log("âš¡ [useChat] Decrypted message via X3DH ephemeral session!");
                      break;
                    } catch (x3dhErr) {
                      // try next key candidate
                    }
                  }
                } else {
                  console.warn(`âš ï¸ [X3DH] Missing signed pre-key private (keyId=${encKeys.signedPreKeyId || 1}) for user ${currentUser}. E2EEProvider will fix this on next load.`);
                }
              } catch (x3dhErr) {
                console.warn("X3DH decryption failed, attempting pairwise fallback:", x3dhErr);
              }
            }

            // Pairwise Fallback if not decrypted by X3DH
            if (!decryptedRealtime) {
              for (const candidateKey of allPeerKeys) {
                try {
                  text = await decryptMessage(payload.ciphertext, payload.nonce, candidateKey, privKey);
                  decryptedRealtime = true;
                  break;
                } catch {}
              }
            }

            // Final fallback: try our own public key
            if (!decryptedRealtime && myPublicKeyRef.current) {
              try {
                text = await decryptMessage(payload.ciphertext, payload.nonce, myPublicKeyRef.current, privKey);
                console.log("âœ… [Socket] Decrypted with own public key (key rotation recovery).");
                decryptedRealtime = true;
              } catch {}
            }
          }

          // â”€â”€ UNIVERSAL LAST-RESORT CACHE RECOVERY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          // This fires whether isMyMessage was true or false â€” covers the race
          // where currentUserIdRef was empty (so isMyMessage=false) but we
          // actually sent the message and have it in our sent plaintext cache.
          if (!decryptedRealtime) {
            if (payload.nonce && sentPlaintextCacheRef.current.has(payload.nonce)) {
              text = sentPlaintextCacheRef.current.get(payload.nonce)!;
              decryptedRealtime = true;
              console.log("âœ… [Socket] Recovered via nonce cache (universal fallback)");
            } else if (payload.ciphertext && sentPlaintextCacheRef.current.has(payload.ciphertext)) {
              text = sentPlaintextCacheRef.current.get(payload.ciphertext)!;
              decryptedRealtime = true;
              console.log("âœ… [Socket] Recovered via ciphertext cache (universal fallback)");
            } else if (payload.id && sentPlaintextCacheRef.current.has(payload.id)) {
              text = sentPlaintextCacheRef.current.get(payload.id)!;
              decryptedRealtime = true;
              console.log("âœ… [Socket] Recovered via id cache (universal fallback)");
            }
          }

          // â”€â”€ PAIRWISE SELF-DECRYPT FALLBACK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          // X25519 DH is symmetric: ECDH(myPriv, peerPub) == ECDH(peerPriv, myPub).
          // If the message was encrypted with encryptMessage(text, peerPub, myPriv),
          // we can decrypt it with decryptMessage(cipher, nonce, peerPub, myPriv).
          // This is identical to the normal pairwise path but run as a final
          // self-recovery attempt when isMyMessage detection misfired.
          if (!decryptedRealtime && privKey && allPeerKeys.length > 0) {
            for (const candidateKey of allPeerKeys) {
              try {
                text = await decryptMessage(payload.ciphertext, payload.nonce, candidateKey, privKey);
                decryptedRealtime = true;
                console.log("âœ… [Socket] Pairwise self-decrypt recovery succeeded");
                break;
              } catch { /* try next */ }
            }
          }

          if (!decryptedRealtime) {
            console.error("âŒ [Socket] All decryption paths exhausted", { senderId, currentUser, isMyMessage: (!!senderId && !!currentUser && senderId === currentUser), cachedNonce: !!payload.nonce && sentPlaintextCacheRef.current.has(payload.nonce), keys: allPeerKeys.length });
            throw new Error("All decryption attempts exhausted");
          }

          console.log("âœ… [Socket] Decrypted message:", text);

          // Cache message in volatile memory and durable IndexedDB
          if (text) {
            if (payload.id) {
              sentPlaintextCacheRef.current.set(payload.id, text);
              void storeDecryptedMessage(currentUserIdRef.current, payload.id, text);
            }
            if (payload.nonce) {
              sentPlaintextCacheRef.current.set(payload.nonce, text);
              void storeDecryptedMessage(currentUserIdRef.current, `nonce_${payload.nonce}`, text);
            }
            if (payload.ciphertext) {
              sentPlaintextCacheRef.current.set(payload.ciphertext, text);
              void storeDecryptedMessage(currentUserIdRef.current, payload.ciphertext, text);
              void storeDecryptedMessage(currentUserIdRef.current, `cipher_${payload.ciphertext}`, text);
            }
            queueVaultSync(currentUserIdRef.current);
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("chat:message_decrypted", {
                  detail: { messageId: payload.id, conversationId, text },
                })
              );
            }
          }

          // Build known messages map
          const knownMap = new Map<string, string>();
          messages.forEach((m) => {
            if (m.text) knownMap.set(m.id, m.text);
          });

          let resolvedReplyTo = await resolveQuotedMessage(
            payload.replyTo,
            currentUserIdRef.current,
            privKey,
            allPeerKeys,
            myPublicKeyRef.current,
            isBiz,
            knownMap
          );

          // Helper to merge server receipts, optimistic receipts, and buffered pending receipts
          const pendingForThis = pendingReceiptsRef.current.get(payload.id) || [];
          const mergeReceipts = (base: MessageReceipt[] = [], opt?: MessageReceipt[]) => {
            const res = [...base];
            if (opt) {
              for (const r of opt) {
                const idx = res.findIndex((x) => x.userId === r.userId);
                if (idx !== -1) {
                  res[idx] = {
                    ...res[idx],
                    deliveredAt: r.deliveredAt ?? res[idx].deliveredAt,
                    seenAt: r.seenAt ?? res[idx].seenAt,
                  };
                } else {
                  res.push(r);
                }
              }
            }
            for (const pr of pendingForThis) {
              const idx = res.findIndex((x) => x.userId === pr.userId);
              if (idx !== -1) {
                res[idx] = {
                  ...res[idx],
                  deliveredAt: pr.deliveredAt ?? res[idx].deliveredAt,
                  seenAt: pr.seenAt ?? res[idx].seenAt,
                };
              } else {
                res.push(pr);
              }
            }
            return res;
          };

          setMessages((prev) => {
            // Replace an existing optimistic placeholder if present,
            // otherwise deduplicate by real server ID
            const hasRealId = prev.some((m) => m.id === payload.id);
            if (hasRealId) {
              console.log("ðŸ”„ [Socket] Duplicate message by server ID, skipping");
              return prev;
            }

            // If quote text missing, check prev state
            if (resolvedReplyTo && !resolvedReplyTo.text && payload.replyToId) {
              const matchedPrev = prev.find((m) => m.id === payload.replyToId);
              if (matchedPrev?.text) {
                resolvedReplyTo.text = matchedPrev.text;
              }
            }

            // Look for an optimistic placeholder to replace (last optimistic msg
            // from the same conversation that hasn't been confirmed yet)
            const optimisticIdx = prev.map((m) => m.id).lastIndexOf(
              prev.slice().reverse().find((m) => m.id.startsWith("optimistic-"))?.id ?? ""
            );
            if (optimisticIdx !== -1) {
              const updated = [...prev];
              const parsed = parseEditedText(text);
              const existingOpt = prev[optimisticIdx];
              const finalReplyTo =
                resolvedReplyTo?.text
                  ? resolvedReplyTo
                  : existingOpt?.replyTo?.text
                  ? existingOpt.replyTo
                  : resolvedReplyTo;

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
                receipts: mergeReceipts(payload.receipts || [], existingOpt?.receipts),
                reactions: payload.reactions || existingOpt?.reactions || [],
                replyToId: payload.replyToId ?? null,
                replyTo: finalReplyTo,
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
                receipts: mergeReceipts(payload.receipts || []),
                reactions: payload.reactions || [],
                replyToId: payload.replyToId ?? null,
                replyTo: resolvedReplyTo,
              },
            ];
          });
        } catch (err) {
          console.error("âŒ [Socket] Failed to decrypt message:", err);
          
          const fallbackSenderId = payload.senderId || payload.sender?.id || "unknown";
          const resolvedReplyTo = await resolveQuotedMessage(
            payload.replyTo,
            currentUserIdRef.current,
            privKey,
            allPeerKeys,
            myPublicKeyRef.current,
            isBiz
          );

          const isSelf =
            (fallbackSenderId && fallbackSenderId === currentUserIdRef.current) ||
            (!!payload.nonce && sentPlaintextCacheRef.current.has(payload.nonce)) ||
            (!!payload.ciphertext && sentPlaintextCacheRef.current.has(payload.ciphertext));

          // Still add the message as waiting_for_retry rather than failing or losing it
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.id)) return prev;

            // If this is our own sent message, protect against showing "Waiting for message" by checking optimistic state
            if (isSelf) {
              const optIdx = prev.map((m) => m.id).lastIndexOf(
                prev.slice().reverse().find((m) => m.id.startsWith("optimistic-"))?.id ?? ""
              );
              if (optIdx !== -1 && prev[optIdx]?.text && prev[optIdx].text !== "â³ Waiting for this message. This may take a while.") {
                const updated = [...prev];
                const opt = prev[optIdx];
                updated[optIdx] = {
                  ...opt,
                  id: payload.id,
                  isDecryptionPending: false,
                  createdAt: payload.createdAt || opt.createdAt,
                  receipts: payload.receipts || opt.receipts,
                  reactions: payload.reactions || opt.reactions || [],
                  replyToId: payload.replyToId ?? opt.replyToId,
                  replyTo: resolvedReplyTo ?? opt.replyTo,
                };
                sentPlaintextCacheRef.current.set(payload.id, opt.text);
                void storeDecryptedMessage(currentUserIdRef.current, payload.id, opt.text);
                if (payload.nonce) {
                  sentPlaintextCacheRef.current.set(payload.nonce, opt.text);
                  void storeDecryptedMessage(currentUserIdRef.current, `nonce_${payload.nonce}`, opt.text);
                }
                return updated;
              }
            }

            return [
              ...prev,
              {
                id: payload.id || Date.now().toString(),
                conversationId: payload.conversationId,
                senderId: fallbackSenderId,
                text: "â³ Waiting for this message. This may take a while.",
                isEdited: false,
                isDecryptionPending: true,
                rawCiphertext: payload.ciphertext,
                rawNonce: payload.nonce,
                rawMessageType: payload.messageType ?? null,
                rawEncryptedKeys: payload.encryptedKeys ?? null,
                recipientRegistrationId: payload.recipientRegistrationId,
                senderRegistrationId: payload.senderRegistrationId,
                createdAt: payload.createdAt || new Date().toISOString(),
                mediaUrl: payload.mediaUrl,
                mediaType: payload.mediaType,
                disappearAfterSeconds: payload.disappearAfterSeconds,
                receipts: payload.receipts || [],
                reactions: payload.reactions || [],
                replyToId: payload.replyToId ?? null,
                replyTo: resolvedReplyTo,
              },
            ];
          });

          // Dispatch silent retry request to recover the message automatically (only for peer messages)
          if (payload.id && fallbackSenderId !== currentUserIdRef.current && !isSelf) {
            requestRetryForMessage(payload.id, payload.conversationId);
          }
        }
      } else if (payload.ciphertext && (!payload.nonce || isBiz || noPeer || isTicket)) {
        // Plaintext: no nonce, B2C chat, peer not resolved, or ticket message
        console.log("â„¹ï¸ [Socket] Plaintext message received");
        const parsed = parseEditedText(payload.ciphertext || "");
        const resolvedReplyTo = await resolveQuotedMessage(
          payload.replyTo,
          currentUserIdRef.current,
          privKey,
          [],
          null,
          true
        );
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
              reactions: payload.reactions || [],
              replyToId: payload.replyToId ?? null,
              replyTo: resolvedReplyTo,
            },
          ];
        });
      } else if (payload.mediaType || payload.mediaUrl) {
        // Media-only messages (no text)
        const resolvedReplyTo = await resolveQuotedMessage(
          payload.replyTo,
          currentUserIdRef.current,
          privKey,
          allPeerKeys,
          myPublicKeyRef.current,
          isBiz
        );
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev;

          const optimisticIdx = prev.map((m) => m.id).lastIndexOf(
            prev.slice().reverse().find((m) => m.id.startsWith("optimistic-"))?.id ?? ""
          );

          const newMsg = {
            id: payload.id || Date.now().toString(),
            conversationId: payload.conversationId,
            senderId: payload.senderId || payload.sender?.id || "unknown",
            text: "",
            createdAt: payload.createdAt || new Date().toISOString(),
            mediaUrl: payload.mediaUrl,
            mediaType: payload.mediaType || "document",
            disappearAfterSeconds: payload.disappearAfterSeconds,
            receipts: payload.receipts || [],
            reactions: payload.reactions || [],
            replyToId: payload.replyToId ?? null,
            replyTo: resolvedReplyTo,
          };

          if (optimisticIdx !== -1) {
            const updated = [...prev];
            updated[optimisticIdx] = newMsg;
            return updated;
          }

          return [...prev, newMsg];
        });
      }
      
      // Proactively mark message as delivered whenever received from another participant
      if (senderId !== currentUserIdRef.current && payload.id) {
        socket.emit("chat:mark_delivered", {
          conversationId,
          messageId: payload.id,
        });
      }

      // If receiver is actively in the chat and tab is visible, mark conversation as seen immediately
      if (senderId !== currentUserIdRef.current && typeof document !== 'undefined' && document.visibilityState !== 'hidden') {
        socket.emit("chat:mark_conversation_seen", {
          conversationId,
        });
      }
    };

    const handleChatError = (err: any) => {
      console.error("ðŸš¨ [Socket] Chat Error:", err);
      // Remove optimistic messages on error
      setMessages((prev) => prev.filter((m) => !m.id.startsWith("optimistic-")));
      
      const errorMessage = err?.message || "Failed to send message.";

      if (err?.code === 'STALE_KEY') {
        const latestKey = err?.context?.latestPublicKey;
        const latestRegId = err?.context?.latestRegistrationId;
        if (latestKey) {
          recipientPublicKeyRef.current = latestKey;
          setRecipientPublicKey(latestKey);
          console.log("ðŸ”„ [Socket] Updated recipient key from STALE_KEY event:", latestKey);
        }
        if (latestRegId) {
          recipientRegistrationIdRef.current = latestRegId;
          console.log("ðŸ”„ [Socket] Updated recipient registrationId from STALE_KEY event:", latestRegId);
        }
        // Purge any cached peer keys from session storage
        if (activePeerIdRef.current) {
          try {
            sessionStorage.removeItem(`peer_bundle_${activePeerIdRef.current}`);
            sessionStorage.removeItem(`peer_keys_${activePeerIdRef.current}`);
          } catch {}
        }
        toast.error("Recipient's security key has changed. Peer keys updated, please retry.");
        return;
      }

      // Special friendly message for block
      if (err?.code === 'SEND_FAILED' && errorMessage.toLowerCase().includes('block')) {
        toast.error("Message not sent. You cannot reply to this conversation.");
      } else {
        toast.error(errorMessage);
      }
    };

    const handlePeerKeyUpdated = async (payload: {
      userId: string;
      deviceId: string;
      registrationId?: string;
      publicKey: string;
    }) => {
      console.log("ðŸ”‘ [Socket] Received e2ee:peer_key_updated:", payload);
      if (activePeerIdRef.current === payload.userId) {
        const previousKey = recipientPublicKeyRef.current;
        recipientPublicKeyRef.current = payload.publicKey;
        setRecipientPublicKey(payload.publicKey);
        if (payload.registrationId) {
          recipientRegistrationIdRef.current = payload.registrationId;
        }

        // If the public key rotated/changed, alert user of safety number update
        if (previousKey && previousKey !== payload.publicKey) {
          setMessages((prev) => [
            ...prev,
            {
              id: `sec-notice-${Date.now()}`,
              text: "Your safety number with this contact has changed. This could mean they reinstalled the app or changed devices. Tap to verify.",
              senderId: "system",
              recipientId: currentUserId,
              conversationId,
              createdAt: new Date().toISOString(),
              isSystem: true,
              systemType: "SAFETY_NUMBER_CHANGED",
            },
          ]);
        }

        // Re-attempt decryption for any pending messages in this chat with the new key
        const privKey = myPrivateKeyRef.current;
        if (privKey && payload.publicKey) {
          setMessages((prev) => {
            const pendingMsgs = prev.filter(
              (m) => m.isDecryptionPending && m.rawCiphertext && m.rawNonce
            );
            if (pendingMsgs.length === 0) return prev;

            void (async () => {
              const decryptedMap = new Map<string, string>();
              for (const m of pendingMsgs) {
                try {
                  const dec = await decryptMessage(
                    m.rawCiphertext!,
                    m.rawNonce!,
                    payload.publicKey,
                    privKey
                  );
                  if (dec) {
                    decryptedMap.set(m.id, parseEditedText(dec).text);
                  }
                } catch {
                  /* still unable to decrypt */
                }
              }

              if (decryptedMap.size > 0) {
                setMessages((curr) =>
                  curr.map((m) => {
                    const newText = decryptedMap.get(m.id);
                    if (newText) {
                      return {
                        ...m,
                        text: newText,
                        isDecryptionPending: false,
                      };
                    }
                    return m;
                  })
                );
              }
            })();

            return prev;
          });
        }
      }
    };

    // â”€â”€ e2ee:process_retry (Sender-Side Auto-Re-encryption) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleProcessRetry = async (payload: {
      retryId: string;
      messageId: string;
      conversationId: string;
      receiverId: string;
      receiverDeviceId?: string | null;
      receiverRegistrationId?: string | null;
      receiverPublicKey: string;
    }) => {
      console.log("ðŸ”„ [E2EE] Received process_retry request:", payload);
      const privKey = myPrivateKeyRef.current;
      if (!privKey) return;

      // 1. Locate message plaintext (cache first, then message history state, then IndexedDB, then recent sent buffer)
      let plaintext = sentPlaintextCacheRef.current.get(payload.messageId);
      if (!plaintext) {
        const found = messagesRef.current.find((m) => m.id === payload.messageId);
        if (
          found?.text &&
          found.text !== "â³ Waiting for this message. This may take a while." &&
          !found.isDecryptionPending
        ) {
          plaintext = found.text;
        }
      }

      if (!plaintext) {
        plaintext = (await getDecryptedMessage(currentUserIdRef.current, payload.messageId)) || undefined;
      }

      if (!plaintext && recentSentPlaintextsRef.current.length > 0) {
        const recent = recentSentPlaintextsRef.current[recentSentPlaintextsRef.current.length - 1];
        if (recent?.text) {
          plaintext = recent.text;
        }
      }

      if (!plaintext) {
        console.warn("âš ï¸ [E2EE] Plaintext not available for retry message:", payload.messageId);
        return;
      }

      const currentUserId = currentUserIdRef.current;
      const myRegId =
        localStorage.getItem("registrationId") ||
        localStorage.getItem(`calls_registration_id_${currentUserId}`) ||
        null;

      // Check if original message was a Signal Protocol (libsignal) message
      const originalMsg = messagesRef.current.find((m) => m.id === payload.messageId);
      const wasLibsignal =
        (originalMsg?.rawMessageType === 3 || originalMsg?.rawMessageType === 2) ||
        (originalMsg?.rawEncryptedKeys as any)?.protocol === 'libsignal';

      if (wasLibsignal && currentUserId && payload.receiverId) {
        // â”€â”€ Signal Protocol Path: Purge session and re-send as fresh PreKeySignalMessage â”€â”€
        // The receiver's session is broken. We must establish a brand-new session
        // (type 3) by fetching the receiver's fresh pre-key bundle.
        try {
          console.log("ðŸ”‘ [E2EE] libsignal retry: purging session and re-establishing with fresh bundle");

          // 1. Purge stale sender session for this receiver
          const store = getSignalProtocolStore(currentUserId);
          await store.removeSession(createSignalAddress(payload.receiverId, 1).toString());

          // 2. Fetch fresh pre-key bundle from server
          const bundleRes = await chatService.fetchPreKeyBundle(payload.receiverId);
          const bundle = bundleRes?.data;
          if (!bundle?.identityKey || !bundle?.signedPreKey?.publicKey) {
            throw new Error("Receiver has no pre-key bundle â€” cannot re-establish session");
          }

          // 3. Build new session (type 3 PreKeySignalMessage will be produced on first encrypt)
          await buildSessionFromBundle(currentUserId, payload.receiverId, bundle, 1);

          // 4. Re-encrypt as type-3 PreKeySignalMessage
          const signalEnc = await encrypt1to1Message(currentUserId, payload.receiverId, plaintext, 1);
          const activeMyPub = myPublicKeyRef.current || myPublicKey;

          // 5. Send via socket as a fresh message update (re-uses the same messageId via retry_fulfill
          //    but with a Signal-compatible payload embedded in encryptedKeys)
          socket.emit("e2ee:retry_fulfill", {
            retryId: payload.retryId,
            messageId: payload.messageId,
            conversationId: payload.conversationId,
            recipientId: payload.receiverId,
            encryptedKeys: {
              protocol: 'libsignal',
              ciphertext: signalEnc.ciphertext,
              messageType: signalEnc.messageType,
              senderPublicKey: activeMyPub || null,
              recipientRegistrationId: payload.receiverRegistrationId,
            },
            senderRegistrationId: myRegId,
          });

          console.log("âœ… [E2EE] libsignal retry fulfilled with fresh type-3 PreKeySignalMessage");
        } catch (signalRetryErr) {
          console.error("âŒ [E2EE] libsignal retry failed, falling back to pairwise:", signalRetryErr);
          // Fallback to pairwise ECDH
          try {
            const encrypted = await encryptMessage(plaintext, payload.receiverPublicKey, privKey);
            const activeMyPubForRetry = myPublicKeyRef.current || myPublicKey;
            socket.emit("e2ee:retry_fulfill", {
              retryId: payload.retryId,
              messageId: payload.messageId,
              conversationId: payload.conversationId,
              recipientId: payload.receiverId,
              encryptedKeys: {
                ciphertext: encrypted.ciphertext,
                nonce: encrypted.nonce,
                recipientRegistrationId: payload.receiverRegistrationId,
                senderPublicKey: activeMyPubForRetry || null,
              },
              senderRegistrationId: myRegId,
            });
          } catch (fbErr) {
            console.error("âŒ [E2EE] Pairwise fallback also failed:", fbErr);
          }
        }
        return;
      }

      // â”€â”€ Pairwise / X3DH Path â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      try {
        // Re-encrypt with receiver's authenticated public key
        const encrypted = await encryptMessage(plaintext, payload.receiverPublicKey, privKey);

        // Fulfill retry silently
        const activeMyPubForRetry = myPublicKeyRef.current || myPublicKey;
        socket.emit("e2ee:retry_fulfill", {
          retryId: payload.retryId,
          messageId: payload.messageId,
          conversationId: payload.conversationId,
          recipientId: payload.receiverId,
          encryptedKeys: {
            ciphertext: encrypted.ciphertext,
            nonce: encrypted.nonce,
            recipientRegistrationId: payload.receiverRegistrationId,
            senderPublicKey: activeMyPubForRetry || null,
          },
          senderRegistrationId: myRegId,
        });

        console.log("âœ… [E2EE] Fulfilled retry silently for message:", payload.messageId);
      } catch (err) {
        console.error("âŒ [E2EE] Failed to fulfill retry:", err);
      }
    };

    // â”€â”€ e2ee:retry_fulfill (Receiver-Side Live Recovery) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleRetryFulfill = async (payload: {
      retryId: string;
      messageId: string;
      conversationId: string;
      senderId: string;
      encryptedKeys: {
        ciphertext?: string;
        nonce?: string;
        messageType?: number;
        protocol?: string;
        recipientRegistrationId?: string;
        senderPublicKey?: string;
      };
      senderRegistrationId?: string;
    }) => {
      console.log("âœ… [E2EE] Received retry_fulfill for message:", payload.messageId);
      if (payload.conversationId !== conversationId) return;

      const privKey = myPrivateKeyRef.current;
      if (!privKey) return;

      const currentUserId = currentUserIdRef.current;
      const { ciphertext, nonce, messageType, protocol } = payload.encryptedKeys || {};
      if (!ciphertext) return;

      let decryptedText = "";

      // â”€â”€ Signal Protocol (libsignal) Retry Path â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      // If this retry was fulfilled using Signal Protocol, decrypt with Signal.
      if (protocol === 'libsignal' || messageType === 3 || messageType === 2) {
        if (currentUserId && payload.senderId) {
          try {
            const dec = await decrypt1to1Message(
              currentUserId,
              payload.senderId,
              ciphertext,
              messageType ?? 3,
              1
            );
            if (dec) {
              decryptedText = parseEditedText(dec).text;
              console.log("ðŸŽ‰ [E2EE] Signal retry_fulfill decrypted successfully");
            }
          } catch (signalFulfillErr) {
            console.warn("[E2EE] Signal retry_fulfill decryption failed:", signalFulfillErr);
          }
        }
      }

      // â”€â”€ Pairwise ECDH / X3DH Retry Path â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (!decryptedText && nonce) {
        // Priority: 1) embedded senderPublicKey (exact key used at re-encrypt time)
        //           2) cached recipientPublicKey
        //           3) all keys from live API fetch
        let senderKeys: string[] = [];

        const embeddedKey = payload.encryptedKeys?.senderPublicKey;
        if (embeddedKey && typeof embeddedKey === 'string') {
          senderKeys.push(embeddedKey);
        }

        if (recipientPublicKeyRef.current && !senderKeys.includes(recipientPublicKeyRef.current)) {
          senderKeys.push(recipientPublicKeyRef.current);
        }

        try {
          const res = await chatService.fetchRecipientKey(payload.senderId);
          if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
            const fetched = res.data.map((d: { publicKey: string }) => d.publicKey);
            for (const k of fetched) {
              if (!senderKeys.includes(k)) senderKeys.push(k);
            }
          } else if (res?.success && res?.data?.publicKey) {
            if (!senderKeys.includes(res.data.publicKey)) senderKeys.push(res.data.publicKey);
          }
        } catch {
          /* use available keys */
        }

        for (const k of senderKeys) {
          try {
            const dec = await decryptMessage(ciphertext, nonce, k, privKey);
            if (dec) {
              decryptedText = parseEditedText(dec).text;
              break;
            }
          } catch {
            console.debug('[E2EE] retry_fulfill: key candidate failed:', k.slice(0, 8) + 'â€¦');
          }
        }
      }

      if (decryptedText) {
        console.log("ðŸŽ‰ [E2EE] Live bubble recovered for message:", payload.messageId);
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === payload.messageId) {
              return {
                ...m,
                text: decryptedText,
                isDecryptionPending: false,
                rawCiphertext: ciphertext,
                rawNonce: nonce ?? null,
              };
            }
            return m;
          })
        );
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
      const targetId = payload.messageId || payload.id;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === targetId
            ? { ...m, isDeleted: true, text: "", mediaUrl: undefined, mediaType: undefined }
            : m
        )
      );
    };

    const handleStatusUpdate = (payload: any) => {
      if (payload.conversationId !== conversationId) return;
      
      const newDeliveredAt =
        payload.status === 'DELIVERED'
          ? payload.timestamp
          : payload.status === 'SEEN' && payload.deliveredAt
          ? payload.deliveredAt
          : payload.status === 'SEEN'
          ? payload.timestamp
          : null;

      const newSeenAt = payload.status === 'SEEN' ? payload.timestamp : null;

      // Buffer in pendingReceiptsRef in case this status update arrived before
      // the message finished async decryption/optimistic replacement
      const currentPending = pendingReceiptsRef.current.get(payload.messageId) || [];
      const pIdx = currentPending.findIndex((r) => r.userId === payload.userId);
      if (pIdx !== -1) {
        currentPending[pIdx] = {
          ...currentPending[pIdx],
          deliveredAt: newDeliveredAt ?? currentPending[pIdx].deliveredAt,
          seenAt: newSeenAt ?? currentPending[pIdx].seenAt,
        };
      } else {
        currentPending.push({
          id: Math.random().toString(),
          userId: payload.userId,
          deliveredAt: newDeliveredAt,
          seenAt: newSeenAt,
        });
      }
      pendingReceiptsRef.current.set(payload.messageId, currentPending);

      setMessages((prev) => {
        let matched = false;
        const next = prev.map((msg) => {
          if (msg.id === payload.messageId) {
            matched = true;
            const receipts = [...(msg.receipts || [])];
            const existingIdx = receipts.findIndex((r) => r.userId === payload.userId);
            
            if (existingIdx !== -1) {
              const existing = receipts[existingIdx];
              receipts[existingIdx] = {
                ...existing,
                deliveredAt: newDeliveredAt ?? existing.deliveredAt,
                seenAt: newSeenAt ?? existing.seenAt,
              };
            } else {
              receipts.push({
                id: Math.random().toString(),
                userId: payload.userId,
                deliveredAt: newDeliveredAt,
                seenAt: newSeenAt,
              });
            }
            
            return { ...msg, receipts };
          }
          return msg;
        });

        // If not matched by real server ID (message is still an optimistic placeholder),
        // update the latest optimistic message immediately so checkmarks update with zero lag
        if (!matched) {
          const optIdx = next.map((m) => m.id).lastIndexOf(
            next.slice().reverse().find((m) => m.id.startsWith("optimistic-") && m.senderId === currentUserIdRef.current)?.id ?? ""
          );
          if (optIdx !== -1) {
            const optMsg = next[optIdx];
            const receipts = [...(optMsg.receipts || [])];
            const existingIdx = receipts.findIndex((r) => r.userId === payload.userId);
            if (existingIdx !== -1) {
              receipts[existingIdx] = {
                ...receipts[existingIdx],
                deliveredAt: newDeliveredAt ?? receipts[existingIdx].deliveredAt,
                seenAt: newSeenAt ?? receipts[existingIdx].seenAt,
              };
            } else {
              receipts.push({
                id: Math.random().toString(),
                userId: payload.userId,
                deliveredAt: newDeliveredAt,
                seenAt: newSeenAt,
              });
            }
            next[optIdx] = { ...optMsg, receipts };
          }
        }

        return next;
      });
    };

    const handleConversationStatusUpdate = (payload: any) => {
      if (payload.conversationId !== conversationId) return;
      if (payload.status !== 'SEEN') return;

      // Build a map of messageId -> { seenAt, deliveredAt } from the receipt list
      const updatedReceiptsMap = new Map(
        payload.receipts.map((r: any) => [r.messageId, r])
      );

      setMessages((prev) => prev.map((msg) => {
        const receiptData = updatedReceiptsMap.get(msg.id) as any;
        if (receiptData) {
          const seenAtStr = receiptData.timestamp;
          const deliveredAtStr = receiptData.deliveredAt ?? null;
          const receipts = [...(msg.receipts || [])];
          const existingIdx = receipts.findIndex((r) => r.userId === payload.userId);
          
          if (existingIdx !== -1) {
            const existing = receipts[existingIdx];
            receipts[existingIdx] = {
              ...existing,
              // Preserve existing deliveredAt if backend didn't send one (never overwrite with null)
              deliveredAt: deliveredAtStr ?? existing.deliveredAt,
              seenAt: seenAtStr,
            };
          } else {
            receipts.push({
              id: Math.random().toString(),
              userId: payload.userId,
              // seen implies delivered â€” use backend value or fall back to seenAt timestamp
              deliveredAt: deliveredAtStr ?? seenAtStr,
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

    const handleRetryExpired = (payload: {
      messageId: string;
      conversationId: string;
      retryId: string;
    }) => {
      console.warn("âŒ› [Socket] Received e2ee:retry_expired:", payload);
      if (payload.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === payload.messageId
              ? {
                  ...m,
                  isDecryptionPending: false,
                  isRetryExpired: true,
                  text: "ðŸ”’ Message unavailable. Decryption timed out.",
                }
              : m
          )
        );
      }
    };

    const handleManualResendInitiated = (payload: {
      messageId: string;
      conversationId: string;
      retryId: string;
      isSenderOnline: boolean;
    }) => {
      console.log("ðŸ”„ [Socket] Received e2ee:manual_resend_initiated:", payload);
      if (payload.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === payload.messageId
              ? {
                  ...m,
                  isDecryptionPending: true,
                  isRetryExpired: false,
                  text: "â³ Waiting for this message. This may take a while.",
                }
              : m
          )
        );
        if (!payload.isSenderOnline) {
          toast.info("Resend requested. Waiting for sender to reconnect.");
        } else {
          toast.success("Resend request delivered to sender.");
        }
      }
    };

    const handleReactionsUpdated = (payload: any) => {
      if (payload.conversationId && payload.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === payload.messageId ? { ...m, reactions: payload.reactions || [] } : m
        )
      );
    };

    socket.on("chat:receive_message", handleReceiveMessage);
    socket.on("NEW_MESSAGE", handleReceiveMessage);
    // Internal replay channel: the drain effect emits this locally when the
    // private key becomes available, replaying queued pre-key messages.
    socket.on("__e2ee_internal_replay__", handleReceiveMessage);
    socket.on("chat:message_edited", handleMessageEdited);
    socket.on("chat:message_unsent", handleMessageUnsent);
    socket.on("chat:message_status_update", handleStatusUpdate);
    socket.on("chat:conversation_status_update", handleConversationStatusUpdate);
    socket.on("chat:reaction_updated", handleReactionsUpdated);
    socket.on("chat:typing_start", handleTypingStart);
    socket.on("chat:typing_stop", handleTypingStop);
    socket.on("chat:error", handleChatError);
    socket.on("e2ee:peer_key_updated", handlePeerKeyUpdated);
    socket.on("e2ee:process_retry", handleProcessRetry);
    socket.on("e2ee:retry_fulfill", handleRetryFulfill);
    socket.on("e2ee:retry_expired", handleRetryExpired);
    socket.on("e2ee:manual_resend_initiated", handleManualResendInitiated);

    return () => {
      socket.off("chat:receive_message", handleReceiveMessage);
      socket.off("NEW_MESSAGE", handleReceiveMessage);
      socket.off("__e2ee_internal_replay__", handleReceiveMessage);
      socket.off("chat:message_edited", handleMessageEdited);
      socket.off("chat:message_unsent", handleMessageUnsent);
      socket.off("chat:message_status_update", handleStatusUpdate);
      socket.off("chat:conversation_status_update", handleConversationStatusUpdate);
      socket.off("chat:reaction_updated", handleReactionsUpdated);
      socket.off("chat:typing_start", handleTypingStart);
      socket.off("chat:typing_stop", handleTypingStop);
      socket.off("chat:error", handleChatError);
      socket.off("e2ee:peer_key_updated", handlePeerKeyUpdated);
      socket.off("e2ee:process_retry", handleProcessRetry);
      socket.off("e2ee:retry_fulfill", handleRetryFulfill);
      socket.off("e2ee:retry_expired", handleRetryExpired);
      socket.off("e2ee:manual_resend_initiated", handleManualResendInitiated);
    };
  }, [socket, isConnected, conversationId]);

  // â”€â”€ Mark Messages as Seen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!socket || !isConnected || !conversationId || !messages.length) return;

    const currentUser = currentUserIdRef.current;
    
    const checkAndMarkSeen = () => {
      // Mark as seen if page is not hidden
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
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
        try {
          const raw = localStorage.getItem("lastReadMap") || "{}";
          const map = JSON.parse(raw);
          map[conversationId] = new Date().toISOString();
          localStorage.setItem("lastReadMap", JSON.stringify(map));
        } catch {}
      }
    };

    // Check immediately and also with slight delay for render stability
    checkAndMarkSeen();
    const visibilityTimeout = setTimeout(checkAndMarkSeen, 300);

    // Also check when window regains focus, becomes visible, or receives user interaction
    window.addEventListener("focus", checkAndMarkSeen);
    window.addEventListener("click", checkAndMarkSeen);
    document.addEventListener("visibilitychange", checkAndMarkSeen);

    return () => {
      clearTimeout(visibilityTimeout);
      window.removeEventListener("focus", checkAndMarkSeen);
      window.removeEventListener("click", checkAndMarkSeen);
      document.removeEventListener("visibilitychange", checkAndMarkSeen);
    };
  }, [messages, socket, isConnected, conversationId]);


  // Note: Delivery catch-up on reconnect is handled server-side in socket.ts
  // (markPendingMessagesDeliveredForUser) which fires on every socket connection.
  // No client-side polling loop is needed here.

  // â”€â”€ Send Message â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const sendMessage = useCallback(
    async (
      text: string,
      currentUserId: string,
      file: File | null = null,
      skipEncryption: boolean = false,
      replyToMessage: QuotedMessage | null = null
    ) => {
      if (!socket || !isConnected || !conversationId) {
        console.error("Cannot send: missing socket or conversationId");
        return;
      }
      
      // If there is no resolved peer, this is a B2C-style plaintext send regardless
      // of what the caller requested â€” never encrypt without a real peer identity.
      const effectiveSkipEncryption = skipEncryption || !activePeerId || isBizChatRef.current;

      // If we are encrypting but missing our own keys, abort
      if (!effectiveSkipEncryption && !myPrivateKey) {
        console.error("Cannot encrypt send: missing myPrivateKey");
        toast.error("Security setup incomplete. Please refresh the page.");
        return;
      }

      // Optimistic local update with a temporary ID
      const optimisticId = `optimistic-${Date.now()}`;
      const replyToId = replyToMessage?.id || null;
      if (text) {
        sentPlaintextCacheRef.current.set(optimisticId, text);
        void storeDecryptedMessage(currentUserId, optimisticId, text);
      }
      
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

      const optimisticMsg: ChatMessage = {
        id: optimisticId,
        conversationId,
        senderId: currentUserId,
        text: text,
        createdAt: new Date().toISOString(),
        mediaUrl: optimisticMediaUrl,
        mediaType: optimisticMediaType,
        replyToId,
        replyTo: replyToMessage,
        reactions: [],
      };

      // Synchronously record optimistic message into messagesRef so immediate socket echoes match without waiting on React render cycles
      messagesRef.current = [...messagesRef.current, optimisticMsg];
      setMessages((prev) => [...prev, optimisticMsg]);

      try {
        let mediaUrl: string | undefined;
        let mediaType: string | undefined;
        
        if (file) {
          setIsUploading(true);
          let finalFile = file;
          if (file.type.startsWith('image/') && !file.type.includes('svg')) {
            finalFile = await compressImage(file, 1920, 0.8);
          }
          const uploadRes = await chatService.uploadMedia(conversationId, finalFile);
          if (uploadRes.success) {
            mediaUrl = uploadRes.data.mediaUrl;
            mediaType = uploadRes.data.mediaType || (file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'document');
            
            // Update optimistic message with real uploaded mediaUrl
            setMessages((prev) =>
              prev.map((m) =>
                m.id === optimisticId ? { ...m, mediaUrl, mediaType } : m
              )
            );
          } else {
            toast.error(uploadRes.error || "Failed to upload file");
            setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
            setIsUploading(false);
            return;
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
        let recipientRegId: string | null = null;
        let encryptedKeysPayload: any = undefined;
        let wireMsgType: number = 2;

        if (text) {
          if (effectiveSkipEncryption) {
            // B2C or no-peer: send as plaintext (stored in ciphertext column, nonce stays null)
            ciphertext = text;
            nonce = null;
          } else {
            const activeMyPriv = myPrivateKeyRef.current || myPrivateKey;
            const activeMyPub = myPublicKeyRef.current || myPublicKey;
            let signalDone = false;

            // 1. Primary: Official Signal Protocol (Double Ratchet + X3DH)
            try {
              const hasSession = await hasActiveSignalSession(currentUserId, activePeerId, 1);
              if (!hasSession) {
                const bundleRes = await chatService.fetchPreKeyBundle(activePeerId);
                const bundle = bundleRes?.data;
                if (bundle?.identityKey && bundle?.signedPreKey?.publicKey) {
                  await buildSessionFromBundle(currentUserId, activePeerId, bundle, 1);
                }
              }

              let signalEnc: any;
              try {
                signalEnc = await encrypt1to1Message(currentUserId, activePeerId, text, 1);
              } catch (encErr) {
                console.warn('[useChat] Initial encrypt1to1Message failed, re-establishing session:', encErr);
                const store = getSignalProtocolStore(currentUserId);
                await store.removeSession(createSignalAddress(activePeerId, 1).toString());
                const bundleRes = await chatService.fetchPreKeyBundle(activePeerId);
                const bundle = bundleRes?.data;
                if (bundle?.identityKey && bundle?.signedPreKey?.publicKey) {
                  await buildSessionFromBundle(currentUserId, activePeerId, bundle, 1);
                  signalEnc = await encrypt1to1Message(currentUserId, activePeerId, text, 1);
                } else {
                  throw encErr;
                }
              }

              ciphertext = signalEnc.ciphertext;
              nonce = null;
              wireMsgType = signalEnc.messageType; // 3 or 2
              recipientRegId = signalEnc.registrationId ? String(signalEnc.registrationId) : null;

              // Self-encrypt the plaintext so the sender can decrypt their own sent
              // messages on any new device/browser (new private key, empty IndexedDB).
              let selfEncryptedSessionKey = null;
              try {
                if (activeMyPub && activeMyPriv) {
                  const selfEnc = await encryptMessage(text, activeMyPub, activeMyPriv);
                  selfEncryptedSessionKey = {
                    ciphertext: selfEnc.ciphertext,
                    nonce: selfEnc.nonce,
                    type: 'plaintext',
                  };
                }
              } catch (selfEncErr) {
                console.warn("[useChat] Could not self-encrypt plaintext for Signal sender history:", selfEncErr);
              }

              encryptedKeysPayload = {
                protocol: 'libsignal',
                recipientRegistrationId: recipientRegId,
                senderPublicKey: activeMyPub || null,
                selfEncryptedSessionKey,
                previewText: text ? text.substring(0, 100) : null,
              };
              signalDone = true;
            } catch (signalErr) {
              console.warn('[useChat] Libsignal encryption failed, falling back to legacy paths:', signalErr);
            }

            if (!signalDone) {
              // 2. Fallback: Multi-Device Fan-Out (WhatsApp/Signal Parity across devices)
              let multiDeviceDone = false;
              try {
                const myDeviceId = localStorage.getItem("deviceId") || `web-${currentUserId}`;
                const myRegId = localStorage.getItem("registrationId") || null;
                const batchKeys = await chatService.fetchBatchKeys([activePeerId, currentUserId]);
                const recipientDevices = (batchKeys[activePeerId] || []).filter(
                  (d: any) => d.deviceId && d.publicKey
                );
                const myOtherDevices = (batchKeys[currentUserId] || []).filter(
                  (d: any) => d.deviceId && d.publicKey
                );

                if (recipientDevices.length > 0 && activeMyPriv) {
                  const matchedDevice = recipientRegistrationIdRef.current
                    ? recipientDevices.find((d: any) => d.registrationId === recipientRegistrationIdRef.current)
                    : null;
                  recipientRegId = matchedDevice?.registrationId || recipientRegistrationIdRef.current || recipientDevices[0]?.registrationId || null;
                  const multiEnc = await encryptMultiDeviceMessage(
                    text,
                    recipientDevices,
                    myOtherDevices,
                    activeMyPriv
                  );
                  ciphertext = multiEnc.ciphertext;
                  nonce = multiEnc.nonce;
                  wireMsgType = 2;
                  encryptedKeysPayload = {
                    protocol: "multi-device",
                    devices: multiEnc.devices,
                    senderPublicKey: activeMyPub || null,
                    recipientRegistrationId: recipientRegId,
                    senderRegistrationId: myRegId,
                  };
                  let selfEncryptedSessionKey = null;
                  try {
                    if (activeMyPub && activeMyPriv) {
                      const selfEnc = await encryptMessage(text, activeMyPub, activeMyPriv);
                      selfEncryptedSessionKey = {
                        ciphertext: selfEnc.ciphertext,
                        nonce: selfEnc.nonce,
                        type: 'plaintext',
                      };
                    }
                  } catch (selfEncErr) {
                    console.warn("[useChat] Could not self-encrypt plaintext for sender history recovery:", selfEncErr);
                  }
                  encryptedKeysPayload = {
                    ...encryptedKeysPayload,
                    selfEncryptedSessionKey,
                  };

                  multiDeviceDone = true;
                  console.log(
                    `⚡ [useChat] Successfully initiated Multi-Device Fan-Out across ${Object.keys(multiEnc.devices).length} devices!`
                  );
                }
              } catch (multiDevErr) {
                console.warn("Multi-device fan-out attempt failed, falling back to X3DH:", multiDevErr);
              }

              // 3. Fallback to X3DH Pre-Key Bundle Handshake if multi-device not performed
              let x3dhDone = false;
              if (!multiDeviceDone) {
                try {
                  const bundleRes = await chatService.fetchPreKeyBundle(activePeerId);
                  const bundle = bundleRes?.data;

                  if (bundle?.identityKey && bundle?.signedPreKey?.publicKey && activeMyPriv) {
                    const x3dh = await performX3DHInitiator(
                      activeMyPriv,
                      bundle.identityKey,
                      bundle.signedPreKey.publicKey,
                      bundle.oneTimePreKey ? bundle.oneTimePreKey.publicKey : null
                    );
                    const enc = await encryptWithSessionKey(text, x3dh.sessionKey);
                    ciphertext = enc.ciphertext;
                    nonce = enc.nonce;
                    recipientRegId = bundle.registrationId || null;
                    wireMsgType = 2;

                    let selfEncryptedSessionKey = null;
                    try {
                      if (activeMyPub && activeMyPriv) {
                        const sessionKeyB64 = bytesToBase64(x3dh.sessionKey);
                        const selfEnc = await encryptMessage(sessionKeyB64, activeMyPub, activeMyPriv);
                        selfEncryptedSessionKey = {
                          ciphertext: selfEnc.ciphertext,
                          nonce: selfEnc.nonce,
                        };
                      }
                    } catch (selfEncErr) {
                      console.warn("Could not self-encrypt session key for sender history recovery:", selfEncErr);
                    }

                    encryptedKeysPayload = {
                      protocol: "x3dh",
                      ephemeralPublicKey: x3dh.ephemeralPublicKey,
                      signedPreKeyId: bundle.signedPreKey.keyId,
                      oneTimePreKeyId: bundle.oneTimePreKey ? bundle.oneTimePreKey.keyId : null,
                      recipientRegistrationId: recipientRegId,
                      senderPublicKey: activeMyPub || null,
                      selfEncryptedSessionKey,
                    };
                    x3dhDone = true;
                    console.log("⚡ [useChat] Successfully initiated X3DH ephemeral encryption!");
                  }
                } catch (x3dhErr) {
                  console.warn("X3DH handshake attempt failed, falling back to pairwise identity key:", x3dhErr);
                }
              }

              // 4. Fallback to pairwise Diffie-Hellman if X3DH not possible
              if (!multiDeviceDone && !x3dhDone) {
                let pubKeyToUse = recipientPublicKey;
                try {
                  const res = await chatService.fetchRecipientKey(activePeerId);
                  if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
                    const newest = res.data[0];
                    pubKeyToUse = newest.publicKey;
                    recipientRegId = newest.registrationId || null;
                  } else if (res?.success && res?.data?.publicKey) {
                    pubKeyToUse = res.data.publicKey;
                    recipientRegId = res.data.registrationId || null;
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

                const activeMyPriv = myPrivateKeyRef.current || myPrivateKey;
                const encrypted = await encryptMessage(text, pubKeyToUse, activeMyPriv!);
                ciphertext = encrypted.ciphertext;
                nonce = encrypted.nonce;
                wireMsgType = 1; // Plain pairwise wire type (not Signal Double Ratchet)
                encryptedKeysPayload = {
                  protocol: "pairwise",
                  recipientRegistrationId: recipientRegId,
                  senderPublicKey: (myPublicKeyRef.current || myPublicKey) || null,
                };
              }
            }
          }

          // Register ciphertext and nonce directly into sent message cache and ring buffer
          if (nonce) {
            sentPlaintextCacheRef.current.set(nonce, text);
            void storeDecryptedMessage(currentUserId, `nonce_${nonce}`, text);
          }
          if (ciphertext) {
            sentPlaintextCacheRef.current.set(ciphertext, text);
            void storeDecryptedMessage(currentUserId, ciphertext, text);
            void storeDecryptedMessage(currentUserId, `cipher_${ciphertext}`, text);
          }
          sentPlaintextCacheRef.current.set(optimisticId, text);
          void storeDecryptedMessage(currentUserId, optimisticId, text);
          queueVaultSync(currentUserId);

          recentSentPlaintextsRef.current.push({ text, nonce, ciphertext, timestamp: Date.now() });
          if (recentSentPlaintextsRef.current.length > 30) {
            recentSentPlaintextsRef.current.shift();
          }
        }

        let previewText = null;
        if (text) {
          previewText = text.substring(0, 100); // Send first 100 chars as preview
        }

        const payload = {
          conversationId,
          ciphertext: ciphertext || null,
          nonce: nonce || null,
          messageType: wireMsgType,
          mediaUrl: mediaUrl || null,
          mediaType: mediaType || null,
          previewText,
          replyToId,
          recipientRegistrationId: recipientRegId,
          encryptedKeys: encryptedKeysPayload,
        };
        socket.emit("chat:send_message", payload);
      } catch (err: any) {
        console.error("Failed to encrypt and send message:", err);
        const errMsg =
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          (err?.response?.status === 413
            ? "File size exceeds server upload limit."
            : err?.message || "Failed to send message.");
        toast.error(errMsg);
        // Roll back optimistic update on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setIsUploading(false);
      }
    },
    [socket, isConnected, conversationId, myPrivateKey, myPublicKey, recipientPublicKey, activePeerId]
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

  const requestManualResend = useCallback(
    (messageId: string) => {
      if (!socket || !conversationId) return;
      const myRegId = localStorage.getItem("registrationId");
      socket.emit("e2ee:manual_resend_request", {
        conversationId,
        messageId,
        recipientRegistrationId: myRegId,
      });
      toast.info("Requesting message resend...");
    },
    [socket, conversationId]
  );

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!conversationId) return;
      const msg = messages.find((m) => m.id === messageId);
      const currentUserId = currentUserIdRef.current;
      const existing = msg?.reactions?.find(
        (r) => r.userId === currentUserId && r.emoji === emoji
      );

      // Optimistic update
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const currentReactions = m.reactions || [];
          if (existing) {
            return {
              ...m,
              reactions: currentReactions.filter(
                (r) => !(r.userId === currentUserId && r.emoji === emoji)
              ),
            };
          } else {
            const filtered = currentReactions.filter((r) => r.userId !== currentUserId);
            return {
              ...m,
              reactions: [
                ...filtered,
                {
                  id: `optimistic-${Date.now()}`,
                  emoji,
                  userId: currentUserId || "",
                  createdAt: new Date().toISOString(),
                },
              ],
            };
          }
        })
      );

      try {
        if (existing) {
          await chatService.removeReaction(conversationId, messageId);
        } else {
          await chatService.addReaction(conversationId, messageId, emoji);
        }
      } catch (err) {
        console.error("Failed to toggle reaction", err);
      }
    },
    [conversationId, messages]
  );

  return {
    messages,
    setMessages,
    clearMessages: () => setMessages([]),
    sendMessage,
    editMessage,
    toggleReaction,
    pinnedMessages,
    pinMessage,
    unsendMessage,
    isUploading,
    typingUsers,
    handleTyping,
    requestManualResend,
    // UI considers the chat ready as long as we have our own keys and a valid connection
    isReady: !!(myPrivateKey && isConnected && conversationId),
  };
};
