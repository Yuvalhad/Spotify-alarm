import type {Alarm} from '@/types';

/**
 * Platform-agnostic scheduler contract. Implementations:
 *  - alarmScheduler.android.ts : notifee trigger notification backed by
 *    AlarmManager (exact, alarm-clock type) + full-screen intent.
 *  - alarmScheduler.ios.ts     : local notification (UNUserNotificationCenter).
 * Metro automatically resolves the platform file when importing
 * '@/services/alarms/alarmScheduler'.
 */
export interface AlarmScheduler {
  /** (Re)schedules all future triggers for this alarm. Idempotent. */
  scheduleAlarm(alarm: Alarm): Promise<void>;
  /** Cancels all triggers belonging to this alarm. */
  cancelAlarm(alarmId: string): Promise<void>;
  /** Cancels + re-creates triggers for every enabled alarm (e.g. after boot/app start). */
  rescheduleAll(alarms: Alarm[]): Promise<void>;
  /** Fires a one-off test alarm in `seconds` seconds (Settings > "Test alarm"). */
  scheduleTestAlarm(alarm: Alarm, seconds: number): Promise<void>;
}

export const ALARM_CHANNEL_ID = 'waketune-alarm';

/** notification.data payload keys (values must be strings for notifee). */
export const DATA_ALARM_ID = 'alarmId';
export const DATA_IS_TEST = 'isTest';

export function triggerIdFor(alarmId: string, day: number | 'once' | 'test'): string {
  return `${alarmId}::${day}`;
}
