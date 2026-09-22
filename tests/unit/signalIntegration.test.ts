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
  decryptSenderMessageWithChainKey,
} from '../../utils/senderKeyEngine';
import {
  exportLocalKeyBundle,
  restoreLocalKeyBundle,
  storeSenderKey,
  getStoredSenderKey,
  clearSenderKey,
  getUserPrivateKey,
  getUserPublicKey,
  storeUserKeys,
  getUserPrivateKeyRing,
  getUserHistoricalPrivateKeys,
} from '../../utils/keyStore';
import {
  decryptMessage,
  encryptMessage,
  bytesToBase64,
  base64ToBytes,
} from '../../utils/crypto';
import { x25519 } from '@noble/curves/ed25519.js';

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
    userId: userBob,
    deviceId: 1,
    identityKey: bobIdentity.identityKeyBase64,
    registrationId: bobIdentity.registrationId,
    signedPreKey: {
      keyId: bobSPK.keyId,
      publicKey: bobSPK.publicKey,
      signature: bobSPK.signature,
    },
    oneTimePreKey: {
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

  // Alice sends Message 3 before David joins
  const gMsg3 = await encryptGroupSenderMessage(groupId, userAlice, 'Group Message 3: Scope finalized', userAlice);
  assert.strictEqual(gMsg3.iteration, 2);

  // 5. Late-Joining Member (David) History Replay & Bi-directional Group Messaging
  const userDavid = 'user_david_' + Date.now();
  await initSignalIdentity(userDavid);
  const davidPub = await getUserPublicKey(userDavid);
  const davidPriv = await getUserPrivateKey(userDavid);
  assert.ok(davidPub && davidPriv);

  // Alice checks group members, detects David is new, and distributes initialChainKey (iteration 0)
  const storedAliceSK = await getStoredSenderKey(groupId, userAlice, userAlice);
  assert.ok(storedAliceSK && storedAliceSK.initialChainKey);
  const wrapDavid = wrapSenderKeyForMember(storedAliceSK.initialChainKey, davidPub, alicePriv);

  // David unwraps Alice's sender key
  const davidUnwrappedCK = unwrapSenderKeyFromMember(wrapDavid.encryptedKey, wrapDavid.nonce, alicePub, davidPriv);
  assert.strictEqual(davidUnwrappedCK, aliceSK.initialChainKey);

  // David stores Alice's sender key at iteration 0 with initialChainKey preserved
  await storeSenderKey(
    groupId,
    userAlice,
    {
      groupId,
      senderId: userAlice,
      chainKey: davidUnwrappedCK,
      iteration: 0,
      initialChainKey: davidUnwrappedCK,
      senderKeyId: `sk_${userAlice}`,
      updatedAt: new Date().toISOString(),
    },
    userDavid
  );

  // David fetches past history and replays from iteration 0 using in-memory ratchet state
  let davidReplayCK = davidUnwrappedCK;
  let davidReplayIter = 0;

  const historyMessages = [gMsg1, gMsg2, gMsg3];
  const davidDecryptedHistory: string[] = [];

  for (const hMsg of historyMessages) {
    const decRes = decryptSenderMessageWithChainKey(
      davidReplayCK,
      davidReplayIter,
      hMsg.iteration,
      hMsg.ciphertext,
      hMsg.nonce
    );
    davidDecryptedHistory.push(decRes.plaintext);
    davidReplayCK = decRes.nextChainKey;
    davidReplayIter = decRes.nextIteration;
  }

  assert.deepStrictEqual(davidDecryptedHistory, [
    'Group Message 1: Project kickoff',
    'Group Message 2: Architecture approved',
    'Group Message 3: Scope finalized',
  ]);
  console.log('✓ Late-joining member David successfully decrypted all 3 historical messages via initialChainKey replay');

  // David persists ratcheted state after history replay so live messages decrypt seamlessly
  await storeSenderKey(
    groupId,
    userAlice,
    {
      groupId,
      senderId: userAlice,
      chainKey: davidReplayCK,
      iteration: davidReplayIter,
      initialChainKey: davidUnwrappedCK,
      senderKeyId: `sk_${userAlice}`,
      updatedAt: new Date().toISOString(),
    },
    userDavid
  );

  // David replies to the group with his own fresh Sender Key
  const davidSK = generateSenderKey(groupId, userDavid);
  await storeSenderKey(groupId, userDavid, davidSK, userDavid);
  const wrapAliceFromDavid = wrapSenderKeyForMember(davidSK.chainKey, alicePub, davidPriv);

  // Alice unwraps David's sender key
  const aliceUnwrappedDavidCK = unwrapSenderKeyFromMember(
    wrapAliceFromDavid.encryptedKey,
    wrapAliceFromDavid.nonce,
    davidPub,
    alicePriv
  );
  await storeSenderKey(
    groupId,
    userDavid,
    {
      groupId,
      senderId: userDavid,
      chainKey: aliceUnwrappedDavidCK,
      iteration: 0,
      initialChainKey: aliceUnwrappedDavidCK,
      senderKeyId: `sk_${userDavid}`,
      updatedAt: new Date().toISOString(),
    },
    userAlice
  );

  // David encrypts and sends message
  const gMsgDavid = await encryptGroupSenderMessage(
    groupId,
    userDavid,
    'David: Thanks for adding me! I have read all past messages.',
    userDavid
  );
  const aliceDecDavid = await decryptGroupSenderMessage(
    groupId,
    userDavid,
    gMsgDavid.ciphertext,
    gMsgDavid.nonce,
    gMsgDavid.iteration,
    userAlice
  );
  assert.strictEqual(aliceDecDavid.plaintext, 'David: Thanks for adding me! I have read all past messages.');
  console.log('✓ Alice successfully decrypted late-joining member David\'s first group message');

  // Alice sends live message 4, which David decrypts in real-time
  const gMsg4 = await encryptGroupSenderMessage(
    groupId,
    userAlice,
    'Group Message 4: Welcome to the team David!',
    userAlice
  );
  assert.strictEqual(gMsg4.iteration, 3);

  const davidDec4 = await decryptGroupSenderMessage(
    groupId,
    userAlice,
    gMsg4.ciphertext,
    gMsg4.nonce,
    gMsg4.iteration,
    userDavid
  );
  assert.strictEqual(davidDec4.plaintext, 'Group Message 4: Welcome to the team David!');
  console.log('✓ Late-joining member David decrypted live ongoing Message 4 without ratchet errors');

  // 6. Key Vault Export and Restore
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

  // 7. Peer Key Update & Session Re-establishment Protocol
  console.log('\n--- Testing Peer Key Update & Session Invalidation ---');
  // Bob reinstalls the app or rotates his identity key:
  const bobNewIdentity = await initSignalIdentity(userBob, true); // force new identity
  assert.notStrictEqual(bobNewIdentity.identityKeyBase64, bobIdentity.identityKeyBase64);
  const bobNewSPK = await generateSignedPreKey(userBob, 2);
  const bobNewOPKs = await generatePreKeyBatch(userBob, 200, 5);

  const bobNewBundle = {
    userId: userBob,
    deviceId: 1,
    identityKey: bobNewIdentity.identityKeyBase64,
    registrationId: bobNewIdentity.registrationId,
    signedPreKey: {
      keyId: bobNewSPK.keyId,
      publicKey: bobNewSPK.publicKey,
      signature: bobNewSPK.signature,
    },
    oneTimePreKey: {
      keyId: bobNewOPKs[0]!.keyId,
      publicKey: bobNewOPKs[0]!.publicKey,
    },
  };

  // Alice receives peer key updated event or detects Bob's key rotation on bundle sync:
  // buildSessionFromBundle automatically overwrites trusted identity and clears old session
  await buildSessionFromBundle(userAlice, userBob, bobNewBundle, 1);
  console.log('✓ Alice re-established fresh session from Bob\'s updated bundle without UntrustedIdentityException');

  // Alice sends a new message to Bob (Handshake Type 3 to start new ratchet)
  const rekeyedMsgText = 'Hello Bob, communicating with your new identity key!';
  const rekeyedEnc = await encrypt1to1Message(userAlice, userBob, rekeyedMsgText, 1);
  assert.strictEqual(rekeyedEnc.messageType, 3);

  // Bob decrypts with his new identity key and private one-time prekey
  const bobDecryptedRekeyed = await decrypt1to1Message(
    userBob,
    userAlice,
    rekeyedEnc.ciphertext,
    rekeyedEnc.messageType,
    1
  );
  assert.strictEqual(bobDecryptedRekeyed, rekeyedMsgText);
  console.log('✓ Bob successfully decrypted re-keyed handshake message with his new identity');

  // Bob replies to Alice with ongoing ratchet (Type 2)
  const bobNewReply = await encrypt1to1Message(userBob, userAlice, 'Hello Alice, new session active!', 1);
  assert.strictEqual(bobNewReply.messageType, 2);

  const aliceDecryptedNewReply = await decrypt1to1Message(
    userAlice,
    userBob,
    bobNewReply.ciphertext,
    bobNewReply.messageType,
    1
  );
  assert.strictEqual(aliceDecryptedNewReply, 'Hello Alice, new session active!');
  console.log('✓ Bidirectional Double Ratchet continues seamlessly across peer key rotation');

  // Group Chat: Alice re-distributes sender key to Bob with his new public key
  const aliceSenderKey = await getStoredSenderKey(groupId, userAlice, userAlice);
  assert.ok(aliceSenderKey);
  const alicePrivForBob = await getUserPrivateKey(userAlice);
  assert.ok(alicePrivForBob);
  const rewrappedSK = wrapSenderKeyForMember(
    aliceSenderKey.initialChainKey || aliceSenderKey.chainKey,
    bobNewIdentity.identityKeyBase64,
    alicePrivForBob
  );
  // Bob unwraps with his new private key
  const bobNewPriv = await getUserPrivateKey(userBob);
  assert.ok(bobNewPriv);
  const unwrappedChainKey = unwrapSenderKeyFromMember(
    rewrappedSK.encryptedKey,
    rewrappedSK.nonce,
    aliceIdentity.identityKeyBase64,
    bobNewPriv
  );
  assert.ok(unwrappedChainKey);
  console.log('✓ Group Sender Key successfully re-wrapped and unwrapped for Bob\'s new public key');

  // 6. Historical Private Key Ring & Sender Self-Decryption across Key Updates
  console.log('\n--- Testing Historical Key Ring & Sender Self-Decryption across Key Updates ---');

  const testSender = 'user_sender_' + Date.now();

  // Generation 1: Initial key pair
  const privGen1 = bytesToBase64(x25519.utils.randomSecretKey());
  const pubGen1 = bytesToBase64(x25519.getPublicKey(base64ToBytes(privGen1)));
  await storeUserKeys(testSender, privGen1, pubGen1);

  // Sender encrypts a message for themselves (selfEncryptedSessionKey style) using pubGen1
  const sentMsgGen1 = 'Historical message from sender Gen 1';
  const encGen1 = await encryptMessage(sentMsgGen1, pubGen1, privGen1);

  // Sender can decrypt it with current active key (privGen1)
  const decActive1 = await decryptMessage(encGen1.ciphertext, encGen1.nonce, pubGen1, privGen1);
  assert.strictEqual(decActive1, sentMsgGen1);
  console.log('✓ Sender encrypted and self-decrypted Generation 1 message');

  // Generation 2: Key rotation / update
  const privGen2 = bytesToBase64(x25519.utils.randomSecretKey());
  const pubGen2 = bytesToBase64(x25519.getPublicKey(base64ToBytes(privGen2)));
  await storeUserKeys(testSender, privGen2, pubGen2);

  // Verify: active key is privGen2, history contains privGen1, ring has [privGen2, privGen1]
  const currentPriv = await getUserPrivateKey(testSender);
  assert.strictEqual(currentPriv, privGen2);

  const historyAfterGen2 = await getUserHistoricalPrivateKeys(testSender);
  assert.deepStrictEqual(historyAfterGen2, [privGen1]);

  const ringAfterGen2 = await getUserPrivateKeyRing(testSender);
  assert.deepStrictEqual(ringAfterGen2, [privGen2, privGen1]);
  console.log('✓ Key update archived Gen 1 private key and constructed [Gen2, Gen1] key ring');

  // Verify that decrypting Gen 1 message with ONLY active key (privGen2) fails
  let directDecryptFailed = false;
  try {
    await decryptMessage(encGen1.ciphertext, encGen1.nonce, pubGen1, privGen2);
  } catch {
    directDecryptFailed = true;
  }
  assert.ok(directDecryptFailed, 'Active key alone must fail to decrypt message encrypted for old key');

  // Decrypt using the historical key ring (iterating candidates, as implemented in useChat.ts)
  let recoveredTextGen1: string | null = null;
  for (const privCandidate of ringAfterGen2) {
    try {
      const dec = await decryptMessage(encGen1.ciphertext, encGen1.nonce, pubGen1, privCandidate);
      if (dec) {
        recoveredTextGen1 = dec;
        break;
      }
    } catch {}
  }
  assert.strictEqual(recoveredTextGen1, sentMsgGen1);
  console.log('✓ Sender historical key ring successfully recovered and decrypted Generation 1 sent message');

  // Generation 3: Another key update
  const privGen3 = bytesToBase64(x25519.utils.randomSecretKey());
  const pubGen3 = bytesToBase64(x25519.getPublicKey(base64ToBytes(privGen3)));
  await storeUserKeys(testSender, privGen3, pubGen3);

  const ringAfterGen3 = await getUserPrivateKeyRing(testSender);
  assert.deepStrictEqual(ringAfterGen3, [privGen3, privGen2, privGen1]);

  // Sender encrypts a Gen 2 message under pubGen2
  const sentMsgGen2 = 'Historical message from sender Gen 2';
  const encGen2 = await encryptMessage(sentMsgGen2, pubGen2, privGen2);

  // Both Gen 1 and Gen 2 messages decrypt using ringAfterGen3
  let recoveredGen1Again: string | null = null;
  for (const privCand of ringAfterGen3) {
    try {
      const d = await decryptMessage(encGen1.ciphertext, encGen1.nonce, pubGen1, privCand);
      if (d) { recoveredGen1Again = d; break; }
    } catch {}
  }
  assert.strictEqual(recoveredGen1Again, sentMsgGen1);

  let recoveredGen2: string | null = null;
  for (const privCand of ringAfterGen3) {
    try {
      const d = await decryptMessage(encGen2.ciphertext, encGen2.nonce, pubGen2, privCand);
      if (d) { recoveredGen2 = d; break; }
    } catch {}
  }
  assert.strictEqual(recoveredGen2, sentMsgGen2);
  console.log('✓ Multi-generation historical key ring successfully decrypted all sent messages');

  // Vault backup and restore: preserves historicalPrivateKeys
  const vaultBundle = await exportLocalKeyBundle(testSender);
  assert.ok(vaultBundle.historicalPrivateKeys);
  assert.deepStrictEqual(vaultBundle.historicalPrivateKeys, [privGen2, privGen1]);

  const restoredUser = 'user_restored_' + Date.now();
  await restoreLocalKeyBundle(restoredUser, vaultBundle);

  const restoredRing = await getUserPrivateKeyRing(restoredUser);
  assert.deepStrictEqual(restoredRing, [privGen3, privGen2, privGen1]);

  let restoredDecGen1: string | null = null;
  for (const privCand of restoredRing) {
    try {
      const d = await decryptMessage(encGen1.ciphertext, encGen1.nonce, pubGen1, privCand);
      if (d) { restoredDecGen1 = d; break; }
    } catch {}
  }
  assert.strictEqual(restoredDecGen1, sentMsgGen1);
  console.log('✓ Vault export/restore preserved historical key ring and restored full history decryption');

  console.log('\n🎉 ALL INTEGRATION E2EE TESTS PASSED SUCCESSFULLY! 🎉');
}

runIntegratedE2EETests().catch((err) => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
