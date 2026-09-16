import { decryptMessage, decryptGroupMessage } from "@/utils/crypto";
import { getUserPrivateKey, getUserPublicKey, getDecryptedMessage } from "@/utils/keyStore";
import { chatService } from "@/services/chat.service";
import { groupService } from "@/services/group.service";

export type NotificationAttachmentType =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "call"
  | "link"
  | "sticker"
  | "contact"
  | "location"
  | "pin"
  | "text";

export interface FormattedNotificationPreview {
  displayText: string;
  attachmentType: NotificationAttachmentType;
  iconLabel: string;
  caption?: string;
  isEncryptedFallback?: boolean;
}

// In-memory caches to make real-time notification decryption instant
const userPubKeyCache = new Map<string, string[]>();
const groupKeyCache = new Map<string, string>();

/**
 * Strips internal system markers from decrypted plaintext
 */
export function cleanMessageText(text: string): string {
  if (!text) return "";
  if (text.startsWith("__EDITED__:")) {
    return text.substring("__EDITED__:".length);
  }
  return text;
}

/**
 * Resolves public keys for a peer (cached in-memory for instant lookups)
 */
async function getPeerPublicKeys(peerUserId: string): Promise<string[]> {
  if (userPubKeyCache.has(peerUserId)) {
    return userPubKeyCache.get(peerUserId)!;
  }
  try {
    const res = await chatService.fetchRecipientKey(peerUserId);
    let keys: string[] = [];
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      keys = res.data.map((d: { publicKey: string }) => d.publicKey);
    } else if (res?.success && res?.data?.publicKey) {
      keys = [res.data.publicKey];
    }
    if (keys.length > 0) {
      userPubKeyCache.set(peerUserId, keys);
    }
    return keys;
  } catch {
    return [];
  }
}

/**
 * Decrypts a 1v1 chat payload in real-time
 */
export async function decrypt1v1Notification(
  payload: {
    id?: string;               // message ID — used for IndexedDB cache lookup
    senderId?: string;
    ciphertext?: string | null;
    nonce?: string | null;
    previewText?: string | null;
    ticketId?: string | null;
  },
  currentUserId: string
): Promise<string> {
  // ── IndexedDB persistent cache (instant — zero crypto) ──────────────────
  // Check before any other path so already-decrypted messages are returned
  // immediately without doing a network round-trip for keys.
  if (currentUserId) {
    if (payload.id) {
      const cached = await getDecryptedMessage(currentUserId, payload.id);
      if (cached) return cleanMessageText(cached);
    }
    if (payload.nonce) {
      const cached = await getDecryptedMessage(currentUserId, `nonce_${payload.nonce}`);
      if (cached) return cleanMessageText(cached);
    }
  }

  // If previewText was sent explicitly and ciphertext is empty
  if (!payload.ciphertext && payload.previewText) {
    return payload.previewText;
  }

  // Plaintext or ticket B2C message
  if (payload.ciphertext && (!payload.nonce || payload.ticketId)) {
    return cleanMessageText(payload.ciphertext);
  }

  if (!payload.ciphertext || !payload.nonce) {
    return payload.previewText || "";
  }

  const senderId = payload.senderId;
  if (!senderId || !currentUserId) {
    return payload.previewText || "";
  }

  const myPrivateKey = await getUserPrivateKey(currentUserId);
  if (!myPrivateKey) {
    return payload.previewText || "🔒 Encrypted message";
  }

  const peerKeys = await getPeerPublicKeys(senderId);
  const myPublicKey = await getUserPublicKey(currentUserId);

  // Try peer's public keys first
  for (const candidateKey of peerKeys) {
    try {
      const decrypted = await decryptMessage(
        payload.ciphertext,
        payload.nonce,
        candidateKey,
        myPrivateKey
      );
      return cleanMessageText(decrypted);
    } catch {
      // try next key
    }
  }

  // Try own public key (key rotation fallback)
  if (myPublicKey) {
    try {
      const decrypted = await decryptMessage(
        payload.ciphertext,
        payload.nonce,
        myPublicKey,
        myPrivateKey
      );
      return cleanMessageText(decrypted);
    } catch {
      // ignore
    }
  }

  return payload.previewText || "🔒 Encrypted message";
}

/**
 * Decrypts a group chat payload in real-time
 */
export async function decryptGroupNotification(
  payload: {
    groupId?: string;
    senderId?: string;
    ciphertext?: string | null;
    nonce?: string | null;
    previewText?: string | null;
  },
  currentUserId: string
): Promise<string> {
  if (!payload.ciphertext && payload.previewText) {
    return payload.previewText;
  }

  if (!payload.ciphertext || !payload.nonce) {
    return payload.previewText || "";
  }

  const groupId = payload.groupId;
  if (!groupId) return payload.previewText || "";

  // Check cached group key
  let gKey = groupKeyCache.get(groupId);
  if (!gKey) {
    try {
      const keyRes = await groupService.fetchGroupKey(groupId);
      const encKey = keyRes.data?.encryptedGroupKey;
      const keyNonce = keyRes.data?.keyNonce;
      if (encKey && keyNonce && currentUserId) {
        const myPrivKey = await getUserPrivateKey(currentUserId);
        const myPubKey = await getUserPublicKey(currentUserId);
        if (myPrivKey && myPubKey) {
          try {
            gKey = await decryptMessage(encKey, keyNonce, myPubKey, myPrivKey);
          } catch {
            const senderKeys = payload.senderId ? await getPeerPublicKeys(payload.senderId) : [];
            for (const k of senderKeys) {
              try {
                gKey = await decryptMessage(encKey, keyNonce, k, myPrivKey);
                break;
              } catch {}
            }
          }
          if (gKey) {
            groupKeyCache.set(groupId, gKey);
          }
        }
      }
    } catch {
      // ignore
    }
  }

  if (gKey) {
    try {
      const decrypted = await decryptGroupMessage(
        payload.ciphertext,
        payload.nonce,
        gKey
      );
      return cleanMessageText(decrypted);
    } catch {
      // ignore
    }
  }

  return payload.previewText || "🔒 Encrypted message";
}

/**
 * Formats decrypted text + media metadata into WhatsApp Web notification labels
 */
export function formatWhatsAppMessagePreview(
  text: string,
  mediaType?: string | null,
  mediaUrl?: string | null
): FormattedNotificationPreview {
  const trimmedText = text?.trim() || "";

  // 1. Pin events
  if (trimmedText.startsWith("__PIN_EVENT__:")) {
    try {
      const payload = JSON.parse(trimmedText.substring("__PIN_EVENT__:".length));
      const action = payload.action === "pin" ? "pinned a message" : "unpinned a message";
      return {
        displayText: action,
        attachmentType: "pin",
        iconLabel: "Pinned",
      };
    } catch {
      return {
        displayText: "Pinned a message",
        attachmentType: "pin",
        iconLabel: "Pinned",
      };
    }
  }

  // 2. Call events
  if (mediaType === "call") {
    let callLabel = "Call";
    if (mediaUrl) {
      try {
        const parsed = JSON.parse(mediaUrl);
        callLabel = parsed.type === "VIDEO" ? "Video call" : "Voice call";
      } catch {}
    }
    return {
      displayText: callLabel,
      attachmentType: "call",
      iconLabel: callLabel,
    };
  }

  // 3. Media attachments
  if (mediaType === "image") {
    return {
      displayText: trimmedText ? `Photo: ${trimmedText}` : "Photo",
      attachmentType: "image",
      iconLabel: "Photo",
      caption: trimmedText || undefined,
    };
  }

  if (mediaType === "video") {
    return {
      displayText: trimmedText ? `Video: ${trimmedText}` : "Video",
      attachmentType: "video",
      iconLabel: "Video",
      caption: trimmedText || undefined,
    };
  }

  if (mediaType === "audio") {
    return {
      displayText: "Voice message",
      attachmentType: "audio",
      iconLabel: "Voice message",
    };
  }

  if (mediaType === "document") {
    return {
      displayText: trimmedText ? `Document: ${trimmedText}` : "Document",
      attachmentType: "document",
      iconLabel: "Document",
      caption: trimmedText || undefined,
    };
  }

  if (mediaType === "sticker") {
    return {
      displayText: "Sticker",
      attachmentType: "sticker",
      iconLabel: "Sticker",
    };
  }

  if (mediaType === "contact") {
    return {
      displayText: trimmedText || "Contact card",
      attachmentType: "contact",
      iconLabel: "Contact",
    };
  }

  if (mediaType === "location") {
    return {
      displayText: trimmedText || "Location",
      attachmentType: "location",
      iconLabel: "Location",
    };
  }

  if (mediaType === "link") {
    return {
      displayText: trimmedText || "Link",
      attachmentType: "link",
      iconLabel: "Link",
    };
  }

  // 4. Regular Text (check for URL link)
  if (trimmedText) {
    const isUrl = /^https?:\/\/[^\s]+$/.test(trimmedText);
    if (isUrl) {
      return {
        displayText: trimmedText,
        attachmentType: "link",
        iconLabel: "Link",
      };
    }

    const isEncryptedFallback = trimmedText.includes("🔒 Encrypted");
    return {
      displayText: trimmedText,
      attachmentType: "text",
      iconLabel: "",
      isEncryptedFallback,
    };
  }

  // 5. Fallback when mediaUrl is present without mediaType
  if (mediaUrl) {
    return {
      displayText: "Photo",
      attachmentType: "image",
      iconLabel: "Photo",
    };
  }

  return {
    displayText: "New message",
    attachmentType: "text",
    iconLabel: "",
  };
}
