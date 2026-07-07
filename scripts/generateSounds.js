#!/usr/bin/env node
/**
 * Generates the bundled fallback alarm sounds as 16-bit PCM WAV files.
 * All sounds are synthesized here (sine/triangle tones) - fully original,
 * royalty-free by construction.
 *
 * Usage: node scripts/generateSounds.js
 * Outputs to android/app/src/main/res/raw/ and ios/WakeTune/.
 */
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;

function writeWav(filePath, samples) {
  const dataSize = samples.length * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); // PCM chunk size
  buf.writeUInt16LE(1, 20); // PCM format
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32); // block align
  buf.writeUInt16LE(16, 34); // bits per sample
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  fs.mkdirSync(path.dirname(filePath), {recursive: true});
  fs.writeFileSync(filePath, buf);
  console.log(`wrote ${filePath} (${(buf.length / 1024).toFixed(0)} KB)`);
}

/** Adds a tone into `out` at [start, start+dur) seconds. */
function tone(out, startSec, durSec, freq, amp = 0.5, shape = 'sine') {
  const start = Math.floor(startSec * SAMPLE_RATE);
  const n = Math.floor(durSec * SAMPLE_RATE);
  const fadeN = Math.min(Math.floor(0.01 * SAMPLE_RATE), Math.floor(n / 4));
  for (let i = 0; i < n && start + i < out.length; i++) {
    const t = i / SAMPLE_RATE;
    let v = Math.sin(2 * Math.PI * freq * t);
    if (shape === 'triangle') {
      v = (2 / Math.PI) * Math.asin(v);
    }
    // Short fade in/out to avoid clicks.
    let env = 1;
    if (i < fadeN) env = i / fadeN;
    else if (i > n - fadeN) env = (n - i) / fadeN;
    out[start + i] += v * amp * env;
  }
}

function silence(seconds) {
  return new Float64Array(Math.floor(seconds * SAMPLE_RATE));
}

// --- classic_beep: the timeless double-beep alarm, 4s loop -----------------
function classicBeep() {
  const out = silence(4);
  for (const base of [0, 1]) {
    tone(out, base + 0.0, 0.18, 880, 0.55);
    tone(out, base + 0.25, 0.18, 880, 0.55);
    tone(out, base + 0.5, 0.18, 880, 0.55);
    tone(out, base + 0.75, 0.18, 880, 0.55);
  }
  // second half slightly higher for urgency
  for (const base of [2, 3]) {
    tone(out, base + 0.0, 0.18, 988, 0.55);
    tone(out, base + 0.25, 0.18, 988, 0.55);
    tone(out, base + 0.5, 0.18, 988, 0.55);
    tone(out, base + 0.75, 0.18, 988, 0.55);
  }
  return out;
}

// --- gentle_rise: soft major chord swells, 8s loop --------------------------
function gentleRise() {
  const out = silence(8);
  const chord = [261.63, 329.63, 392.0]; // C major
  for (let rep = 0; rep < 2; rep++) {
    const start = rep * 4;
    for (const f of chord) {
      // Slow attack: three overlapping swells
      tone(out, start + 0.0, 2.2, f, 0.12, 'triangle');
      tone(out, start + 1.6, 2.2, f * 2, 0.08, 'triangle');
    }
    tone(out, start + 3.0, 0.9, 523.25, 0.15, 'triangle'); // high C accent
  }
  return out;
}

// --- synth_morning: upbeat arpeggio, 6s loop --------------------------------
function synthMorning() {
  const out = silence(6);
  const seq = [329.63, 392.0, 493.88, 587.33, 493.88, 392.0]; // E G B D B G
  const step = 0.25;
  for (let rep = 0; rep < 4; rep++) {
    seq.forEach((f, i) => {
      tone(out, rep * 1.5 + i * step, step * 0.85, f, 0.35, 'triangle');
    });
  }
  return out;
}

// --- alarm_fallback: notification-channel sound, 25s (iOS caps at 30s) -----
function alarmFallback() {
  const out = silence(25);
  for (let s = 0; s < 25; s += 1.0) {
    tone(out, s + 0.0, 0.2, 880, 0.5);
    tone(out, s + 0.3, 0.2, 880, 0.5);
    tone(out, s + 0.6, 0.2, 1046.5, 0.5);
  }
  return out;
}

const root = path.join(__dirname, '..');
const targets = [
  path.join(root, 'android', 'app', 'src', 'main', 'res', 'raw'),
  path.join(root, 'ios', 'WakeTune', 'Sounds'),
];

const sounds = {
  classic_beep: classicBeep(),
  gentle_rise: gentleRise(),
  synth_morning: synthMorning(),
  alarm_fallback: alarmFallback(),
};

for (const dir of targets) {
  for (const [name, samples] of Object.entries(sounds)) {
    writeWav(path.join(dir, `${name}.wav`), samples);
  }
}
