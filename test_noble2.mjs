import { x25519 } from '@noble/curves/ed25519.js';
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { randomBytes } from '@noble/hashes/utils.js';

const aPriv = x25519.utils.randomSecretKey();
const bPub = x25519.getPublicKey(x25519.utils.randomSecretKey());

const sharedSecret = x25519.getSharedSecret(aPriv, bPub);

const nonce1 = randomBytes(24);
const msg1 = new TextEncoder().encode("Message 1");
const cipher1 = xchacha20poly1305(sharedSecret, nonce1);
const ct1 = cipher1.encrypt(msg1);

const nonce2 = randomBytes(24);
const msg2 = new TextEncoder().encode("Message 2");
const cipher2 = xchacha20poly1305(sharedSecret, nonce2);
try {
  const ct2 = cipher2.encrypt(msg2);
  console.log("Second encrypt worked!");
} catch (e) {
  console.log("Second encrypt failed:", e.message);
}

try {
  const dec1 = cipher1.decrypt(ct1);
  console.log("First decrypt worked:", new TextDecoder().decode(dec1));
} catch (e) {
  console.log("First decrypt failed:", e.message);
}
