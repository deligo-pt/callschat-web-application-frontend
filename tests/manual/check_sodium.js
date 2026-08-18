const sodium = require('libsodium-wrappers');
sodium.ready.then(() => {
  console.log(Object.keys(sodium).filter(k => k.includes('xchacha20')));
});
