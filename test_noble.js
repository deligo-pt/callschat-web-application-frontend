const { x25519 } = require('@noble/curves/ed25519');
const { xchacha20poly1305 } = require('@noble/ciphers/chacha');
const { randomBytes } = require('@noble/hashes/utils');

const aPriv = x25519.utils.randomSecretKey();
const aPub = x25519.getPublicKey(aPriv);

const bPriv = x25519.utils.randomSecretKey();
const bPub = x25519.getPublicKey(bPriv);

const sharedAB = x25519.getSharedSecret(aPriv, bPub);
const sharedBA = x25519.getSharedSecret(bPriv, aPub);

console.log("Shared matches:", Buffer.from(sharedAB).equals(Buffer.from(sharedBA)));

const nonce = randomBytes(24);
const msg = new TextEncoder().encode("Hello world");

const cipher = xchacha20poly1305(sharedAB, nonce);
const ciphertext = cipher.encrypt(msg);

const cipher2 = xchacha20poly1305(sharedBA, nonce);
try {
  const decrypted = cipher2.decrypt(ciphertext);
  console.log("Decrypted:", new TextDecoder().decode(decrypted));
} catch(e) {
  console.error("Decrypt failed:", e.message);
}
