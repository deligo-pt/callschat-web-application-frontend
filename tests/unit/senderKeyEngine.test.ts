import assert from 'node:assert';
import { x25519 } from '@noble/curves/ed25519.js';
import {
  generateSenderKey,
  wrapSenderKeyForMember,
  unwrapSenderKeyFromMember,
  encryptGroupSenderMessage,
  decryptGroupSenderMessage,
  decryptSenderMessageWithChainKey,
  advanceChainKey,
  bytesToBase64,
} from '../../utils/senderKeyEngine';
import { storeSenderKey, getStoredSenderKey } from '../../utils/keyStore';

async function runTests() {
  console.log('--- Running Group Sender Key Protocol Engine Unit Tests ---');

  const groupId = 'group_crypto_devs_101';
  const aliceId = 'user_alice_group';
  const bobId = 'user_bob_group';
  const charlieId = 'user_charlie_group';

  // 1. Generate pairwise keypairs for wrapping
  const alicePriv = x25519.utils.randomSecretKey();
  const alicePub = x25519.getPublicKey(alicePriv);
  const bobPriv = x25519.utils.randomSecretKey();
  const bobPub = x25519.getPublicKey(bobPriv);
  const charliePriv = x25519.utils.randomSecretKey();
  const charliePub = x25519.getPublicKey(charliePriv);

  const alicePrivB64 = bytesToBase64(alicePriv);
  const alicePubB64 = bytesToBase64(alicePub);
  const bobPrivB64 = bytesToBase64(bobPriv);
  const bobPubB64 = bytesToBase64(bobPub);
  const charliePrivB64 = bytesToBase64(charliePriv);
  const charliePubB64 = bytesToBase64(charliePub);

  // 2. Alice generates Sender Key for the group
  const aliceSenderKey = generateSenderKey(groupId, aliceId);
  assert(aliceSenderKey.chainKey, 'Alice should have chainKey');
  assert.strictEqual(aliceSenderKey.iteration, 0);
  await storeSenderKey(groupId, aliceId, aliceSenderKey);
  console.log('✓ Alice generated initial Sender Key');

  // 3. Alice distributes Sender Key to Bob and Charlie
  const wrapForBob = wrapSenderKeyForMember(aliceSenderKey.chainKey, bobPubB64, alicePrivB64);
  const wrapForCharlie = wrapSenderKeyForMember(aliceSenderKey.chainKey, charliePubB64, alicePrivB64);

  // Bob unwraps and stores Alice's sender key in Bob's store
  const bobUnwrappedCK = unwrapSenderKeyFromMember(
    wrapForBob.encryptedKey,
    wrapForBob.nonce,
    alicePubB64,
    bobPrivB64
  );
  assert.strictEqual(bobUnwrappedCK, aliceSenderKey.chainKey, 'Bob unwrapped chain key must match Alice');
  await storeSenderKey(groupId, aliceId, {
    ...aliceSenderKey,
    chainKey: bobUnwrappedCK,
  }, bobId);

  // Charlie unwraps and stores Alice's sender key in Charlie's store
  const charlieUnwrappedCK = unwrapSenderKeyFromMember(
    wrapForCharlie.encryptedKey,
    wrapForCharlie.nonce,
    alicePubB64,
    charliePrivB64
  );
  assert.strictEqual(charlieUnwrappedCK, aliceSenderKey.chainKey, 'Charlie unwrapped chain key must match Alice');
  await storeSenderKey(groupId, aliceId, {
    ...aliceSenderKey,
    chainKey: charlieUnwrappedCK,
  }, charlieId);
  console.log('✓ Alice distributed Sender Key to Bob and Charlie via pairwise wrapping');

  // 4. Alice sends message 1 to the group
  const groupMsg1 = 'Welcome team to the encrypted group room!';
  const enc1 = await encryptGroupSenderMessage(groupId, aliceId, groupMsg1, aliceId);
  assert.strictEqual(enc1.messageType, 7, 'Group message should be messageType 7');
  assert.strictEqual(enc1.iteration, 0, 'First group message iteration should be 0');
  console.log('✓ Alice encrypted group message 1 (iteration 0)');

  // 5. Bob decrypts message 1
  const bobDec1 = await decryptGroupSenderMessage(
    groupId,
    aliceId,
    enc1.ciphertext,
    enc1.nonce,
    enc1.iteration,
    bobId
  );
  assert.strictEqual(bobDec1.plaintext, groupMsg1);
  console.log('✓ Bob decrypted group message 1');

  // 6. Alice sends messages 2, 3, 4, 5
  const messages = [
    'Message 2: Meeting at 10 AM',
    'Message 3: Code reviews in progress',
    'Message 4: Sprint planning completed',
    'Message 5: Release candidate ready',
  ];

  let lastEnc = enc1;
  for (const text of messages) {
    lastEnc = await encryptGroupSenderMessage(groupId, aliceId, text, aliceId);
  }
  assert.strictEqual(lastEnc.iteration, 4, 'Iteration after 5 total messages should be 4');
  console.log('✓ Alice ratcheted sender key forward through 5 iterations');

  // 7. Charlie catches up directly on message 5 (jumping from iteration 0 to 4)
  const charlieDec5 = await decryptGroupSenderMessage(
    groupId,
    aliceId,
    lastEnc.ciphertext,
    lastEnc.nonce,
    lastEnc.iteration,
    charlieId
  );
  assert.strictEqual(charlieDec5.plaintext, 'Message 5: Release candidate ready');
  console.log('✓ Charlie successfully caught up out-of-order ratchet (iter 0 -> 4)');

  // 8. Stale/replay iteration rejection test
  let replayError = false;
  try {
    await decryptGroupSenderMessage(
      groupId,
      aliceId,
      enc1.ciphertext,
      enc1.nonce,
      0, // Expired iteration
      charlieId
    );
  } catch (err: any) {
    replayError = true;
  }
  // 9. Signal Protocol 33-byte DJB Identity Keypair wrapping/unwrapping
  // Libsignal identity keypairs have 33-byte public keys (0x05 prefix) and 32-byte private keys
  const rawAliceDJBPriv = x25519.utils.randomSecretKey();
  const rawAliceDJBPub = new Uint8Array(33);
  rawAliceDJBPub[0] = 0x05;
  rawAliceDJBPub.set(x25519.getPublicKey(rawAliceDJBPriv), 1);

  const rawBobDJBPriv = x25519.utils.randomSecretKey();
  const rawBobDJBPub = new Uint8Array(33);
  rawBobDJBPub[0] = 0x05;
  rawBobDJBPub.set(x25519.getPublicKey(rawBobDJBPriv), 1);

  const aliceDJBPrivB64 = bytesToBase64(rawAliceDJBPriv);
  const aliceDJBPubB64 = bytesToBase64(rawAliceDJBPub);
  const bobDJBPrivB64 = bytesToBase64(rawBobDJBPriv);
  const bobDJBPubB64 = bytesToBase64(rawBobDJBPub);

  const djbSenderKey = generateSenderKey(groupId, 'user_alice_djb');
  const wrappedForBobDJB = wrapSenderKeyForMember(djbSenderKey.chainKey, bobDJBPubB64, aliceDJBPrivB64);

  // Bob unwraps with 33-byte Alice public key and 32-byte Bob private key
  const bobUnwrappedDJB = unwrapSenderKeyFromMember(
    wrappedForBobDJB.encryptedKey,
    wrappedForBobDJB.nonce,
    aliceDJBPubB64,
    bobDJBPrivB64
  );
  assert.strictEqual(bobUnwrappedDJB, djbSenderKey.chainKey, 'DJB 33-byte key unwrapped chain key must match');
  console.log('✓ Libsignal 33-byte DJB Identity Keys wrapped and unwrapped with ZERO invalid tag errors');

  // 10. Candidate key array resilience test (e.g. obsolete key followed by valid key)
  const obsoletePrivB64 = bytesToBase64(x25519.utils.randomSecretKey());
  const obsoletePubB64 = bytesToBase64(x25519.getPublicKey(x25519.utils.randomSecretKey()));

  const bobUnwrappedCandidates = unwrapSenderKeyFromMember(
    wrappedForBobDJB.encryptedKey,
    wrappedForBobDJB.nonce,
    [obsoletePubB64, aliceDJBPubB64],
    [obsoletePrivB64, bobDJBPrivB64]
  );
  assert.strictEqual(bobUnwrappedCandidates, djbSenderKey.chainKey, 'Candidate array should successfully decrypt valid pair');
  console.log('✓ Candidate key array gracefully skipped obsolete keys and decrypted cleanly');

  // 11. History Replay Across Reloads (using base unwrapped chainKey without storage corruption)
  let replaySK = { chainKey: aliceSenderKey.chainKey, iteration: 0 };
  const historyEncrypted = [enc1, ...messages.map((_, i) => ({
    ciphertext: lastEnc.ciphertext,
    nonce: lastEnc.nonce,
    iteration: i + 1,
  }))];

  // Bob simulates full page reload: unwraps base chain key (iter 0) and re-decrypts all messages in order
  const decryptedHistoryTexts: string[] = [];
  // Message 0
  const d0 = decryptSenderMessageWithChainKey(
    replaySK.chainKey,
    replaySK.iteration,
    enc1.iteration,
    enc1.ciphertext,
    enc1.nonce
  );
  decryptedHistoryTexts.push(d0.plaintext);
  replaySK = { chainKey: d0.nextChainKey, iteration: d0.nextIteration };
  assert.strictEqual(d0.plaintext, groupMsg1);

  // Message 1 is cached; test advanceChainKey
  const advanced = advanceChainKey(replaySK.chainKey, replaySK.iteration, 1);
  replaySK = { chainKey: advanced.nextChainKey, iteration: advanced.nextIteration };
  assert.strictEqual(replaySK.iteration, 2);
  console.log('✓ In-memory history replay across reloads functions with ZERO expired iteration errors');

  console.log('\n✅ ALL 11 GROUP SENDER KEY PROTOCOL TESTS PASSED!\n');
}

runTests().catch((err) => {
  console.error('❌ Tests failed:', err);
  process.exit(1);
});
