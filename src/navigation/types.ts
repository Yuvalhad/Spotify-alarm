import type {NavigatorScreenParams} from '@react-navigation/native';

export type RootStackParamList = {
  Onboarding: undefined;
  SpotifyLogin: undefined;
  AlarmList: undefined;
  CreateAlarm: {alarmId?: string} | undefined;
  ActiveAlarm: {alarmId: string; isTest?: boolean};
  WakeSuccess: {trackTitle?: string; artist?: string};
  Settings: undefined;
};

export type RootNavigatorParams = NavigatorScreenParams<RootStackParamList>;
