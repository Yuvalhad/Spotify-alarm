/**
 * Local persistence for alarms. MVP is fully local: no backend.
 * Alarms are not sensitive, so AsyncStorage is fine here.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import type {Alarm} from '@/types';
import {logger} from '@/utils/logger';

const ALARMS_KEY = 'waketune.alarms.v1';

export async function loadAlarms(): Promise<Alarm[]> {
  try {
    const raw = await AsyncStorage.getItem(ALARMS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as Alarm[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    logger.error('Failed to load alarms', e);
    return [];
  }
}

export async function saveAlarms(alarms: Alarm[]): Promise<void> {
  await AsyncStorage.setItem(ALARMS_KEY, JSON.stringify(alarms));
}

export async function getAlarmById(id: string): Promise<Alarm | undefined> {
  const alarms = await loadAlarms();
  return alarms.find(a => a.id === id);
}

export async function upsertAlarm(alarm: Alarm): Promise<Alarm[]> {
  const alarms = await loadAlarms();
  const idx = alarms.findIndex(a => a.id === alarm.id);
  if (idx >= 0) {
    alarms[idx] = alarm;
  } else {
    alarms.push(alarm);
  }
  await saveAlarms(alarms);
  return alarms;
}

export async function deleteAlarm(id: string): Promise<Alarm[]> {
  const alarms = (await loadAlarms()).filter(a => a.id !== id);
  await saveAlarms(alarms);
  return alarms;
}
