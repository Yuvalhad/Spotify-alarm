/**
 * Playback orchestration on top of the official Spotify Connect Web API.
 *
 * HARD PLATFORM/POLICY REALITIES (do not "fix" these, they are by design):
 *  - Full-track playback control requires Spotify PREMIUM. Free users get a
 *    clear message and the local fallback sound instead.
 *  - The Web API can only control an EXISTING Spotify Connect device. If the
 *    Spotify app process is dead on this phone, there is no device to command.
 *    Our strategy: try devices -> try waking the Spotify app via deep link
 *    (only possible when WakeTune is foregrounded, e.g. after the full-screen
 *    alarm activity opened) -> retry -> otherwise local fallback sound.
 *  - iOS: none of this can happen while WakeTune is killed. The local
 *    notification rings first; Spotify playback starts when the user opens
 *    the alarm screen. See alarmScheduler.ios.ts.
 */
import {Linking} from 'react-native';

import type {Track} from '@/types';
import {logger} from '@/utils/logger';
import {getDevices, pausePlayback, setVolume, startPlayback, SpotifyApiError} from './spotifyApi';
import type {SpotifyDevice} from './spotifyTypes';

export type PlaybackStartResult =
  | {status: 'playing'; deviceName: string}
  | {status: 'no_device'}
  | {status: 'not_premium'}
  | {status: 'error'; message: string};

const DEVICE_POLL_ATTEMPTS = 5;
const DEVICE_POLL_INTERVAL_MS = 2000;

function pickBestDevice(devices: SpotifyDevice[]): SpotifyDevice | undefined {
  const usable = devices.filter(d => !d.is_restricted && d.id);
  return (
    usable.find(d => d.is_active) ??
    usable.find(d => d.type === 'Smartphone') ??
    usable[0]
  );
}

/**
 * Tries to open the Spotify app so it registers as a Connect device.
 * Works only when our app is in the foreground (alarm screen is open).
 */
export async function tryWakeSpotifyApp(): Promise<boolean> {
  try {
    const canOpen = await Linking.canOpenURL('spotify:');
    if (!canOpen) {
      return false;
    }
    await Linking.openURL('spotify:');
    return true;
  } catch {
    return false;
  }
}

/**
 * Main entry: try to start playing `track` on the best available device.
 * Never throws - always resolves to a PlaybackStartResult so the alarm
 * flow can decide on fallback.
 */
export async function startAlarmPlayback(
  track: Track,
  opts: {gradualVolume: boolean; wakeSpotifyIfNeeded: boolean},
): Promise<PlaybackStartResult> {
  try {
    let device = pickBestDevice((await getDevices()).devices);

    if (!device && opts.wakeSpotifyIfNeeded) {
      logger.info('No Spotify device - trying to wake the Spotify app');
      const woke = await tryWakeSpotifyApp();
      if (woke) {
        for (let i = 0; i < DEVICE_POLL_ATTEMPTS && !device; i++) {
          await new Promise<void>(r => setTimeout(() => r(), DEVICE_POLL_INTERVAL_MS));
          device = pickBestDevice((await getDevices()).devices);
        }
      }
    }

    if (!device || !device.id) {
      return {status: 'no_device'};
    }

    if (opts.gradualVolume) {
      // Start quiet; ramp is driven by rampVolume() from the alarm screen.
      await setVolume(20).catch(() => undefined);
    }

    await startPlayback(device.id, [track.uri]);
    logger.info(`Spotify playback started on ${device.name}`);
    return {status: 'playing', deviceName: device.name};
  } catch (e) {
    if (e instanceof SpotifyApiError) {
      // 403 on /me/player/play is the documented "Premium required" answer.
      if (e.status === 403) {
        return {status: 'not_premium'};
      }
      if (e.status === 404) {
        return {status: 'no_device'};
      }
    }
    logger.warn('startAlarmPlayback failed', e);
    return {status: 'error', message: e instanceof Error ? e.message : 'unknown'};
  }
}

/**
 * Gradual volume ramp 20% -> 85%. SAFETY: capped below 100% - never blast
 * max volume into someone's ears at 7am.
 */
export function rampVolume(durationMs = 45_000): () => void {
  const START = 20;
  const END = 85;
  const STEPS = 8;
  let cancelled = false;
  let step = 0;

  const interval = setInterval(async () => {
    if (cancelled) {
      return;
    }
    step += 1;
    const v = START + ((END - START) * step) / STEPS;
    await setVolume(v).catch(() => undefined);
    if (step >= STEPS) {
      clearInterval(interval);
    }
  }, durationMs / STEPS);

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}

export async function stopAlarmPlayback(): Promise<void> {
  try {
    await pausePlayback();
  } catch (e) {
    // Pause failing is non-fatal (device may already be gone).
    logger.debug('pausePlayback failed (ignored)', e);
  }
}
