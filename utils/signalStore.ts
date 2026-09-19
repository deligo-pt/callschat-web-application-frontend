import { get, set, del, createStore, entries } from 'idb-keyval';
import type {
  StorageType,
  KeyPairType,
  Direction,
  SessionRecordType,
} from '@privacyresearch/libsignal-protocol-typescript';

// Custom isolated IndexedDB store for Signal Protocol records
const signalDbStore =
  typeof window !== 'undefined'
    ? createStore('callschat-signal-db', 'signal-protocol-store')
    : undefined;

// In-memory fallback for SSR or environments where IndexedDB is unavailable
const memoryFallback = new Map<string, any>();

async function getStoredValue<T>(key: string): Promise<T | undefined> {
  if (signalDbStore) {
    try {
      const val = await get<T>(key, signalDbStore);
      return val ?? undefined;
    } catch {
      return memoryFallback.get(key);
    }
  }
  return memoryFallback.get(key);
}

async function setStoredValue<T>(key: string, value: T): Promise<void> {
  memoryFallback.set(key, value);
  if (signalDbStore) {
    try {
      await set(key, value, signalDbStore);
    } catch (err) {
      console.warn('[signalStore] Failed to write to IndexedDB, fallback to memory:', err);
    }
  }
}

async function deleteStoredValue(key: string): Promise<void> {
  memoryFallback.delete(key);
  if (signalDbStore) {
    try {
      await del(key, signalDbStore);
    } catch (err) {
      console.warn('[signalStore] Failed to delete from IndexedDB:', err);
    }
  }
}

/**
 * Ensures a binary value is returned as a pure ArrayBuffer.
 */
export function ensureArrayBuffer(data: ArrayBuffer | Uint8Array | unknown): ArrayBuffer {
  if (data instanceof ArrayBuffer) {
    return data;
  }
  if (ArrayBuffer.isView(data)) {
    return data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength
    ) as ArrayBuffer;
  }
  if (typeof data === 'string') {
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
  throw new Error('Expected ArrayBuffer or Uint8Array');
}

/**
 * Web Locks API wrapper to serialize session operations across tabs.
 */
export async function withSessionLock<T>(
  addressName: string,
  operation: () => Promise<T>
): Promise<T> {
  if (typeof window !== 'undefined' && 'locks' in navigator) {
    return await navigator.locks.request(`signal_lock_${addressName}`, async () => {
      return await operation();
    });
  }
  return await operation();
}

/**
 * Production-ready persistent SignalProtocolStore implementing StorageType.
 */
export class SignalProtocolStore implements StorageType {
  private readonly userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // ---------------------------------------------------------------------------
  // Identity Keys & Registration ID
  // ---------------------------------------------------------------------------

  async getIdentityKeyPair(): Promise<KeyPairType | undefined> {
    const stored = await getStoredValue<{ pubKey: any; privKey: any }>(
      `identityKey_${this.userId}`
    );
    if (!stored?.pubKey || !stored?.privKey) {
      return undefined;
    }
    return {
      pubKey: ensureArrayBuffer(stored.pubKey),
      privKey: ensureArrayBuffer(stored.privKey),
    };
  }

  async storeIdentityKeyPair(keyPair: KeyPairType): Promise<void> {
    await setStoredValue(`identityKey_${this.userId}`, {
      pubKey: ensureArrayBuffer(keyPair.pubKey),
      privKey: ensureArrayBuffer(keyPair.privKey),
    });
  }

  async getLocalRegistrationId(): Promise<number | undefined> {
    return await getStoredValue<number>(`registrationId_${this.userId}`);
  }

  async storeLocalRegistrationId(registrationId: number): Promise<void> {
    await setStoredValue(`registrationId_${this.userId}`, registrationId);
  }

  async isTrustedIdentity(
    identifier: string,
    identityKey: ArrayBuffer,
    _direction: Direction
  ): Promise<boolean> {
    const trusted = await getStoredValue<any>(`identity_${this.userId}_${identifier}`);
    if (!trusted) {
      return true; // Trust on first use (TOFU)
    }
    const trustedBuf = new Uint8Array(ensureArrayBuffer(trusted));
    const newBuf = new Uint8Array(identityKey);
    if (trustedBuf.length !== newBuf.length) return false;
    for (let i = 0; i < trustedBuf.length; i++) {
      if (trustedBuf[i] !== newBuf[i]) return false;
    }
    return true;
  }

  async saveIdentity(encodedAddress: string, publicKey: ArrayBuffer): Promise<boolean> {
    const key = `identity_${this.userId}_${encodedAddress}`;
    const existing = await getStoredValue<any>(key);
    await setStoredValue(key, ensureArrayBuffer(publicKey));
    if (!existing) {
      return false; // New identity saved
    }
    const existingBuf = new Uint8Array(ensureArrayBuffer(existing));
    const newBuf = new Uint8Array(publicKey);
    if (existingBuf.length !== newBuf.length) return true;
    for (let i = 0; i < existingBuf.length; i++) {
      if (existingBuf[i] !== newBuf[i]) return true;
    }
    return false; // Re-saved same identity
  }

  // ---------------------------------------------------------------------------
  // Pre-Keys (One-Time Prekeys)
  // ---------------------------------------------------------------------------

  async loadPreKey(keyId: string | number): Promise<KeyPairType | undefined> {
    const stored = await getStoredValue<{ pubKey: any; privKey: any }>(
      `preKey_${this.userId}_${keyId}`
    );
    if (!stored?.pubKey || !stored?.privKey) {
      return undefined;
    }
    return {
      pubKey: ensureArrayBuffer(stored.pubKey),
      privKey: ensureArrayBuffer(stored.privKey),
    };
  }

  async storePreKey(keyId: number | string, keyPair: KeyPairType): Promise<void> {
    await setStoredValue(`preKey_${this.userId}_${keyId}`, {
      pubKey: ensureArrayBuffer(keyPair.pubKey),
      privKey: ensureArrayBuffer(keyPair.privKey),
    });
  }

  async recordLocalPreKeyIds(keyIds: (number | string)[]): Promise<void> {
    const numericIds = keyIds.map((k) => Number(k));
    const existing = (await getStoredValue<number[]>(`localPreKeyIds_${this.userId}`)) || [];
    const merged = Array.from(new Set([...existing, ...numericIds]));
    await setStoredValue(`localPreKeyIds_${this.userId}`, merged);
  }

  async getLocalPreKeyCount(): Promise<number> {
    const existing = await getStoredValue<number[]>(`localPreKeyIds_${this.userId}`);
    return existing ? existing.length : 0;
  }

  async removePreKey(keyId: number | string): Promise<void> {
    await deleteStoredValue(`preKey_${this.userId}_${keyId}`);
    const existing = await getStoredValue<number[]>(`localPreKeyIds_${this.userId}`);
    if (existing && existing.length > 0) {
      const numId = Number(keyId);
      const filtered = existing.filter((id) => id !== numId);
      await setStoredValue(`localPreKeyIds_${this.userId}`, filtered);
    }
  }

  // ---------------------------------------------------------------------------
  // Signed Pre-Keys
  // ---------------------------------------------------------------------------

  async loadSignedPreKey(
    keyId: number | string
  ): Promise<(KeyPairType & { signature?: ArrayBuffer }) | undefined> {
    const stored = await getStoredValue<{ pubKey: any; privKey: any; signature?: any }>(
      `signedPreKey_${this.userId}_${keyId}`
    );
    if (!stored?.pubKey || !stored?.privKey) {
      return undefined;
    }
    return {
      pubKey: ensureArrayBuffer(stored.pubKey),
      privKey: ensureArrayBuffer(stored.privKey),
      signature: stored.signature ? ensureArrayBuffer(stored.signature) : undefined,
    };
  }

  async storeSignedPreKey(
    keyId: number | string,
    keyPair: KeyPairType,
    signature?: ArrayBuffer
  ): Promise<void> {
    await setStoredValue(`signedPreKey_${this.userId}_${keyId}`, {
      pubKey: ensureArrayBuffer(keyPair.pubKey),
      privKey: ensureArrayBuffer(keyPair.privKey),
      signature: signature ? ensureArrayBuffer(signature) : undefined,
    });
  }

  async removeSignedPreKey(keyId: number | string): Promise<void> {
    await deleteStoredValue(`signedPreKey_${this.userId}_${keyId}`);
  }

  // ---------------------------------------------------------------------------
  // Session Records (Serialized Double Ratchet Sessions)
  // ---------------------------------------------------------------------------

  async loadSession(encodedAddress: string): Promise<SessionRecordType | undefined> {
    return await getStoredValue<SessionRecordType>(`session_${this.userId}_${encodedAddress}`);
  }

  async storeSession(encodedAddress: string, record: SessionRecordType): Promise<void> {
    await setStoredValue(`session_${this.userId}_${encodedAddress}`, record);
  }

  async removeSession(encodedAddress: string): Promise<void> {
    await deleteStoredValue(`session_${this.userId}_${encodedAddress}`);
  }

  async removeAllSessions(): Promise<void> {
    memoryFallback.clear();
  }

  async exportSessions(): Promise<Record<string, SessionRecordType>> {
    const prefix = `session_${this.userId}_`;
    const result: Record<string, SessionRecordType> = {};
    if (signalDbStore) {
      try {
        const allEntries = await entries(signalDbStore);
        for (const [k, v] of allEntries) {
          if (typeof k === 'string' && k.startsWith(prefix)) {
            const addr = k.substring(prefix.length);
            result[addr] = v;
          }
        }
      } catch (err) {
        console.warn('[signalStore] Failed to read sessions from IndexedDB:', err);
      }
    }
    // Also merge from memory fallback
    for (const [k, v] of memoryFallback.entries()) {
      if (typeof k === 'string' && k.startsWith(prefix)) {
        const addr = k.substring(prefix.length);
        if (!result[addr]) {
          result[addr] = v;
        }
      }
    }
    return result;
  }

  async importSessions(sessions: Record<string, SessionRecordType>): Promise<void> {
    if (!sessions || typeof sessions !== 'object') return;
    for (const [addr, record] of Object.entries(sessions)) {
      if (addr && record) {
        await this.storeSession(addr, record);
      }
    }
  }
}

// Global active store cache keyed by userId
const activeStoreCache = new Map<string, SignalProtocolStore>();

export function getSignalProtocolStore(userId: string): SignalProtocolStore {
  let store = activeStoreCache.get(userId);
  if (!store) {
    store = new SignalProtocolStore(userId);
    activeStoreCache.set(userId, store);
  }
  return store;
}
