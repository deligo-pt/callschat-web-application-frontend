const sodium = require('libsodium-wrappers');

async function test() {
  await sodium.ready;
  
  const alice = sodium.crypto_box_keypair();
  const bob = sodium.crypto_box_keypair();
  
  const msg = "Hello Alice!";
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  
  // Bob encrypts for Alice
  const ciphertext = sodium.crypto_box_easy(msg, nonce, alice.publicKey, bob.privateKey);
  
  // Alice receives from Bob
  try {
    const decrypted = sodium.crypto_box_open_easy(ciphertext, nonce, bob.publicKey, alice.privateKey);
    console.log("Alice decrypted Bob's message:", sodium.to_string(decrypted));
  } catch (e) {
    console.error("Alice failed to decrypt:", e.message);
  }
}
test();
