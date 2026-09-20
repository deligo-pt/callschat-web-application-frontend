import { get, set, del, entries } from 'idb-keyval';
import { getSignalProtocolStore } from './signalStore';
import { arrayBufferToBase64, base64ToArrayBuffer } from './signalCrypto';

// In-memory fallback for SSR and test environments
const memStore = new Map<string, any>();

async function safeGet<T>(key: string): Promise<T | null> {
  if (typeof window === 'undefined') {
    return memStore.get(key) ?? null;
  }
  try {
    const val = await get<T>(key);
    return val ?? memStore.get(key) ?? null;
  } catch {
    return memStore.get(key) ?? null;
  }
}

async function safeSet<T>(key: string, value: T): Promise<void> {
  memStore.set(key, value);
  if (typeof window !== 'undefined') {
    try {
      await set(key, value);
    } catch (err) {
      console.warn('[keyStore] IndexedDB write failed:', err);
    }
  }
}

async function safeDel(key: string): Promise<void> {
  memStore.delete(key);
  if (typeof window !== 'undefined') {
    try {
      await del(key);
    } catch (err) {
      console.warn('[keyStore] IndexedDB del failed:', err);
    }
  }
}

// =============================================================================
// IndexedDB Secure KeyStore
// Handles user private/public keypairs and symmetric group keys in IndexedDB.
// =============================================================================

export const storeUserKeys = async (userId: string, privKey: string, pubKey: string): Promise<void> => {
  await safeSet(`privateKey_${userId}`, privKey);
  await safeSet(`publicKey_${userId}`, pubKey);
};

export const getUserPrivateKey = async (userId: string): Promise<string | null> => {
  if (userId) {
    try {
      const store = getSignalProtocolStore(userId);
      const idKey = await store.getIdentityKeyPair();
      if (idKey?.privKey) {
        return arrayBufferToBase64(idKey.privKey);
      }
    } catch {}
  }
  return await safeGet<string>(`privateKey_${userId}`);
};

export const getRawStoredUserPrivateKey = async (userId: string): Promise<string | null> => {
  return await safeGet<string>(`privateKey_${userId}`);
};

export const getUserPublicKey = async (userId: string): Promise<string | null> => {
  if (userId) {
    try {
      const store = getSignalProtocolStore(userId);
      const idKey = await store.getIdentityKeyPair();
      if (idKey?.pubKey) {
        return arrayBufferToBase64(idKey.pubKey);
      }
    } catch {}
  }
  return await safeGet<string>(`publicKey_${userId}`);
};

export const clearUserKeys = async (userId: string): Promise<void> => {
  await safeDel(`privateKey_${userId}`);
  await safeDel(`publicKey_${userId}`);
};

// -----------------------------------------------------------------------------
// Group Symmetric Keys (IndexedDB)
// -----------------------------------------------------------------------------

export const storeGroupKey = async (groupId: string, userId: string, groupKey: string): Promise<void> => {
  await safeSet(`groupKey_${groupId}_${userId}`, groupKey);
};

export const getStoredGroupKey = async (groupId: string, userId: string): Promise<string | null> => {
  return await safeGet<string>(`groupKey_${groupId}_${userId}`);
};

export const clearGroupKey = async (groupId: string, userId: string): Promise<void> => {
  await safeDel(`groupKey_${groupId}_${userId}`);
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
  if (!userId || !messageId || !plaintext) return;
  await safeSet(`msg_text_${userId}_${messageId}`, plaintext);
};

export const getDecryptedMessage = async (
  userId: string,
  messageId: string
): Promise<string | null> => {
  if (!userId || !messageId) return null;
  return await safeGet<string>(`msg_text_${userId}_${messageId}`);
};

// -----------------------------------------------------------------------------
// Key Vault Backup Export & Restore Helpers
// -----------------------------------------------------------------------------

export interface LocalKeyBundle {
  privateKey: string;
  publicKey: string;
  registrationId?: string | null;
  deviceId?: string | null;
  signedPreKeyPrivate?: string | null;
  signedPreKey?: {
    keyId: number;
    pubKey: string;
    privKey: string;
    signature?: string;
  } | null;
  sessions?: Record<string, any> | null;
  signalIdentity?: {
    pubKey: string;
    privKey: string;
  } | null;
  senderKeys?: Record<string, any> | null;
  groupKeys?: Record<string, string> | null;
  decryptedMessages?: Record<string, string> | null;
  timestamp?: number;
}

export const exportLocalKeyBundle = async (userId: string): Promise<LocalKeyBundle | null> => {
  if (!userId) return null;

  const privateKey = await getUserPrivateKey(userId);
  const publicKey = await getUserPublicKey(userId);

  if (!privateKey || !publicKey) return null;

  const deviceId = (typeof window !== 'undefined' ? localStorage.getItem('deviceId') : null) || `web-${userId}`;
  const signedPreKeyPrivate = await getSignedPreKeyPrivate(userId, 1);

  let signalIdentity: { pubKey: string; privKey: string } | null = null;
  let signalRegId: number | null = null;
  let signedPreKey: { keyId: number; pubKey: string; privKey: string; signature?: string } | null = null;
  let sessions: Record<string, any> | null = null;
  try {
    const store = getSignalProtocolStore(userId);
    const keyPair = await store.getIdentityKeyPair();
    if (keyPair) {
      signalIdentity = {
        pubKey: arrayBufferToBase64(keyPair.pubKey),
        privKey: arrayBufferToBase64(keyPair.privKey),
      };
    }
    const localRegId = await store.getLocalRegistrationId();
    if (localRegId != null) {
      signalRegId = localRegId;
    }
    const spk = await store.loadSignedPreKey(1);
    if (spk) {
      signedPreKey = {
        keyId: 1,
        pubKey: arrayBufferToBase64(spk.pubKey),
        privKey: arrayBufferToBase64(spk.privKey),
        signature: spk.signature ? arrayBufferToBase64(spk.signature) : undefined,
      };
    }
    sessions = await store.exportSessions();
  } catch (err) {
    console.warn('[keyStore] Could not export signal identity/sessions:', err);
  }

  const senderKeys: Record<string, any> = {};
  const groupKeys: Record<string, string> = {};
  const decryptedMessages: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    try {
      const allEntries = await entries();
      for (const [k, v] of allEntries) {
        const keyStr = String(k);
        if (keyStr.startsWith(`group_sender_key_${userId}_`) || keyStr.startsWith(`group_sender_key_`)) {
          senderKeys[keyStr] = v;
        } else if (keyStr.startsWith(`groupKey_`) && keyStr.includes(`_${userId}`)) {
          groupKeys[keyStr] = String(v);
        } else if (keyStr.startsWith(`msg_text_${userId}_`)) {
          decryptedMessages[keyStr] = String(v);
        }
      }
    } catch (err) {
      console.warn('[keyStore] Could not export group/sender/decrypted keys from IndexedDB:', err);
    }
  }

  const registrationId =
    (typeof window !== 'undefined' ? localStorage.getItem('registrationId') : null) ||
    (signalRegId != null ? String(signalRegId) : null);

  return {
    privateKey,
    publicKey,
    registrationId,
    deviceId,
    signedPreKeyPrivate,
    signedPreKey,
    sessions,
    signalIdentity,
    senderKeys: Object.keys(senderKeys).length > 0 ? senderKeys : null,
    groupKeys: Object.keys(groupKeys).length > 0 ? groupKeys : null,
    decryptedMessages: Object.keys(decryptedMessages).length > 0 ? decryptedMessages : null,
    timestamp: Date.now(),
  };
};

export const restoreLocalKeyBundle = async (
  userId: string,
  bundle: LocalKeyBundle
): Promise<boolean> => {
  if (!userId || !bundle.privateKey || !bundle.publicKey) {
    return false;
  }

  await storeUserKeys(userId, bundle.privateKey, bundle.publicKey);

  if (typeof window !== 'undefined') {
    if (bundle.registrationId) {
      localStorage.setItem('registrationId', bundle.registrationId);
    }
    if (bundle.deviceId) {
      localStorage.setItem('deviceId', bundle.deviceId);
    }
  }
  if (bundle.signedPreKeyPrivate) {
    await storeSignedPreKeyPrivate(userId, 1, bundle.signedPreKeyPrivate);
  }

  if (bundle.signedPreKey?.pubKey && bundle.signedPreKey?.privKey) {
    try {
      const store = getSignalProtocolStore(userId);
      await store.storeSignedPreKey(
        bundle.signedPreKey.keyId || 1,
        {
          pubKey: base64ToArrayBuffer(bundle.signedPreKey.pubKey),
          privKey: base64ToArrayBuffer(bundle.signedPreKey.privKey),
        },
        bundle.signedPreKey.signature ? base64ToArrayBuffer(bundle.signedPreKey.signature) : undefined
      );
    } catch (err) {
      console.warn('[keyStore] Could not restore signed pre-key:', err);
    }
  }

  if (bundle.sessions && typeof bundle.sessions === 'object') {
    try {
      const store = getSignalProtocolStore(userId);
      await store.importSessions(bundle.sessions);
    } catch (err) {
      console.warn('[keyStore] Could not restore sessions:', err);
    }
  }

  if (bundle.signalIdentity?.pubKey && bundle.signalIdentity?.privKey) {
    try {
      const store = getSignalProtocolStore(userId);
      await store.storeIdentityKeyPair({
        pubKey: base64ToArrayBuffer(bundle.signalIdentity.pubKey),
        privKey: base64ToArrayBuffer(bundle.signalIdentity.privKey),
      });
      const regIdToStore = bundle.registrationId ? Number(bundle.registrationId) : Math.floor(Math.random() * 16380) + 1;
      await store.storeLocalRegistrationId(regIdToStore);
      await storeUserKeys(userId, bundle.signalIdentity.privKey, bundle.signalIdentity.pubKey);
    } catch (err) {
      console.warn('[keyStore] Could not restore signal identity:', err);
    }
  }

  if (bundle.senderKeys && typeof bundle.senderKeys === 'object') {
    for (const [k, v] of Object.entries(bundle.senderKeys)) {
      try {
        await safeSet(k, v);
      } catch {}
    }
  }

  if (bundle.groupKeys && typeof bundle.groupKeys === 'object') {
    for (const [k, v] of Object.entries(bundle.groupKeys)) {
      try {
        await safeSet(k, v);
      } catch {}
    }
  }

  if (bundle.decryptedMessages && typeof bundle.decryptedMessages === 'object') {
    for (const [k, v] of Object.entries(bundle.decryptedMessages)) {
      try {
        await safeSet(k, v);
      } catch {}
    }
  }

  return true;
};

// -----------------------------------------------------------------------------
// Safety Number Verification (IndexedDB)
// -----------------------------------------------------------------------------

export interface SafetyVerificationRecord {
  safetyNumber: string;
  verifiedAt: string;
}

export const storeSafetyNumberVerification = async (
  myUserId: string,
  peerUserId: string,
  safetyNumber: string,
  verified: boolean
): Promise<void> => {
  if (typeof window === 'undefined' || !myUserId || !peerUserId) return;
  const storageKey = `safety_verified_${myUserId}_${peerUserId}`;
  if (verified) {
    await set(storageKey, {
      safetyNumber,
      verifiedAt: new Date().toISOString(),
    });
  } else {
    await del(storageKey);
  }
};

export const getSafetyNumberVerification = async (
  myUserId: string,
  peerUserId: string,
  expectedSafetyNumber?: string
): Promise<{ isVerified: boolean; verifiedAt?: string }> => {
  if (typeof window === 'undefined' || !myUserId || !peerUserId) {
    return { isVerified: false };
  }
  const storageKey = `safety_verified_${myUserId}_${peerUserId}`;
  const record = await get<SafetyVerificationRecord>(storageKey);
  if (!record) return { isVerified: false };

  // If safety number has changed since verification (e.g. key rotated), invalidate
  if (expectedSafetyNumber && record.safetyNumber !== expectedSafetyNumber) {
    return { isVerified: false };
  }

  return { isVerified: true, verifiedAt: record.verifiedAt };
};

// -----------------------------------------------------------------------------
// Signal-Grade Group Sender Keys (IndexedDB)
// -----------------------------------------------------------------------------

export interface StoredSenderKey {
  groupId: string;
  senderId: string;
  chainKey: string;
  iteration: number;
  senderKeyId: string;
  initialChainKey?: string;
  distributedTo?: string[];
  identityPublicKey?: string;
  updatedAt: string;
}

export const storeSenderKey = async (
  groupId: string,
  senderId: string,
  record: StoredSenderKey,
  myUserId?: string
): Promise<void> => {
  const prefix = myUserId ? `group_sender_key_${myUserId}_` : 'group_sender_key_';
  await safeSet(`${prefix}${groupId}_${senderId}`, record);
};

export const getStoredSenderKey = async (
  groupId: string,
  senderId: string,
  myUserId?: string
): Promise<StoredSenderKey | null> => {
  if (myUserId) {
    const userSpecific = await safeGet<StoredSenderKey>(`group_sender_key_${myUserId}_${groupId}_${senderId}`);
    if (userSpecific) return userSpecific;
  }
  return await safeGet<StoredSenderKey>(`group_sender_key_${groupId}_${senderId}`);
};

export const clearSenderKey = async (
  groupId: string,
  senderId: string,
  myUserId?: string
): Promise<void> => {
  if (myUserId) {
    await safeDel(`group_sender_key_${myUserId}_${groupId}_${senderId}`);
  }
  await safeDel(`group_sender_key_${groupId}_${senderId}`);
};
