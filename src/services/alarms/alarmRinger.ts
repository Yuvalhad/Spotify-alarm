/**
 * Orchestrates what happens when an alarm rings and the ActiveAlarm screen
 * mounts:
 *
 *   1. load the alarm
 *   2. resolve 'random' challenge mode to a concrete challenge
 *   3. music path: resolve the alarm's provider (Spotify / Apple Music) ->
 *      connected? -> provider.startAlarmPlayback()
 *   4. on ANY failure: local fallback sound (the alarm must always ring)
 *   5. expose stopRinging() for the challenge-success / emergency paths
 */
import notifee from '@notifee/react-native';

import type {ActiveAlarmSession, Alarm, ChallengeMode} from '@/types';
import {getProviderForAlarm} from '@/services/music';
import type {MusicProvider} from '@/services/music';
import {playFallbackSound, stopFallbackSound} from '@/services/audio/fallbackSound';
import {pickRandom} from '@/utils/random';
import {logger} from '@/utils/logger';
import {clearPendingAlarm} from './alarmEvents';

export type RingerStatus =
  | 'starting'
  | 'music_playing'
  | 'fallback_not_subscribed'
  | 'fallback_no_device'
  | 'fallback_error'
  | 'fallback_not_connected';

export interface RingerState {
  session: ActiveAlarmSession;
  status: RingerStatus;
  providerLabel?: string;
}

const CONCRETE_MODES: Exclude<ChallengeMode, 'random'>[] = ['lyrics', 'singing', 'dance'];

let activeProvider: MusicProvider | null = null;

export function resolveChallengeMode(alarm: Alarm): Exclude<ChallengeMode, 'random'> {
  return alarm.challengeMode === 'random' ? pickRandom(CONCRETE_MODES) : alarm.challengeMode;
}

export async function startRinging(alarm: Alarm): Promise<RingerState> {
  const session: ActiveAlarmSession = {
    alarmId: alarm.id,
    startedAt: new Date().toISOString(),
    usingFallbackSound: false,
    resolvedChallengeMode: resolveChallengeMode(alarm),
  };

  const fallback = (status: RingerStatus, providerLabel?: string): RingerState => {
    session.usingFallbackSound = true;
    playFallbackSound(alarm.fallbackSound, alarm.gradualVolumeEnabled);
    return {session, status, providerLabel};
  };

  try {
    const provider = await getProviderForAlarm(alarm);
    if (!provider || !(await provider.isConnected())) {
      return fallback('fallback_not_connected', provider?.label);
    }
    activeProvider = provider;

    const result = await provider.startAlarmPlayback(alarm, {
      gradualVolume: alarm.gradualVolumeEnabled,
    });
    session.track = result.track;

    switch (result.status) {
      case 'playing':
        return {session, status: 'music_playing', providerLabel: provider.label};
      case 'not_subscribed':
        return fallback('fallback_not_subscribed', provider.label);
      case 'no_device':
        return fallback('fallback_no_device', provider.label);
      case 'error':
        return fallback('fallback_error', provider.label);
    }
  } catch (e) {
    logger.error('startRinging failed, using fallback sound', e);
    return fallback('fallback_error');
  }
}

/**
 * Stops everything: streaming playback, fallback sound, the ringing
 * notification, and the pending-alarm marker. Called after a successful
 * challenge or the emergency escape.
 */
export async function stopRinging(state: RingerState): Promise<void> {
  stopFallbackSound();
  if (state.status === 'music_playing' && activeProvider) {
    await activeProvider.stopPlayback().catch(e => {
      logger.debug('provider.stopPlayback failed (ignored)', e);
    });
  }
  activeProvider = null;
  // Dismiss any displayed alarm notifications for this alarm.
  const displayed = await notifee.getDisplayedNotifications();
  await Promise.all(
    displayed
      .filter(n => n.notification.data?.alarmId === state.session.alarmId)
      .map(n => (n.id ? notifee.cancelDisplayedNotification(n.id) : Promise.resolve())),
  );
  await clearPendingAlarm();
}
