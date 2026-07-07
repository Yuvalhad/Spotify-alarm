/**
 * Logic shared by both platform schedulers: building notifee trigger
 * notifications for an alarm's next occurrences.
 */
import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidVisibility,
  RepeatFrequency,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import {Platform} from 'react-native';

import type {Alarm} from '@/types';
import {formatTime, nextOccurrence} from '@/utils/time';
import {logger} from '@/utils/logger';
import {ALARM_CHANNEL_ID, DATA_ALARM_ID, DATA_IS_TEST, triggerIdFor} from './alarmTypes';

export async function ensureAlarmChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  await notifee.createChannel({
    id: ALARM_CHANNEL_ID,
    name: 'Alarms',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    bypassDnd: true,
    vibration: true,
    // TODO(assets): bundle android/app/src/main/res/raw/alarm_fallback.mp3 and
    // set `sound: 'alarm_fallback'` for a proper looping alarm tone even
    // before JS is alive. Using the default sound until then.
    sound: 'default',
  });
}

function baseNotification(alarm: Alarm, isTest: boolean) {
  return {
    id: '', // set per-trigger by callers
    title: '⏰ WakeTune',
    body: alarm.label
      ? `${alarm.label} — complete the challenge to stop`
      : `Alarm ${formatTime(alarm.time)} — complete the challenge to stop`,
    data: {
      [DATA_ALARM_ID]: alarm.id,
      [DATA_IS_TEST]: isTest ? '1' : '0',
    },
    android: {
      channelId: ALARM_CHANNEL_ID,
      category: AndroidCategory.ALARM,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      // Full-screen intent: launches the app over the lock screen like a real
      // alarm clock (requires USE_FULL_SCREEN_INTENT permission, declared in
      // the manifest).
      fullScreenAction: {id: 'alarm-fullscreen', launchActivity: 'default'},
      pressAction: {id: 'alarm-press', launchActivity: 'default'},
      ongoing: true,
      autoCancel: false,
      loopSound: true,
      lightUpScreen: true,
    },
    ios: {
      // TODO(assets): bundle ios/WakeTune/alarm_fallback.wav (<30s, per iOS
      // rules) and reference it here; 'default' until the asset is added.
      sound: 'default',
      interruptionLevel: 'timeSensitive' as const,
      // NOTE(iOS): `critical: true` (plays through silent switch / Focus)
      // requires Apple's Critical Alerts entitlement, which is granted only
      // on request. TODO(ios): apply for the entitlement, then enable:
      // critical: true, criticalVolume: 0.8,
    },
  };
}

/**
 * Creates notifee timestamp triggers for the alarm:
 *  - one-shot alarm  -> single trigger at next occurrence
 *  - repeating alarm -> one WEEKLY trigger per selected weekday
 *
 * `androidAlarmManager` is passed on Android so notifee uses AlarmManager
 * exact alarms instead of inexact WorkManager scheduling.
 */
export async function createTriggersForAlarm(
  alarm: Alarm,
  androidAlarmManager: TimestampTrigger['alarmManager'],
): Promise<void> {
  const notification = baseNotification(alarm, false);

  if (alarm.daysOfWeek.length === 0) {
    const fireAt = nextOccurrence(alarm);
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: fireAt.getTime(),
      alarmManager: androidAlarmManager,
    };
    await notifee.createTriggerNotification(
      {...notification, id: triggerIdFor(alarm.id, 'once')},
      trigger,
    );
    logger.debug('Scheduled one-shot alarm', alarm.id, fireAt.toISOString());
    return;
  }

  for (const day of alarm.daysOfWeek) {
    const dayAlarm: Alarm = {...alarm, daysOfWeek: [day]};
    const fireAt = nextOccurrence(dayAlarm);
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: fireAt.getTime(),
      repeatFrequency: RepeatFrequency.WEEKLY,
      alarmManager: androidAlarmManager,
    };
    await notifee.createTriggerNotification(
      {...notification, id: triggerIdFor(alarm.id, day)},
      trigger,
    );
    logger.debug('Scheduled weekly alarm', alarm.id, 'day', day, fireAt.toISOString());
  }
}

export async function cancelTriggersForAlarm(alarmId: string): Promise<void> {
  const ids = await notifee.getTriggerNotificationIds();
  const mine = ids.filter(id => id.startsWith(`${alarmId}::`));
  await Promise.all(mine.map(id => notifee.cancelTriggerNotification(id)));
}

export async function createTestTrigger(
  alarm: Alarm,
  seconds: number,
  androidAlarmManager: TimestampTrigger['alarmManager'],
): Promise<void> {
  const notification = baseNotification(alarm, true);
  await notifee.createTriggerNotification(
    {...notification, id: triggerIdFor(alarm.id, 'test')},
    {
      type: TriggerType.TIMESTAMP,
      timestamp: Date.now() + seconds * 1000,
      alarmManager: androidAlarmManager,
    },
  );
}
