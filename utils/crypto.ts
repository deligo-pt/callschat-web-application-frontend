import { x25519 } from '@noble/curves/ed25519.js';
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { randomBytes } from '@noble/hashes/utils.js';
import { hmac } from '@noble/hashes/hmac.js';
import { sha256, sha512 } from '@noble/hashes/sha2.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import {
  storeUserKeys,
  storePreKeyPrivate,
  getPreKeyPrivate,
  storeSignedPreKeyPrivate,
  getSignedPreKeyPrivate,
} from './keyStore';

export const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const base64ToBytes = (base64: string): Uint8Array => {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
};

export const utf8ToBytes = (str: string): Uint8Array => {
  return new TextEncoder().encode(str);
};

export const bytesToUtf8 = (bytes: Uint8Array): string => {
  return new TextDecoder().decode(bytes);
};

export const initCrypto = async () => {
  // @noble packages are synchronous and do not require initialization.
};

export const generateAndStoreKeyPair = async (userId: string = "") => {
  const privateKey = x25519.utils.randomSecretKey();
  const publicKey = x25519.getPublicKey(privateKey);
  
  const publicKeyBase64 = bytesToBase64(publicKey);
  const privateKeyBase64 = bytesToBase64(privateKey);
  
  if (typeof window !== "undefined") {
    await storeUserKeys(userId, privateKeyBase64, publicKeyBase64);
  }
  
  return publicKeyBase64;
};

export const deriveSharedSecret = (myPrivateKey: string, peerPublicKey: string): Uint8Array => {
  const myPriv = base64ToBytes(myPrivateKey);
  const peerPub = base64ToBytes(peerPublicKey);
  return x25519.getSharedSecret(myPriv, peerPub);
};

const sharedSecretCache: Record<string, Uint8Array> = {};

export const getSharedSecret = (myPrivateKey: string, peerPublicKey: string): Uint8Array => {
  const cacheKey = `${myPrivateKey}_${peerPublicKey}`;
  if (sharedSecretCache[cacheKey]) {
    return sharedSecretCache[cacheKey];
  }
  const secret = deriveSharedSecret(myPrivateKey, peerPublicKey);
  sharedSecretCache[cacheKey] = secret;
  return secret;
};

export const encryptMessage = async (plaintext: string, recipientPublicKey: string, myPrivateKey: string) => {
  const sharedSecret = getSharedSecret(myPrivateKey, recipientPublicKey);
  const nonceBytes = randomBytes(24);
  
  const cipher = xchacha20poly1305(sharedSecret, nonceBytes);
  
  const plaintextBytes = utf8ToBytes(plaintext);
  const encryptedPayload = cipher.encrypt(plaintextBytes);
  
  return {
    ciphertext: bytesToBase64(encryptedPayload),
    nonce: bytesToBase64(nonceBytes)
  };
};

export const decryptMessage = async (ciphertext: string, nonce: string, senderPublicKey: string, myPrivateKey: string) => {
  const sharedSecret = getSharedSecret(myPrivateKey, senderPublicKey);
  const cipherBytes = base64ToBytes(ciphertext);
  const nonceBytes = base64ToBytes(nonce);
  
  const cipher = xchacha20poly1305(sharedSecret, nonceBytes);
  
  const decryptedBytes = cipher.decrypt(cipherBytes);
  return bytesToUtf8(decryptedBytes);
};

// ── Symmetric Group Chat Encryption (XChaCha20Poly1305) ──────────────────────

export const generateGroupKey = async (): Promise<string> => {
  const keyBytes = randomBytes(32);
  return bytesToBase64(keyBytes);
};

export const encryptGroupMessage = async (plaintext: string, groupKeyBase64: string) => {
  const groupKey = base64ToBytes(groupKeyBase64);
  const nonceBytes = randomBytes(24);
  
  const cipher = xchacha20poly1305(groupKey, nonceBytes);
  const plaintextBytes = utf8ToBytes(plaintext);
  const encryptedPayload = cipher.encrypt(plaintextBytes);
  
  return {
    ciphertext: bytesToBase64(encryptedPayload),
    nonce: bytesToBase64(nonceBytes)
  };
};

export const decryptGroupMessage = async (ciphertextBase64: string, nonceBase64: string, groupKeyBase64: string) => {
  const cipherBytes = base64ToBytes(ciphertextBase64);
  const nonceBytes = base64ToBytes(nonceBase64);
  const groupKey = base64ToBytes(groupKeyBase64);
  
  const cipher = xchacha20poly1305(groupKey, nonceBytes);
  const decryptedBytes = cipher.decrypt(cipherBytes);
  
  return bytesToUtf8(decryptedBytes);
};

// ── QR Login: Ephemeral Diffie-Hellman Key Exchange ───────────────────────────

export const generateEphemeralKeyPair = async (): Promise<{
  publicKey: string;
  privateKey: string;
}> => {
  const privateKey = x25519.utils.randomSecretKey();
  const publicKey = x25519.getPublicKey(privateKey);
  return {
    publicKey: bytesToBase64(publicKey),
    privateKey: bytesToBase64(privateKey),
  };
};

export const decryptKeyFromMobile = async (
  encryptedPrivKey: string,
  mobileEphPub: string,
  nonce: string,
  webEphPriv: string,
): Promise<string> => {
  const cipherBytes = base64ToBytes(encryptedPrivKey);
  const nonceBytes = base64ToBytes(nonce);
  const mobilePub = base64ToBytes(mobileEphPub);
  const webPriv = base64ToBytes(webEphPriv);

  const sharedSecret = x25519.getSharedSecret(webPriv, mobilePub);
  const cipher = xchacha20poly1305(sharedSecret, nonceBytes);
  
  const decrypted = cipher.decrypt(cipherBytes);
  return bytesToBase64(decrypted);
};

export const derivePublicKeyFromPrivate = async (privateKeyBase64: string): Promise<string> => {
  const privBytes = base64ToBytes(privateKeyBase64);
  const pubBytes = x25519.getPublicKey(privBytes);
  return bytesToBase64(pubBytes);
};

// ── X3DH Pre-Keys & Ephemeral Handshake (Signal/WhatsApp Architecture) ───────

export interface GeneratedPreKey {
  keyId: number;
  publicKey: string;
}

export const generatePreKeyBatch = async (
  userId: string,
  startId: number,
  count: number,
): Promise<GeneratedPreKey[]> => {
  const list: GeneratedPreKey[] = [];
  for (let i = 0; i < count; i++) {
    const keyId = startId + i;
    const priv = x25519.utils.randomSecretKey();
    const pub = x25519.getPublicKey(priv);
    const privBase64 = bytesToBase64(priv);
    const pubBase64 = bytesToBase64(pub);

    if (typeof window !== 'undefined') {
      await storePreKeyPrivate(userId, keyId, privBase64);
    }

    list.push({ keyId, publicKey: pubBase64 });
  }
  return list;
};

export const generateSignedPreKey = async (
  userId: string,
  keyId: number,
  identityPrivateKeyBase64: string,
): Promise<{ keyId: number; publicKey: string; signature: string }> => {
  const priv = x25519.utils.randomSecretKey();
  const pub = x25519.getPublicKey(priv);
  const privBase64 = bytesToBase64(priv);
  const pubBase64 = bytesToBase64(pub);

  if (typeof window !== 'undefined') {
    await storeSignedPreKeyPrivate(userId, keyId, privBase64);
  }

  // Generate HMAC-SHA256 signature using the Identity Private Key
  const identityPrivBytes = base64ToBytes(identityPrivateKeyBase64);
  const sigBytes = hmac(sha256, identityPrivBytes, pub);
  const signature = bytesToBase64(sigBytes);

  return {
    keyId,
    publicKey: pubBase64,
    signature,
  };
};

/**
 * X3DH Initiator:
 * Sender generates ephemeral keypair EK and calculates:
 * DH1 = X25519(IK_sender, SPK_recipient)
 * DH2 = X25519(EK_sender, IK_recipient)
 * DH3 = X25519(EK_sender, SPK_recipient)
 * DH4 = X25519(EK_sender, OPK_recipient) [if OPK present]
 * Combines using HKDF-SHA256 into a 32-byte master session key.
 */
export const performX3DHInitiator = async (
  myIdentityPrivateKey: string,
  recipientIdentityPublicKey: string,
  recipientSignedPreKey: string,
  recipientOneTimePreKey?: string | null,
): Promise<{
  sessionKey: Uint8Array;
  ephemeralPublicKey: string;
}> => {
  const myIKPriv = base64ToBytes(myIdentityPrivateKey);
  const recipientIKPub = base64ToBytes(recipientIdentityPublicKey);
  const recipientSPKPub = base64ToBytes(recipientSignedPreKey);

  // Generate ephemeral keypair EK
  const ekPriv = x25519.utils.randomSecretKey();
  const ekPub = x25519.getPublicKey(ekPriv);

  const dh1 = x25519.getSharedSecret(myIKPriv, recipientSPKPub);
  const dh2 = x25519.getSharedSecret(ekPriv, recipientIKPub);
  const dh3 = x25519.getSharedSecret(ekPriv, recipientSPKPub);

  let combinedDH: Uint8Array;
  if (recipientOneTimePreKey) {
    const recipientOPKPub = base64ToBytes(recipientOneTimePreKey);
    const dh4 = x25519.getSharedSecret(ekPriv, recipientOPKPub);
    combinedDH = new Uint8Array(dh1.length + dh2.length + dh3.length + dh4.length);
    combinedDH.set(dh1, 0);
    combinedDH.set(dh2, dh1.length);
    combinedDH.set(dh3, dh1.length + dh2.length);
    combinedDH.set(dh4, dh1.length + dh2.length + dh3.length);
  } else {
    combinedDH = new Uint8Array(dh1.length + dh2.length + dh3.length);
    combinedDH.set(dh1, 0);
    combinedDH.set(dh2, dh1.length);
    combinedDH.set(dh3, dh1.length + dh2.length);
  }

  const salt = new Uint8Array(32); // All zeros salt as per standard Signal X3DH
  const info = utf8ToBytes('CallsChat-X3DH-Master-Session');
  const sessionKey = hkdf(sha256, combinedDH, salt, info, 32);

  return {
    sessionKey,
    ephemeralPublicKey: bytesToBase64(ekPub),
  };
};

/**
 * X3DH Receiver:
 * Recipient mirrors calculations:
 * DH1 = X25519(SPK_recipient, IK_sender)
 * DH2 = X25519(IK_recipient, EK_sender)
 * DH3 = X25519(SPK_recipient, EK_sender)
 * DH4 = X25519(OPK_recipient, EK_sender) [if OPK was used]
 */
export const performX3DHReceiver = async (
  myIdentityPrivateKey: string,
  mySignedPreKeyPrivate: string,
  myOneTimePreKeyPrivate: string | null,
  senderIdentityPublicKey: string,
  senderEphemeralPublicKey: string,
): Promise<Uint8Array> => {
  const myIKPriv = base64ToBytes(myIdentityPrivateKey);
  const mySPKPriv = base64ToBytes(mySignedPreKeyPrivate);
  const senderIKPub = base64ToBytes(senderIdentityPublicKey);
  const senderEKPub = base64ToBytes(senderEphemeralPublicKey);

  const dh1 = x25519.getSharedSecret(mySPKPriv, senderIKPub);
  const dh2 = x25519.getSharedSecret(myIKPriv, senderEKPub);
  const dh3 = x25519.getSharedSecret(mySPKPriv, senderEKPub);

  let combinedDH: Uint8Array;
  if (myOneTimePreKeyPrivate) {
    const myOPKPriv = base64ToBytes(myOneTimePreKeyPrivate);
    const dh4 = x25519.getSharedSecret(myOPKPriv, senderEKPub);
    combinedDH = new Uint8Array(dh1.length + dh2.length + dh3.length + dh4.length);
    combinedDH.set(dh1, 0);
    combinedDH.set(dh2, dh1.length);
    combinedDH.set(dh3, dh1.length + dh2.length);
    combinedDH.set(dh4, dh1.length + dh2.length + dh3.length);
  } else {
    combinedDH = new Uint8Array(dh1.length + dh2.length + dh3.length);
    combinedDH.set(dh1, 0);
    combinedDH.set(dh2, dh1.length);
    combinedDH.set(dh3, dh1.length + dh2.length);
  }

  const salt = new Uint8Array(32);
  const info = utf8ToBytes('CallsChat-X3DH-Master-Session');
  return hkdf(sha256, combinedDH, salt, info, 32);
};

export const encryptWithSessionKey = async (
  plaintext: string,
  sessionKey: Uint8Array,
): Promise<{ ciphertext: string; nonce: string }> => {
  const nonceBytes = randomBytes(24);
  const cipher = xchacha20poly1305(sessionKey, nonceBytes);
  const plaintextBytes = utf8ToBytes(plaintext);
  const encryptedPayload = cipher.encrypt(plaintextBytes);

  return {
    ciphertext: bytesToBase64(encryptedPayload),
    nonce: bytesToBase64(nonceBytes),
  };
};

export const decryptWithSessionKey = async (
  ciphertext: string,
  nonce: string,
  sessionKey: Uint8Array,
): Promise<string> => {
  const cipherBytes = base64ToBytes(ciphertext);
  const nonceBytes = base64ToBytes(nonce);
  const cipher = xchacha20poly1305(sessionKey, nonceBytes);
  const decryptedBytes = cipher.decrypt(cipherBytes);
  return bytesToUtf8(decryptedBytes);
};

// =============================================================================
// Zero-Knowledge Encrypted Keystore Vault (Backup & Restore)
// =============================================================================

export const deriveKeyFromPin = (pin: string, salt: Uint8Array, iterations = 100000): Uint8Array => {
  const pinBytes = utf8ToBytes(pin);
  return pbkdf2(sha256, pinBytes, salt, { c: iterations, dkLen: 32 });
};

export const encryptKeyVault = (
  keyBundle: Record<string, any>,
  pin: string,
  iterations = 100000,
): { encryptedVault: string; nonce: string; salt: string; kdfIterations: number } => {
  const salt = randomBytes(16);
  const nonce = randomBytes(24);
  const key = deriveKeyFromPin(pin, salt, iterations);
  const cipher = xchacha20poly1305(key, nonce);
  const jsonStr = JSON.stringify(keyBundle);
  const plaintextBytes = utf8ToBytes(jsonStr);
  const encryptedBytes = cipher.encrypt(plaintextBytes);

  return {
    encryptedVault: bytesToBase64(encryptedBytes),
    nonce: bytesToBase64(nonce),
    salt: bytesToBase64(salt),
    kdfIterations: iterations,
  };
};

export const decryptKeyVault = (
  encryptedVault: string,
  nonce: string,
  salt: string,
  pin: string,
  iterations = 100000,
): Record<string, any> => {
  const saltBytes = base64ToBytes(salt);
  const nonceBytes = base64ToBytes(nonce);
  const cipherBytes = base64ToBytes(encryptedVault);

  const key = deriveKeyFromPin(pin, saltBytes, iterations);
  const cipher = xchacha20poly1305(key, nonceBytes);
  const decryptedBytes = cipher.decrypt(cipherBytes);
  const jsonStr = bytesToUtf8(decryptedBytes);
  return JSON.parse(jsonStr);
};

// =============================================================================
// Multi-Device Message Fan-Out Protocol (WhatsApp / Signal Parity)
// =============================================================================

export interface DeviceKeyInfo {
  deviceId: string;
  publicKey: string;
  registrationId?: string | null;
}

export interface MultiDeviceEnvelope {
  encryptedKey: string; // Base64 wrapped 32-byte message key
  keyNonce: string;     // Base64 24-byte nonce
  recipientRegistrationId?: string | null;
}

export interface MultiDeviceEncryptedPayload {
  ciphertext: string;
  nonce: string;
  devices: Record<string, MultiDeviceEnvelope>;
}

export const encryptMultiDeviceMessage = async (
  plaintext: string,
  targetDevices: DeviceKeyInfo[],
  mySenderDevices: DeviceKeyInfo[],
  myPrivateKey: string,
): Promise<MultiDeviceEncryptedPayload> => {
  // 1. Generate a single random 32-byte symmetric message key (O(1) payload size)
  const kMsg = randomBytes(32);
  const msgNonceBytes = randomBytes(24);
  const msgCipher = xchacha20poly1305(kMsg, msgNonceBytes);
  const plaintextBytes = utf8ToBytes(plaintext);
  const ciphertextBytes = msgCipher.encrypt(plaintextBytes);

  const myPrivBytes = base64ToBytes(myPrivateKey);

  // Combine recipient devices + sender's other devices (deduplicating by deviceId)
  const allDevicesMap = new Map<string, DeviceKeyInfo>();
  for (const dev of targetDevices) {
    if (dev.deviceId && dev.publicKey) {
      allDevicesMap.set(dev.deviceId, dev);
    }
  }
  for (const dev of mySenderDevices) {
    if (dev.deviceId && dev.publicKey) {
      allDevicesMap.set(dev.deviceId, dev);
    }
  }

  const devices: Record<string, MultiDeviceEnvelope> = {};

  for (const [deviceId, dev] of allDevicesMap.entries()) {
    try {
      const devPubBytes = base64ToBytes(dev.publicKey);
      const sharedSecret = x25519.getSharedSecret(myPrivBytes, devPubBytes);
      const wrapNonceBytes = randomBytes(24);
      const wrapCipher = xchacha20poly1305(sharedSecret, wrapNonceBytes);
      const encryptedKMsg = wrapCipher.encrypt(kMsg);

      devices[deviceId] = {
        encryptedKey: bytesToBase64(encryptedKMsg),
        keyNonce: bytesToBase64(wrapNonceBytes),
        recipientRegistrationId: dev.registrationId ?? null,
      };
    } catch (wrapErr) {
      console.warn(`[crypto] Failed to wrap message key for device ${deviceId}:`, wrapErr);
    }
  }

  return {
    ciphertext: bytesToBase64(ciphertextBytes),
    nonce: bytesToBase64(msgNonceBytes),
    devices,
  };
};

export const decryptMultiDeviceMessage = async (
  ciphertext: string,
  nonce: string,
  devices: Record<string, MultiDeviceEnvelope>,
  senderPublicKey: string,
  myPrivateKey: string,
  myDeviceId?: string | null,
): Promise<string> => {
  const myPrivBytes = base64ToBytes(myPrivateKey);
  const senderPubBytes = base64ToBytes(senderPublicKey);
  const sharedSecret = x25519.getSharedSecret(myPrivBytes, senderPubBytes);

  let unwrappedKMsg: Uint8Array | null = null;

  // 1. Fast path: check if myDeviceId exists directly in devices
  if (myDeviceId && devices[myDeviceId]) {
    try {
      const env = devices[myDeviceId];
      const wrapNonce = base64ToBytes(env.keyNonce);
      const wrapCipher = xchacha20poly1305(sharedSecret, wrapNonce);
      unwrappedKMsg = wrapCipher.decrypt(base64ToBytes(env.encryptedKey));
    } catch {
      unwrappedKMsg = null;
    }
  }

  // 2. Resilient fallback: if fast path missed or deviceId differed, try each device entry
  if (!unwrappedKMsg) {
    for (const [devId, env] of Object.entries(devices)) {
      if (devId === myDeviceId) continue;
      try {
        const wrapNonce = base64ToBytes(env.keyNonce);
        const wrapCipher = xchacha20poly1305(sharedSecret, wrapNonce);
        unwrappedKMsg = wrapCipher.decrypt(base64ToBytes(env.encryptedKey));
        if (unwrappedKMsg) break;
      } catch {
        // Not for this device keypair
      }
    }
  }

  if (!unwrappedKMsg) {
    throw new Error('Could not unwrap message key for this device in multi-device envelope');
  }

  // 3. Decrypt the actual message body with unwrapped message key
  const msgCipherBytes = base64ToBytes(ciphertext);
  const msgNonceBytes = base64ToBytes(nonce);
  const msgCipher = xchacha20poly1305(unwrappedKMsg, msgNonceBytes);
  const decryptedBytes = msgCipher.decrypt(msgCipherBytes);
  return bytesToUtf8(decryptedBytes);
};

// =============================================================================
// Step 4.3: Cryptographic Identity Verification & Safety Numbers
// WhatsApp / Signal-grade deterministic 60-digit fingerprint
// =============================================================================

export interface SafetyNumberResult {
  raw: string; // 60-digit continuous string
  formatted: string; // 12 blocks of 5 digits separated by spaces
  blocks: string[]; // Array of 12 strings, each 5 digits
  qrData: string; // Standard verification payload
}

/**
 * Computes a deterministic 60-digit Safety Number from two users' public keys.
 * Sorts keys lexicographically so both parties compute the exact same fingerprint.
 *
 * @param userKeyA Public key of first user (Base64)
 * @param userKeyB Public key of second user (Base64)
 */
export const computeSafetyNumber = (
  userKeyA: string,
  userKeyB: string
): SafetyNumberResult => {
  if (!userKeyA || !userKeyB) {
    throw new Error('Both public keys are required to compute a safety number');
  }

  // 1. Sort public keys lexicographically to ensure commutativity:
  // computeSafetyNumber(A, B) === computeSafetyNumber(B, A)
  const sorted = [userKeyA, userKeyB].sort();
  const b1 = base64ToBytes(sorted[0]!);
  const b2 = base64ToBytes(sorted[1]!);

  const combined = new Uint8Array(b1.length + b2.length);
  combined.set(b1, 0);
  combined.set(b2, b1.length);

  // 2. Hash concatenated keys with SHA-512 (64 bytes output)
  const digest = sha512(combined);

  // 3. Extract twelve 5-digit blocks from 48 bytes (4 bytes per block)
  const blocks: string[] = [];
  for (let i = 0; i < 12; i++) {
    const val =
      ((digest[i * 4] ?? 0) << 24) |
      ((digest[i * 4 + 1] ?? 0) << 16) |
      ((digest[i * 4 + 2] ?? 0) << 8) |
      (digest[i * 4 + 3] ?? 0);
    const unsignedVal = val >>> 0;
    blocks.push(String(unsignedVal % 100000).padStart(5, '0'));
  }

  const raw = blocks.join('');
  const formatted = blocks.join(' ');
  const qrData = `callschat:verify?v=1&k1=${encodeURIComponent(sorted[0]!)}&k2=${encodeURIComponent(sorted[1]!)}&sn=${raw}`;

  return { raw, formatted, blocks, qrData };
};

// ---------------------------------------------------------------------------
// Step 4.5: Signal-Grade Group Sender Key Protocol Primitives
// ---------------------------------------------------------------------------

export interface SenderKeyRecord {
  senderId: string;
  groupId: string;
  chainKey: string; // Base64 32-byte ratcheting key
  iteration: number;
  senderKeyId: string;
  updatedAt: string;
}

const SENDER_KEY_MESSAGE_INFO = utf8ToBytes('group_msg_key');
const SENDER_KEY_RATCHET_STEP_INFO = utf8ToBytes('group_ratchet_step');

/**
 * Generates a fresh Sender Key for group messaging.
 * Returns an initial 32-byte chain key and unique sender key ID.
 */
export const generateSenderKey = (groupId: string, senderId: string): SenderKeyRecord => {
  const chainKeyBytes = randomBytes(32);
  const senderKeyId = `sk_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  return {
    groupId,
    senderId,
    chainKey: bytesToBase64(chainKeyBytes),
    iteration: 0,
    senderKeyId,
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Derives a single message key (MK) from the current chain key (CK)
 * and advances the chain key to the next ratchet step using HMAC-SHA256.
 *
 * MK = HMAC-SHA256(CK, "group_msg_key")
 * CK_next = HMAC-SHA256(CK, "group_ratchet_step")
 */
export const ratchetSenderKey = (
  chainKeyBase64: string
): { messageKey: Uint8Array; nextChainKey: string } => {
  const chainKeyBytes = base64ToBytes(chainKeyBase64);
  const messageKey = hmac(sha256, chainKeyBytes, SENDER_KEY_MESSAGE_INFO);
  const nextChainKeyBytes = hmac(sha256, chainKeyBytes, SENDER_KEY_RATCHET_STEP_INFO);

  return {
    messageKey,
    nextChainKey: bytesToBase64(nextChainKeyBytes),
  };
};

/**
 * Encrypts a group message using the sender's current chain key.
 * Ratchets the chain key forward once and returns the ciphertext, nonce,
 * message iteration, and the new advanced chain key to persist.
 */
export const encryptWithSenderKey = async (
  plaintext: string,
  chainKeyBase64: string,
  iteration: number
): Promise<{
  ciphertext: string;
  nonce: string;
  iteration: number;
  nextChainKey: string;
}> => {
  const { messageKey, nextChainKey } = ratchetSenderKey(chainKeyBase64);
  const nonceBytes = randomBytes(24);
  const cipher = xchacha20poly1305(messageKey, nonceBytes);
  const ciphertextBytes = cipher.encrypt(utf8ToBytes(plaintext));

  return {
    ciphertext: bytesToBase64(ciphertextBytes),
    nonce: bytesToBase64(nonceBytes),
    iteration,
    nextChainKey,
  };
};

/**
 * Decrypts a group message using the sender's chain key.
 * If targetIteration > currentIteration, ratchets the chain key forward
 * to catch up with the sender (up to a safe max limit of 2000 steps).
 */
export const decryptWithSenderKey = async (
  ciphertextBase64: string,
  nonceBase64: string,
  chainKeyBase64: string,
  targetIteration: number,
  currentIteration: number
): Promise<{
  text: string;
  updatedChainKey: string;
  updatedIteration: number;
}> => {
  if (targetIteration < currentIteration) {
    throw new Error(
      `Received out-of-order expired message iteration ${targetIteration} < current ${currentIteration}`
    );
  }

  const MAX_FORWARD_STEPS = 2000;
  if (targetIteration - currentIteration > MAX_FORWARD_STEPS) {
    throw new Error(
      `Ratchet gap too large (${targetIteration - currentIteration} > ${MAX_FORWARD_STEPS})`
    );
  }

  let curCK = chainKeyBase64;
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
    text: bytesToUtf8(decryptedBytes),
    updatedChainKey: curCK,
    updatedIteration: curIter,
  };
};

/**
 * Wraps a Sender Key chain key for a specific group member using pairwise Diffie-Hellman + XChaCha20-Poly1305.
 */
export const wrapSenderKeyForMember = (
  chainKeyBase64: string,
  memberPublicKeyBase64: string,
  myPrivateKeyBase64: string
): { encryptedKey: string; nonce: string } => {
  const memberPub = base64ToBytes(memberPublicKeyBase64);
  const myPriv = base64ToBytes(myPrivateKeyBase64);
  const sharedSecret = x25519.getSharedSecret(myPriv, memberPub);
  const wrappingKey = sha256(sharedSecret);

  const nonce = randomBytes(24);
  const cipher = xchacha20poly1305(wrappingKey, nonce);
  const encrypted = cipher.encrypt(utf8ToBytes(chainKeyBase64));

  return {
    encryptedKey: bytesToBase64(encrypted),
    nonce: bytesToBase64(nonce),
  };
};

/**
 * Unwraps a received Sender Key chain key from a group member using pairwise Diffie-Hellman + XChaCha20-Poly1305.
 */
export const unwrapSenderKeyFromMember = (
  encryptedKeyBase64: string,
  nonceBase64: string,
  senderPublicKeyBase64: string,
  myPrivateKeyBase64: string
): string => {
  const senderPub = base64ToBytes(senderPublicKeyBase64);
  const myPriv = base64ToBytes(myPrivateKeyBase64);
  const sharedSecret = x25519.getSharedSecret(myPriv, senderPub);
  const wrappingKey = sha256(sharedSecret);

  const nonce = base64ToBytes(nonceBase64);
  const encryptedBytes = base64ToBytes(encryptedKeyBase64);
  const cipher = xchacha20poly1305(wrappingKey, nonce);
  const decryptedBytes = cipher.decrypt(encryptedBytes);

  return bytesToUtf8(decryptedBytes);
};
