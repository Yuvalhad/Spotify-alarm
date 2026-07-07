# Apple Music setup

WakeTune lets every user connect their PERSONAL Apple Music account. Unlike
Spotify there is **no user cap and no quota-extension review** — once the app
is configured, any Apple Music subscriber can use it.

## How it works in this codebase

- `src/services/music/appleMusicProvider.ts` — the JS provider (implements
  the same `MusicProvider` interface as Spotify).
- `ios/WakeTune/MusicKitModule.swift` (+ `.m` bridge) — native MusicKit:
  authorization, library playlists, and **in-app playback** via
  `ApplicationMusicPlayer` (no external app needed, unlike Spotify Connect).
- Already wired: registered in the Xcode project, `NSAppleMusicUsageDescription`
  in Info.plist, Swift bridging header configured.

## One-time configuration (🔑 your Apple Developer account)

1. In the [Apple Developer portal](https://developer.apple.com/account) →
   Identifiers → your app id (e.g. `com.yourname.waketune`) → **App Services**
   → enable **MusicKit**.
   That's it — with the MusicKit *framework* (which we use), developer tokens
   are issued automatically by the OS; no manual JWT needed.
2. Build target: playback + library APIs used here require **iOS 16+** devices
   (the module returns a clear error on older versions and the app falls back
   to the built-in alarm sound).

## User experience

1. "Connect your music" screen → **Continue with Apple Music**.
2. iOS shows the standard media-library permission prompt (the Apple ID
   already signed into the device — no password typed in the app).
3. Alarms play the user's chosen library playlist, or shuffle their library.
4. No subscription? The user gets a clear message and alarms use the
   built-in fallback sound (same policy as Spotify Free).

## Current limitations / TODOs (marked in code)

- **Android**: Apple's MusicKit SDK for Android requires a manually issued
  developer token and a separate native integration —
  `TODO(android)` in `appleMusicProvider.ts`. Until then the UI shows
  "available on iPhone for now".
- **Per-source selection**: playlist + library-shuffle are implemented;
  top-tracks / artist sources fall back to shuffle —
  `TODO(apple-music)` in `appleMusicProvider.ts`.
- **Gradual volume**: `ApplicationMusicPlayer` has no volume API;
  `TODO(ios)` for an MPVolumeView-based ramp.
