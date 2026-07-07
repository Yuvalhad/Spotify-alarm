# WakeTune ⏰🎵

A smart alarm clock for iOS & Android that wakes you up with a song you love
from Spotify — and won't stop until you complete a wake-up challenge: type the
lyrics, sing along, or dance.

Built with **React Native (bare workflow) + TypeScript**. Local-first: no
backend, tokens in the secure keychain, everything else on-device.

📖 **[PROJECT_BOOK.md](./PROJECT_BOOK.md)** — the full project book (Hebrew):
every file explained, what connects to what, alarm lifecycle end-to-end,
failure matrix, and how-to recipes.

📐 See [ARCHITECTURE.md](./ARCHITECTURE.md) for the original architecture
plan, platform-limitation analysis and MVP scope (Hebrew).

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

The only thing you must configure is your Spotify Client ID:

1. Create an app at https://developer.spotify.com/dashboard with redirect URI
   `waketune://oauth-callback` (details: [docs/SPOTIFY_SETUP.md](./docs/SPOTIFY_SETUP.md)).
2. Paste the Client ID into **`src/config.ts`**.

Then:

```bash
npm install

# Android (gradle wrapper, debug keystore and sounds are already in the repo)
npm run android

# iOS (Mac only) - full Xcode project is committed
cd ios && bundle install && bundle exec pod install && cd ..
npm run ios
```

Bundled alarm sounds are synthesized originals — regenerate or replace via
`node scripts/generateSounds.js` (see `docs/SOUNDS.md`).

## Releasing to the stores

See **[docs/RELEASE.md](./docs/RELEASE.md)** — a step-by-step guide for
Google Play and the App Store, including Android release signing
(`android/keystore.properties`), the CI workflow that builds a signed AAB
(`.github/workflows/android-release.yml`), the Spotify extended-quota
request, store listing copy ([docs/STORE_LISTING.md](./docs/STORE_LISTING.md))
and the privacy policy ([PRIVACY_POLICY.md](./PRIVACY_POLICY.md)).

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
