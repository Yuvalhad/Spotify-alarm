/**
 * Challenge 3: dance / movement.
 *
 * MVP: accelerometer-based movement scoring - count strong movement "peaks"
 * (shakes / arm swings while holding the phone) within a time window.
 *
 * SAFETY (by design):
 *  - tasks are simple and stationary-friendly: "shake the phone", "move it
 *    side to side" - never jumping, spinning or anything risky;
 *  - the alarm screen shows: "Do this in a safe place - not while driving
 *    and not near stairs.";
 *  - thresholds are achievable; the emergency escape always exists.
 *
 * Anti-cheat: peaks must exceed a real acceleration threshold AND be spaced
 * ≥ MIN_PEAK_SPACING_MS apart, so tiny wiggles or a single hard tap don't count.
 *
 * TODO(advanced): camera-based movement detection (pose estimation) - only
 * after explicit Camera permission, processed locally.
 */
import {accelerometer, setUpdateIntervalForType, SensorTypes} from 'react-native-sensors';
import type {Subscription} from 'rxjs';

import type {ChallengeContext, ChallengeResult, DanceChallengeSpec} from './challengeTypes';

const SPECS = {
  easy: {requiredMoves: 10, peakThreshold: 5, windowSeconds: 30},
  medium: {requiredMoves: 15, peakThreshold: 6.5, windowSeconds: 30},
  hard: {requiredMoves: 25, peakThreshold: 8, windowSeconds: 40},
} as const;

const PROMPTS = [
  'Shake the phone {n} times to the beat!',
  'Hold the phone and swing it side to side {n} times!',
  'Move! {n} strong moves with the phone in your hand!',
];

const MIN_PEAK_SPACING_MS = 250;
const GRAVITY = 9.81;

export function buildDanceChallenge(ctx: ChallengeContext): DanceChallengeSpec {
  const s = SPECS[ctx.difficulty];
  const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)].replace(
    '{n}',
    String(s.requiredMoves),
  );
  return {kind: 'dance', prompt, ...s};
}

export interface DanceSessionCallbacks {
  /** movesSoFar / requiredMoves progress + current magnitude for the UI meter. */
  onProgress: (moves: number, magnitude: number) => void;
  onFinished: (result: ChallengeResult) => void;
}

export interface DanceSession {
  stop: () => void;
}

export function startDanceSession(
  spec: DanceChallengeSpec,
  cb: DanceSessionCallbacks,
): DanceSession {
  let moves = 0;
  let lastPeakAt = 0;
  let finished = false;
  let subscription: Subscription | null = null;
  const startedAt = Date.now();

  const finish = (result: ChallengeResult) => {
    if (finished) {
      return;
    }
    finished = true;
    subscription?.unsubscribe();
    cb.onFinished(result);
  };

  setUpdateIntervalForType(SensorTypes.accelerometer, 50); // 20 Hz

  subscription = accelerometer.subscribe({
    next: ({x, y, z}) => {
      if (finished) {
        return;
      }
      const now = Date.now();
      // Magnitude of acceleration with gravity magnitude removed (approx).
      const magnitude = Math.abs(Math.sqrt(x * x + y * y + z * z) - GRAVITY);

      if (magnitude >= spec.peakThreshold && now - lastPeakAt >= MIN_PEAK_SPACING_MS) {
        lastPeakAt = now;
        moves += 1;
        cb.onProgress(moves, magnitude);
        if (moves >= spec.requiredMoves) {
          finish({success: true, score: 100});
          return;
        }
      } else {
        cb.onProgress(moves, magnitude);
      }

      if ((now - startedAt) / 1000 > spec.windowSeconds) {
        finish({
          success: false,
          score: Math.round((moves / spec.requiredMoves) * 100),
          reason: 'Time is up - move harder! (safely)',
        });
      }
    },
    error: () => {
      // Sensor unavailable (emulator, rare devices): don't trap the user.
      finish({success: false, reason: 'sensor_unavailable'});
    },
  });

  return {stop: () => finish({success: false, reason: 'cancelled'})};
}
