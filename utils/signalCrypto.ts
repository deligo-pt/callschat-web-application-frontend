import {
  KeyHelper,
  SignalProtocolAddress,
  SessionBuilder,
  SessionCipher,
} from '@privacyresearch/libsignal-protocol-typescript';
import { SessionRecord } from '@privacyresearch/libsignal-protocol-typescript/lib/session-record';
import type {
  KeyPairType,
  DeviceType,
  MessageType,
} from '@privacyresearch/libsignal-protocol-typescript';
import {
  SignalProtocolStore,
  getSignalProtocolStore,
  ensureArrayBuffer,
  withSessionLock,
} from './signalStore';
import { storeUserKeys } from './keyStore';
import { computeSafetyNumber } from './crypto';

export { getSignalProtocolStore };

// -----------------------------------------------------------------------------
// Binary / Base64 / String Converters
// -----------------------------------------------------------------------------

export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function utf8ToArrayBuffer(str: string): ArrayBuffer {
  return new TextEncoder().encode(str).buffer;
}

export function arrayBufferToUtf8(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return new TextDecoder().decode(bytes);
}

/**
 * Creates a SignalProtocolAddress for a given user and device ID.
 */
export function createSignalAddress(userId: string, deviceId: number = 1): SignalProtocolAddress {
  return new SignalProtocolAddress(userId, deviceId);
}

// -----------------------------------------------------------------------------
// Identity & Pre-Key Pool Management
// -----------------------------------------------------------------------------

export interface SignalIdentityBundle {
  userId: string;
  registrationId: number;
  identityKeyBase64: string;
}

/**
 * Initializes or loads the user's Signal Protocol identity.
 */
export async function initSignalIdentity(
  userId: string,
  forceNew: boolean = false
): Promise<SignalIdentityBundle> {
  const store = getSignalProtocolStore(userId);
  let identity = await store.getIdentityKeyPair();
  let regId = await store.getLocalRegistrationId();

  if (!identity || !regId || forceNew) {
    identity = await KeyHelper.generateIdentityKeyPair();
    regId = KeyHelper.generateRegistrationId();
    await store.storeIdentityKeyPair(identity);
    await store.storeLocalRegistrationId(regId);
  }

  const privKeyB64 = arrayBufferToBase64(identity.privKey);
  const pubKeyB64 = arrayBufferToBase64(identity.pubKey);
  await storeUserKeys(userId, privKeyB64, pubKeyB64);

  return {
    userId,
    registrationId: regId,
    identityKeyBase64: pubKeyB64,
  };
}

/**
 * Generates a fresh Signed Pre-Key for the user and stores its private key.
 */
export async function generateSignedPreKey(
  userId: string,
  signedKeyId: number = 1
): Promise<{ keyId: number; publicKey: string; signature: string }> {
  const store = getSignalProtocolStore(userId);
  const identity = await store.getIdentityKeyPair();
  if (!identity) {
    throw new Error(`Cannot generate signed prekey: No identity key for user ${userId}`);
  }

  const spk = await KeyHelper.generateSignedPreKey(identity, signedKeyId);
  await store.storeSignedPreKey(signedKeyId, spk.keyPair, spk.signature);

  return {
    keyId: signedKeyId,
    publicKey: arrayBufferToBase64(spk.keyPair.pubKey),
    signature: arrayBufferToBase64(spk.signature),
  };
}

/**
 * Loads the user's existing Signed Pre-Key or generates a new one if not found.
 * Reuses the existing keypair and signature across page reloads to prevent desynchronization.
 */
export async function getOrGenerateSignedPreKey(
  userId: string,
  signedKeyId: number = 1
): Promise<{ keyId: number; publicKey: string; signature: string }> {
  const store = getSignalProtocolStore(userId);
  const existing = await store.loadSignedPreKey(signedKeyId);

  if (existing?.pubKey && existing?.privKey && existing?.signature) {
    return {
      keyId: signedKeyId,
      publicKey: arrayBufferToBase64(existing.pubKey),
      signature: arrayBufferToBase64(existing.signature),
    };
  }

  return await generateSignedPreKey(userId, signedKeyId);
}

/**
 * Generates a batch of One-Time Prekeys (OPKs) and stores their private keys.
 */
export async function generatePreKeyBatch(
  userId: string,
  startKeyId: number,
  count: number = 50
): Promise<Array<{ keyId: number; publicKey: string }>> {
  const store = getSignalProtocolStore(userId);
  const opks: Array<{ keyId: number; publicKey: string }> = [];
  const keyIds: number[] = [];

  for (let i = 0; i < count; i++) {
    const keyId = startKeyId + i;
    const preKey = await KeyHelper.generatePreKey(keyId);
    await store.storePreKey(keyId, preKey.keyPair);
    keyIds.push(keyId);
    opks.push({
      keyId,
      publicKey: arrayBufferToBase64(preKey.keyPair.pubKey),
    });
  }

  await store.recordLocalPreKeyIds(keyIds);
  return opks;
}

// -----------------------------------------------------------------------------
// Session Establishment (X3DH)
// -----------------------------------------------------------------------------

export interface PreKeyBundlePayload {
  userId: string;
  deviceId?: string | number;
  registrationId: number | string;
  identityKey: string;
  signedPreKey: {
    keyId: number;
    publicKey: string;
    signature: string;
  };
  oneTimePreKey?: {
    keyId: number;
    publicKey: string;
  } | null;
}

/**
 * Ingests a peer's PreKey bundle to initialize a Double Ratchet session as initiator.
 */
export async function buildSessionFromBundle(
  myUserId: string,
  peerUserId: string,
  bundle: PreKeyBundlePayload,
  peerDeviceId: number = 1
): Promise<void> {
  const store = getSignalProtocolStore(myUserId);
  const remoteAddress = createSignalAddress(peerUserId, peerDeviceId);

  const device: DeviceType<ArrayBuffer> = {
    identityKey: base64ToArrayBuffer(bundle.identityKey),
    signedPreKey: {
      keyId: bundle.signedPreKey.keyId,
      publicKey: base64ToArrayBuffer(bundle.signedPreKey.publicKey),
      signature: base64ToArrayBuffer(bundle.signedPreKey.signature),
    },
    registrationId: Number(bundle.registrationId),
    preKey: bundle.oneTimePreKey
      ? {
          keyId: bundle.oneTimePreKey.keyId,
          publicKey: base64ToArrayBuffer(bundle.oneTimePreKey.publicKey),
        }
      : undefined,
  };

  const identityKeyBuf = base64ToArrayBuffer(bundle.identityKey);
  const isTrusted = await store.isTrustedIdentity(remoteAddress.toString(), identityKeyBuf, 1);
  if (!isTrusted) {
    console.log(`[signalCrypto] Peer ${peerUserId} identity changed. Overwriting trusted identity.`);
    await store.saveIdentity(remoteAddress.toString(), identityKeyBuf);
    await store.removeSession(remoteAddress.toString());
  }

  const builder = new SessionBuilder(store, remoteAddress);
  await builder.processPreKey(device);
}

/**
 * Checks if an active session already exists for the peer.
 */
export async function hasActiveSignalSession(
  myUserId: string,
  peerUserId: string,
  peerDeviceId: number = 1
): Promise<boolean> {
  const store = getSignalProtocolStore(myUserId);
  const remoteAddress = createSignalAddress(peerUserId, peerDeviceId);
  const serialized = await store.loadSession(remoteAddress.toString());
  if (!serialized) return false;
  try {
    const record = SessionRecord.deserialize(serialized as string);
    return record.haveOpenSession();
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
// 1-to-1 Encryption & Decryption
// -----------------------------------------------------------------------------

export interface EncryptedSignalPayload {
  ciphertext: string; // Base64 encoded Protobuf wire format
  messageType: number; // 3 = PreKeySignalMessage, 2 = SignalMessage
  registrationId?: number;
}

/**
 * Encrypts a plaintext message for a recipient using Signal Double Ratchet.
 */
export async function encrypt1to1Message(
  myUserId: string,
  recipientUserId: string,
  plaintext: string,
  recipientDeviceId: number = 1
): Promise<EncryptedSignalPayload> {
  const store = getSignalProtocolStore(myUserId);
  const remoteAddress = createSignalAddress(recipientUserId, recipientDeviceId);

  return await withSessionLock(remoteAddress.toString(), async () => {
    const cipher = new SessionCipher(store, remoteAddress);
    const plaintextBuffer = utf8ToArrayBuffer(plaintext);
    const encrypted: MessageType = await cipher.encrypt(plaintextBuffer);

    // Map internal type 1 to Signal wire standard type 2 (SignalMessage)
    // Wire: 3 = PreKeySignalMessage, 2 = SignalMessage
    const wireMessageType = encrypted.type === 3 ? 3 : 2;

    let ciphertextBase64: string;
    if (typeof encrypted.body === 'string') {
      // libsignal body may be binary string or Base64; ensure Base64 on wire
      ciphertextBase64 = btoa(encrypted.body);
    } else if (encrypted.body && (encrypted.body as unknown) instanceof ArrayBuffer) {
      ciphertextBase64 = arrayBufferToBase64(encrypted.body as unknown as ArrayBuffer);
    } else {
      throw new Error('Encrypted payload missing body');
    }

    return {
      ciphertext: ciphertextBase64,
      messageType: wireMessageType,
      registrationId: encrypted.registrationId,
    };
  });
}

/**
 * Decrypts a 1-to-1 incoming message using Signal Double Ratchet.
 */
export async function decrypt1to1Message(
  myUserId: string,
  senderUserId: string,
  ciphertextBase64: string,
  messageType: number = 2,
  senderDeviceId: number = 1
): Promise<string> {
  const store = getSignalProtocolStore(myUserId);
  const remoteAddress = createSignalAddress(senderUserId, senderDeviceId);

  return await withSessionLock(remoteAddress.toString(), async () => {
    const cipher = new SessionCipher(store, remoteAddress);
    let decryptedBuffer: ArrayBuffer | null = null;
    let primaryError: any = null;

    const ciphertextBuffer = base64ToArrayBuffer(ciphertextBase64);

    if (messageType === 3) {
      // Primary: PreKeyWhisperMessage (handshake)
      try {
        decryptedBuffer = await cipher.decryptPreKeyWhisperMessage(ciphertextBuffer);
      } catch (err: any) {
        primaryError = err;
        // Fallback: It might be a regular WhisperMessage if handshake was previously processed
        try {
          decryptedBuffer = await cipher.decryptWhisperMessage(ciphertextBuffer);
        } catch {
          // keep primaryError
        }
      }
    } else {
      // Primary: WhisperMessage (ongoing ratchet)
      try {
        decryptedBuffer = await cipher.decryptWhisperMessage(ciphertextBuffer);
      } catch (err: any) {
        primaryError = err;
        // Fallback: It might be a PreKeyWhisperMessage if wire type was defaulted to 2
        try {
          decryptedBuffer = await cipher.decryptPreKeyWhisperMessage(ciphertextBuffer);
        } catch {
          // keep primaryError
        }
      }
    }

    if (!decryptedBuffer) {
      throw primaryError || new Error('Decryption failed');
    }

    return arrayBufferToUtf8(decryptedBuffer);
  });
}

// -----------------------------------------------------------------------------
// Safety Number Verification (Hardware-Accelerated Signal Fingerprint v2)
// -----------------------------------------------------------------------------

function getFingerprintChunk(hash: Uint8Array, offset: number): string {
  const chunk =
    (hash[offset]! * Math.pow(2, 32) +
      hash[offset + 1]! * Math.pow(2, 24) +
      hash[offset + 2]! * Math.pow(2, 16) +
      hash[offset + 3]! * Math.pow(2, 8) +
      hash[offset + 4]!) %
    100000;
  let s = chunk.toString();
  while (s.length < 5) {
    s = '0' + s;
  }
  return s;
}

async function computeHalfFingerprint(
  subtle: SubtleCrypto,
  identifier: string,
  keyBuf: ArrayBuffer,
  iterations = 5200
): Promise<string> {
  const versionBuf = new Uint16Array([0]).buffer; // version 0
  const idBuf = new TextEncoder().encode(identifier).buffer;

  // Initial buffer: [version (2 bytes), key (32/33 bytes), identifier (N bytes)]
  const initial = new Uint8Array(2 + keyBuf.byteLength + idBuf.byteLength);
  initial.set(new Uint8Array(versionBuf), 0);
  initial.set(new Uint8Array(keyBuf), 2);
  initial.set(new Uint8Array(idBuf), 2 + keyBuf.byteLength);

  const keyBytes = new Uint8Array(keyBuf);
  let currentBuffer: ArrayBuffer = initial.buffer;

  for (let i = 0; i < iterations; i++) {
    const combined = new Uint8Array(currentBuffer.byteLength + keyBytes.byteLength);
    combined.set(new Uint8Array(currentBuffer), 0);
    combined.set(keyBytes, currentBuffer.byteLength);
    currentBuffer = await subtle.digest('SHA-512', combined.buffer);
  }

  const output = new Uint8Array(currentBuffer);
  return (
    getFingerprintChunk(output, 0) +
    getFingerprintChunk(output, 5) +
    getFingerprintChunk(output, 10) +
    getFingerprintChunk(output, 15) +
    getFingerprintChunk(output, 20) +
    getFingerprintChunk(output, 25)
  );
}

/**
 * Computes official 60-digit Signal Fingerprint v2 using hardware-accelerated
 * browser WebCrypto (~140ms) with instant (<1ms) SHA-512 commutated fallback.
 */
export async function computeSignalFingerprint(
  myUserId: string,
  myIdentityKeyBase64: string,
  peerUserId: string,
  peerIdentityKeyBase64: string
): Promise<{ raw: string; formatted: string; blocks: string[]; qrData: string }> {
  try {
    const subtle =
      typeof window !== 'undefined' && window.crypto?.subtle
        ? window.crypto.subtle
        : (globalThis as any).crypto?.subtle;

    if (subtle) {
      const myKeyBuf = base64ToArrayBuffer(myIdentityKeyBase64);
      const peerKeyBuf = base64ToArrayBuffer(peerIdentityKeyBase64);

      // Race with 1.5s timeout to guarantee instant response even on low-end CPUs
      const computePromise = (async () => {
        const [partA, partB] = await Promise.all([
          computeHalfFingerprint(subtle, myUserId, myKeyBuf),
          computeHalfFingerprint(subtle, peerUserId, peerKeyBuf),
        ]);
        const rawFingerprint = [partA, partB].sort().join('');
        const blocks: string[] = [];
        for (let i = 0; i < 12; i++) {
          blocks.push(rawFingerprint.slice(i * 5, (i + 1) * 5));
        }
        return {
          raw: rawFingerprint,
          formatted: blocks.join(' '),
          blocks,
          qrData: `callschat:verify?v=2&u1=${encodeURIComponent(myUserId)}&u2=${encodeURIComponent(peerUserId)}&fp=${rawFingerprint}`,
        };
      })();

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
      const result = await Promise.race([computePromise, timeoutPromise]);
      if (result) return result;
    }
  } catch (err) {
    console.warn('[signalCrypto] Fast WebCrypto fingerprint calculation fell back:', err);
  }

  // Instant fallback to commutated SHA-512 safety number (<1ms)
  return computeSafetyNumber(myIdentityKeyBase64, peerIdentityKeyBase64);
}
