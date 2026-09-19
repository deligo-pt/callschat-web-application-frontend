import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { useE2EE } from "@/context/E2EEContext";
import { groupService, GroupItem } from "@/services/group.service";
import { chatService } from "@/services/chat.service";
import {
  generateGroupKey,
  encryptMessage,
  encryptGroupMessage,
  decryptGroupMessage,
  decryptMessage,
} from "@/utils/crypto";
import {
  generateSenderKey,
  ratchetSenderKey,
  wrapSenderKeyForMember,
  unwrapSenderKeyFromMember,
  encryptGroupSenderMessage,
  decryptGroupSenderMessage,
  decryptSenderMessageWithChainKey,
  advanceChainKey,
} from "@/utils/senderKeyEngine";
import {
  getUserPrivateKey,
  getRawStoredUserPrivateKey,
  getUserPublicKey,
  storeGroupKey,
  getStoredGroupKey,
  storeSenderKey,
  getStoredSenderKey,
  clearSenderKey,
  storeDecryptedMessage,
  getDecryptedMessage,
} from "@/utils/keyStore";

export interface QuotedMessage {
  id: string;
  senderId: string;
  senderName?: string;
  text: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
}

export interface GroupPollOptionData {
  id: string;
  pollId: string;
  text: string;
  order: number;
  votes: Array<{
    userId: string;
    votedAt: string;
    user?: {
      profile?: {
        displayName: string;
        avatarUrl: string | null;
      } | null;
    } | null;
  }>;
}

export interface GroupPollData {
  id: string;
  groupMessageId: string;
  question: string;
  allowMultiple: boolean;
  options: GroupPollOptionData[];
}

export interface GroupMessageReactionItem {
  id: string;
  emoji: string;
  userId: string;
  createdAt: string;
  user?: {
    profile?: {
      displayName: string;
      avatarUrl: string | null;
    } | null;
  } | null;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  text: string;
  createdAt: string;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "audio" | "document" | "poll" | "call" | string | null;
  sender?: {
    profile?: {
      displayName: string;
      avatarUrl: string | null;
    } | null;
  };
  isEdited?: boolean;
  isDeleted?: boolean;
  deletedByAdmin?: boolean;
  isSystem?: boolean;
  systemEventType?: string | null;
  systemMetadata?: any;
  replyToId?: string | null;
  replyTo?: QuotedMessage | null;
  receipts?: {
    id: string;
    userId: string;
    deliveredAt: string | null;
    seenAt: string | null;
  }[];
  reactions?: GroupMessageReactionItem[];
  poll?: GroupPollData | null;
}

export interface PinnedMessage {
  id: string;
  groupId: string;
  groupMessageId: string;
  pinnedBy: string;
  pinnedAt: string;
  expiresAt: string | null;
  groupMessage?: GroupMessage;
}

const parseEditedText = (rawText: string) => {
  if (rawText && rawText.startsWith("__EDITED__:")) {
    return { text: rawText.substring("__EDITED__:".length), isEdited: true };
  }
  return { text: rawText, isEdited: false };
};

const resolveGroupQuotedMessage = async (
  replyToRaw: any,
  currentUid: string,
  gKey: string | null,
  knownDecryptedMap?: Map<string, string>
): Promise<QuotedMessage | null> => {
  if (!replyToRaw || !replyToRaw.id) return null;
  const senderName =
    replyToRaw.sender?.profile?.displayName ||
    replyToRaw.sender?.profile?.username ||
    replyToRaw.senderName ||
    (replyToRaw.senderId === currentUid ? "You" : "Member");

  if (replyToRaw.isDeleted) {
    return {
      id: replyToRaw.id,
      senderId: replyToRaw.senderId,
      senderName,
      text: replyToRaw.deletedByAdmin ? "🚫 This message was deleted by an admin" : "🚫 This message was deleted",
      mediaUrl: null,
      mediaType: null,
    };
  }

  let text = replyToRaw.text || "";

  if (!text && knownDecryptedMap && knownDecryptedMap.has(replyToRaw.id)) {
    text = knownDecryptedMap.get(replyToRaw.id)!;
  }

  if (!text && currentUid) {
    if (replyToRaw.nonce) {
      text = (await getDecryptedMessage(currentUid, `nonce_${replyToRaw.nonce}`)) || "";
    }
    if (!text) {
      text = (await getDecryptedMessage(currentUid, replyToRaw.id)) || "";
    }
  }

  if (!text && replyToRaw.ciphertext && replyToRaw.nonce && gKey) {
    try {
      const dec = await decryptGroupMessage(replyToRaw.ciphertext, replyToRaw.nonce, gKey);
      text = parseEditedText(dec).text;
    } catch {}
  } else if (!text && replyToRaw.ciphertext && !replyToRaw.nonce && replyToRaw.messageType !== 7) {
    text = parseEditedText(replyToRaw.ciphertext).text;
  }

  if (!text && replyToRaw.mediaType) {
    if (replyToRaw.mediaType === "image") text = "Photo";
    else if (replyToRaw.mediaType === "video") text = "Video";
    else if (replyToRaw.mediaType === "audio") text = "Voice message";
    else if (replyToRaw.mediaType === "document") text = "Document";
    else if (replyToRaw.mediaType === "poll") text = "📊 Poll";
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

const resolveUserPublicKeys = async (userId: string): Promise<string[]> => {
  const keys: string[] = [];
  if (!userId) return keys;
  try {
    const res = await chatService.fetchRecipientKey(userId);
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      for (const d of res.data) {
        if (d.publicKey && !keys.includes(d.publicKey)) keys.push(d.publicKey);
      }
    } else if (res?.data?.publicKey && !keys.includes(res.data.publicKey)) {
      keys.push(res.data.publicKey);
    }
  } catch {}

  try {
    const storedPub = await getUserPublicKey(userId);
    if (storedPub && !keys.includes(storedPub)) keys.push(storedPub);
  } catch {}

  return keys;
};

const resolveUserPublicKey = async (userId: string): Promise<string | null> => {
  const keys = await resolveUserPublicKeys(userId);
  return keys[0] ?? null;
};

const getCandidatePrivateKeys = async (userId: string): Promise<string[]> => {
  const keys: string[] = [];
  if (!userId) return keys;
  const primary = await getUserPrivateKey(userId);
  if (primary && !keys.includes(primary)) keys.push(primary);
  const raw = await getRawStoredUserPrivateKey(userId);
  if (raw && !keys.includes(raw)) keys.push(raw);
  if (typeof window !== "undefined") {
    const lsPriv = localStorage.getItem(`privateKey_${userId}`) || localStorage.getItem("privateKey");
    if (lsPriv && !keys.includes(lsPriv)) keys.push(lsPriv);
  }
  return keys;
};

export const useGroupChat = (groupId: string, currentUserId: string) => {
  const { socket, isConnected } = useSocket();
  const { keysReady } = useE2EE();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const messagesRef = useRef<GroupMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
  const [groupDetails, setGroupDetails] = useState<any>(null);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const groupKeyRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string>(currentUserId);
  const groupDetailsRef = useRef<any>(null);
  const pendingReceiptsRef = useRef<Map<string, any[]>>(new Map());
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const isRekeyingRef = useRef<boolean>(false);
  const rekeyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sentPlaintextCacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    groupDetailsRef.current = groupDetails;
  }, [groupDetails]);

  // ── Setup: Fetch & Decrypt Symmetric Group Key (Zero Sync Issue Protocol) ───
  useEffect(() => {
    if (!groupId || !currentUserId || !keysReady) return;

    const setupGroupKey = async () => {
      try {
        setIsReady(false);
        setError(null);

        // Check IndexedDB key store first (Instant unlock)
        const cachedKey = await getStoredGroupKey(groupId, currentUserId);
        if (cachedKey) {
          groupKeyRef.current = cachedKey;
        }

        // 1. Ensure local keypair is loaded from E2EEProvider / SignalProtocolStore
        let localPrivKey = await getUserPrivateKey(currentUserId);
        let localPubKey = await getUserPublicKey(currentUserId);

        if (!localPrivKey || !localPubKey) {
          for (let i = 0; i < 10; i++) {
            await new Promise((r) => setTimeout(r, 150));
            localPrivKey = await getUserPrivateKey(currentUserId);
            localPubKey = await getUserPublicKey(currentUserId);
            if (localPrivKey && localPubKey) break;
          }
        }

        // 2. Fetch group details & permissions
        const groupRes = await groupService.fetchGroupDetails(groupId);
        if (groupRes.success && groupRes.data) {
          setGroupDetails(groupRes.data);
        }
        const creatorId = groupRes.data?.createdBy;

        // 3. If symmetric key is not in cache, fetch envelope and decrypt
        let plaintextGroupKey: string | null = groupKeyRef.current;

        if (!plaintextGroupKey) {
          const keyRes = await groupService.fetchGroupKey(groupId);
          let encryptedGroupKey = keyRes.data?.encryptedGroupKey;
          let keyNonce = keyRes.data?.keyNonce;
          const senderId = keyRes.data?.senderId || creatorId;

          if (!encryptedGroupKey || !keyNonce) {
            // Auto-initialize if creator/admin
            const isCreatorOrAdmin =
              currentUserId === creatorId ||
              groupRes.data?.myRole === "ADMIN" ||
              groupRes.data?.myRole === "OWNER";

            if (isCreatorOrAdmin && currentUserId) {
              const myPrivKey = (await getUserPrivateKey(currentUserId)) || localPrivKey;
              if (myPrivKey) {
                const freshGroupKey = await generateGroupKey();
                const membersRes = await groupService.fetchGroupMembers(groupId);
                const memberList =
                  membersRes.success && membersRes.data?.members
                    ? membersRes.data.members
                    : [{ userId: currentUserId }];

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
                    pubKey = localPubKey || "";
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
                  plaintextGroupKey = freshGroupKey;
                  await storeGroupKey(groupId, currentUserId, freshGroupKey);
                  groupKeyRef.current = freshGroupKey;
                }
              }
            }
          }

          // If still not unlocked, decrypt using sender public keys
          if (!plaintextGroupKey && encryptedGroupKey && keyNonce) {
            const senderCandidates = [senderId, creatorId, currentUserId].filter(Boolean);
            const candidatePubKeys: string[] = [];

            for (const sId of senderCandidates) {
              if (!sId) continue;
              const rKeyRes = await chatService.fetchRecipientKey(sId);
              if (rKeyRes?.data && Array.isArray(rKeyRes.data)) {
                for (const k of rKeyRes.data) {
                  if (k.publicKey && !candidatePubKeys.includes(k.publicKey)) {
                    candidatePubKeys.push(k.publicKey);
                  }
                }
              } else if (rKeyRes?.data?.publicKey && !candidatePubKeys.includes(rKeyRes.data.publicKey)) {
                candidatePubKeys.push(rKeyRes.data.publicKey);
              }
            }

            if (localPubKey && !candidatePubKeys.includes(localPubKey)) {
              candidatePubKeys.push(localPubKey);
            }

            const myPrivKey = (await getUserPrivateKey(currentUserId)) || localPrivKey;
            if (myPrivKey) {
              for (const pubKey of candidatePubKeys) {
                try {
                  plaintextGroupKey = await decryptMessage(encryptedGroupKey, keyNonce, pubKey, myPrivKey);
                  if (plaintextGroupKey) {
                    await storeGroupKey(groupId, currentUserId, plaintextGroupKey);
                    groupKeyRef.current = plaintextGroupKey;
                    break;
                  }
                } catch {}
              }
            }
          }
        }

        // 4. Fetch Message History and Pinned Messages
        const [historyRes, pinsRes] = await Promise.all([
          groupService.fetchGroupMessages(groupId),
          groupService.fetchPinnedMessages(groupId),
        ]);

        if (pinsRes.success && pinsRes.data) {
          setPinnedMessages(pinsRes.data);
        }

        if (historyRes.success && Array.isArray(historyRes.data)) {
          const decryptedTextsMap = new Map<string, string>();
          const currentKey = groupKeyRef.current;

          // 1. Fetch active sender keys for this group to decrypt sender-keyed history
          const skMap = new Map<string, { chainKey: string; iteration: number }>();
          try {
            const skRes = await groupService.fetchSenderKeys(groupId);
            if (skRes.success && Array.isArray(skRes.data)) {
              const myPrivs = await getCandidatePrivateKeys(currentUserId);
              if (myPrivs.length > 0) {
                for (const dist of skRes.data) {
                  const senderPubs = await resolveUserPublicKeys(dist.senderId);
                  if (senderPubs.length > 0) {
                    try {
                      const chainKey = unwrapSenderKeyFromMember(
                        dist.encryptedKey,
                        dist.nonce,
                        senderPubs,
                        myPrivs
                      );
                      skMap.set(dist.senderId, {
                        chainKey,
                        iteration: dist.iteration ?? 0,
                      });
                    } catch (skErr) {
                      console.warn(`[useGroupChat] Could not unwrap sender key for ${dist.senderId}:`, skErr);
                    }
                  }
                }
              }
            }
          } catch {}

          // 2. Also load user's own sender key for self-sent history replay if available
          try {
            const mySK = await getStoredSenderKey(groupId, currentUserId, currentUserId);
            if (mySK) {
              skMap.set(currentUserId, {
                chainKey: mySK.chainKey,
                iteration: mySK.iteration,
              });
            }
          } catch {}

          // 3. Process history messages in chronological order
          for (const msg of historyRes.data) {
            // Check local decrypted cache first (Zero-latency, replay-immune across page reloads)
            let text =
              (msg.id ? sentPlaintextCacheRef.current.get(msg.id) : null) ||
              (msg.nonce ? sentPlaintextCacheRef.current.get(msg.nonce) : null) ||
              (msg.ciphertext ? sentPlaintextCacheRef.current.get(msg.ciphertext) : null);

            if (!text && msg.id) {
              text = await getDecryptedMessage(currentUserId, msg.id);
            }
            if (!text && msg.nonce) {
              text = await getDecryptedMessage(currentUserId, `nonce_${msg.nonce}`);
            }
            if (!text && msg.ciphertext) {
              text = await getDecryptedMessage(currentUserId, `cipher_${msg.ciphertext}`);
            }

            if (text) {
              const parsed = parseEditedText(text).text;
              decryptedTextsMap.set(msg.id, parsed);
              sentPlaintextCacheRef.current.set(msg.id, parsed);
              if (msg.nonce) sentPlaintextCacheRef.current.set(msg.nonce, parsed);
              if (msg.ciphertext) sentPlaintextCacheRef.current.set(msg.ciphertext, parsed);
              // Advance in-memory sender key ratchet if this message used sender key
              const targetIter = msg.senderKeyIteration;
              if (targetIter != null && skMap.has(msg.senderId)) {
                const skState = skMap.get(msg.senderId)!;
                if (skState.iteration <= targetIter) {
                  const adv = advanceChainKey(skState.chainKey, skState.iteration, targetIter);
                  skMap.set(msg.senderId, { chainKey: adv.nextChainKey, iteration: adv.nextIteration });
                }
              }
              continue;
            }

            // Incoming or sender-keyed messages: decrypt with in-memory chain key
            if (msg.ciphertext && msg.nonce && (msg.senderKeyIteration != null || msg.messageType === 7)) {
              const targetIter = msg.senderKeyIteration ?? 0;
              const skState = skMap.get(msg.senderId);

              if (skState && targetIter >= skState.iteration) {
                try {
                  const decResult = decryptSenderMessageWithChainKey(
                    skState.chainKey,
                    skState.iteration,
                    targetIter,
                    msg.ciphertext,
                    msg.nonce
                  );
                  const t = parseEditedText(decResult.plaintext).text;
                  decryptedTextsMap.set(msg.id, t);
                  sentPlaintextCacheRef.current.set(msg.id, t);
                  if (msg.nonce) sentPlaintextCacheRef.current.set(msg.nonce, t);
                  if (msg.ciphertext) sentPlaintextCacheRef.current.set(msg.ciphertext, t);
                  void storeDecryptedMessage(currentUserId, msg.id, t);
                  if (msg.nonce) void storeDecryptedMessage(currentUserId, `nonce_${msg.nonce}`, t);
                  if (msg.ciphertext) void storeDecryptedMessage(currentUserId, `cipher_${msg.ciphertext}`, t);
                  skMap.set(msg.senderId, {
                    chainKey: decResult.nextChainKey,
                    iteration: decResult.nextIteration,
                  });
                  continue;
                } catch (skErr) {
                  console.warn(`[useGroupChat] skMap decryption error for message ${msg.id}:`, skErr);
                }
              }

              // Fallback to stored sender key in IndexedDB for incoming messages
              if (msg.senderId !== currentUserId) {
                try {
                  const decResult = await decryptGroupSenderMessage(
                    groupId,
                    msg.senderId,
                    msg.ciphertext,
                    msg.nonce,
                    targetIter,
                    currentUserId
                  );
                  const t = parseEditedText(decResult.plaintext).text;
                  decryptedTextsMap.set(msg.id, t);
                  sentPlaintextCacheRef.current.set(msg.id, t);
                  if (msg.nonce) sentPlaintextCacheRef.current.set(msg.nonce, t);
                  if (msg.ciphertext) sentPlaintextCacheRef.current.set(msg.ciphertext, t);
                  void storeDecryptedMessage(currentUserId, msg.id, t);
                  if (msg.nonce) void storeDecryptedMessage(currentUserId, `nonce_${msg.nonce}`, t);
                  if (msg.ciphertext) void storeDecryptedMessage(currentUserId, `cipher_${msg.ciphertext}`, t);
                  continue;
                } catch {}
              }
            }

            // Fallback to symmetric group key or unencrypted ciphertext
            if (msg.ciphertext && msg.nonce && currentKey) {
              try {
                const dec = await decryptGroupMessage(msg.ciphertext, msg.nonce, currentKey);
                const t = parseEditedText(dec).text;
                decryptedTextsMap.set(msg.id, t);
                sentPlaintextCacheRef.current.set(msg.id, t);
                if (msg.nonce) sentPlaintextCacheRef.current.set(msg.nonce, t);
                if (msg.ciphertext) sentPlaintextCacheRef.current.set(msg.ciphertext, t);
                void storeDecryptedMessage(currentUserId, msg.id, t);
                if (msg.nonce) void storeDecryptedMessage(currentUserId, `nonce_${msg.nonce}`, t);
                if (msg.ciphertext) void storeDecryptedMessage(currentUserId, `cipher_${msg.ciphertext}`, t);
              } catch {}
            } else if (msg.ciphertext && !msg.nonce) {
              decryptedTextsMap.set(msg.id, parseEditedText(msg.ciphertext).text);
            }
          }

          // 4. Save the final ratcheted state of skMap into IndexedDB
          for (const [sId, skState] of skMap.entries()) {
            if (sId !== currentUserId) {
              await storeSenderKey(groupId, sId, {
                groupId,
                senderId: sId,
                chainKey: skState.chainKey,
                iteration: skState.iteration,
                senderKeyId: `sk_${sId}`,
                updatedAt: new Date().toISOString(),
              }, currentUserId);
            }
          }

          const decryptedHistory = await Promise.all(
            historyRes.data.map(async (msg: any) => {
              const replyTo = await resolveGroupQuotedMessage(
                msg.replyTo,
                currentUserId,
                currentKey,
                decryptedTextsMap
              );

              let text = decryptedTextsMap.get(msg.id) ?? "";
              if (!text && msg.ciphertext && !msg.mediaUrl) {
                text = "🔒 Encrypted message";
              }

              return {
                id: msg.id,
                groupId: msg.groupId,
                senderId: msg.senderId,
                text,
                isEdited: msg.isEdited ?? false,
                createdAt: msg.createdAt,
                mediaUrl: msg.mediaUrl,
                mediaType: msg.mediaType,
                sender: msg.sender,
                isDeleted: msg.isDeleted,
                deletedByAdmin: msg.deletedByAdmin,
                isSystem: msg.isSystem,
                systemEventType: msg.systemEventType,
                systemMetadata: msg.systemMetadata,
                replyToId: msg.replyToId ?? null,
                replyTo,
                receipts: msg.receipts || [],
                reactions: msg.reactions || [],
                poll: msg.poll || null,
              };
            })
          );

          decryptedHistory.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          setMessages(decryptedHistory);

          // Proactively mark delivered
          if (socket && isConnected) {
            const undelivered = historyRes.data.filter(
              (m: any) =>
                m.senderId !== currentUserId &&
                (!m.receipts ||
                  !m.receipts.some((r: any) => r.userId === currentUserId && r.deliveredAt))
            );
            undelivered.forEach((m: any) => {
              socket.emit("group:mark_delivered", { groupId, messageId: m.id });
            });
          }
        } else {
          setMessages([]);
        }

        setIsReady(true);
      } catch (err: any) {
        console.error("Failed to setup group chat:", err);
        setError(err.message || "Failed to unlock group keys");
        setIsReady(true);
      }
    };

    setupGroupKey();
  }, [groupId, currentUserId, keysReady]);

  // ── Socket: Room Subscription ──────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !isConnected || !groupId) return;

    socket.emit("group:join_room", { groupId });

    return () => {
      socket.emit("group:leave_room", { groupId });
    };
  }, [socket, isConnected, groupId]);

  // ── Automatic Group Re-Keying Protocol (Forward Secrecy) ──────────────────
  const performRekey = useCallback(
    async (reason: string) => {
      if (isRekeyingRef.current || !groupId) return;
      isRekeyingRef.current = true;
      try {
        const myUid = currentUserIdRef.current;
        const localPrivKey = await getUserPrivateKey(myUid);
        const localPubKey = await getUserPublicKey(myUid);
        if (!localPrivKey) {
          console.warn("[useGroupChat] Cannot rekey: missing local private key");
          return;
        }

        // 1. Generate fresh 256-bit symmetric group key
        const freshGroupKey = await generateGroupKey();

        // 2. Fetch current active members (removed members are excluded)
        const membersRes = await groupService.fetchGroupMembers(groupId);
        if (!membersRes.success || !membersRes.data?.members) {
          console.warn("[useGroupChat] Cannot rekey: failed to fetch active members");
          return;
        }

        const memberList = membersRes.data.members;
        const rekeyPayload: Array<{ userId: string; encryptedGroupKey: string; keyNonce: string }> = [];

        // 3. Encrypt fresh key for each active member
        for (const m of memberList) {
          const uId = (m as any).userId || (m as any).id;
          if (!uId) continue;

          let pubKey = "";
          if (uId === myUid) {
            pubKey = localPubKey || "";
          } else {
            const rKeyRes = await chatService.fetchRecipientKey(uId);
            if (rKeyRes?.data && Array.isArray(rKeyRes.data) && rKeyRes.data.length > 0) {
              pubKey = rKeyRes.data[0].publicKey;
            } else if (rKeyRes?.success && rKeyRes?.data?.publicKey) {
              pubKey = rKeyRes.data.publicKey;
            }
          }

          if (pubKey) {
            try {
              const enc = await encryptMessage(freshGroupKey, pubKey, localPrivKey);
              rekeyPayload.push({
                userId: uId,
                encryptedGroupKey: enc.ciphertext,
                keyNonce: enc.nonce,
              });
            } catch (encErr) {
              console.warn(`[useGroupChat] Could not encrypt rotated key for member ${uId}:`, encErr);
            }
          }
        }

        if (rekeyPayload.length > 0) {
          const rekeyRes = await groupService.rekeyGroup(groupId, rekeyPayload);
          if (rekeyRes.success) {
            groupKeyRef.current = freshGroupKey;
            await storeGroupKey(groupId, myUid, freshGroupKey);
            console.log(`[useGroupChat] Successfully re-keyed group ${groupId} (${reason})`);
          }
        }
      } catch (err) {
        console.error("[useGroupChat] Error during group re-keying:", err);
      } finally {
        isRekeyingRef.current = false;
      }
    },
    [groupId]
  );

  // ── Socket: Real-Time Event Handlers ───────────────────────────────────────
  useEffect(() => {
    if (!socket || !isConnected || !groupId) return;

    const handleReceiveMessage = async (payload: any) => {
      if (payload.groupId !== groupId) return;
      // 1. Deduplication guard: ignore if message already exists in state
      if (payload.id && messagesRef.current.some((m) => m.id === payload.id)) {
        return;
      }

      const senderId = payload.senderId || payload.sender?.id || "unknown";
      const effectiveUserId = currentUserIdRef.current || currentUserId;

      const knownMap = new Map<string, string>();
      messagesRef.current.forEach((m) => {
        if (m.text) knownMap.set(m.id, m.text);
      });

      const resolvedReplyTo = await resolveGroupQuotedMessage(
        payload.replyTo,
        effectiveUserId,
        groupKeyRef.current,
        knownMap
      );

      let text = "";
      const isMyMessage = senderId === effectiveUserId;

      // Check local in-memory cache and IndexedDB first (Zero-latency & prevents ratchet replay errors)
      let cached =
        (payload.id ? sentPlaintextCacheRef.current.get(payload.id) : null) ||
        (payload.nonce ? sentPlaintextCacheRef.current.get(payload.nonce) : null) ||
        (payload.ciphertext ? sentPlaintextCacheRef.current.get(payload.ciphertext) : null);

      if (!cached && effectiveUserId) {
        if (payload.id) {
          cached = await getDecryptedMessage(effectiveUserId, payload.id);
        }
        if (!cached && payload.nonce) {
          cached = await getDecryptedMessage(effectiveUserId, `nonce_${payload.nonce}`);
        }
        if (!cached && payload.ciphertext) {
          cached = await getDecryptedMessage(effectiveUserId, `cipher_${payload.ciphertext}`);
        }
      }

      if (cached) {
        text = parseEditedText(cached).text;
        if (payload.id) sentPlaintextCacheRef.current.set(payload.id, text);
        if (payload.nonce) sentPlaintextCacheRef.current.set(payload.nonce, text);
        if (payload.ciphertext) sentPlaintextCacheRef.current.set(payload.ciphertext, text);
        if (effectiveUserId) {
          if (payload.id) void storeDecryptedMessage(effectiveUserId, payload.id, text);
          if (payload.nonce) void storeDecryptedMessage(effectiveUserId, `nonce_${payload.nonce}`, text);
          if (payload.ciphertext) void storeDecryptedMessage(effectiveUserId, `cipher_${payload.ciphertext}`, text);
        }
      }

      // If not sender's message (or if not resolved from cache), proceed with sender key decryption
      if (!text && payload.ciphertext && payload.nonce && (payload.senderKeyIteration != null || payload.messageType === 7) && !isMyMessage) {
        try {
          let sk = await getStoredSenderKey(groupId, senderId, effectiveUserId);
          if (!sk) {
            const skRes = await groupService.fetchSenderKeys(groupId);
            if (skRes.success && Array.isArray(skRes.data)) {
              const myDist = skRes.data.find((d: any) => d.senderId === senderId);
              if (myDist) {
                const myPrivs = await getCandidatePrivateKeys(effectiveUserId);
                const senderPubs = await resolveUserPublicKeys(senderId);
                if (myPrivs.length > 0 && senderPubs.length > 0) {
                  const chainKey = unwrapSenderKeyFromMember(
                    myDist.encryptedKey,
                    myDist.nonce,
                    senderPubs,
                    myPrivs
                  );
                  sk = {
                    groupId,
                    senderId,
                    chainKey,
                    iteration: myDist.iteration ?? 0,
                    senderKeyId: `sk_${senderId}`,
                    updatedAt: new Date().toISOString(),
                  };
                  await storeSenderKey(groupId, senderId, sk, effectiveUserId);
                }
              }
            }
          }

          if (sk) {
            try {
              const decResult = await decryptGroupSenderMessage(
                groupId,
                senderId,
                payload.ciphertext,
                payload.nonce,
                payload.senderKeyIteration ?? 0,
                effectiveUserId
              );
              text = parseEditedText(decResult.plaintext).text;
              if (payload.id) sentPlaintextCacheRef.current.set(payload.id, text);
              if (payload.nonce) sentPlaintextCacheRef.current.set(payload.nonce, text);
              if (payload.ciphertext) sentPlaintextCacheRef.current.set(payload.ciphertext, text);
              if (effectiveUserId) {
                if (payload.id) void storeDecryptedMessage(effectiveUserId, payload.id, text);
                if (payload.nonce) void storeDecryptedMessage(effectiveUserId, `nonce_${payload.nonce}`, text);
                if (payload.ciphertext) void storeDecryptedMessage(effectiveUserId, `cipher_${payload.ciphertext}`, text);
              }
            } catch (decErr) {
              console.warn(`[useGroupChat] Real-time sender key decryption error:`, decErr);
              const errStr = String(decErr);
              const isReplay = errStr.includes("replay") || errStr.includes("expired");
              if (!isReplay) {
                try {
                  const skRes = await groupService.fetchSenderKeys(groupId);
                  if (skRes.success && Array.isArray(skRes.data)) {
                    const myDist = skRes.data.find((d: any) => d.senderId === senderId);
                    if (myDist) {
                      const myPrivs = await getCandidatePrivateKeys(effectiveUserId);
                      const senderPubs = await resolveUserPublicKeys(senderId);
                      if (myPrivs.length > 0 && senderPubs.length > 0) {
                        const chainKey = unwrapSenderKeyFromMember(
                          myDist.encryptedKey,
                          myDist.nonce,
                          senderPubs,
                          myPrivs
                        );
                        const freshSk = {
                          groupId,
                          senderId,
                          chainKey,
                          iteration: myDist.iteration ?? 0,
                          senderKeyId: `sk_${senderId}`,
                          updatedAt: new Date().toISOString(),
                        };
                        await storeSenderKey(groupId, senderId, freshSk, effectiveUserId);
                        const decResult = await decryptGroupSenderMessage(
                          groupId,
                          senderId,
                          payload.ciphertext,
                          payload.nonce,
                          payload.senderKeyIteration ?? 0,
                          effectiveUserId
                        );
                        text = parseEditedText(decResult.plaintext).text;
                        if (payload.id) sentPlaintextCacheRef.current.set(payload.id, text);
                        if (payload.nonce) sentPlaintextCacheRef.current.set(payload.nonce, text);
                        if (payload.ciphertext) sentPlaintextCacheRef.current.set(payload.ciphertext, text);
                        if (effectiveUserId) {
                          if (payload.id) void storeDecryptedMessage(effectiveUserId, payload.id, text);
                          if (payload.nonce) void storeDecryptedMessage(effectiveUserId, `nonce_${payload.nonce}`, text);
                          if (payload.ciphertext) void storeDecryptedMessage(effectiveUserId, `cipher_${payload.ciphertext}`, text);
                        }
                      }
                    }
                  }
                } catch (retryErr) {
                  console.warn("[useGroupChat] Retry decryption with refreshed sender key failed:", retryErr);
                }
              }
            }
          }
        } catch (skErr) {
          console.warn("[useGroupChat] Real-time sender key decryption error, checking group key fallback:", skErr);
        }
      }

      if (!text && payload.ciphertext && payload.nonce && groupKeyRef.current) {
        try {
          const dec = await decryptGroupMessage(payload.ciphertext, payload.nonce, groupKeyRef.current);
          text = parseEditedText(dec).text;
          if (payload.id) sentPlaintextCacheRef.current.set(payload.id, text);
          if (payload.nonce) sentPlaintextCacheRef.current.set(payload.nonce, text);
          if (payload.ciphertext) sentPlaintextCacheRef.current.set(payload.ciphertext, text);
          if (effectiveUserId) {
            if (payload.id) void storeDecryptedMessage(effectiveUserId, payload.id, text);
            if (payload.nonce) void storeDecryptedMessage(effectiveUserId, `nonce_${payload.nonce}`, text);
            if (payload.ciphertext) void storeDecryptedMessage(effectiveUserId, `cipher_${payload.ciphertext}`, text);
          }
        } catch {
          text = "🔒 Encrypted group message";
        }
      } else if (!text && payload.ciphertext && !payload.nonce) {
        text = parseEditedText(payload.ciphertext).text;
      }

      const newMsg: GroupMessage = {
        id: payload.id || Date.now().toString(),
        groupId: payload.groupId,
        senderId,
        text,
        createdAt: payload.createdAt || new Date().toISOString(),
        mediaUrl: payload.mediaUrl ?? undefined,
        mediaType: payload.mediaType ?? undefined,
        sender: payload.sender,
        receipts: payload.receipts || [],
        reactions: payload.reactions || [],
        poll: payload.poll || null,
        isSystem: payload.isSystem,
        systemEventType: payload.systemEventType,
        systemMetadata: payload.systemMetadata,
        replyToId: payload.replyToId ?? null,
        replyTo: resolvedReplyTo,
      };

      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;

        if (isMyMessage) {
          const optIdx = prev.findIndex(
            (m) =>
              m.id.startsWith("optimistic-") &&
              (m.text === text || (payload.mediaUrl && m.mediaUrl === payload.mediaUrl))
          );
          if (optIdx !== -1) {
            const next = [...prev];
            next[optIdx] = newMsg;
            return next;
          }
        }

        return [...prev, newMsg];
      });

      if (senderId !== currentUserIdRef.current) {
        socket.emit("group:mark_delivered", {
          groupId: payload.groupId,
          messageId: payload.id,
        });
      }
    };

    const handleStatusUpdate = (payload: any) => {
      if (payload.groupId !== groupId) return;
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === payload.messageId) {
            const receipts = [...(msg.receipts || [])];
            const idx = receipts.findIndex((r) => r.userId === payload.userId);
            const isSeen = payload.status === "SEEN";
            const isDelivered = payload.status === "DELIVERED";
            const existing = idx !== -1 ? receipts[idx] : null;

            const entry = {
              id: existing?.id || Math.random().toString(),
              userId: payload.userId,
              deliveredAt: isDelivered ? payload.timestamp : (existing?.deliveredAt || payload.timestamp),
              seenAt: isSeen ? payload.timestamp : existing?.seenAt,
            };
            if (idx !== -1) {
              receipts[idx] = entry;
            } else {
              receipts.push(entry);
            }
            return { ...msg, receipts };
          }
          return msg;
        })
      );
    };

    const handleReactionsUpdated = (payload: any) => {
      if (payload.groupId !== groupId) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === payload.messageId ? { ...m, reactions: payload.reactions } : m))
      );
    };

    const handlePinUpdated = async (payload: any) => {
      if (payload.groupId !== groupId) return;
      const pinsRes = await groupService.fetchPinnedMessages(groupId);
      if (pinsRes.success && pinsRes.data) {
        setPinnedMessages(pinsRes.data);
      }
    };

    const handlePollUpdated = (payload: any) => {
      if (payload.groupId !== groupId) return;
      setMessages((prev) =>
        prev.map((m) => (m.poll && m.poll.id === payload.poll?.id ? { ...m, poll: payload.poll } : m))
      );
    };

    const handleSettingsUpdated = (payload: any) => {
      if (payload.groupId !== groupId) return;
      setGroupDetails((prev: any) => (prev ? { ...prev, ...payload.settings } : prev));
    };

    const handleTypingStart = (payload: any) => {
      if (payload.groupId !== groupId || payload.userId === currentUserIdRef.current) return;
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.set(payload.userId, payload.userName || "Someone");
        return next;
      });

      const existingTimeout = typingTimeoutsRef.current.get(payload.userId);
      if (existingTimeout) clearTimeout(existingTimeout);

      const timeout = setTimeout(() => {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.delete(payload.userId);
          return next;
        });
      }, 4000);
      typingTimeoutsRef.current.set(payload.userId, timeout);
    };

    const handleTypingStop = (payload: any) => {
      if (payload.groupId !== groupId) return;
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.delete(payload.userId);
        return next;
      });
      const existingTimeout = typingTimeoutsRef.current.get(payload.userId);
      if (existingTimeout) clearTimeout(existingTimeout);
    };

    const handleMessageUnsent = (payload: any) => {
      if (payload.groupId !== groupId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === payload.messageId
            ? { ...m, isDeleted: true, deletedByAdmin: payload.deletedByAdmin, text: "", mediaUrl: undefined }
            : m
        )
      );
    };

    // Forward Secrecy: Automatic Group Key Rotation Handlers
    const handleRequestRekey = async (payload: any) => {
      if (payload.groupId !== groupId) return;
      const details = groupDetailsRef.current;
      const myRole = details?.myRole;
      const isOwner = myRole === "OWNER" || details?.createdBy === currentUserIdRef.current;
      const isAdmin = myRole === "ADMIN" || isOwner;

      if (!isAdmin) return;

      // If current user is the one who removed the member, rotate immediately
      if (payload.removedBy === currentUserIdRef.current) {
        await performRekey(`member removal initiated by self (${payload.removedUserId})`);
        return;
      }

      // Otherwise delay based on hierarchy (Owner: 1500ms, Admin: 3000ms) to avoid duplicate racing re-keys
      const delay = isOwner ? 1500 : 3000;
      if (rekeyTimeoutRef.current) clearTimeout(rekeyTimeoutRef.current);
      rekeyTimeoutRef.current = setTimeout(async () => {
        await performRekey(`member departure/removal (${payload.removedUserId})`);
      }, delay);
    };

    const handleKeyRotated = async (payload: any) => {
      if (payload.groupId !== groupId) return;
      // If we rotated it ourselves, our local ref and keystore are already up to date
      if (payload.rotatedBy === currentUserIdRef.current) return;

      // Clear pending scheduled re-key if another admin already completed it
      if (rekeyTimeoutRef.current) {
        clearTimeout(rekeyTimeoutRef.current);
        rekeyTimeoutRef.current = null;
      }

      try {
        const keyRes = await groupService.fetchGroupKey(groupId);
        if (!keyRes.success || !keyRes.data?.encryptedGroupKey || !keyRes.data?.keyNonce) {
          console.warn("[useGroupChat] Failed to fetch rotated group key");
          return;
        }

        const { encryptedGroupKey, keyNonce } = keyRes.data;
        const senderId = keyRes.data.senderId || payload.rotatedBy;

        let senderPubKey = "";
        if (senderId) {
          const rKeyRes = await chatService.fetchRecipientKey(senderId);
          if (rKeyRes?.data && Array.isArray(rKeyRes.data) && rKeyRes.data.length > 0) {
            senderPubKey = rKeyRes.data[0].publicKey;
          } else if (rKeyRes?.data?.publicKey) {
            senderPubKey = rKeyRes.data.publicKey;
          }
        }

        const myPrivKey = await getUserPrivateKey(currentUserIdRef.current);
        if (myPrivKey && senderPubKey) {
          const newKey = await decryptMessage(encryptedGroupKey, keyNonce, senderPubKey, myPrivKey);
          if (newKey) {
            groupKeyRef.current = newKey;
            await storeGroupKey(groupId, currentUserIdRef.current, newKey);
            console.log(`[useGroupChat] Successfully unlocked and stored rotated group key for ${groupId}`);
          }
        }
      } catch (err) {
        console.error("[useGroupChat] Error adopting rotated group key:", err);
      }
    };

    const handleMemberRemoved = (payload: any) => {
      if (payload.groupId !== groupId) return;
      if (payload.userId === currentUserIdRef.current) {
        setError("You are no longer a member of this group.");
      }
      if (currentUserIdRef.current) {
        clearSenderKey(groupId, currentUserIdRef.current).catch(() => {});
      }
      groupService.fetchGroupDetails(groupId).then((res) => {
        if (res.success && res.data) {
          setGroupDetails(res.data);
        }
      });
    };

    const handleMemberLeft = (payload: any) => {
      if (payload.groupId !== groupId) return;
      if (payload.userId === currentUserIdRef.current) {
        setError("You have left this group.");
      }
      if (currentUserIdRef.current) {
        clearSenderKey(groupId, currentUserIdRef.current).catch(() => {});
      }
      groupService.fetchGroupDetails(groupId).then((res) => {
        if (res.success && res.data) {
          setGroupDetails(res.data);
        }
      });
    };

    const handleMemberAdded = (payload: any) => {
      if (payload.groupId !== groupId) return;
      groupService.fetchGroupDetails(groupId).then((res) => {
        if (res.success && res.data) {
          setGroupDetails(res.data);
        }
      });
    };

    const handleSenderKeyReceived = async (payload: any) => {
      if (payload.groupId !== groupId) return;
      const effectiveUserId = currentUserIdRef.current || currentUserId;
      if (payload.recipientId && payload.recipientId !== effectiveUserId) return;
      try {
        const myPrivs = await getCandidatePrivateKeys(effectiveUserId);
        const senderPubs = await resolveUserPublicKeys(payload.senderId);
        if (myPrivs.length === 0 || senderPubs.length === 0) return;

        const chainKey = unwrapSenderKeyFromMember(
          payload.encryptedKey,
          payload.nonce,
          senderPubs,
          myPrivs
        );

        await storeSenderKey(
          groupId,
          payload.senderId,
          {
            groupId,
            senderId: payload.senderId,
            chainKey,
            iteration: payload.iteration ?? 0,
            senderKeyId: `sk_${payload.senderId}`,
            updatedAt: new Date().toISOString(),
          },
          effectiveUserId
        );
      } catch (err) {
        console.error("[useGroupChat] Error processing received sender key:", err);
      }
    };

    socket.on("group:receive_message", handleReceiveMessage);
    socket.on("group:message_status_update", handleStatusUpdate);
    socket.on("group:reaction_updated", handleReactionsUpdated);
    socket.on("group:pin_updated", handlePinUpdated);
    socket.on("group:poll_updated", handlePollUpdated);
    socket.on("group:settings_updated", handleSettingsUpdated);
    socket.on("group:typing_start", handleTypingStart);
    socket.on("group:typing_stop", handleTypingStop);
    socket.on("group:message_unsent", handleMessageUnsent);
    socket.on("group:request_rekey", handleRequestRekey);
    socket.on("group:key_rotated", handleKeyRotated);
    socket.on("group:member_removed", handleMemberRemoved);
    socket.on("group:member_left", handleMemberLeft);
    socket.on("group:member_added", handleMemberAdded);
    socket.on("group:sender_key_received", handleSenderKeyReceived);

    return () => {
      if (rekeyTimeoutRef.current) {
        clearTimeout(rekeyTimeoutRef.current);
        rekeyTimeoutRef.current = null;
      }
      socket.off("group:receive_message", handleReceiveMessage);
      socket.off("group:message_status_update", handleStatusUpdate);
      socket.off("group:reaction_updated", handleReactionsUpdated);
      socket.off("group:pin_updated", handlePinUpdated);
      socket.off("group:poll_updated", handlePollUpdated);
      socket.off("group:settings_updated", handleSettingsUpdated);
      socket.off("group:typing_start", handleTypingStart);
      socket.off("group:typing_stop", handleTypingStop);
      socket.off("group:message_unsent", handleMessageUnsent);
      socket.off("group:request_rekey", handleRequestRekey);
      socket.off("group:key_rotated", handleKeyRotated);
      socket.off("group:member_removed", handleMemberRemoved);
      socket.off("group:member_left", handleMemberLeft);
      socket.off("group:member_added", handleMemberAdded);
      socket.off("group:sender_key_received", handleSenderKeyReceived);
    };
  }, [socket, isConnected, groupId, performRekey]);

  // ── Mark Group Messages as Seen ────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !isConnected || !groupId || !messages.length) return;

    const currentUser = currentUserIdRef.current;

    const checkAndMarkSeen = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }

      const unseen = messages.filter((m) => {
        if (m.senderId === currentUser || m.id.startsWith("optimistic-")) return false;
        const myReceipt = m.receipts?.find((r) => r.userId === currentUser);
        return !myReceipt?.seenAt;
      });

      unseen.forEach((m) => {
        socket.emit("group:mark_seen", {
          groupId,
          messageId: m.id,
        });
      });
    };

    checkAndMarkSeen();
    const visibilityTimeout = setTimeout(checkAndMarkSeen, 300);

    window.addEventListener("focus", checkAndMarkSeen);
    window.addEventListener("click", checkAndMarkSeen);
    document.addEventListener("visibilitychange", checkAndMarkSeen);

    return () => {
      clearTimeout(visibilityTimeout);
      window.removeEventListener("focus", checkAndMarkSeen);
      window.removeEventListener("click", checkAndMarkSeen);
      document.removeEventListener("visibilitychange", checkAndMarkSeen);
    };
  }, [socket, isConnected, groupId, messages]);

  // ── Reactive Group Delivery Receipt Catch-Up ───────────────────────────────
  useEffect(() => {
    if (!socket || !isConnected || !groupId || !messages.length) return;

    const currentUser = currentUserIdRef.current;
    const undelivered = messages.filter(
      (m) =>
        m.senderId !== currentUser &&
        !m.id.startsWith("optimistic-") &&
        (!m.receipts ||
          !m.receipts.some(
            (r: any) => r.userId === currentUser && r.deliveredAt
          ))
    );

    if (undelivered.length > 0) {
      undelivered.forEach((m) => {
        socket.emit("group:mark_delivered", {
          groupId,
          messageId: m.id,
        });
      });
    }
  }, [socket, isConnected, groupId, messages]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (
      text: string,
      replyToId?: string | null,
      mediaUrl?: string | null,
      mediaType?: string | null
    ) => {
      if (!socket || !isConnected) throw new Error("Socket disconnected");

      const gKey = groupKeyRef.current;
      const currentUserId = currentUserIdRef.current;
      let ciphertext: string | null = null;
      let nonce: string | null = null;
      let senderKeyIteration: number | null = null;
      let messageType: number = 7;

      // Optimistic message setup
      const optimisticId = `optimistic-${Date.now()}`;
      if (text && currentUserId) {
        sentPlaintextCacheRef.current.set(optimisticId, text);
        void storeDecryptedMessage(currentUserId, optimisticId, text);
      }

      let optimisticReplyTo: QuotedMessage | null = null;
      if (replyToId) {
        const quoted = messagesRef.current.find((m) => m.id === replyToId);
        if (quoted) {
          optimisticReplyTo = {
            id: quoted.id,
            senderId: quoted.senderId,
            senderName: quoted.senderId === currentUserId ? "You" : (quoted.sender?.profile?.displayName || "Member"),
            text: quoted.text,
            mediaUrl: quoted.mediaUrl || null,
            mediaType: quoted.mediaType || null,
          };
        }
      }

      const optimisticMsg: GroupMessage = {
        id: optimisticId,
        groupId,
        senderId: currentUserId,
        text: text || "",
        createdAt: new Date().toISOString(),
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaType || undefined,
        replyToId: replyToId || null,
        replyTo: optimisticReplyTo,
        receipts: [],
        reactions: [],
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      if (text && currentUserId) {
        // 1. Attempt Signal-Grade Group Sender Key Protocol
        try {
          let mySK = await getStoredSenderKey(groupId, currentUserId, currentUserId);
          const activeMyPubKey = await getUserPublicKey(currentUserId);
          const needsDistribution = !mySK || (mySK as any).identityPublicKey !== activeMyPubKey;

          if (needsDistribution) {
            mySK = generateSenderKey(groupId, currentUserId);
            (mySK as any).identityPublicKey = activeMyPubKey;
            const membersRes = await groupService.fetchGroupMembers(groupId);
            const membersList = (membersRes.data as any)?.members || [];
            const otherMembers = membersList.filter((m: any) => m.userId !== currentUserId);

            if (otherMembers.length > 0) {
              const myPrivKey = await getUserPrivateKey(currentUserId);
              if (myPrivKey) {
                const memberUserIds = otherMembers.map((m: any) => m.userId);
                const batchMap = await chatService.fetchBatchKeys(memberUserIds);
                const distributions: any[] = [];
                for (const m of otherMembers) {
                  const pubKey = batchMap[m.userId]?.[0]?.publicKey || m.publicKey;
                  if (pubKey) {
                    const wrapped = wrapSenderKeyForMember(mySK.chainKey, pubKey, myPrivKey);
                    distributions.push({
                      recipientId: m.userId,
                      encryptedKey: wrapped.encryptedKey,
                      nonce: wrapped.nonce,
                      iteration: 0,
                    });
                  }
                }
                if (distributions.length > 0) {
                  socket.emit("group:sender_key_distribute", {
                    groupId,
                    distributions,
                  });
                }
              }
            }
            await storeSenderKey(groupId, currentUserId, mySK, currentUserId);
          }

          const enc = await encryptGroupSenderMessage(groupId, currentUserId, text, currentUserId);
          ciphertext = enc.ciphertext;
          nonce = enc.nonce;
          senderKeyIteration = enc.iteration;
          messageType = 7;
        } catch (skErr) {
          console.warn("[useGroupChat] Sender key encryption failed, falling back to shared group key:", skErr);
        }

        // 2. Fallback to Phase 3 shared group key if sender key protocol was not used
        if (!ciphertext && gKey) {
          const enc = await encryptGroupMessage(text, gKey);
          ciphertext = enc.ciphertext;
          nonce = enc.nonce;
          messageType = 1;
        } else if (!ciphertext && !gKey) {
          ciphertext = text;
          messageType = 1;
        }

        // Register ciphertext and nonce directly into sent message cache and IndexedDB
        if (nonce) {
          sentPlaintextCacheRef.current.set(nonce, text);
          void storeDecryptedMessage(currentUserId, `nonce_${nonce}`, text);
        }
        if (ciphertext) {
          sentPlaintextCacheRef.current.set(ciphertext, text);
          void storeDecryptedMessage(currentUserId, `cipher_${ciphertext}`, text);
        }
      }

      socket.emit("group:send_message", {
        groupId,
        ciphertext,
        nonce,
        messageType: messageType || 7,
        senderKeyIteration,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        replyToId: replyToId || null,
      });
    },
    [socket, isConnected, groupId]
  );

  const startTyping = useCallback(() => {
    if (socket && isConnected) {
      socket.emit("group:typing_start", { groupId });
    }
  }, [socket, isConnected, groupId]);

  const stopTyping = useCallback(() => {
    if (socket && isConnected) {
      socket.emit("group:typing_stop", { groupId });
    }
  }, [socket, isConnected, groupId]);

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

  const pinMessage = useCallback(
    async (messageId: string, durationSeconds?: number) => {
      await groupService.pinMessage(groupId, messageId, durationSeconds);
    },
    [groupId]
  );

  const unpinMessage = useCallback(
    async (messageId: string) => {
      await groupService.unpinMessage(groupId, messageId);
    },
    [groupId]
  );

  const createPoll = useCallback(
    async (question: string, options: string[], allowMultiple: boolean) => {
      return groupService.createPoll(groupId, question, options, allowMultiple);
    },
    [groupId]
  );

  const votePoll = useCallback(
    async (optionId: string, allowMultiple: boolean) => {
      return groupService.votePoll(groupId, optionId, allowMultiple);
    },
    [groupId]
  );

  const unsendMessage = useCallback(
    async (messageId: string) => {
      return groupService.unsendMessage(groupId, messageId);
    },
    [groupId]
  );

  const typingText = useMemo(() => {
    const names = Array.from(typingUsers.values());
    if (names.length === 0) return "";
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return `${names[0]}, ${names[1]} and ${names.length - 2} others are typing...`;
  }, [typingUsers]);

  const myRole = groupDetails?.myRole || "MEMBER";
  const isOwner = myRole === "OWNER" || groupDetails?.createdBy === currentUserId;
  const isAdmin = myRole === "ADMIN" || isOwner;
  const isAnnouncementOnly = groupDetails?.sendMessagesScope === "ONLY_ADMINS" && !isAdmin;

  return {
    messages,
    pinnedMessages,
    groupDetails,
    myRole,
    isAdmin,
    isOwner,
    isAnnouncementOnly,
    typingText,
    isReady,
    error,
    isUploading,
    setIsUploading,
    sendMessage,
    startTyping,
    stopTyping,
    toggleReaction,
    pinMessage,
    unpinMessage,
    createPoll,
    votePoll,
    unsendMessage,
    rekeyGroup: () => performRekey("manual rotation"),
    getGroupKey: () => groupKeyRef.current,
  };
};
