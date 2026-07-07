# iOS setup

The `ios/` Xcode project is not committed (a `project.pbxproj` cannot be
meaningfully hand-authored/reviewed). Generate it once locally:

```bash
# From the repo root, with Node 18+ and Xcode installed:
npx @react-native-community/cli init WakeTuneTmp --version 0.75.4 --skip-install
cp -R WakeTuneTmp/ios ./ios-template   # take the generated ios/ folder
# Rename the project to WakeTune (or generate with the right name directly),
# move it to ./ios, then:
cd ios && bundle install && bundle exec pod install
```

Then apply the WakeTune-specific configuration:

1. **Info.plist** — merge every key from `ios/WakeTune/Info.plist.reference`
   (URL scheme `waketune`, `LSApplicationQueriesSchemes`, mic/motion usage
   descriptions).
2. **Signing** — set your team + bundle id (e.g. `com.yourname.waketune`).
3. **Sounds** — add the fallback alarm sound files to the app bundle
   (`classic_beep.mp3`, `gentle_rise.mp3`, `synth_morning.mp3`, and a
   `alarm_fallback.wav` under 30s for notification sounds). Then switch
   `sound: 'default'` to the real file in
   `src/services/alarms/schedulerShared.ts`.
4. **react-native-permissions** — add the Microphone permission handler to the
   Podfile per the library README:
   ```ruby
   setup_permissions(['Microphone'])
   ```

## Honest iOS limitations (already handled in code)

- If the app is force-quit or killed by the system, **no code runs at alarm
  time**. The alarm rings as a local notification (time-sensitive level);
  Spotify playback + the challenge start when the user taps it. See
  `src/services/alarms/alarmScheduler.ios.ts`.
- Notification sounds are capped at ~30 seconds and respect silent/Focus.
  Ringing "forever" is impossible without the **Critical Alerts** entitlement
  (requires an application to Apple). TODO markers exist in
  `schedulerShared.ts` and `alarmScheduler.ios.ts`.
- Onboarding tells users: don't force-quit the app at night, allow
  notifications, allow Time-Sensitive notifications in Sleep/Focus.
