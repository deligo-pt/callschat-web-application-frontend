import { get, set, del } from 'idb-keyval';

// =============================================================================
// IndexedDB Secure KeyStore
// Handles user private/public keypairs and symmetric group keys in IndexedDB.
// =============================================================================

export const storeUserKeys = async (userId: string, privKey: string, pubKey: string): Promise<void> => {
  if (typeof window === 'undefined') return;
  await set(`privateKey_${userId}`, privKey);
  await set(`publicKey_${userId}`, pubKey);
};

export const getUserPrivateKey = async (userId: string): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  return (await get(`privateKey_${userId}`)) || null;
};

export const getUserPublicKey = async (userId: string): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  return (await get(`publicKey_${userId}`)) || null;
};

export const clearUserKeys = async (userId: string): Promise<void> => {
  if (typeof window === 'undefined') return;
  await del(`privateKey_${userId}`);
  await del(`publicKey_${userId}`);
};

// -----------------------------------------------------------------------------
// Group Symmetric Keys (IndexedDB)
// -----------------------------------------------------------------------------

export const storeGroupKey = async (groupId: string, userId: string, groupKey: string): Promise<void> => {
  if (typeof window === 'undefined') return;
  await set(`groupKey_${groupId}_${userId}`, groupKey);
};

export const getStoredGroupKey = async (groupId: string, userId: string): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  return (await get(`groupKey_${groupId}_${userId}`)) || null;
};

export const clearGroupKey = async (groupId: string, userId: string): Promise<void> => {
  if (typeof window === 'undefined') return;
  await del(`groupKey_${groupId}_${userId}`);
};

export const migrateKeysFromLocalStorage = async (userId: string): Promise<void> => {
  if (typeof window === 'undefined') return;

  // Try user-specific keys first
  let priv = localStorage.getItem(`privateKey_${userId}`);
  let pub = localStorage.getItem(`publicKey_${userId}`);

  // Fallback to legacy generic keys
  if (!priv) {
    priv = localStorage.getItem("privateKey");
    pub = localStorage.getItem("publicKey");
  }

  if (priv && pub) {
    // Save to secure IndexedDB
    await storeUserKeys(userId, priv, pub);

    // Clean up legacy localStorage
    localStorage.removeItem(`privateKey_${userId}`);
    localStorage.removeItem(`publicKey_${userId}`);
    localStorage.removeItem("privateKey");
    localStorage.removeItem("publicKey");
  }
};

// -----------------------------------------------------------------------------
// X3DH Pre-Keys (IndexedDB)
// -----------------------------------------------------------------------------

export const storePreKeyPrivate = async (
  userId: string,
  keyId: number,
  privateKey: string
): Promise<void> => {
  if (typeof window === 'undefined') return;
  await set(`preKey_priv_${userId}_${keyId}`, privateKey);
};

export const getPreKeyPrivate = async (
  userId: string,
  keyId: number
): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  return (await get(`preKey_priv_${userId}_${keyId}`)) || null;
};

export const storeSignedPreKeyPrivate = async (
  userId: string,
  keyId: number,
  privateKey: string
): Promise<void> => {
  if (typeof window === 'undefined') return;
  await set(`signedPreKey_priv_${userId}_${keyId}`, privateKey);
};

export const getSignedPreKeyPrivate = async (
  userId: string,
  keyId: number
): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  return (await get(`signedPreKey_priv_${userId}_${keyId}`)) || null;
};

// -----------------------------------------------------------------------------
// Durable Local Message Plaintext Cache (IndexedDB)
// Ensures sent and decrypted messages survive page refreshes, tab restarts, and dev server restarts
// -----------------------------------------------------------------------------

export const storeDecryptedMessage = async (
  userId: string,
  messageId: string,
  plaintext: string
): Promise<void> => {
  if (typeof window === 'undefined' || !userId || !messageId || !plaintext) return;
  try {
    await set(`msg_text_${userId}_${messageId}`, plaintext);
  } catch (err) {
    console.warn('[keyStore] Failed to cache decrypted message:', err);
  }
};

export const getDecryptedMessage = async (
  userId: string,
  messageId: string
): Promise<string | null> => {
  if (typeof window === 'undefined' || !userId || !messageId) return null;
  try {
    return (await get(`msg_text_${userId}_${messageId}`)) || null;
  } catch (err) {
    return null;
  }
};


