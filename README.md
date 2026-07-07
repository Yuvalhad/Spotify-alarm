# WakeTune ⏰🎵

A smart alarm clock for iOS & Android that wakes you up with a song you love
from Spotify — and won't stop until you complete a wake-up challenge: type the
lyrics, sing along, or dance.

Built with **React Native (bare workflow) + TypeScript**. Local-first: no
backend, tokens in the secure keychain, everything else on-device.

📐 See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full architecture plan,
platform-limitation analysis and MVP scope (Hebrew).

## Project layout

```
src/
  app/App.tsx               root: providers, navigation, alarm-event routing
  screens/                  Onboarding · SpotifyLogin · AlarmList · CreateAlarm ·
                            ActiveAlarm · WakeSuccess · Settings
  components/               AlarmCard · ChallengeCard · SpotifyTrackCard · PrimaryButton
  services/
    spotify/                spotifyAuth (OAuth PKCE) · spotifyApi (Web API) ·
                            spotifyPlayback (Connect control) · trackSelector
    alarms/                 alarmScheduler(.android/.ios) · alarmEvents · alarmRinger
    challenges/             challengeEngine · lyrics/singing/dance challenges
    lyrics/                 LyricsProvider interface + demo provider (licensed-only policy)
    audio/                  local fallback alarm sound
    storage/                secureStorage (Keychain) · alarmStorage · settingsStorage
    permissions/            notifications · exact alarms · microphone
  state/                    AuthContext · AlarmsContext
  navigation/  theme/  utils/  types/
android/                    bare Android project (exact alarms, full-screen intent)
ios/                        Info.plist reference + docs/IOS_SETUP.md to generate the project
docs/                       SPOTIFY_SETUP.md · IOS_SETUP.md
```

## Getting started

```bash
npm install

# Android (see notes below)
npm run android

# iOS - generate the Xcode project first: docs/IOS_SETUP.md
npm run ios
```

Before first run:

1. **Spotify**: create an app + set your client id — see
   [docs/SPOTIFY_SETUP.md](./docs/SPOTIFY_SETUP.md).
2. **Android**: generate the gradle wrapper (`gradle wrapper` in `android/`,
   Gradle 8.8) and a debug keystore (command in `android/app/build.gradle`).
3. **Sounds**: add royalty-free alarm sound files — see
   `android/app/src/main/res/raw/README.md`.
4. **iOS**: generate the Xcode project — see [docs/IOS_SETUP.md](./docs/IOS_SETUP.md).

## What it deliberately does NOT do

- No lyrics scraping / unofficial APIs — lyrics ship behind a
  `LyricsProvider` interface (demo data only until a licensed provider is added).
- No track downloading, no DRM bypass. Playback is controlled through
  Spotify's official Web API only (Premium required; free accounts get the
  built-in fallback alarm sound).
- No voice recordings — the sing-along challenge analyzes mic levels in
  memory, on-device only.
- No pretending iOS can run code from a killed app at 7am — see
  `src/services/alarms/alarmScheduler.ios.ts` for the honest strategy.

## Scripts

| Command | |
|---|---|
| `npm run typecheck` | TypeScript |
| `npm test` | Jest unit tests (time/text utils, challenge evaluation) |
| `npm run lint` | ESLint |
