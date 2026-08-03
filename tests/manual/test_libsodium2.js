const sodium = require("libsodium-wrappers");

async function test() {
  await sodium.ready;
  
  const A = sodium.crypto_box_keypair();
  const B = sodium.crypto_box_keypair();
  
  const plaintext = "Hello B, this is A";
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  
  // User A encrypts
  const ciphertext = sodium.crypto_box_easy(plaintext, nonce, B.publicKey, A.privateKey);
  
  // User B decrypts
  const decrypted = sodium.crypto_box_open_easy(ciphertext, nonce, A.publicKey, B.privateKey);
  
  console.log("Decrypted by B:", sodium.to_string(decrypted));
}

test();
