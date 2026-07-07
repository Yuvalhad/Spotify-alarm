import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {colors} from '@/theme/theme';
import OnboardingScreen from '@/screens/OnboardingScreen';
import MusicConnectScreen from '@/screens/MusicConnectScreen';
import AlarmListScreen from '@/screens/AlarmListScreen';
import CreateAlarmScreen from '@/screens/CreateAlarmScreen';
import ActiveAlarmScreen from '@/screens/ActiveAlarmScreen';
import WakeSuccessScreen from '@/screens/WakeSuccessScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import type {RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface Props {
  initialRouteName: keyof RootStackParamList;
}

export default function RootNavigator({initialRouteName}: Props) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerStyle: {backgroundColor: colors.background},
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {fontWeight: '700'},
        contentStyle: {backgroundColor: colors.background},
      }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{headerShown: false}} />
      <Stack.Screen
        name="MusicConnect"
        component={MusicConnectScreen}
        options={{title: 'Connect Music'}}
      />
      <Stack.Screen name="AlarmList" component={AlarmListScreen} options={{title: 'WakeTune'}} />
      <Stack.Screen
        name="CreateAlarm"
        component={CreateAlarmScreen}
        options={{title: 'Alarm'}}
      />
      <Stack.Screen
        name="ActiveAlarm"
        component={ActiveAlarmScreen}
        options={{
          headerShown: false,
          // No swipe-back / hardware-back: the challenge (or the emergency
          // escape) is the only way out. See ActiveAlarmScreen.
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="WakeSuccess"
        component={WakeSuccessScreen}
        options={{headerShown: false, gestureEnabled: false}}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{title: 'Settings'}} />
    </Stack.Navigator>
  );
}
