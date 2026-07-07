/**
 * Music provider registry. The user picks their service once (Onboarding /
 * Connect screen); alarms remember which provider they were created with.
 */
import {loadSettings, saveSettings} from '@/services/storage/settingsStorage';
import type {Alarm} from '@/types';
import {appleMusicProvider} from './appleMusicProvider';
import {spotifyProvider} from './spotifyProvider';
import type {MusicProvider, MusicProviderId} from './musicProviderTypes';

export const ALL_PROVIDERS: MusicProvider[] = [spotifyProvider, appleMusicProvider];

export function getProvider(id: MusicProviderId): MusicProvider {
  return id === 'apple_music' ? appleMusicProvider : spotifyProvider;
}

/** The provider the user selected app-wide (null = none connected yet). */
export async function getActiveProvider(): Promise<MusicProvider | null> {
  const settings = await loadSettings();
  return settings.musicProvider ? getProvider(settings.musicProvider) : null;
}

export async function setActiveProvider(id: MusicProviderId | null): Promise<void> {
  await saveSettings({musicProvider: id});
}

/** Provider for a specific alarm (falls back to the app-wide selection). */
export async function getProviderForAlarm(alarm: Alarm): Promise<MusicProvider | null> {
  if (alarm.musicProvider) {
    return getProvider(alarm.musicProvider);
  }
  return getActiveProvider();
}

export type {MusicPlaylist, MusicProvider, MusicProviderId} from './musicProviderTypes';
