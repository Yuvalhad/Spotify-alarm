# Releasing WakeTune to Google Play & the App Store

Everything in the repo is release-ready. This guide covers the parts that
require **your** accounts and machines (marked 🔑 = only you can do it).

---

## 0. One-time prerequisites

| What | Where | Cost |
|---|---|---|
| 🔑 Spotify Developer app | https://developer.spotify.com/dashboard | free |
| 🔑 Google Play Console account | https://play.google.com/console | $25 once |
| 🔑 Apple Developer Program | https://developer.apple.com/programs/ | $99/year |
| 🔑 A Mac with Xcode | required to build & upload the iOS app | — |
| 🔑 Hosted privacy policy URL | both stores require one | free |

**Privacy policy hosting:** `PRIVACY_POLICY.md` is ready in the repo root.
Easiest: enable GitHub Pages on this repo (Settings → Pages → main branch)
and use `https://<user>.github.io/Spotify-alarm/PRIVACY_POLICY` — or paste it
into any static host. Put the final URL in both store listings.

---

## 1. Spotify (blocks everything else — do first)

1. Create the app in the dashboard, add redirect URI `waketune://oauth-callback`.
2. Paste the Client ID into `src/config.ts`.
3. **Development mode is limited to 25 allow-listed users.** For a public
   store release you MUST request an **extended quota / production**
   review from Spotify (dashboard → your app → "Request extension").
   Spotify reviews the use case; describe WakeTune honestly: alarm clock
   that plays the user's own library via the official Web API, Premium
   required for playback, no lyrics display, no data retention.
4. Spotify branding rules apply to store screenshots and in-app UI:
   https://developer.spotify.com/documentation/design

---

## 2. Google Play

### Build the signed bundle

```bash
# one-time: create the upload keystore (NOT committed; keep it safe + backed up)
cd android/app
keytool -genkeypair -v -keystore waketune-release.keystore -alias waketune \
  -keyalg RSA -keysize 2048 -validity 10000

# one-time: create android/keystore.properties (gitignored):
cat > ../keystore.properties <<'EOF'
storeFile=waketune-release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=waketune
keyPassword=YOUR_KEY_PASSWORD
EOF

# build the App Bundle
cd ..
./gradlew bundleRelease
# output: android/app/build/outputs/bundle/release/app-release.aab
```

(Alternatively, tag a release and let CI build it — see
`.github/workflows/android-release.yml`.)

### Console setup (🔑)

1. Create the app in Play Console (app name **WakeTune**, category: Tools or
   Lifestyle, free).
2. Upload `app-release.aab` to **Internal testing** first; opt in to
   **Play App Signing** (recommended — Google keeps the signing key,
   your keystore becomes the upload key).
3. Fill the **store listing** — ready-made copy in `docs/STORE_LISTING.md`,
   privacy policy URL from step 0.
4. **Data safety form** — truthful answers for WakeTune:
   - Data collected: **none** (no data leaves the device to the developer).
   - Data shared: **none**.
   - Security practices: data encrypted at rest (Keystore), users can request
     deletion by uninstalling / revoking Spotify access.
5. **Permissions declarations**:
   - `USE_EXACT_ALARM` triggers a Play policy declaration — declare the app
     is an **alarm clock**, which is the explicitly allowed use case.
   - `RECORD_AUDIO`: explain the optional sing-along challenge, on-device
     processing only.
   - `USE_FULL_SCREEN_INTENT`: alarm clock — allowed use case.
6. Content rating questionnaire (IARC), target audience (18+ or 13+ is
   simplest), App access: provide a **test Spotify Premium account** for
   Google reviewers + note that a free-account flow exists (fallback sound).
7. Roll out: Internal → Closed → Production.

### Screenshots

At least 2 phone screenshots (16:9 or 9:16, 320–3840px). Take them from a
real device/emulator: alarm list, create-alarm, active-alarm challenge.

---

## 3. App Store (iOS)

### Build (🔑 requires a Mac)

```bash
npm install
cd ios
bundle install          # first time only (CocoaPods via Gemfile)
bundle exec pod install
open WakeTune.xcworkspace
```

In Xcode:

1. Target **WakeTune** → Signing & Capabilities → select your **Team**, set a
   unique bundle id (e.g. `com.yuvalhad.waketune`).
2. Product → Archive → Distribute App → App Store Connect.

### App Store Connect (🔑)

1. Create the app record (name **WakeTune**, bundle id from above,
   category: Lifestyle; secondary: Music).
2. Listing copy: `docs/STORE_LISTING.md`; privacy policy URL from step 0.
3. **App Privacy** section — matches PRIVACY_POLICY.md:
   - Data collection: **No data collected**.
   - The mic is used but audio is not collected/stored — still describe the
     sing-along feature in the review notes to avoid confusion.
4. **App Review notes** (critical for approval):
   - Provide a **test Spotify Premium account** (email+password) for review.
   - Explain: alarm rings as a local time-sensitive notification; Spotify
     playback starts when the notification is opened (iOS background
     limits); free-account users get a built-in alarm sound.
   - Mention the hidden emergency dismiss (long-press 10s bottom-right) so
     reviewers don't think the alarm is undismissable.
5. Optional but recommended before wide release: apply for the
   **Critical Alerts entitlement** (rings through silent/Focus) — request at
   https://developer.apple.com/contact/request/notifications-critical-alerts-entitlement/
   then set `critical: true` in `src/services/alarms/schedulerShared.ts`.

### Known review risks (and how this repo already mitigates them)

- *Guideline 2.5.4 background audio abuse* — we do NOT declare background
  audio. ✅
- *4.2 minimal functionality* — challenges + Spotify integration are real
  functionality. ✅
- *5.1.1 permissions* — mic/motion have clear purpose strings and are
  optional. ✅
- *Intellectual property* — no lyrics shipped, no Spotify logo misuse; follow
  Spotify design guidelines in screenshots.

---

## 4. Version bumps for each release

- Android: `versionCode` (+1 every upload) and `versionName` in
  `android/app/build.gradle`.
- iOS: `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION` in Xcode (or
  `agvtool`).
- Keep `package.json` `version` in sync for sanity.

---

## 5. Pre-submission smoke test (both platforms)

1. Fresh install → onboarding → connect Spotify (Premium) → grant permissions.
2. Create an alarm 2 minutes out, lock the phone → it must ring, show the
   full-screen/notification path, play a track, and the challenge must stop it.
3. Repeat with Spotify app force-closed → fallback/wake-Spotify path.
4. Repeat with a **free** Spotify account → clear message + fallback sound.
5. Airplane mode → fallback sound still rings.
6. Reboot the device with an alarm set (Android) → alarm survives.
7. Settings → "Test alarm" works; emergency long-press works.
