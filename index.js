/**
 * WakeTune entry point.
 *
 * IMPORTANT: notifee.onBackgroundEvent MUST be registered here (outside of any
 * component) so that alarm notification events are handled even when the app
 * is in the background / killed (Android). On iOS, if the app process was
 * killed, tapping the notification cold-starts the app and the initial
 * notification is read in App.tsx instead.
 */
import {AppRegistry} from 'react-native';
import notifee, {EventType} from '@notifee/react-native';

import App from './src/app/App';
import {name as appName} from './app.json';
import {handleAlarmNotificationEvent} from './src/services/alarms/alarmEvents';

notifee.onBackgroundEvent(async ({type, detail}) => {
  if (
    type === EventType.PRESS ||
    type === EventType.DELIVERED ||
    type === EventType.ACTION_PRESS
  ) {
    await handleAlarmNotificationEvent(type, detail);
  }
});

AppRegistry.registerComponent(appName, () => App);
