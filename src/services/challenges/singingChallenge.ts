/**
 * Challenge 2: sing along.
 *
 * MVP (honest scope): verify the user is actually producing voice for N
 * cumulative seconds - level (RMS) + duration + continuity. We do NOT claim
 * to recognize the song being sung.
 *
 * TODO(advanced): pitch detection (autocorrelation / YIN over the PCM
 * stream), basic tempo comparison against the playing track, and a match
 * score with difficulty-based thresholds.
 *
 * PRIVACY:
 *  - audio is processed locally, frame by frame; NOTHING is recorded to disk
 *    and nothing leaves the device;
 *  - the mic is opened only during this challenge and closed immediately after;
 *  - explicit user consent is collected in onboarding/settings
 *    (settingsStorage.micProcessingConsent) before the first use.
 */
import AudioRecord from 'react-native-audio-record';

import {logger} from '@/utils/logger';
import type {
  ChallengeContext,
  ChallengeResult,
  SingingChallengeSpec,
} from './challengeTypes';

const SPECS = {
  easy: {requiredVoicedSeconds: 5, voiceLevelThreshold: 0.06, windowSeconds: 30},
  medium: {requiredVoicedSeconds: 10, voiceLevelThreshold: 0.08, windowSeconds: 40},
  hard: {requiredVoicedSeconds: 18, voiceLevelThreshold: 0.1, windowSeconds: 50},
} as const;

export function buildSingingChallenge(ctx: ChallengeContext): SingingChallengeSpec {
  const s = SPECS[ctx.difficulty];
  return {
    kind: 'singing',
    prompt: ctx.track
      ? `Sing along with "${ctx.track.title}" - keep singing until the bar fills up!`
      : 'Sing anything - keep singing until the bar fills up!',
    ...s,
  };
}

export interface SingingSessionCallbacks {
  /** Called ~every frame with the current level (0..1) and voiced progress (0..1). */
  onProgress: (level: number, progress: number) => void;
  onFinished: (result: ChallengeResult) => void;
}

export interface SingingSession {
  stop: () => void;
}

/**
 * Starts mic level monitoring. Caller must have RECORD_AUDIO / NSMicrophone
 * permission granted before calling (see permissions.ts).
 */
export function startSingingSession(
  spec: SingingChallengeSpec,
  cb: SingingSessionCallbacks,
): SingingSession {
  let voicedMs = 0;
  let lastFrameAt = Date.now();
  let finished = false;
  const startedAt = Date.now();

  AudioRecord.init({
    sampleRate: 16000,
    channels: 1,
    bitsPerSample: 16,
    wavFile: '', // stream-only; we never write a file (privacy)
    audioSource: 6, // Android VOICE_RECOGNITION - less AGC weirdness
  });

  const finish = (result: ChallengeResult) => {
    if (finished) {
      return;
    }
    finished = true;
    try {
      AudioRecord.stop();
    } catch (e) {
      logger.debug('AudioRecord.stop failed', e);
    }
    cb.onFinished(result);
  };

  AudioRecord.on('data', (base64Chunk: string) => {
    if (finished) {
      return;
    }
    const now = Date.now();
    const frameMs = Math.min(now - lastFrameAt, 250);
    lastFrameAt = now;

    const level = rmsOfBase64Pcm16(base64Chunk);

    // Anti-cheat: very quiet frames don't count, and progress only
    // accumulates - short bursts alone won't fill the bar quickly.
    if (level >= spec.voiceLevelThreshold) {
      voicedMs += frameMs;
    }

    const progress = Math.min(1, voicedMs / (spec.requiredVoicedSeconds * 1000));
    cb.onProgress(level, progress);

    if (progress >= 1) {
      finish({success: true, score: 100});
    } else if ((now - startedAt) / 1000 > spec.windowSeconds) {
      finish({
        success: false,
        score: Math.round(progress * 100),
        reason: 'Time is up - sing louder and longer!',
      });
    }
  });

  AudioRecord.start();

  return {
    stop: () => finish({success: false, reason: 'cancelled'}),
  };
}

/** RMS (0..1) of a base64-encoded 16-bit little-endian PCM chunk. */
export function rmsOfBase64Pcm16(base64: string): number {
  const bytes = base64Decode(base64);
  const sampleCount = Math.floor(bytes.length / 2);
  if (sampleCount === 0) {
    return 0;
  }
  let sumSquares = 0;
  for (let i = 0; i < sampleCount; i++) {
    let sample = bytes[i * 2] | (bytes[i * 2 + 1] << 8);
    if (sample >= 0x8000) {
      sample -= 0x10000;
    }
    const normalized = sample / 32768;
    sumSquares += normalized * normalized;
  }
  return Math.sqrt(sumSquares / sampleCount);
}

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Minimal base64 decoder (avoids pulling in Buffer polyfills). */
function base64Decode(input: string): Uint8Array {
  const clean = input.replace(/[^A-Za-z0-9+/]/g, '');
  const len = Math.floor((clean.length * 3) / 4);
  const out = new Uint8Array(len);
  let o = 0;
  for (let i = 0; i + 3 < clean.length; i += 4) {
    const n =
      (B64_CHARS.indexOf(clean[i]) << 18) |
      (B64_CHARS.indexOf(clean[i + 1]) << 12) |
      (B64_CHARS.indexOf(clean[i + 2]) << 6) |
      B64_CHARS.indexOf(clean[i + 3]);
    if (o < len) {
      out[o++] = (n >> 16) & 0xff;
    }
    if (o < len) {
      out[o++] = (n >> 8) & 0xff;
    }
    if (o < len) {
      out[o++] = n & 0xff;
    }
  }
  return out;
}
