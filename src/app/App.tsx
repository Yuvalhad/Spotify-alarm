/**
 * App root: providers + navigation + alarm-event wiring.
 *
 * Alarm routing paths into the ActiveAlarm screen:
 *  1. Cold start from a notification tap  -> notifee.getInitialNotification()
 *  2. Foreground/background event         -> notifee.onForegroundEvent + the
 *     background handler in index.js persisting a "pending alarm"
 *  3. App resumed some other way while an alarm is pending -> getPendingAlarm()
 */
import React, {useEffect, useState} from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import notifee, {EventType} from '@notifee/react-native';

import RootNavigator from '@/navigation/RootNavigator';
import {navigationRef, navigateToActiveAlarm} from '@/navigation/navigationRef';
import type {RootStackParamList} from '@/navigation/types';
import {AuthProvider} from '@/state/AuthContext';
import {AlarmsProvider} from '@/state/AlarmsContext';
import {getPendingAlarm, handleAlarmNotificationEvent} from '@/services/alarms/alarmEvents';
import {DATA_ALARM_ID, DATA_IS_TEST} from '@/services/alarms/alarmTypes';
import {loadSettings} from '@/services/storage/settingsStorage';
import {colors} from '@/theme/theme';

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
  },
};

export default function App() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);
  const [initialAlarm, setInitialAlarm] = useState<{alarmId: string; isTest: boolean} | null>(
    null,
  );

  useEffect(() => {
    (async () => {
      // 1) Launched by tapping an alarm notification (cold start)?
      const initial = await notifee.getInitialNotification();
      const data = initial?.notification?.data as Record<string, string> | undefined;
      if (data?.[DATA_ALARM_ID]) {
        setInitialAlarm({alarmId: data[DATA_ALARM_ID], isTest: data[DATA_IS_TEST] === '1'});
        setInitialRoute('AlarmList'); // ActiveAlarm is pushed on top after mount
        return;
      }
      // 2) An alarm fired recently and was never resolved?
      const pending = await getPendingAlarm();
      if (pending) {
        setInitialAlarm({alarmId: pending.alarmId, isTest: pending.isTest});
        setInitialRoute('AlarmList');
        return;
      }
      // 3) Normal launch.
      const settings = await loadSettings();
      setInitialRoute(settings.onboardingCompleted ? 'AlarmList' : 'Onboarding');
    })();
  }, []);

  // Foreground notification events (alarm fires while app is open).
  useEffect(() => {
    return notifee.onForegroundEvent(async ({type, detail}) => {
      await handleAlarmNotificationEvent(type, detail);
      const data = detail.notification?.data as Record<string, string> | undefined;
      const alarmId = data?.[DATA_ALARM_ID];
      if (alarmId && (type === EventType.DELIVERED || type === EventType.PRESS)) {
        navigateToActiveAlarm(alarmId, data?.[DATA_IS_TEST] === '1');
      }
    });
  }, []);

  if (!initialRoute) {
    return null; // splash: keep native splash screen visible
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <AuthProvider>
        <AlarmsProvider>
          <NavigationContainer
            ref={navigationRef}
            theme={navTheme}
            onReady={() => {
              if (initialAlarm) {
                navigateToActiveAlarm(initialAlarm.alarmId, initialAlarm.isTest);
              }
            }}>
            <RootNavigator initialRouteName={initialRoute} />
          </NavigationContainer>
        </AlarmsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
