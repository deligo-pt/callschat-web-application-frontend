import { x25519 } from '@noble/curves/ed25519.js';
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { randomBytes } from '@noble/hashes/utils.js';
import { storeUserKeys } from './keyStore';

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
