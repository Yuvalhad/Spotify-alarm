/**
 * Orchestrates what happens when an alarm rings and the ActiveAlarm screen
 * mounts:
 *
 *   1. load the alarm
 *   2. resolve 'random' challenge mode to a concrete challenge
 *   3. Spotify path: connected? -> premium? -> select track -> start playback
 *   4. on ANY Spotify failure: local fallback sound (the alarm must always ring)
 *   5. expose stopRinging() for the challenge-success / emergency paths
 */
import notifee from '@notifee/react-native';

import type {ActiveAlarmSession, Alarm, ChallengeMode} from '@/types';
import {isSpotifyConnected} from '@/services/spotify/spotifyAuth';
import {isPremiumUser} from '@/services/spotify/spotifyApi';
import {
  rampVolume,
  startAlarmPlayback,
  stopAlarmPlayback,
} from '@/services/spotify/spotifyPlayback';
import {selectTrackForAlarm} from '@/services/spotify/trackSelector';
import {playFallbackSound, stopFallbackSound} from '@/services/audio/fallbackSound';
import {pickRandom} from '@/utils/random';
import {logger} from '@/utils/logger';
import {clearPendingAlarm} from './alarmEvents';

export type RingerStatus =
  | 'starting'
  | 'spotify_playing'
  | 'fallback_no_premium'
  | 'fallback_no_device'
  | 'fallback_error'
  | 'fallback_not_connected';

export interface RingerState {
  session: ActiveAlarmSession;
  status: RingerStatus;
}

const CONCRETE_MODES: Exclude<ChallengeMode, 'random'>[] = ['lyrics', 'singing', 'dance'];

let cancelRamp: (() => void) | null = null;

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

  const fallback = (status: RingerStatus): RingerState => {
    session.usingFallbackSound = true;
    playFallbackSound(alarm.fallbackSound, alarm.gradualVolumeEnabled);
    return {session, status};
  };

  try {
    if (!(await isSpotifyConnected())) {
      return fallback('fallback_not_connected');
    }

    // Premium gate: Web API playback control is Premium-only (Spotify policy).
    const premium = await isPremiumUser().catch(() => false);
    if (!premium) {
      return fallback('fallback_no_premium');
    }

    const track = await selectTrackForAlarm(alarm);
    if (!track) {
      return fallback('fallback_error');
    }
    session.track = track;

    const result = await startAlarmPlayback(track, {
      gradualVolume: alarm.gradualVolumeEnabled,
      wakeSpotifyIfNeeded: true,
    });

    switch (result.status) {
      case 'playing':
        if (alarm.gradualVolumeEnabled) {
          cancelRamp = rampVolume();
        }
        return {session, status: 'spotify_playing'};
      case 'not_premium':
        return fallback('fallback_no_premium');
      case 'no_device':
        return fallback('fallback_no_device');
      case 'error':
        return fallback('fallback_error');
    }
  } catch (e) {
    logger.error('startRinging failed, using fallback sound', e);
    return fallback('fallback_error');
  }
}

/**
 * Stops everything: Spotify playback, fallback sound, the ringing
 * notification, and the pending-alarm marker. Called after a successful
 * challenge or the emergency escape.
 */
export async function stopRinging(state: RingerState): Promise<void> {
  if (cancelRamp) {
    cancelRamp();
    cancelRamp = null;
  }
  stopFallbackSound();
  if (state.status === 'spotify_playing') {
    await stopAlarmPlayback();
  }
  // Dismiss any displayed alarm notifications for this alarm.
  const displayed = await notifee.getDisplayedNotifications();
  await Promise.all(
    displayed
      .filter(n => n.notification.data?.alarmId === state.session.alarmId)
      .map(n => (n.id ? notifee.cancelDisplayedNotification(n.id) : Promise.resolve())),
  );
  await clearPendingAlarm();
}
