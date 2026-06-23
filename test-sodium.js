const sodium = require('libsodium-wrappers');

(async () => {
  await sodium.ready;
  const alice = sodium.crypto_box_keypair();
  const bob = sodium.crypto_box_keypair();

  const msg = "Hello Bob!";
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);

  // Alice encrypts for Bob
  const ciphertext = sodium.crypto_box_easy(msg, nonce, bob.publicKey, alice.privateKey);

  // Bob decrypts
  const decryptedByBob = sodium.crypto_box_open_easy(ciphertext, nonce, alice.publicKey, bob.privateKey);
  console.log("Bob decrypted:", sodium.to_string(decryptedByBob));

  try {
    // Alice tries to decrypt her own message
    const decryptedByAlice = sodium.crypto_box_open_easy(ciphertext, nonce, bob.publicKey, alice.privateKey);
    console.log("Alice decrypted her own:", sodium.to_string(decryptedByAlice));
  } catch (err) {
    console.error("Alice failed to decrypt:", err.message);
  }
})();
