/**
 * Global navigation ref so non-component code (notification event handlers)
 * can route to the ActiveAlarm screen.
 */
import {createNavigationContainerRef} from '@react-navigation/native';

import type {RootStackParamList} from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateToActiveAlarm(alarmId: string, isTest: boolean): void {
  if (navigationRef.isReady()) {
    navigationRef.navigate('ActiveAlarm', {alarmId, isTest});
  }
}
