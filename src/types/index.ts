/**
 * Core data models shared across the app.
 */

export type MusicSourceType =
  | 'liked_songs'
  | 'top_tracks'
  | 'playlist'
  | 'artist'
  | 'random_library';

export type ChallengeMode = 'lyrics' | 'singing' | 'dance' | 'random';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type TrackPickStrategy = 'most_loved' | 'random' | 'energetic' | 'newest';

export interface AlarmTime {
  /** 0-23 */
  hour: number;
  /** 0-59 */
  minute: number;
}

export interface Alarm {
  id: string;
  time: AlarmTime;
  /**
   * Days the alarm repeats on. 0 = Sunday ... 6 = Saturday.
   * Empty array = one-shot alarm (fires once at the next occurrence of `time`).
   */
  daysOfWeek: number[];
  enabled: boolean;
  label?: string;

  /** Which streaming service this alarm plays from ('spotify' | 'apple_music'). */
  musicProvider?: 'spotify' | 'apple_music';
  musicSourceType: MusicSourceType;
  /** Required when musicSourceType === 'playlist' (id within the provider). */
  musicPlaylistId?: string;
  /** Required when musicSourceType === 'artist'. */
  spotifyArtistId?: string;
  trackPickStrategy: TrackPickStrategy;

  challengeMode: ChallengeMode;
  difficulty: Difficulty;

  gradualVolumeEnabled: boolean;
  /** Bundled fallback sound key, see services/audio/fallbackSound.ts */
  fallbackSound: string;

  createdAt: string;
  updatedAt: string;
}

export interface Track {
  id: string;
  uri: string;
  title: string;
  artist: string;
  albumName: string;
  albumArtUrl?: string;
  durationMs: number;
}

export interface ChallengeResult {
  success: boolean;
  /** 0-100 where relevant (singing / dance). */
  score?: number;
  reason?: string;
}

/** What actually happened when the alarm fired (for the active alarm screen). */
export interface ActiveAlarmSession {
  alarmId: string;
  startedAt: string;
  track?: Track;
  /** True when Spotify playback failed and we fell back to the local sound. */
  usingFallbackSound: boolean;
  /** The concrete challenge chosen for this ring (random mode is resolved here). */
  resolvedChallengeMode: Exclude<ChallengeMode, 'random'>;
}
