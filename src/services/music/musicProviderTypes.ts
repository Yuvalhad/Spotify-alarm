/**
 * One interface, two streaming services. Every user connects their PERSONAL
 * account - Spotify or Apple Music - and the rest of the app doesn't care
 * which one it is.
 *
 * Implementations:
 *  - spotifyProvider.ts     (both platforms; OAuth PKCE + Web API/Connect)
 *  - appleMusicProvider.ts  (iOS via native MusicKit; Android: TODO)
 */
import type {Alarm, Track} from '@/types';

export type MusicProviderId = 'spotify' | 'apple_music';

export interface MusicPlaylist {
  id: string;
  name: string;
  imageUrl?: string;
  trackCount?: number;
}

export type AlarmPlaybackStatus =
  | 'playing'
  /** Streaming account can't play full tracks (Spotify Free / no Apple Music subscription). */
  | 'not_subscribed'
  /** Spotify only: no Connect device available. */
  | 'no_device'
  | 'error';

export interface AlarmPlaybackResult {
  status: AlarmPlaybackStatus;
  /** The track that started playing (for the alarm screen), when known. */
  track?: Track;
  message?: string;
}

export interface MusicProvider {
  readonly id: MusicProviderId;
  readonly label: string;
  /** Is this provider usable on this platform/build at all? */
  isAvailable(): Promise<boolean>;
  isConnected(): Promise<boolean>;
  /** Interactive login with the user's personal account (call from a button press). */
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  /** Human-readable account label for Settings ("Yuval (Premium)" / "Apple Music"). */
  getAccountLabel(): Promise<string | null>;
  /** Whether the account tier allows full-track playback. */
  canPlayFullTracks(): Promise<boolean>;
  /** The user's own playlists, for the alarm source picker. */
  getPlaylists(): Promise<MusicPlaylist[]>;
  /**
   * Start alarm music for this alarm. Implementations resolve the alarm's
   * music source themselves and NEVER throw - they return a status the
   * ringer maps to the local fallback sound.
   */
  startAlarmPlayback(
    alarm: Alarm,
    opts: {gradualVolume: boolean},
  ): Promise<AlarmPlaybackResult>;
  stopPlayback(): Promise<void>;
}
