const fs = require('fs');

function writeWav(filename, duration, freq, pattern) {
  const sampleRate = 8000;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = Buffer.alloc(44 + numSamples);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate, 28);
  buffer.writeUInt16LE(1, 32);
  buffer.writeUInt16LE(8, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const value = Math.sin(2 * Math.PI * freq * t) * 127;
    let envelope = 1;
    if (pattern === 'ring') {
       envelope = (i % (sampleRate)) < (sampleRate / 2) ? 1 : 0;
    } else {
       envelope = 1 - (i / numSamples); // simple fade out for pop
    }
    buffer.writeUInt8(Math.round(value * envelope + 128), 44 + i);
  }
  fs.writeFileSync(filename, buffer);
}

writeWav('public/sounds/message-pop.mp3', 0.15, 800, 'pop');
writeWav('public/sounds/ringtone.mp3', 2.0, 500, 'ring');
