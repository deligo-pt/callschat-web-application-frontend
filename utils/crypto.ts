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

// ── QR Login: Ephemeral Diffie-Hellman Key Exchange ───────────────────────────
//
// Used during QR code login to securely transfer the user's private key
// from the mobile app to the web browser without the server ever seeing it.
//
// Protocol:
//   1. Web generates an ephemeral keypair (webEphPub / webEphPriv).
//   2. webEphPub is embedded in the QR code JSON alongside the qrToken.
//   3. Android encrypts the user's private key with webEphPub (crypto_box_easy).
//   4. Server relays the ciphertext blindly via Socket.IO — cannot decrypt it.
//   5. Web decrypts using webEphPriv + mobileEphPub.
//   6. Web derives the matching public key and stores both in localStorage.

/**
 * Generates a one-time (ephemeral) keypair for a single QR login session.
 * The private half stays in a React ref — never stored or sent anywhere.
 * The public half is embedded in the QR code value so the Android app can
 * encrypt the user's real private key specifically for this browser session.
 */
export const generateEphemeralKeyPair = async (): Promise<{
  publicKey: string;
  privateKey: string;
}> => {
  await sodium.ready;
  const kp = sodium.crypto_box_keypair();
  return {
    publicKey: sodium.to_base64(kp.publicKey, sodium.base64_variants.ORIGINAL),
    privateKey: sodium.to_base64(kp.privateKey, sodium.base64_variants.ORIGINAL),
  };
};

/**
 * Decrypts the user's private key that was encrypted by the Android app.
 * Uses the DH secret derived from webEphPriv + mobileEphPub.
 *
 * @returns The plaintext private key in base64 — store immediately in localStorage.
 */
export const decryptKeyFromMobile = async (
  encryptedPrivKey: string,
  mobileEphPub: string,
  nonce: string,
  webEphPriv: string,
): Promise<string> => {
  await sodium.ready;
  const decrypted = sodium.crypto_box_open_easy(
    sodium.from_base64(encryptedPrivKey, sodium.base64_variants.ORIGINAL),
    sodium.from_base64(nonce, sodium.base64_variants.ORIGINAL),
    sodium.from_base64(mobileEphPub, sodium.base64_variants.ORIGINAL),
    sodium.from_base64(webEphPriv, sodium.base64_variants.ORIGINAL),
  );
  return sodium.to_base64(decrypted, sodium.base64_variants.ORIGINAL);
};

/**
 * Derives the matching public key from a private key using the same scalar
 * multiplication that crypto_box_keypair uses internally.
 * This means we only need to sync the private key — the public key is always
 * recoverable without any extra data transfer.
 */
export const derivePublicKeyFromPrivate = async (privateKeyBase64: string): Promise<string> => {
  await sodium.ready;
  const privBytes = sodium.from_base64(privateKeyBase64, sodium.base64_variants.ORIGINAL);
  const pubBytes = sodium.crypto_scalarmult_base(privBytes);
  return sodium.to_base64(pubBytes, sodium.base64_variants.ORIGINAL);
};

