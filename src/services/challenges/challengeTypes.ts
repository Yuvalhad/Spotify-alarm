import type {ChallengeResult, Difficulty, Track} from '@/types';

/**
 * A challenge is a small state machine the ActiveAlarm screen drives:
 * prepare() builds the prompt, then the screen feeds it input (text / mic
 * levels / motion events) and asks for evaluation.
 */
export interface ChallengeContext {
  difficulty: Difficulty;
  track?: Track;
}

export interface LyricsChallengeSpec {
  kind: 'lyrics';
  /** What the user must type. */
  prompt: string;
  /** Text shown to the user to copy (lyrics line / title / artist / sentence). */
  targetText: string;
  /** Whether the target is shown on screen (easy) or partially hidden (hard). */
  showTarget: boolean;
  /** Minimum 0..1 similarity to pass. */
  passThreshold: number;
}

export interface SingingChallengeSpec {
  kind: 'singing';
  prompt: string;
  /** Total seconds of voiced audio required. */
  requiredVoicedSeconds: number;
  /** RMS level (0..1) above which a frame counts as "voiced". */
  voiceLevelThreshold: number;
  /** Overall time window in seconds. */
  windowSeconds: number;
}

export interface DanceChallengeSpec {
  kind: 'dance';
  prompt: string;
  /** Number of qualifying movement peaks (e.g. shakes) required. */
  requiredMoves: number;
  /** Acceleration magnitude (m/s^2, gravity removed) a peak must exceed. */
  peakThreshold: number;
  /** Time window in seconds. */
  windowSeconds: number;
}

export type ChallengeSpec = LyricsChallengeSpec | SingingChallengeSpec | DanceChallengeSpec;

export type {ChallengeResult};
