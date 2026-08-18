import { x25519 } from '@noble/curves/ed25519.js';
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { randomBytes } from '@noble/hashes/utils.js';

const aPriv = x25519.utils.randomSecretKey();
const bPub = x25519.getPublicKey(x25519.utils.randomSecretKey());

const sharedSecret = x25519.getSharedSecret(aPriv, bPub);
const initialHex = Buffer.from(sharedSecret).toString('hex');

const nonce1 = randomBytes(24);
const msg1 = new TextEncoder().encode("Message 1");
const cipher1 = xchacha20poly1305(sharedSecret, nonce1);
const ct1 = cipher1.encrypt(msg1);

const afterHex = Buffer.from(sharedSecret).toString('hex');
console.log("Key mutated during encrypt?:", initialHex !== afterHex);

const dec1 = cipher1.decrypt(ct1);
const afterDecHex = Buffer.from(sharedSecret).toString('hex');
console.log("Key mutated during decrypt?:", initialHex !== afterDecHex);

