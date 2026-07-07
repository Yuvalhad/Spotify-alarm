/**
 * Challenge engine: resolves an alarm + ringing session into a concrete
 * ChallengeSpec that the ActiveAlarm screen renders and drives.
 *
 * If a challenge can't run on this device (e.g. mic permission denied for
 * singing, no accelerometer for dance), we downgrade to the lyrics/typing
 * challenge - the alarm must always be dismissible by SOME challenge, never
 * un-dismissible (safety requirement).
 */
import type {ActiveAlarmSession, Alarm} from '@/types';
import {checkMicrophonePermission} from '@/services/permissions/permissions';
import {loadSettings} from '@/services/storage/settingsStorage';
import {buildDanceChallenge} from './danceChallenge';
import {buildLyricsChallenge} from './lyricsChallenge';
import {buildSingingChallenge} from './singingChallenge';
import type {ChallengeContext, ChallengeSpec} from './challengeTypes';

export async function buildChallengeForSession(
  alarm: Alarm,
  session: ActiveAlarmSession,
): Promise<ChallengeSpec> {
  const ctx: ChallengeContext = {difficulty: alarm.difficulty, track: session.track};

  switch (session.resolvedChallengeMode) {
    case 'singing': {
      const [micState, settings] = await Promise.all([
        checkMicrophonePermission(),
        loadSettings(),
      ]);
      if (micState !== 'granted' || !settings.micProcessingConsent) {
        // No mic -> typing challenge instead of an unsolvable screen.
        return buildLyricsChallenge(ctx);
      }
      return buildSingingChallenge(ctx);
    }
    case 'dance':
      return buildDanceChallenge(ctx);
    case 'lyrics':
    default:
      return buildLyricsChallenge(ctx);
  }
}
