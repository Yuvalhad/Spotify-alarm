package com.waketune

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "WakeTune"

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
    // showWhenLocked / turnScreenOn are declared on the activity in the
    // manifest so the full-screen alarm intent (notifee fullScreenAction)
    // can wake the screen and show the alarm over the lock screen.
    // TODO(android): gate these on "launched by an alarm" (inspect the
    // launch intent) so normal app opens don't bypass the lock screen on
    // devices where that matters. Keyguard is NOT dismissed here - the user
    // still needs to unlock for anything outside this activity.
  }

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
