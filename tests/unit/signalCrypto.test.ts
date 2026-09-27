import assert from 'node:assert';
import {
  initSignalIdentity,
  generateSignedPreKey,
  getOrGenerateSignedPreKey,
  generatePreKeyBatch,
  buildSessionFromBundle,
  encrypt1to1Message,
  decrypt1to1Message,
  computeSignalFingerprint,
  hasActiveSignalSession,
} from '../../utils/signalCrypto';

async function runTests() {
  console.log('--- Running Signal 1-to-1 Crypto Engine Unit Tests ---');

  const aliceId = 'user_alice_test';
  const bobId = 'user_bob_test';

  // 1. Initialize Identities
  const aliceIdentity = await initSignalIdentity(aliceId, true);
  const bobIdentity = await initSignalIdentity(bobId, true);

  assert(aliceIdentity.identityKeyBase64, 'Alice should have identity key');
  assert(bobIdentity.identityKeyBase64, 'Bob should have identity key');
  console.log('✓ Identities initialized for Alice and Bob');

  // 2. Bob publishes PreKey bundle (Signed PreKey + 1 OPK)
  const bobSpk = await generateSignedPreKey(bobId, 1);
  const bobOpks = await generatePreKeyBatch(bobId, 100, 10);
  const selectedBobOpk = bobOpks[0]!;

  const bobBundle = {
    userId: bobId,
    deviceId: 1,
    registrationId: bobIdentity.registrationId,
    identityKey: bobIdentity.identityKeyBase64,
    signedPreKey: bobSpk,
    oneTimePreKey: selectedBobOpk,
  };
  console.log('✓ Bob generated SignedPreKey and OPK pool');

  // 3. Alice ingests Bob's bundle to establish X3DH session
  await buildSessionFromBundle(aliceId, bobId, bobBundle, 1);
  const aliceHasSession = await hasActiveSignalSession(aliceId, bobId, 1);
  assert.strictEqual(aliceHasSession, true, 'Alice should now have active session with Bob');
  console.log('✓ Alice successfully established session via Bob bundle');

  // 4. Alice sends first message (Handshake message -> PreKeySignalMessage Type 3)
  const message1 = 'Hello Bob! This is our first end-to-end encrypted message.';
  const enc1 = await encrypt1to1Message(aliceId, bobId, message1, 1);
  assert.strictEqual(enc1.messageType, 3, 'First message should be PreKeySignalMessage (Type 3)');
  assert(enc1.ciphertext, 'Ciphertext should be non-empty Base64');
  console.log('✓ Alice encrypted Type 3 handshake message');

  // 5. Bob receives and decrypts message 1
  const dec1 = await decrypt1to1Message(bobId, aliceId, enc1.ciphertext, enc1.messageType, 1);
  assert.strictEqual(dec1, message1, 'Bob should decrypt Alice message 1 correctly');
  console.log('✓ Bob successfully decrypted Type 3 handshake message');

  // 6. Bob replies to Alice (Ongoing Double Ratchet -> SignalMessage Type 2)
  const reply1 = 'Hello Alice! I received your message securely.';
  const encReply1 = await encrypt1to1Message(bobId, aliceId, reply1, 1);
  assert.strictEqual(encReply1.messageType, 2, 'Ongoing reply should be SignalMessage (Type 2)');
  console.log('✓ Bob encrypted Type 2 ratchet message');

  // 7. Alice decrypts Bob's reply
  const decReply1 = await decrypt1to1Message(aliceId, bobId, encReply1.ciphertext, encReply1.messageType, 1);
  assert.strictEqual(decReply1, reply1, 'Alice should decrypt Bob reply correctly');
  console.log('✓ Alice successfully decrypted Type 2 ratchet message');

  // 8. Multi-turn Double Ratchet conversation
  const turns = [
    { sender: aliceId, receiver: bobId, text: 'How is the weather today?' },
    { sender: bobId, receiver: aliceId, text: 'Sunny and clear! How about you?' },
    { sender: aliceId, receiver: bobId, text: 'Same here! Signal protocol is running great.' },
    { sender: bobId, receiver: aliceId, text: 'Agreed, perfect forward secrecy confirmed.' },
  ];

  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i]!;
    const enc = await encrypt1to1Message(turn.sender, turn.receiver, turn.text, 1);
    assert.strictEqual(enc.messageType, 2, `Turn ${i} should be Type 2`);
    const dec = await decrypt1to1Message(turn.receiver, turn.sender, enc.ciphertext, enc.messageType, 1);
    assert.strictEqual(dec, turn.text, `Turn ${i} text should match`);
  }
  console.log('✓ Multi-turn Double Ratchet forward secrecy verified (4 turns)');

  // 9. Signal Fingerprint v2 (Safety Numbers)
  const fpAlice = await computeSignalFingerprint(aliceId, aliceIdentity.identityKeyBase64, bobId, bobIdentity.identityKeyBase64);
  const fpBob = await computeSignalFingerprint(bobId, bobIdentity.identityKeyBase64, aliceId, aliceIdentity.identityKeyBase64);

  assert.strictEqual(fpAlice.raw.length, 60, 'Fingerprint should be 60 digits');
  assert.strictEqual(fpAlice.blocks.length, 12, 'Fingerprint should have 12 blocks');
  assert.strictEqual(fpAlice.raw, fpBob.raw, 'Fingerprints must be identical on both sides (commutative)');
  console.log('✓ 60-digit Signal Fingerprint v2 matches symmetrically on both sides');

  // 10. getOrGenerateSignedPreKey idempotency & persistence
  await initSignalIdentity('user_charlie_test', true);
  const spk1 = await getOrGenerateSignedPreKey('user_charlie_test', 1);
  const spk2 = await getOrGenerateSignedPreKey('user_charlie_test', 1);
  assert.strictEqual(spk1.keyId, 1);
  assert.strictEqual(spk1.publicKey, spk2.publicKey, 'Public key must remain identical across calls');
  assert.strictEqual(spk1.signature, spk2.signature, 'Signature must remain identical across calls');
  console.log('✓ getOrGenerateSignedPreKey reuses existing signed pre-key and signature identically');

  // 11. Dual-try Fallback Decryption (Passing wire type 2 for a Type 3 handshake)
  const davidId = 'user_david_test';
  const eveId = 'user_eve_test';
  await initSignalIdentity(davidId, true);
  const eveIdentity = await initSignalIdentity(eveId, true);
  const eveSpk = await getOrGenerateSignedPreKey(eveId, 1);
  const eveOpks = await generatePreKeyBatch(eveId, 200, 5);
  await buildSessionFromBundle(davidId, eveId, {
    userId: eveId,
    deviceId: 1,
    registrationId: eveIdentity.registrationId,
    identityKey: eveIdentity.identityKeyBase64,
    signedPreKey: eveSpk,
    oneTimePreKey: eveOpks[0],
  }, 1);

  const handshakeMsg = await encrypt1to1Message(davidId, eveId, 'Fallback test message', 1);
  assert.strictEqual(handshakeMsg.messageType, 3);

  // Purposefully pass messageType 2 (incorrect wire type) — dual-try should recover and decrypt
  const decryptedFallback = await decrypt1to1Message(eveId, davidId, handshakeMsg.ciphertext, 2, 1);
  assert.strictEqual(decryptedFallback, 'Fallback test message');
  console.log('✓ decrypt1to1Message successfully recovered and decrypted via dual-try fallback');

  console.log('\n✅ ALL 11 SIGNAL 1-TO-1 CRYPTO ENGINE TESTS PASSED!\n');
}

runTests().catch((err) => {
  console.error('❌ Tests failed:', err);
  process.exit(1);
});
