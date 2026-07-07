/**
 * Fallback implementation for non-mobile targets (tests, tooling).
 * On device, Metro resolves alarmScheduler.android.ts / alarmScheduler.ios.ts
 * instead of this file.
 */
import type {Alarm} from '@/types';
import type {AlarmScheduler} from './alarmTypes';
import {
  cancelTriggersForAlarm,
  createTestTrigger,
  createTriggersForAlarm,
  ensureAlarmChannel,
} from './schedulerShared';

export const alarmScheduler: AlarmScheduler = {
  async scheduleAlarm(alarm: Alarm): Promise<void> {
    await ensureAlarmChannel();
    await cancelTriggersForAlarm(alarm.id);
    if (alarm.enabled) {
      await createTriggersForAlarm(alarm, undefined);
    }
  },
  async cancelAlarm(alarmId: string): Promise<void> {
    await cancelTriggersForAlarm(alarmId);
  },
  async rescheduleAll(alarms: Alarm[]): Promise<void> {
    for (const alarm of alarms) {
      await cancelTriggersForAlarm(alarm.id);
      if (alarm.enabled) {
        await createTriggersForAlarm(alarm, undefined);
      }
    }
  },
  async scheduleTestAlarm(alarm: Alarm, seconds: number): Promise<void> {
    await createTestTrigger(alarm, seconds, undefined);
  },
};
