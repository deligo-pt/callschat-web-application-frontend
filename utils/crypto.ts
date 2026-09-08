import { x25519 } from '@noble/curves/ed25519.js';
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { randomBytes } from '@noble/hashes/utils.js';
import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { hkdf } from '@noble/hashes/hkdf.js';
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

