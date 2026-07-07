/**
 * Spotify implementation of MusicProvider - wraps the existing auth/api/
 * playback services. Works on both platforms via OAuth PKCE + Spotify Connect.
 */
import type {Alarm} from '@/types';
import {
  isSpotifyConnected,
  loginWithSpotify,
  logoutSpotify,
} from '@/services/spotify/spotifyAuth';
import {getMe, getMyPlaylists} from '@/services/spotify/spotifyApi';
import {
  rampVolume,
  startAlarmPlayback as startSpotifyPlayback,
  stopAlarmPlayback as stopSpotifyPlayback,
} from '@/services/spotify/spotifyPlayback';
import {selectTrackForAlarm} from '@/services/spotify/trackSelector';
import {logger} from '@/utils/logger';
import type {AlarmPlaybackResult, MusicPlaylist, MusicProvider} from './musicProviderTypes';

let cancelRamp: (() => void) | null = null;

export const spotifyProvider: MusicProvider = {
  id: 'spotify',
  label: 'Spotify',

  async isAvailable() {
    return true; // both platforms
  },

  isConnected: isSpotifyConnected,
  connect: async () => {
    await loginWithSpotify();
  },
  disconnect: logoutSpotify,

  async getAccountLabel() {
    try {
      const me = await getMe();
      const name = me.display_name ?? me.id;
      return `${name} (${me.product === 'premium' ? 'Premium' : 'Free'})`;
    } catch {
      return null;
    }
  },

  async canPlayFullTracks() {
    try {
      return (await getMe()).product === 'premium';
    } catch {
      return false;
    }
  },

  async getPlaylists(): Promise<MusicPlaylist[]> {
    const playlists = await getMyPlaylists();
    return playlists.map(p => ({
      id: p.id,
      name: p.name,
      imageUrl: p.images?.[0]?.url,
      trackCount: p.tracks?.total,
    }));
  },

  async startAlarmPlayback(alarm: Alarm, opts): Promise<AlarmPlaybackResult> {
    try {
      if (!(await this.canPlayFullTracks())) {
        return {status: 'not_subscribed'};
      }
      const track = await selectTrackForAlarm(alarm);
      if (!track) {
        return {status: 'error', message: 'No playable tracks found'};
      }
      const result = await startSpotifyPlayback(track, {
        gradualVolume: opts.gradualVolume,
        wakeSpotifyIfNeeded: true,
      });
      switch (result.status) {
        case 'playing':
          if (opts.gradualVolume) {
            cancelRamp = rampVolume();
          }
          return {status: 'playing', track};
        case 'not_premium':
          return {status: 'not_subscribed'};
        case 'no_device':
          return {status: 'no_device', track};
        case 'error':
          return {status: 'error', track, message: result.message};
      }
    } catch (e) {
      logger.warn('spotifyProvider.startAlarmPlayback failed', e);
      return {status: 'error', message: e instanceof Error ? e.message : 'unknown'};
    }
  },

  async stopPlayback() {
    if (cancelRamp) {
      cancelRamp();
      cancelRamp = null;
    }
    await stopSpotifyPlayback();
  },
};
