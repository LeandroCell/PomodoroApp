// One-off utility to (re)generate the built-in notification sounds as plain PCM WAV files, so the
// app ships fully offline-capable audio without depending on any external/licensed sample library.
// Run with: node scripts/generate-sounds.js
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;

function writeWav(filePath, samples) {
  const numSamples = samples.length;
  const dataSize = numSamples * 2; // 16-bit mono
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
}

function silence(seconds) {
  return new Array(Math.round(SAMPLE_RATE * seconds)).fill(0);
}

function sineTone(freq, seconds, { attack = 0.01, release = 0.2, amplitude = 0.5 } = {}) {
  const n = Math.round(SAMPLE_RATE * seconds);
  const out = new Array(n);
  const attackSamples = Math.round(SAMPLE_RATE * attack);
  const releaseSamples = Math.round(SAMPLE_RATE * release);
  for (let i = 0; i < n; i++) {
    let envelope = 1;
    if (i < attackSamples) envelope = i / attackSamples;
    else if (i > n - releaseSamples) envelope = Math.max(0, (n - i) / releaseSamples);
    out[i] = Math.sin((2 * Math.PI * freq * i) / SAMPLE_RATE) * amplitude * envelope;
  }
  return out;
}

function squareTone(freq, seconds, { amplitude = 0.35, release = 0.03 } = {}) {
  const n = Math.round(SAMPLE_RATE * seconds);
  const out = new Array(n);
  const releaseSamples = Math.round(SAMPLE_RATE * release);
  for (let i = 0; i < n; i++) {
    const phase = ((freq * i) / SAMPLE_RATE) % 1;
    let envelope = 1;
    if (i > n - releaseSamples) envelope = Math.max(0, (n - i) / releaseSamples);
    out[i] = (phase < 0.5 ? amplitude : -amplitude) * envelope;
  }
  return out;
}

function concat(...parts) {
  return [].concat(...parts);
}

const outDir = path.join(__dirname, '..', 'assets', 'sounds');

// Chime: a gentle two-note rising chime (like a soft "ding-dong").
writeWav(
  path.join(outDir, 'chime.wav'),
  concat(sineTone(880, 0.28, { attack: 0.005, release: 0.22, amplitude: 0.5 }), silence(0.04), sineTone(1318.5, 0.4, { attack: 0.005, release: 0.35, amplitude: 0.45 }))
);

// Bell: a single warm tone with a long natural decay.
writeWav(path.join(outDir, 'bell.wav'), sineTone(1046.5, 1.3, { attack: 0.002, release: 1.1, amplitude: 0.55 }));

// Digital: two short crisp square-wave beeps, like a kitchen timer.
writeWav(
  path.join(outDir, 'digital.wav'),
  concat(squareTone(1500, 0.12), silence(0.08), squareTone(1500, 0.12), silence(0.08), squareTone(1900, 0.16))
);

console.log('Generated sounds in', outDir);
