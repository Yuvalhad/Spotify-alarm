/**
 * ANDROID scheduler - a "real" alarm clock:
 *  - AlarmManager with type SET_ALARM_CLOCK (exact, survives Doze, shows the
 *    alarm icon in the status bar; the OS treats it as a user-facing alarm).
 *  - Full-screen intent notification opens the app over the lock screen.
 *  - SCHEDULE_EXACT_ALARM / USE_EXACT_ALARM are declared in AndroidManifest;
 *    exact-alarm permission is verified before scheduling and surfaced to the
 *    user in Settings if missing.
 *  - BOOT_COMPLETED: notifee persists trigger notifications and re-registers
 *    them after reboot via its own boot receiver (RECEIVE_BOOT_COMPLETED is
 *    declared in the manifest).
 *  - Doze: SET_ALARM_CLOCK is exempt from Doze restrictions by design.
 *
 * NOTE on foreground service: while the alarm is ringing, the app is held in
 * the foreground by the full-screen alarm activity itself. A dedicated
 * foreground service is only needed if we want ringing to survive the user
 * dismissing the activity without solving the challenge.
 * TODO(android): add a ForegroundService (notifee registerForegroundService)
 * that keeps the fallback sound alive if the alarm activity is swiped away.
 */
import {AlarmType} from '@notifee/react-native';

import type {Alarm} from '@/types';
import {checkExactAlarmPermission} from '@/services/permissions/permissions';
import {logger} from '@/utils/logger';
import type {AlarmScheduler} from './alarmTypes';
import {
  cancelTriggersForAlarm,
  createTestTrigger,
  createTriggersForAlarm,
  ensureAlarmChannel,
} from './schedulerShared';

const ALARM_MANAGER_CONFIG = {
  type: AlarmType.SET_ALARM_CLOCK,
  allowWhileIdle: true,
};

async function assertExactAlarmsAllowed(): Promise<void> {
  const state = await checkExactAlarmPermission();
  if (state !== 'granted') {
    // We still schedule (notifee downgrades to inexact), but warn loudly -
    // the UI checks the same permission and shows a fix-it banner.
    logger.warn(
      'Exact alarm permission missing - alarm may ring late. ' +
        'Direct the user to Settings > Alarms & reminders.',
    );
  }
}

export const alarmScheduler: AlarmScheduler = {
  async scheduleAlarm(alarm: Alarm): Promise<void> {
    await ensureAlarmChannel();
    await assertExactAlarmsAllowed();
    await cancelTriggersForAlarm(alarm.id);
    if (!alarm.enabled) {
      return;
    }
    await createTriggersForAlarm(alarm, ALARM_MANAGER_CONFIG);
  },

  async cancelAlarm(alarmId: string): Promise<void> {
    await cancelTriggersForAlarm(alarmId);
  },

  async rescheduleAll(alarms: Alarm[]): Promise<void> {
    await ensureAlarmChannel();
    for (const alarm of alarms) {
      await cancelTriggersForAlarm(alarm.id);
      if (alarm.enabled) {
        await createTriggersForAlarm(alarm, ALARM_MANAGER_CONFIG);
      }
    }
  },

  async scheduleTestAlarm(alarm: Alarm, seconds: number): Promise<void> {
    await ensureAlarmChannel();
    await createTestTrigger(alarm, seconds, ALARM_MANAGER_CONFIG);
  },
};
