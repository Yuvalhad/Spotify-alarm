/**
 * Apple Music implementation of MusicProvider.
 *
 * iOS: backed by a native MusicKit module (ios/WakeTune/MusicKitModule.swift).
 *  - Login = MusicAuthorization.request() - the user's PERSONAL Apple Music
 *    account (the one signed into the device). No OAuth dance, no 25-user
 *    cap, no approval process like Spotify's quota extension.
 *  - Playback runs INSIDE our app via ApplicationMusicPlayer - unlike
 *    Spotify, no external app/device is needed.
 *  - Requires: Apple Music subscription for full tracks; the "MusicKit" app
 *    service enabled for the bundle id (docs/APPLE_MUSIC_SETUP.md);
 *    NSAppleMusicUsageDescription in Info.plist; iOS 16+ device.
 *
 * Android: Apple ships a MusicKit SDK for Android, but it needs a manually
 * issued developer token + separate native integration.
 * TODO(android): integrate Apple MusicKit for Android; until then this
 * provider reports isAvailable() === false on Android and the UI explains.
 */
import {NativeModules, Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type {Alarm, Track} from '@/types';
import {logger} from '@/utils/logger';
import type {AlarmPlaybackResult, MusicPlaylist, MusicProvider} from './musicProviderTypes';

interface NativeNowPlaying {
  title?: string;
  artist?: string;
  artworkUrl?: string;
  durationMs?: number;
}

interface MusicKitModuleType {
  requestAuthorization(): Promise<boolean>;
  isAuthorized(): Promise<boolean>;
  isSubscribed(): Promise<boolean>;
  getUserPlaylists(): Promise<
    {id: string; name: string; artworkUrl?: string; trackCount?: number}[]
  >;
  playPlaylist(playlistId: string): Promise<NativeNowPlaying | null>;
  playLibraryShuffle(): Promise<NativeNowPlaying | null>;
  stop(): Promise<boolean>;
}

const MusicKitModule: MusicKitModuleType | undefined = NativeModules.MusicKitModule;

const CONNECTED_KEY = 'waketune.appleMusic.connected.v1';

function toTrack(np: NativeNowPlaying | null): Track | undefined {
  if (!np || !np.title) {
    return undefined;
  }
  return {
    id: `applemusic-${np.title}`,
    uri: '',
    title: np.title,
    artist: np.artist ?? 'Apple Music',
    albumName: '',
    albumArtUrl: np.artworkUrl,
    durationMs: np.durationMs ?? 0,
  };
}

export const appleMusicProvider: MusicProvider = {
  id: 'apple_music',
  label: 'Apple Music',

  async isAvailable() {
    return Platform.OS === 'ios' && MusicKitModule != null;
  },

  async isConnected() {
    if (!(await this.isAvailable())) {
      return false;
    }
    try {
      const [flag, authorized] = await Promise.all([
        AsyncStorage.getItem(CONNECTED_KEY),
        MusicKitModule!.isAuthorized(),
      ]);
      return flag === '1' && authorized;
    } catch {
      return false;
    }
  },

  async connect() {
    if (!(await this.isAvailable())) {
      throw new Error(
        Platform.OS === 'android'
          ? 'Apple Music is available on iPhone for now'
          : 'Apple Music module is not linked in this build',
      );
    }
    const granted = await MusicKitModule!.requestAuthorization();
    if (!granted) {
      throw new Error('Apple Music access was not authorized');
    }
    await AsyncStorage.setItem(CONNECTED_KEY, '1');
  },

  async disconnect() {
    // MusicKit authorization is managed by iOS Settings; we only forget our flag.
    await AsyncStorage.removeItem(CONNECTED_KEY);
  },

  async getAccountLabel() {
    if (!(await this.isConnected())) {
      return null;
    }
    const subscribed = await MusicKitModule!.isSubscribed().catch(() => false);
    return subscribed ? 'Apple Music (subscribed)' : 'Apple Music (no subscription)';
  },

  async canPlayFullTracks() {
    if (!(await this.isConnected())) {
      return false;
    }
    return MusicKitModule!.isSubscribed().catch(() => false);
  },

  async getPlaylists(): Promise<MusicPlaylist[]> {
    if (!(await this.isConnected())) {
      return [];
    }
    const items = await MusicKitModule!.getUserPlaylists();
    return items.map(p => ({
      id: p.id,
      name: p.name,
      imageUrl: p.artworkUrl,
      trackCount: p.trackCount,
    }));
  },

  async startAlarmPlayback(alarm: Alarm): Promise<AlarmPlaybackResult> {
    try {
      if (!(await this.canPlayFullTracks())) {
        return {status: 'not_subscribed'};
      }
      // Playlist source plays the chosen library playlist; every other source
      // shuffles the user's library.
      // TODO(apple-music): mirror Spotify's per-source selection (top tracks /
      // artist) via MusicKit catalog+library requests.
      const nowPlaying =
        alarm.musicSourceType === 'playlist' && alarm.musicPlaylistId
          ? await MusicKitModule!.playPlaylist(alarm.musicPlaylistId)
          : await MusicKitModule!.playLibraryShuffle();
      // NOTE: gradual volume is not supported here - ApplicationMusicPlayer
      // has no volume API (system volume applies). TODO(ios): optional
      // MPVolumeView-based ramp.
      return {status: 'playing', track: toTrack(nowPlaying)};
    } catch (e) {
      logger.warn('appleMusicProvider.startAlarmPlayback failed', e);
      return {status: 'error', message: e instanceof Error ? e.message : 'unknown'};
    }
  },

  async stopPlayback() {
    if (MusicKitModule) {
      await MusicKitModule.stop().catch(() => undefined);
    }
  },
};
