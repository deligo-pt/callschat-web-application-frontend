import assert from 'node:assert';
import { createRequire } from 'node:module';
import {
  SignalProtocolStore,
  getSignalProtocolStore,
  withSessionLock,
  ensureArrayBuffer,
} from '../../utils/signalStore';

const require = createRequire(import.meta.url);
const libsignal = require('@privacyresearch/libsignal-protocol-typescript');
const { Direction } = libsignal;

async function runTests() {
  console.log('--- Running SignalProtocolStore Unit Tests ---');
  const userId = 'user_test_store_123';
  const store = getSignalProtocolStore(userId);

  // 1. ArrayBuffer converter
  const sampleBytes = new Uint8Array([1, 2, 3, 4, 5]);
  const buf = ensureArrayBuffer(sampleBytes);
  assert.strictEqual(buf instanceof ArrayBuffer, true);
  assert.strictEqual(buf.byteLength, 5);
  console.log('✓ ensureArrayBuffer works');

  // 2. Identity KeyPair & Registration ID
  const dummyIdentity = {
    pubKey: new Uint8Array([10, 20, 30]).buffer,
    privKey: new Uint8Array([40, 50, 60]).buffer,
  };
  await store.storeIdentityKeyPair(dummyIdentity);
  await store.storeLocalRegistrationId(4321);

  const loadedIdentity = await store.getIdentityKeyPair();
  assert(loadedIdentity, 'Identity keypair should be loaded');
  assert.deepStrictEqual(new Uint8Array(loadedIdentity.pubKey), new Uint8Array([10, 20, 30]));
  assert.deepStrictEqual(new Uint8Array(loadedIdentity.privKey), new Uint8Array([40, 50, 60]));

  const loadedRegId = await store.getLocalRegistrationId();
  assert.strictEqual(loadedRegId, 4321);
  console.log('✓ storeIdentityKeyPair and storeLocalRegistrationId work');

  // 3. One-Time PreKeys
  const opk = {
    pubKey: new Uint8Array([1, 1, 1]).buffer,
    privKey: new Uint8Array([2, 2, 2]).buffer,
  };
  await store.storePreKey(1, opk);
  const loadedOpk = await store.loadPreKey(1);
  assert(loadedOpk, 'OPK 1 should be loaded');
  assert.deepStrictEqual(new Uint8Array(loadedOpk.pubKey), new Uint8Array([1, 1, 1]));

  await store.removePreKey(1);
  const deletedOpk = await store.loadPreKey(1);
  assert.strictEqual(deletedOpk, undefined, 'OPK 1 should be removed');
  console.log('✓ storePreKey, loadPreKey, and removePreKey work');

  // 4. Signed PreKeys
  const spk = {
    pubKey: new Uint8Array([7, 8, 9]).buffer,
    privKey: new Uint8Array([9, 8, 7]).buffer,
  };
  await store.storeSignedPreKey(25, spk);
  const loadedSpk = await store.loadSignedPreKey(25);
  assert(loadedSpk, 'SPK 25 should be loaded');
  assert.deepStrictEqual(new Uint8Array(loadedSpk.pubKey), new Uint8Array([7, 8, 9]));

  await store.removeSignedPreKey(25);
  const deletedSpk = await store.loadSignedPreKey(25);
  assert.strictEqual(deletedSpk, undefined, 'SPK 25 should be removed');
  console.log('✓ storeSignedPreKey, loadSignedPreKey, and removeSignedPreKey work');

  // 5. Session Records
  const address = 'peer_bob.1';
  const serializedSession = JSON.stringify({ version: 3, ratchet: 'test-ratchet-state' });
  await store.storeSession(address, serializedSession);
  const loadedSession = await store.loadSession(address);
  assert.strictEqual(loadedSession, serializedSession);

  await store.removeSession(address);
  const deletedSession = await store.loadSession(address);
  assert.strictEqual(deletedSession, undefined);
  console.log('✓ storeSession, loadSession, and removeSession work');

  // 6. Identity Trust (TOFU)
  const peerIdentKey = new Uint8Array([100, 101, 102]).buffer;
  const isTrustedFirst = await store.isTrustedIdentity('peer_alice.1', peerIdentKey, Direction.SENDING);
  assert.strictEqual(isTrustedFirst, true, 'First identity should be trusted');

  await store.saveIdentity('peer_alice.1', peerIdentKey);
  const isTrustedSecond = await store.isTrustedIdentity('peer_alice.1', peerIdentKey, Direction.SENDING);
  assert.strictEqual(isTrustedSecond, true, 'Same identity should be trusted');

  const untrustedIdentKey = new Uint8Array([200, 201, 202]).buffer;
  const isTrustedMismatch = await store.isTrustedIdentity('peer_alice.1', untrustedIdentKey, Direction.SENDING);
  assert.strictEqual(isTrustedMismatch, false, 'Changed identity should be untrusted');
  console.log('✓ isTrustedIdentity and saveIdentity (TOFU) work');

  // 7. withSessionLock wrapper
  const lockResult = await withSessionLock('test_lock', async () => {
    return 'lock-passed';
  });
  assert.strictEqual(lockResult, 'lock-passed');
  console.log('✓ withSessionLock works');

  console.log('\n✅ ALL 7 SIGNAL PROTOCOL STORE TESTS PASSED!\n');
}

runTests().catch((err) => {
  console.error('❌ Tests failed:', err);
  process.exit(1);
});
