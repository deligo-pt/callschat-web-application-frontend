const sodium = require('libsodium-wrappers');
sodium.ready.then(() => {
  const keys = Object.keys(sodium);
  console.log('crypto_box keys:', keys.filter(k => k.includes('crypto_box') && k.includes('xchacha')));
});
