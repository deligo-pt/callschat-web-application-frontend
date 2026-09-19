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
} from '../../utils/signalCrypto';
import {
  generateSenderKey,
  wrapSenderKeyForMember,
  unwrapSenderKeyFromMember,
  encryptGroupSenderMessage,
  decryptGroupSenderMessage,
} from '../../utils/senderKeyEngine';
import {
  exportLocalKeyBundle,
  restoreLocalKeyBundle,
  storeSenderKey,
  getStoredSenderKey,
  clearSenderKey,
  getUserPrivateKey,
  getUserPublicKey,
} from '../../utils/keyStore';
import { decryptMessage, encryptMessage } from '../../utils/crypto';

async function runIntegratedE2EETests() {
  console.log('--- Running Signal Integrated E2EE Test Suite ---');

  const userAlice = 'user_alice_' + Date.now();
  const userBob = 'user_bob_' + Date.now();
  const userCharlie = 'user_charlie_' + Date.now();
  const groupId = 'group_project_omega_' + Date.now();

  // 1. Initial Setup: Key generation for Alice, Bob, and Charlie
  const aliceIdentity = await initSignalIdentity(userAlice);
  const bobIdentity = await initSignalIdentity(userBob);
  const charlieIdentity = await initSignalIdentity(userCharlie);

  // Participants generate SignedPreKey and One-Time Prekeys (as done in E2EEProvider)
  await getOrGenerateSignedPreKey(userAlice, 1);
  await getOrGenerateSignedPreKey(userCharlie, 1);
  const bobSPK = await generateSignedPreKey(userBob, 1);
  const bobOPKs = await generatePreKeyBatch(userBob, 100, 5);

  assert.strictEqual(bobOPKs.length, 5);
  console.log('✓ Identities and Pre-Key pools generated for all participants');

  // 2. 1-to-1 Messaging Flow: Alice initiates session with Bob
  const bobPreKeyBundle = {
    identityKey: bobIdentity.identityKeyBase64,
    registrationId: bobIdentity.registrationId,
    signedPreKey: {
      keyId: bobSPK.keyId,
      publicKey: bobSPK.publicKey,
      signature: bobSPK.signature,
    },
    preKey: {
      keyId: bobOPKs[0]!.keyId,
      publicKey: bobOPKs[0]!.publicKey,
    },
  };

  await buildSessionFromBundle(userAlice, userBob, bobPreKeyBundle);
  console.log('✓ Alice built Signal session from Bob\'s pre-key bundle');

  // Alice sends first message (Type 3 handshake)
  const handshakeText = 'Hello Bob! This is Signal Handshake.';
  const handshake = await encrypt1to1Message(userAlice, userBob, handshakeText);
  assert.strictEqual(handshake.messageType, 3);
  const alicePrivBefore = await getUserPrivateKey(userAlice);
  const alicePubBefore = await getUserPublicKey(userAlice);
  assert.ok(alicePrivBefore && alicePubBefore);
  const selfEnc = await encryptMessage(handshakeText, alicePubBefore, alicePrivBefore);

  // Bob decrypts handshake message
  const bobDecryptedHandshake = await decrypt1to1Message(
    userBob,
    userAlice,
    handshake.ciphertext,
    handshake.messageType
  );
  assert.strictEqual(bobDecryptedHandshake, 'Hello Bob! This is Signal Handshake.');
  console.log('✓ Handshake message (Type 3) decrypted by Bob successfully');

  // Bob replies (Type 2 ratchet)
  const bobReply = await encrypt1to1Message(userBob, userAlice, 'Hello Alice! Secure session confirmed.');
  assert.strictEqual(bobReply.messageType, 2);

  // Alice decrypts reply
  const aliceDecryptedReply = await decrypt1to1Message(
    userAlice,
    userBob,
    bobReply.ciphertext,
    bobReply.messageType
  );
  assert.strictEqual(aliceDecryptedReply, 'Hello Alice! Secure session confirmed.');
  console.log('✓ Ongoing Double Ratchet (Type 2) reply decrypted by Alice');

  // 3. Safety Number Verification (Signal Fingerprint v2)
  const fpAlice = await computeSignalFingerprint(
    userAlice,
    aliceIdentity.identityKeyBase64,
    userBob,
    bobIdentity.identityKeyBase64
  );
  const fpBob = await computeSignalFingerprint(
    userBob,
    bobIdentity.identityKeyBase64,
    userAlice,
    aliceIdentity.identityKeyBase64
  );

  assert.strictEqual(fpAlice.raw, fpBob.raw);
  assert.strictEqual(fpAlice.raw.length, 60);
  assert.strictEqual(fpAlice.blocks.length, 12);
  console.log('✓ Symmetrical 60-digit Signal Fingerprint verified between Alice and Bob');

  // 4. Group Sender Key Messaging Flow
  // Direct use of Signal Protocol Identity keys for sender key pairwise wrapping
  const alicePriv = await getUserPrivateKey(userAlice);
  const bobPub = await getUserPublicKey(userBob);
  const charliePub = await getUserPublicKey(userCharlie);
  assert.ok(alicePriv && bobPub && charliePub);

  // Alice generates initial sender key for the group
  const aliceSK = generateSenderKey(groupId, userAlice);
  await storeSenderKey(groupId, userAlice, aliceSK, userAlice);

  // Alice wraps sender key for Bob and Charlie using Signal Identity
  const wrapBob = wrapSenderKeyForMember(aliceSK.chainKey, bobPub, alicePriv);
  const wrapCharlie = wrapSenderKeyForMember(aliceSK.chainKey, charliePub, alicePriv);

  // Bob and Charlie unwrap and store Alice's sender key (testing candidate array support)
  const bobPriv = await getUserPrivateKey(userBob);
  const alicePub = await getUserPublicKey(userAlice);
  assert.ok(bobPriv && alicePub);
  const bobCK = unwrapSenderKeyFromMember(wrapBob.encryptedKey, wrapBob.nonce, [alicePub], [bobPriv]);
  await storeSenderKey(
    groupId,
    userAlice,
    {
      groupId,
      senderId: userAlice,
      chainKey: bobCK,
      iteration: 0,
      senderKeyId: `sk_${userAlice}`,
      updatedAt: new Date().toISOString(),
    },
    userBob
  );

  const charliePriv = await getUserPrivateKey(userCharlie);
  assert.ok(charliePriv);
  const charlieCK = unwrapSenderKeyFromMember(wrapCharlie.encryptedKey, wrapCharlie.nonce, alicePub, charliePriv);
  await storeSenderKey(
    groupId,
    userAlice,
    {
      groupId,
      senderId: userAlice,
      chainKey: charlieCK,
      iteration: 0,
      senderKeyId: `sk_${userAlice}`,
      updatedAt: new Date().toISOString(),
    },
    userCharlie
  );
  console.log('✓ Alice distributed Sender Key to Bob and Charlie');

  // Alice encrypts group messages
  const gMsg1 = await encryptGroupSenderMessage(groupId, userAlice, 'Group Message 1: Project kickoff', userAlice);
  assert.strictEqual(gMsg1.messageType, 7);
  assert.strictEqual(gMsg1.iteration, 0);

  const gMsg2 = await encryptGroupSenderMessage(groupId, userAlice, 'Group Message 2: Architecture approved', userAlice);
  assert.strictEqual(gMsg2.messageType, 7);
  assert.strictEqual(gMsg2.iteration, 1);

  // Bob decrypts both messages in order
  const bobDec1 = await decryptGroupSenderMessage(groupId, userAlice, gMsg1.ciphertext, gMsg1.nonce, gMsg1.iteration, userBob);
  const bobDec2 = await decryptGroupSenderMessage(groupId, userAlice, gMsg2.ciphertext, gMsg2.nonce, gMsg2.iteration, userBob);
  assert.strictEqual(bobDec1.plaintext, 'Group Message 1: Project kickoff');
  assert.strictEqual(bobDec2.plaintext, 'Group Message 2: Architecture approved');
  console.log('✓ Bob decrypted both group messages in sequential order');

  // Charlie was offline for msg 1 and receives msg 2 first (out-of-order catch-up)
  const charlieDec2 = await decryptGroupSenderMessage(groupId, userAlice, gMsg2.ciphertext, gMsg2.nonce, gMsg2.iteration, userCharlie);
  assert.strictEqual(charlieDec2.plaintext, 'Group Message 2: Architecture approved');
  assert.strictEqual(charlieDec2.iteration, 1);
  console.log('✓ Charlie caught up ratchet and decrypted msg 2 out-of-order');

  // 5. Key Vault Export and Restore
  const aliceBackup = await exportLocalKeyBundle(userAlice);
  assert.ok(aliceBackup);
  assert.ok(aliceBackup.signalIdentity);
  assert.strictEqual(aliceBackup.signalIdentity.pubKey, aliceIdentity.identityKeyBase64);
  assert.ok(aliceBackup.signedPreKey, 'Backup must include Signed Pre-Key');
  assert.ok(aliceBackup.sessions, 'Backup must include Double Ratchet sessions');

  // Simulate restoring on a new device for Alice (cleared cache / new browser)
  const restoreSuccess = await restoreLocalKeyBundle(userAlice, aliceBackup);
  assert.strictEqual(restoreSuccess, true);

  const restoredIdentity = await initSignalIdentity(userAlice);
  assert.strictEqual(restoredIdentity.identityKeyBase64, aliceIdentity.identityKeyBase64);
  console.log('✓ Key Vault export and restore preserved Signal Identity Key exactly');

  // Verify that restored Alice can continue the ongoing Double Ratchet with Bob
  const bobOngoingMsg = await encrypt1to1Message(
    userBob,
    userAlice,
    'Bob: Still talking after restore!'
  );
  assert.strictEqual(bobOngoingMsg.messageType, 2); // Type 2 = ongoing ratchet

  const decryptedByRestoredAlice = await decrypt1to1Message(
    userAlice,
    userBob,
    bobOngoingMsg.ciphertext,
    bobOngoingMsg.messageType
  );
  assert.strictEqual(decryptedByRestoredAlice, 'Bob: Still talking after restore!');
  console.log('✓ Restored device continued Double Ratchet session and decrypted ongoing message');

  // Verify Alice can decrypt her own sent message history via restored keys
  const alicePrivKey = await getUserPrivateKey(userAlice);
  const alicePubKey = await getUserPublicKey(userAlice);
  assert.ok(alicePrivKey);
  assert.ok(alicePubKey);
  const selfDecrypted = await decryptMessage(
    selfEnc.ciphertext,
    selfEnc.nonce,
    alicePubKey,
    alicePrivKey
  );
  assert.strictEqual(selfDecrypted, handshakeText);
  console.log('✓ Restored device decrypted past sent message history via selfEncryptedSessionKey');

  console.log('\n🎉 ALL INTEGRATION E2EE TESTS PASSED SUCCESSFULLY! 🎉');
}

runIntegratedE2EETests().catch((err) => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
