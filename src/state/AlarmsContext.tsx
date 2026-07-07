/**
 * Alarm list state. Every mutation persists to storage AND syncs the
 * platform scheduler, so storage and scheduled triggers never drift apart.
 */
import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';

import type {Alarm} from '@/types';
import {alarmScheduler} from '@/services/alarms/alarmScheduler';
import {
  deleteAlarm as deleteAlarmFromStorage,
  loadAlarms,
  upsertAlarm,
} from '@/services/storage/alarmStorage';
import {logger} from '@/utils/logger';

interface AlarmsContextValue {
  loading: boolean;
  alarms: Alarm[];
  saveAlarm: (alarm: Alarm) => Promise<void>;
  removeAlarm: (alarmId: string) => Promise<void>;
  toggleAlarm: (alarmId: string, enabled: boolean) => Promise<void>;
  reload: () => Promise<void>;
}

const AlarmsContext = createContext<AlarmsContextValue | undefined>(undefined);

export function AlarmsProvider({children}: {children: React.ReactNode}) {
  const [loading, setLoading] = useState(true);
  const [alarms, setAlarms] = useState<Alarm[]>([]);

  const reload = useCallback(async () => {
    const loaded = await loadAlarms();
    setAlarms(loaded);
  }, []);

  useEffect(() => {
    (async () => {
      const loaded = await loadAlarms();
      setAlarms(loaded);
      setLoading(false);
      // Re-sync all triggers on app start. Covers: app updates, notifee data
      // loss, one-shot alarms that fired while we were dead, and (with
      // notifee's boot receiver) device reboots.
      try {
        await alarmScheduler.rescheduleAll(loaded);
      } catch (e) {
        logger.error('rescheduleAll failed', e);
      }
    })();
  }, []);

  const saveAlarm = useCallback(async (alarm: Alarm) => {
    const next = await upsertAlarm(alarm);
    setAlarms(next);
    await alarmScheduler.scheduleAlarm(alarm);
  }, []);

  const removeAlarm = useCallback(async (alarmId: string) => {
    const next = await deleteAlarmFromStorage(alarmId);
    setAlarms(next);
    await alarmScheduler.cancelAlarm(alarmId);
  }, []);

  const toggleAlarm = useCallback(
    async (alarmId: string, enabled: boolean) => {
      const alarm = alarms.find(a => a.id === alarmId);
      if (!alarm) {
        return;
      }
      const updated: Alarm = {...alarm, enabled, updatedAt: new Date().toISOString()};
      const next = await upsertAlarm(updated);
      setAlarms(next);
      await alarmScheduler.scheduleAlarm(updated);
    },
    [alarms],
  );

  const value = useMemo(
    () => ({loading, alarms, saveAlarm, removeAlarm, toggleAlarm, reload}),
    [loading, alarms, saveAlarm, removeAlarm, toggleAlarm, reload],
  );

  return <AlarmsContext.Provider value={value}>{children}</AlarmsContext.Provider>;
}

export function useAlarms(): AlarmsContextValue {
  const ctx = useContext(AlarmsContext);
  if (!ctx) {
    throw new Error('useAlarms must be used inside <AlarmsProvider>');
  }
  return ctx;
}
