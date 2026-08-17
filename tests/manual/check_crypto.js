const sodium = require('libsodium-wrappers');
sodium.ready.then(() => {
  const myKp = sodium.crypto_box_keypair();
  const peerKp = sodium.crypto_box_keypair();
  
  const shared1 = sodium.crypto_scalarmult(myKp.privateKey, peerKp.publicKey);
  const shared2 = sodium.crypto_scalarmult(peerKp.privateKey, myKp.publicKey);
  
  console.log("Shared secret match:", Buffer.from(shared1).equals(Buffer.from(shared2)));
  
  const nonce = sodium.randombytes_buf(24);
  const message = "Hello XChaCha20";
  
  const cipher = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    message, null, null, nonce, shared1
  );
  
  const decrypted = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
    null, cipher, null, nonce, shared2
  );
  
  console.log("Decrypted:", sodium.to_string(decrypted));
});
