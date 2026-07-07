# iOS setup

The `ios/` folder contains a complete Xcode project (based on the official
React Native 0.75.4 template, renamed to WakeTune) with everything already
configured:

- `Info.plist`: URL scheme `waketune` (Spotify OAuth redirect),
  `LSApplicationQueriesSchemes: spotify`, microphone + motion usage
  descriptions, portrait-only.
- `Podfile`: react-native-permissions `setup_permissions(['Microphone'])`.
- `WakeTune/Sounds/*.wav`: bundled fallback alarm sounds, already registered
  as Xcode resources (regenerate with `node scripts/generateSounds.js`).

## Build (requires a Mac + Xcode)

```bash
npm install
cd ios
bundle install            # first time only (installs CocoaPods via Gemfile)
bundle exec pod install
open WakeTune.xcworkspace # note: .xcworkspace, not .xcodeproj
```

Then in Xcode: select your **Team** under Signing & Capabilities, set your
bundle identifier (e.g. `com.yourname.waketune`), and run on a device.

Store submission: see `docs/RELEASE.md`.

## Honest iOS limitations (already handled in code)

- If the app is force-quit or killed by the system, **no code runs at alarm
  time**. The alarm rings as a local notification (time-sensitive level);
  Spotify playback + the challenge start when the user taps it. See
  `src/services/alarms/alarmScheduler.ios.ts`.
- Notification sounds are capped at ~30 seconds (our `alarm_fallback.wav` is
  25s) and respect silent/Focus. Ringing "forever" from a killed app is
  impossible without the **Critical Alerts** entitlement (requires an
  application to Apple - link in docs/RELEASE.md). TODO markers exist in
  `schedulerShared.ts` and `alarmScheduler.ios.ts`.
- Onboarding tells users: don't force-quit the app at night, allow
  notifications, allow Time-Sensitive notifications in Sleep/Focus.
