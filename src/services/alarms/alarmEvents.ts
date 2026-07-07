/**
 * Handles notifee notification events for alarms, in both foreground and
 * background (registered in index.js).
 *
 * Responsibilities:
 *  - remember which alarm is currently ringing ("pending alarm") so App.tsx
 *    can route to the ActiveAlarm screen on launch/resume,
 *  - disable one-shot alarms after they fire,
 *  - never dismiss the ringing notification here - only a solved challenge
 *    (or the emergency escape) does that.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {EventType, type EventDetail} from '@notifee/react-native';

import {getAlarmById, upsertAlarm} from '@/services/storage/alarmStorage';
import {logger} from '@/utils/logger';
import {DATA_ALARM_ID, DATA_IS_TEST} from './alarmTypes';

const PENDING_ALARM_KEY = 'waketune.pendingAlarm.v1';

export interface PendingAlarm {
  alarmId: string;
  isTest: boolean;
  firedAt: string;
  notificationId?: string;
}

export async function handleAlarmNotificationEvent(
  type: EventType,
  detail: EventDetail,
): Promise<void> {
  const data = detail.notification?.data as Record<string, string> | undefined;
  const alarmId = data?.[DATA_ALARM_ID];
  if (!alarmId) {
    return;
  }

  const pending: PendingAlarm = {
    alarmId,
    isTest: data?.[DATA_IS_TEST] === '1',
    firedAt: new Date().toISOString(),
    notificationId: detail.notification?.id,
  };

  if (type === EventType.DELIVERED) {
    await AsyncStorage.setItem(PENDING_ALARM_KEY, JSON.stringify(pending));
    logger.info('Alarm delivered', alarmId);
    // One-shot alarms are done after firing - flip them off in storage.
    if (!pending.isTest) {
      const alarm = await getAlarmById(alarmId);
      if (alarm && alarm.daysOfWeek.length === 0 && alarm.enabled) {
        await upsertAlarm({...alarm, enabled: false, updatedAt: new Date().toISOString()});
      }
    }
    return;
  }

  if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
    // User tapped the notification (this is the main iOS entry path).
    await AsyncStorage.setItem(PENDING_ALARM_KEY, JSON.stringify(pending));
    logger.info('Alarm notification pressed', alarmId);
  }
}

export async function getPendingAlarm(): Promise<PendingAlarm | null> {
  const raw = await AsyncStorage.getItem(PENDING_ALARM_KEY);
  if (!raw) {
    return null;
  }
  try {
    const pending = JSON.parse(raw) as PendingAlarm;
    // Stale guard: a pending alarm older than 2h is abandoned - don't ambush
    // the user with a challenge screen at noon for a 7am alarm they slept
    // through and dismissed elsewhere.
    if (Date.now() - Date.parse(pending.firedAt) > 2 * 60 * 60 * 1000) {
      await clearPendingAlarm();
      return null;
    }
    return pending;
  } catch {
    return null;
  }
}

export async function clearPendingAlarm(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_ALARM_KEY);
}
