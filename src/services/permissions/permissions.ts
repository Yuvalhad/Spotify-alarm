/**
 * Central permission handling.
 *
 * Platform notes:
 *  - Notifications:
 *      Android 13+: runtime POST_NOTIFICATIONS permission.
 *      iOS: requested via notifee (UNUserNotificationCenter).
 *  - Exact alarms (Android 12+): SCHEDULE_EXACT_ALARM may require the user to
 *    grant "Alarms & reminders" in system settings. USE_EXACT_ALARM is declared
 *    in the manifest and is auto-granted for alarm-clock apps (Android 13+),
 *    but we still check and deep-link the user to settings when needed.
 *  - Microphone: needed only for the singing challenge.
 *  - Motion: Android accelerometer needs no permission; iOS needs
 *    NSMotionUsageDescription (CoreMotion) in Info.plist. react-native-sensors
 *    accelerometer works without a runtime prompt on both platforms.
 */
import {Platform} from 'react-native';
import notifee, {AndroidNotificationSetting, AuthorizationStatus} from '@notifee/react-native';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

export type PermissionState = 'granted' | 'denied' | 'blocked' | 'unavailable';

export interface PermissionsSnapshot {
  notifications: PermissionState;
  exactAlarm: PermissionState; // Android only; 'granted' on iOS (N/A)
  microphone: PermissionState;
}

export async function requestNotificationPermission(): Promise<PermissionState> {
  const settings = await notifee.requestPermission();
  switch (settings.authorizationStatus) {
    case AuthorizationStatus.AUTHORIZED:
    case AuthorizationStatus.PROVISIONAL:
      return 'granted';
    case AuthorizationStatus.DENIED:
      return 'blocked';
    default:
      return 'denied';
  }
}

export async function checkNotificationPermission(): Promise<PermissionState> {
  const settings = await notifee.getNotificationSettings();
  return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
    ? 'granted'
    : 'denied';
}

/**
 * Android 12+ exact alarm capability. If not granted, we deep-link to the
 * system "Alarms & reminders" screen. Without it alarms will be inexact
 * (can be minutes late) - unacceptable for an alarm clock.
 */
export async function checkExactAlarmPermission(): Promise<PermissionState> {
  if (Platform.OS !== 'android') {
    return 'granted';
  }
  const settings = await notifee.getNotificationSettings();
  return settings.android.alarm === AndroidNotificationSetting.ENABLED
    ? 'granted'
    : 'denied';
}

export async function openExactAlarmSettings(): Promise<void> {
  if (Platform.OS === 'android') {
    await notifee.openAlarmPermissionSettings();
  }
}

export async function requestMicrophonePermission(): Promise<PermissionState> {
  const perm =
    Platform.OS === 'ios' ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO;
  const result = await request(perm);
  return mapResult(result);
}

export async function checkMicrophonePermission(): Promise<PermissionState> {
  const perm =
    Platform.OS === 'ios' ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO;
  const result = await check(perm);
  return mapResult(result);
}

function mapResult(result: string): PermissionState {
  switch (result) {
    case RESULTS.GRANTED:
    case RESULTS.LIMITED:
      return 'granted';
    case RESULTS.BLOCKED:
      return 'blocked';
    case RESULTS.UNAVAILABLE:
      return 'unavailable';
    default:
      return 'denied';
  }
}

export async function getPermissionsSnapshot(): Promise<PermissionsSnapshot> {
  const [notifications, exactAlarm, microphone] = await Promise.all([
    checkNotificationPermission(),
    checkExactAlarmPermission(),
    checkMicrophonePermission(),
  ]);
  return {notifications, exactAlarm, microphone};
}

/**
 * TODO(android): battery optimization. On some OEMs (Xiaomi/Huawei/Samsung)
 * aggressive battery savers can delay alarms even with exact-alarm permission.
 * notifee.openBatteryOptimizationSettings() lets the user whitelist the app.
 * We surface this from the Settings screen rather than forcing it in onboarding.
 */
export async function openBatteryOptimizationSettings(): Promise<void> {
  if (Platform.OS === 'android') {
    await notifee.openBatteryOptimizationSettings();
  }
}
