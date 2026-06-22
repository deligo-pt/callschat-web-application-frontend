const sodium = require("libsodium-wrappers");

async function test() {
  await sodium.ready;
  
  const senderKeys = sodium.crypto_box_keypair();
  const recipientKeys = sodium.crypto_box_keypair();
  
  const plaintext = "Hello World";
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  
  // Sender encrypts for recipient
  const ciphertext = sodium.crypto_box_easy(plaintext, nonce, recipientKeys.publicKey, senderKeys.privateKey);
  
  // Recipient decrypts
  const decryptedByRecipient = sodium.crypto_box_open_easy(ciphertext, nonce, senderKeys.publicKey, recipientKeys.privateKey);
  console.log("Decrypted by recipient:", sodium.to_string(decryptedByRecipient));
  
  // Sender tries to decrypt their own message using recipient public key and sender private key
  try {
    const decryptedBySender = sodium.crypto_box_open_easy(ciphertext, nonce, recipientKeys.publicKey, senderKeys.privateKey);
    console.log("Decrypted by sender:", sodium.to_string(decryptedBySender));
  } catch (e) {
    console.error("Sender decryption failed:", e.message);
  }
}

test();
