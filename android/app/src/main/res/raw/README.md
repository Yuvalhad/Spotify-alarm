# Bundled alarm sounds (Android)

Place the fallback alarm sound files here (they are intentionally not
committed as binaries):

- `classic_beep.mp3`
- `gentle_rise.mp3`
- `synth_morning.mp3`
- `alarm_fallback.mp3` (used as the notification channel sound; see
  `src/services/alarms/schedulerShared.ts`)

Requirements: royalty-free / self-produced audio only. Keep files short
(loopable, a few seconds) - `react-native-sound` loops them (see
`src/services/audio/fallbackSound.ts`).

The same files must be added to the iOS app bundle via Xcode.
