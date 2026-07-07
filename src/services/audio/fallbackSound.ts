/**
 * Local fallback alarm sound - the safety net that guarantees the alarm is
 * audible even when Spotify fails (no premium / no device / offline / API
 * error). Plays a bundled sound in a loop via react-native-sound.
 *
 * The sound files are synthesized (fully original, royalty-free) by
 * scripts/generateSounds.js into android/app/src/main/res/raw/ and
 * ios/WakeTune/Sounds/ (registered as Xcode bundle resources).
 */
import {Platform} from 'react-native';
import Sound from 'react-native-sound';

import {logger} from '@/utils/logger';

export const FALLBACK_SOUNDS = [
  {key: 'classic_beep', label: 'Classic Beep', file: 'classic_beep.wav'},
  {key: 'gentle_rise', label: 'Gentle Rise', file: 'gentle_rise.wav'},
  {key: 'synth_morning', label: 'Synth Morning', file: 'synth_morning.wav'},
] as const;

let current: Sound | null = null;
let rampTimer: ReturnType<typeof setInterval> | null = null;

Sound.setCategory('Playback'); // iOS: play even when ringer volume applies to media

export function playFallbackSound(soundKey: string, gradualVolume: boolean): void {
  stopFallbackSound();
  const def = FALLBACK_SOUNDS.find(s => s.key === soundKey) ?? FALLBACK_SOUNDS[0];

  const sound = new Sound(def.file, Sound.MAIN_BUNDLE, error => {
    if (error) {
      logger.error('Fallback sound failed to load', def.file, error);
      // Last-resort: the alarm notification channel sound is still ringing,
      // so the user is not left in silence.
      return;
    }
    sound.setNumberOfLoops(-1);
    // SAFETY: volume capped at 0.85 - never full blast.
    sound.setVolume(gradualVolume ? 0.2 : 0.85);
    sound.play(success => {
      if (!success) {
        logger.warn('Fallback sound playback ended with error');
      }
    });

    if (gradualVolume) {
      let vol = 0.2;
      rampTimer = setInterval(() => {
        vol = Math.min(0.85, vol + 0.1);
        sound.setVolume(vol);
        if (vol >= 0.85 && rampTimer) {
          clearInterval(rampTimer);
          rampTimer = null;
        }
      }, 5000);
    }
  });
  current = sound;
}

export function stopFallbackSound(): void {
  if (rampTimer) {
    clearInterval(rampTimer);
    rampTimer = null;
  }
  if (current) {
    current.stop();
    current.release();
    current = null;
  }
}

export function isFallbackAvailable(): boolean {
  // react-native-sound loads lazily; assume available on both platforms.
  return Platform.OS === 'android' || Platform.OS === 'ios';
}
