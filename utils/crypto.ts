import sodium from "libsodium-wrappers";

export const initCrypto = async () => {
  await sodium.ready;
};

export const generateAndStoreKeyPair = async (userId: string = "") => {
  await sodium.ready;
  const keypair = sodium.crypto_box_keypair();
  
  // Convert to Base64 ORIGINAL
  const publicKeyBase64 = sodium.to_base64(keypair.publicKey, sodium.base64_variants.ORIGINAL);
  const privateKeyBase64 = sodium.to_base64(keypair.privateKey, sodium.base64_variants.ORIGINAL);
  
  // Store securely
  if (typeof window !== "undefined") {
    const privKeyName = userId ? `privateKey_${userId}` : "privateKey";
    const pubKeyName = userId ? `publicKey_${userId}` : "publicKey";
    localStorage.setItem(privKeyName, privateKeyBase64);
    localStorage.setItem(pubKeyName, publicKeyBase64);
  }
  
  return publicKeyBase64;
};

export const encryptMessage = async (plaintext: string, recipientPublicKey: string, myPrivateKey: string) => {
  await sodium.ready;
  
  const recipientPub = sodium.from_base64(recipientPublicKey, sodium.base64_variants.ORIGINAL);
  const myPriv = sodium.from_base64(myPrivateKey, sodium.base64_variants.ORIGINAL);
  
  const nonceBytes = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  
  const ciphertextBytes = sodium.crypto_box_easy(
    plaintext,
    nonceBytes,
    recipientPub,
    myPriv
  );
  
  return {
    ciphertext: sodium.to_base64(ciphertextBytes, sodium.base64_variants.ORIGINAL),
    nonce: sodium.to_base64(nonceBytes, sodium.base64_variants.ORIGINAL)
  };
};

export const decryptMessage = async (ciphertext: string, nonce: string, senderPublicKey: string, myPrivateKey: string) => {
  await sodium.ready;
  
  const cipherBytes = sodium.from_base64(ciphertext, sodium.base64_variants.ORIGINAL);
  const nonceBytes = sodium.from_base64(nonce, sodium.base64_variants.ORIGINAL);
  const senderPub = sodium.from_base64(senderPublicKey, sodium.base64_variants.ORIGINAL);
  const myPriv = sodium.from_base64(myPrivateKey, sodium.base64_variants.ORIGINAL);
  
  console.log(`[crypto] crypto_box_open_easy diagnostics:
    - cipherBytes length: ${cipherBytes.length}
    - nonceBytes length: ${nonceBytes.length}
    - senderPublicKey (incoming) length: ${senderPub.length} (Expected: 32)
    - myPrivateKey (incoming) length: ${myPriv.length} (Expected: 32)`);

  const decryptedBytes = sodium.crypto_box_open_easy(
    cipherBytes,
    nonceBytes,
    senderPub,
    myPriv
  );
  
  return sodium.to_string(decryptedBytes);
};

// ── Symmetric Group Chat Encryption (Secretbox) ──────────────────────────────

export const generateGroupKey = async (): Promise<string> => {
  await sodium.ready;
  const keyBytes = sodium.crypto_secretbox_keygen();
  return sodium.to_base64(keyBytes, sodium.base64_variants.ORIGINAL);
};

export const encryptGroupMessage = async (plaintext: string, groupKeyBase64: string) => {
  await sodium.ready;
  const groupKey = sodium.from_base64(groupKeyBase64, sodium.base64_variants.ORIGINAL);
  const nonceBytes = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  
  const ciphertextBytes = sodium.crypto_secretbox_easy(
    plaintext,
    nonceBytes,
    groupKey
  );
  
  return {
    ciphertext: sodium.to_base64(ciphertextBytes, sodium.base64_variants.ORIGINAL),
    nonce: sodium.to_base64(nonceBytes, sodium.base64_variants.ORIGINAL)
  };
};

export const decryptGroupMessage = async (ciphertextBase64: string, nonceBase64: string, groupKeyBase64: string) => {
  await sodium.ready;
  const cipherBytes = sodium.from_base64(ciphertextBase64, sodium.base64_variants.ORIGINAL);
  const nonceBytes = sodium.from_base64(nonceBase64, sodium.base64_variants.ORIGINAL);
  const groupKey = sodium.from_base64(groupKeyBase64, sodium.base64_variants.ORIGINAL);
  
  const decryptedBytes = sodium.crypto_secretbox_open_easy(
    cipherBytes,
    nonceBytes,
    groupKey
  );
  
  return sodium.to_string(decryptedBytes);
};
