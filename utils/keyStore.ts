import { get, set, del } from 'idb-keyval';

export const storeUserKeys = async (userId: string, privKey: string, pubKey: string) => {
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

export const clearUserKeys = async (userId: string) => {
  if (typeof window === 'undefined') return;
  await del(`privateKey_${userId}`);
  await del(`publicKey_${userId}`);
};

export const migrateKeysFromLocalStorage = async (userId: string) => {
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
    
    // Clean up insecure localStorage
    localStorage.removeItem(`privateKey_${userId}`);
    localStorage.removeItem(`publicKey_${userId}`);
    localStorage.removeItem("privateKey");
    localStorage.removeItem("publicKey");
    console.log("[KeyStore] Successfully migrated keys from localStorage to IndexedDB");
  }
};
