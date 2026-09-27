import {
  exportLocalKeyBundle,
  getUserPrivateKey,
  getUserPublicKey,
  getDecryptedMessage,
  storeDecryptedMessage,
  getStoredGroupKey,
  getVaultSessionPin,
} from "./keyStore";
import {
  encryptKeyVault,
  decryptMessage,
  decryptWithSessionKey,
  decryptGroupMessage,
  base64ToBytes,
} from "./crypto";
import { decrypt1to1Message } from "./signalCrypto";
import { chatService } from "@/services/chat.service";
import { groupService } from "@/services/group.service";

let syncTimeout: NodeJS.Timeout | null = null;
let isSyncing = false;

/**
 * Thoroughly sweeps all 1-to-1 conversations and groups for the user,
 * ensures their message histories are decrypted using the device's local keys,
 * and caches the plaintexts into IndexedDB under multiple keys:
 * (msg.id, nonce_${msg.nonce}, msg.ciphertext, cipher_${msg.ciphertext})
 * so that exportLocalKeyBundle captures 100% of all conversation history in the backup.
 */
export async function populateAllConversationsCache(
  userId: string,
  onProgress?: (status: string) => void
): Promise<number> {
  if (typeof window === "undefined" || !userId) return 0;

  const myPriv = await getUserPrivateKey(userId);
  const myPub = await getUserPublicKey(userId);
  if (!myPriv) {
    console.warn("[vaultSync] Cannot sweep conversations: local private key not available");
    return 0;
  }

  onProgress?.("Discovering conversations & groups...");
  let totalCached = 0;

  try {
    const [convRes, groupRes] = await Promise.all([
      chatService.fetchMyConversations().catch(() => ({ success: false, data: [] })),
      groupService.fetchMyGroups().catch(() => ({ success: false, data: [] })),
    ]);

    const convs: any[] = (convRes?.success && Array.isArray(convRes?.data)) ? convRes.data : [];
    const groups: any[] = (groupRes?.success && Array.isArray(groupRes?.data)) ? groupRes.data : [];

    // Collect peer IDs to batch fetch public keys
    const peerIds = new Set<string>();
    convs.forEach((c) => {
      const otherId =
        c.otherUserId ||
        (Array.isArray(c.participants)
          ? c.participants.find((p: any) => (p._id || p.id) !== userId)?._id ||
            c.participants.find((p: any) => (p._id || p.id) !== userId)?.id
          : null);
      if (otherId) peerIds.add(otherId);
    });

    let batchKeys: Record<string, any[]> = {};
    if (peerIds.size > 0) {
      try {
        batchKeys = await chatService.fetchBatchKeys(Array.from(peerIds));
      } catch {}
    }

    // 1. Process 1-to-1 Conversations
    for (let i = 0; i < convs.length; i++) {
      const c = convs[i];
      const peerId =
        c.otherUserId ||
        (Array.isArray(c.participants)
          ? c.participants.find((p: any) => (p._id || p.id) !== userId)?._id ||
            c.participants.find((p: any) => (p._id || p.id) !== userId)?.id
          : null);

      onProgress?.(`Backing up chat ${i + 1} of ${convs.length}...`);

      try {
        const histRes = await chatService.fetchHistory(c.id);
        const msgs: any[] = (histRes?.success && Array.isArray(histRes?.data)) ? histRes.data : [];

        // Build peer key list
        const peerKeyCandidates: string[] = [];
        if (peerId && batchKeys[peerId]) {
          batchKeys[peerId].forEach((d: any) => {
            if (d.publicKey) peerKeyCandidates.push(d.publicKey);
          });
        }

        for (const m of msgs) {
          if (!m.ciphertext) continue;

          // Check if already stored in IndexedDB
          let text = await getDecryptedMessage(userId, m.id);
          if (!text && m.nonce) {
            text = await getDecryptedMessage(userId, `nonce_${m.nonce}`);
          }
          if (!text && m.ciphertext) {
            text =
              (await getDecryptedMessage(userId, m.ciphertext)) ||
              (await getDecryptedMessage(userId, `cipher_${m.ciphertext}`));
          }

          if (!text) {
            let encKeys = m.encryptedKeys;
            if (typeof encKeys === "string") {
              try { encKeys = JSON.parse(encKeys); } catch {}
            }

            const isSignalMsg =
              m.messageType === 2 ||
              m.messageType === 3 ||
              encKeys?.protocol === "libsignal";

            if (m.senderId === userId) {
              // Self-sent: Try selfEncryptedSessionKey
              if (encKeys?.selfEncryptedSessionKey && myPub && myPriv) {
                try {
                  const decRaw = await decryptMessage(
                    encKeys.selfEncryptedSessionKey.ciphertext,
                    encKeys.selfEncryptedSessionKey.nonce,
                    myPub,
                    myPriv
                  );
                  if (decRaw) {
                    if (encKeys.selfEncryptedSessionKey.type === "plaintext") {
                      text = decRaw;
                    } else {
                      const sessionKey = base64ToBytes(decRaw);
                      text = await decryptWithSessionKey(m.ciphertext, m.nonce, sessionKey);
                    }
                  }
                } catch {}
              }

              // Self-sent fallback: pairwise
              if (!text && peerKeyCandidates.length > 0 && m.nonce) {
                for (const pk of peerKeyCandidates) {
                  try {
                    text = await decryptMessage(m.ciphertext, m.nonce, pk, myPriv);
                    if (text) break;
                  } catch {}
                }
              }
            } else {
              // Peer-sent: Libsignal Double Ratchet
              if (isSignalMsg && m.senderId) {
                try {
                  text = await decrypt1to1Message(
                    userId,
                    m.senderId,
                    m.ciphertext,
                    m.messageType ?? 2,
                    1
                  );
                } catch {}
              }

              // Peer-sent fallback: pairwise
              if (!text && peerKeyCandidates.length > 0 && m.nonce) {
                for (const pk of peerKeyCandidates) {
                  try {
                    text = await decryptMessage(m.ciphertext, m.nonce, pk, myPriv);
                    if (text) break;
                  } catch {}
                }
              }
            }
          }

          if (text) {
            // Strip __EDITED__: prefix if present
            if (text.startsWith("__EDITED__:")) {
              text = text.substring("__EDITED__:".length);
            }
            await storeDecryptedMessage(userId, m.id, text);
            if (m.nonce) {
              await storeDecryptedMessage(userId, `nonce_${m.nonce}`, text);
            }
            if (m.ciphertext) {
              await storeDecryptedMessage(userId, m.ciphertext, text);
              await storeDecryptedMessage(userId, `cipher_${m.ciphertext}`, text);
            }
            totalCached++;
          }
        }
      } catch (err) {
        console.warn(`[vaultSync] Error sweeping conversation ${c.id}:`, err);
      }
    }

    // 2. Process Group Conversations
    for (let j = 0; j < groups.length; j++) {
      const g = groups[j];
      onProgress?.(`Backing up group ${j + 1} of ${groups.length}...`);

      try {
        const gHistRes = await groupService.fetchGroupMessages(g.id);
        const gMsgs: any[] = (gHistRes?.success && Array.isArray(gHistRes?.data)) ? gHistRes.data : [];
        const groupKey = await getStoredGroupKey(g.id, userId);

        for (const gm of gMsgs) {
          if (!gm.ciphertext) continue;

          let text = await getDecryptedMessage(userId, gm.id);
          if (!text && gm.nonce) {
            text = await getDecryptedMessage(userId, `nonce_${gm.nonce}`);
          }
          if (!text && gm.ciphertext) {
            text =
              (await getDecryptedMessage(userId, gm.ciphertext)) ||
              (await getDecryptedMessage(userId, `cipher_${gm.ciphertext}`));
          }

          if (!text && groupKey && gm.nonce) {
            try {
              text = await decryptGroupMessage(gm.ciphertext, gm.nonce, groupKey);
            } catch {}
          }

          if (text) {
            if (text.startsWith("__EDITED__:")) {
              text = text.substring("__EDITED__:".length);
            }
            await storeDecryptedMessage(userId, gm.id, text);
            if (gm.nonce) {
              await storeDecryptedMessage(userId, `nonce_${gm.nonce}`, text);
            }
            if (gm.ciphertext) {
              await storeDecryptedMessage(userId, gm.ciphertext, text);
              await storeDecryptedMessage(userId, `cipher_${gm.ciphertext}`, text);
            }
            totalCached++;
          }
        }
      } catch (gErr) {
        console.warn(`[vaultSync] Error sweeping group ${g.id}:`, gErr);
      }
    }

    console.log(`⚡ [vaultSync] Swept and cached ${totalCached} historical messages into vault bundle!`);
  } catch (err) {
    console.warn("[vaultSync] Error during multi-conversation sweep:", err);
  }

  return totalCached;
}

/**
 * Automatically and non-intrusively updates the user's encrypted cloud key backup
 * in the background when the user has unlocked their vault in this session.
 * Debounced to avoid hammering the backend on every individual message.
 */
export function queueVaultSync(userId: string, delayMs: number = 3000): void {
  if (typeof window === "undefined" || !userId) return;

  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(async () => {
    if (isSyncing) return;
    try {
      isSyncing = true;
      const currentPin = await getVaultSessionPin(userId);
      if (!currentPin) return;

      const localBundle = await exportLocalKeyBundle(userId);
      if (!localBundle || !localBundle.privateKey || !localBundle.publicKey) {
        return;
      }

      // Encrypt client-side using zero-knowledge PBKDF2 + XChaCha20-Poly1305
      const encrypted = encryptKeyVault(localBundle, currentPin, 100000);

      await chatService.uploadKeyBackup({
        encryptedVault: encrypted.encryptedVault,
        nonce: encrypted.nonce,
        salt: encrypted.salt,
        kdfAlgorithm: "PBKDF2-SHA256",
        kdfIterations: encrypted.kdfIterations,
        version: 1,
      });
      console.debug("[vaultSync] Background vault backup synced successfully.");
    } catch (err) {
      console.warn("[vaultSync] Background vault sync failed:", err);
    } finally {
      isSyncing = false;
    }
  }, delayMs);
}
