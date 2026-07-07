/**
 * iOS scheduler - honest about platform limits:
 *
 * WHAT iOS DOES NOT ALLOW (do not pretend otherwise):
 *  - No background code execution at an arbitrary future time. If the app is
 *    killed (by the user or the system), we CANNOT start Spotify playback,
 *    run JS, or loop audio at alarm time.
 *  - Local notification sounds play for at most ~30 seconds per notification
 *    and respect the ringer switch / Focus unless we have the Critical Alerts
 *    entitlement (special Apple approval).
 *
 * OUR STRATEGY:
 *  1. Schedule a local notification (time-sensitive interruption level) at
 *     alarm time - this is the guaranteed part.
 *  2. Schedule a few FOLLOW-UP notifications 30s apart so the ringing
 *     effectively repeats if the user does not react (see FOLLOW_UPS below).
 *  3. When the user taps the notification (or the app is foreground/background
 *     -alive), the ActiveAlarm screen opens and only then do we start Spotify
 *     playback + the challenge.
 *  4. Onboarding explains how to get reliable behavior: keep the app in the
 *     app switcher (don't force-quit), allow notifications, allow
 *     time-sensitive notifications in Focus settings.
 *
 * TODO(ios): apply for the Critical Alerts entitlement to ring through
 * silent/Focus. TODO(ios): consider a "sleep mode" flow where the user opens
 * the app before sleeping and we keep a silent audio session alive
 * (background audio mode) so alarm-time JS is guaranteed - battery tradeoff.
 */
import type {Alarm} from '@/types';
import type {AlarmScheduler} from './alarmTypes';
import {
  cancelTriggersForAlarm,
  createTestTrigger,
  createTriggersForAlarm,
} from './schedulerShared';

// AlarmManager config is Android-only; undefined on iOS.
const NO_ALARM_MANAGER = undefined;

export const alarmScheduler: AlarmScheduler = {
  async scheduleAlarm(alarm: Alarm): Promise<void> {
    await cancelTriggersForAlarm(alarm.id);
    if (!alarm.enabled) {
      return;
    }
    await createTriggersForAlarm(alarm, NO_ALARM_MANAGER);
    // TODO(ios): schedule 3-4 follow-up one-shot notifications at +30s, +60s,
    // +90s after each occurrence and cancel them when the challenge is solved.
    // notifee trigger ids: `${alarm.id}::followup-N`.
  },

  async cancelAlarm(alarmId: string): Promise<void> {
    await cancelTriggersForAlarm(alarmId);
  },

  async rescheduleAll(alarms: Alarm[]): Promise<void> {
    for (const alarm of alarms) {
      await cancelTriggersForAlarm(alarm.id);
      if (alarm.enabled) {
        await createTriggersForAlarm(alarm, NO_ALARM_MANAGER);
      }
    }
  },

  async scheduleTestAlarm(alarm: Alarm, seconds: number): Promise<void> {
    await createTestTrigger(alarm, seconds, NO_ALARM_MANAGER);
  },
};
