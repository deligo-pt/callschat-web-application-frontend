import { x25519 } from '@noble/curves/ed25519.js';
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { randomBytes } from '@noble/hashes/utils.js';
import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';
import {
  storeSenderKey,
  getStoredSenderKey,
  clearSenderKey,
  type StoredSenderKey,
} from './keyStore';

// Domain separation labels for HMAC-SHA256 Sender Key ratchets
const SENDER_KEY_MESSAGE_INFO = new TextEncoder().encode('signal_group_msg_key');
const SENDER_KEY_RATCHET_STEP_INFO = new TextEncoder().encode('signal_group_ratchet_step');

const MAX_CATCHUP_STEPS = 2000;

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function utf8ToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

export function bytesToUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * Generates a fresh Sender Key for group messaging.
 */
export function generateSenderKey(groupId: string, senderId: string): StoredSenderKey {
  const chainKeyBytes = randomBytes(32);
  const senderKeyId = `sk_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const chainKey = bytesToBase64(chainKeyBytes);
  return {
    groupId,
    senderId,
    chainKey,
    iteration: 0,
    senderKeyId,
    initialChainKey: chainKey,
    distributedTo: [],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Derives a single message key (MK) from current chain key (CK) and advances ratchet.
 */
export function ratchetSenderKey(
  chainKeyBase64: string
): { messageKey: Uint8Array; nextChainKey: string } {
  const chainKeyBytes = base64ToBytes(chainKeyBase64);
  const messageKey = hmac(sha256, chainKeyBytes, SENDER_KEY_MESSAGE_INFO);
  const nextChainKeyBytes = hmac(sha256, chainKeyBytes, SENDER_KEY_RATCHET_STEP_INFO);

  return {
    messageKey,
    nextChainKey: bytesToBase64(nextChainKeyBytes),
  };
}

export function normalizeCurve25519Key(bytes: Uint8Array): Uint8Array {
  if (bytes.length === 33 && bytes[0] === 0x05) {
    return bytes.slice(1);
  }
  if (bytes.length === 64) {
    return bytes.slice(0, 32);
  }
  return bytes;
}

/**
 * Wraps a Sender Key for a specific member using pairwise Diffie-Hellman + authenticated cipher.
 */
export function wrapSenderKeyForMember(
  chainKeyBase64: string,
  memberPublicKeyBase64: string,
  myPrivateKeyBase64: string
): { encryptedKey: string; nonce: string } {
  const memberPub = normalizeCurve25519Key(base64ToBytes(memberPublicKeyBase64));
  const myPriv = normalizeCurve25519Key(base64ToBytes(myPrivateKeyBase64));
  const sharedSecret = x25519.getSharedSecret(myPriv, memberPub);
  const wrappingKey = sha256(sharedSecret);

  const nonce = randomBytes(24);
  const cipher = xchacha20poly1305(wrappingKey, nonce);
  const encrypted = cipher.encrypt(utf8ToBytes(chainKeyBase64));

  return {
    encryptedKey: bytesToBase64(encrypted),
    nonce: bytesToBase64(nonce),
  };
}

/**
 * Unwraps a received Sender Key from a member.
 * Supports passing candidate public or private keys to gracefully handle rotations/transitions.
 */
export function unwrapSenderKeyFromMember(
  encryptedKeyBase64: string,
  nonceBase64: string,
  senderPublicKeyBase64: string | string[],
  myPrivateKeyBase64: string | string[]
): string {
  const senderPubs = (Array.isArray(senderPublicKeyBase64) ? senderPublicKeyBase64 : [senderPublicKeyBase64]).filter(Boolean);
  const myPrivs = (Array.isArray(myPrivateKeyBase64) ? myPrivateKeyBase64 : [myPrivateKeyBase64]).filter(Boolean);

  const nonce = base64ToBytes(nonceBase64);
  const encryptedBytes = base64ToBytes(encryptedKeyBase64);

  let lastError: any = null;
  for (const myPrivStr of myPrivs) {
    for (const senderPubStr of senderPubs) {
      try {
        const senderPub = normalizeCurve25519Key(base64ToBytes(senderPubStr));
        const myPriv = normalizeCurve25519Key(base64ToBytes(myPrivStr));
        if (senderPub.length !== 32 || myPriv.length !== 32) {
          continue;
        }
        const sharedSecret = x25519.getSharedSecret(myPriv, senderPub);

        // 1. Standard SHA-256 wrapping key derivation
        try {
          const wrappingKey = sha256(sharedSecret);
          const cipher = xchacha20poly1305(wrappingKey, nonce);
          const decryptedBytes = cipher.decrypt(encryptedBytes);
          return bytesToUtf8(decryptedBytes);
        } catch {}

        // 2. Direct shared secret fallback (compatibility with pairwise cipher secret)
        try {
          const cipher = xchacha20poly1305(sharedSecret, nonce);
          const decryptedBytes = cipher.decrypt(encryptedBytes);
          return bytesToUtf8(decryptedBytes);
        } catch (directErr) {
          lastError = directErr;
        }
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw lastError || new Error('Failed to unwrap sender key from member');
}

export interface EncryptGroupResult {
  ciphertext: string;
  nonce: string;
  iteration: number;
  messageType: number; // 7 = SenderKeyMessage
}

/**
 * Encrypts a message with the user's Sender Key for the given group.
 * Ratchets the chain key forward and updates storage.
 */
export async function encryptGroupSenderMessage(
  groupId: string,
  senderId: string,
  plaintext: string,
  myUserId?: string
): Promise<EncryptGroupResult> {
  const effectiveMyId = myUserId || senderId;
  let record = await getStoredSenderKey(groupId, senderId, effectiveMyId);
  if (!record) {
    record = generateSenderKey(groupId, senderId);
    await storeSenderKey(groupId, senderId, record, effectiveMyId);
  }

  const { messageKey, nextChainKey } = ratchetSenderKey(record.chainKey);
  const nonceBytes = randomBytes(24);
  const cipher = xchacha20poly1305(messageKey, nonceBytes);
  const ciphertextBytes = cipher.encrypt(utf8ToBytes(plaintext));

  const updatedRecord: StoredSenderKey = {
    ...record,
    chainKey: nextChainKey,
    iteration: record.iteration + 1,
    updatedAt: new Date().toISOString(),
  };
  await storeSenderKey(groupId, senderId, updatedRecord, effectiveMyId);

  return {
    ciphertext: bytesToBase64(ciphertextBytes),
    nonce: bytesToBase64(nonceBytes),
    iteration: record.iteration,
    messageType: 7,
  };
}

export interface DecryptGroupResult {
  plaintext: string;
  iteration: number;
}

/**
 * Decrypts an incoming SenderKeyMessage from a group member.
 * Ratchets forward to targetIteration if needed, and persists updated state.
 */
export async function decryptGroupSenderMessage(
  groupId: string,
  senderId: string,
  ciphertextBase64: string,
  nonceBase64: string,
  targetIteration: number,
  myUserId?: string
): Promise<DecryptGroupResult> {
  const record = await getStoredSenderKey(groupId, senderId, myUserId);
  if (!record) {
    throw new Error(`No Sender Key found for member ${senderId} in group ${groupId}`);
  }

  if (targetIteration < record.iteration) {
    if (record.initialChainKey) {
      // Replay from initialChainKey at iteration 0 for out-of-order or earlier messages
      const dec = decryptSenderMessageWithChainKey(
        record.initialChainKey,
        0,
        targetIteration,
        ciphertextBase64,
        nonceBase64
      );
      return {
        plaintext: dec.plaintext,
        iteration: targetIteration,
      };
    }
    throw new Error(
      `Received expired or replay iteration ${targetIteration} < current ${record.iteration}`
    );
  }

  if (targetIteration - record.iteration > MAX_CATCHUP_STEPS) {
    throw new Error(
      `Ratchet gap too large (${targetIteration - record.iteration} > ${MAX_CATCHUP_STEPS})`
    );
  }

  let curCK = record.chainKey;
  let curIter = record.iteration;
  let targetMK: Uint8Array | null = null;

  while (curIter <= targetIteration) {
    const { messageKey, nextChainKey } = ratchetSenderKey(curCK);
    if (curIter === targetIteration) {
      targetMK = messageKey;
      curCK = nextChainKey;
      curIter++;
      break;
    }
    curCK = nextChainKey;
    curIter++;
  }

  if (!targetMK) {
    throw new Error('Failed to derive message key for target iteration');
  }

  const nonceBytes = base64ToBytes(nonceBase64);
  const ciphertextBytes = base64ToBytes(ciphertextBase64);
  const cipher = xchacha20poly1305(targetMK, nonceBytes);
  const decryptedBytes = cipher.decrypt(ciphertextBytes);

  const updatedRecord: StoredSenderKey = {
    ...record,
    chainKey: curCK,
    iteration: curIter,
    updatedAt: new Date().toISOString(),
  };
  await storeSenderKey(groupId, senderId, updatedRecord, myUserId);

  return {
    plaintext: bytesToUtf8(decryptedBytes),
    iteration: targetIteration,
  };
}

/**
 * Decrypts a Sender Key message using an in-memory chain key state (for history replay across reloads).
 * Advances the chain key forward and returns the new chain key state without corrupting storage.
 */
export function decryptSenderMessageWithChainKey(
  initialChainKey: string,
  currentIteration: number,
  targetIteration: number,
  ciphertextBase64: string,
  nonceBase64: string
): { plaintext: string; nextChainKey: string; nextIteration: number } {
  if (targetIteration < currentIteration) {
    throw new Error(`Target iteration ${targetIteration} < current ${currentIteration}`);
  }
  if (targetIteration - currentIteration > MAX_CATCHUP_STEPS) {
    throw new Error(`Ratchet gap too large (${targetIteration - currentIteration} > ${MAX_CATCHUP_STEPS})`);
  }

  let curCK = initialChainKey;
  let curIter = currentIteration;
  let targetMK: Uint8Array | null = null;

  while (curIter <= targetIteration) {
    const { messageKey, nextChainKey } = ratchetSenderKey(curCK);
    if (curIter === targetIteration) {
      targetMK = messageKey;
      curCK = nextChainKey;
      curIter++;
      break;
    }
    curCK = nextChainKey;
    curIter++;
  }

  if (!targetMK) {
    throw new Error('Failed to derive message key for target iteration');
  }

  const nonceBytes = base64ToBytes(nonceBase64);
  const ciphertextBytes = base64ToBytes(ciphertextBase64);
  const cipher = xchacha20poly1305(targetMK, nonceBytes);
  const decryptedBytes = cipher.decrypt(ciphertextBytes);

  return {
    plaintext: bytesToUtf8(decryptedBytes),
    nextChainKey: curCK,
    nextIteration: curIter,
  };
}

/**
 * Advances a chain key to target iteration without decrypting (used when message is retrieved from local cache).
 */
export function advanceChainKey(
  initialChainKey: string,
  currentIteration: number,
  targetIteration: number
): { nextChainKey: string; nextIteration: number } {
  if (targetIteration < currentIteration) {
    return { nextChainKey: initialChainKey, nextIteration: currentIteration };
  }
  if (targetIteration - currentIteration > MAX_CATCHUP_STEPS) {
    return { nextChainKey: initialChainKey, nextIteration: currentIteration };
  }

  let curCK = initialChainKey;
  let curIter = currentIteration;
  while (curIter <= targetIteration) {
    const { nextChainKey } = ratchetSenderKey(curCK);
    curCK = nextChainKey;
    curIter++;
  }

  return {
    nextChainKey: curCK,
    nextIteration: curIter,
  };
}
