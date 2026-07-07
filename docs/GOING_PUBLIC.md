# Going public: from 25 users to everyone

WakeTune talks to the Spotify API, and Spotify gates public access. This is
the complete playbook for getting past the 25-user development cap — plus a
realistic plan B, because approval is **not guaranteed**.

---

## 1. The two Spotify modes

| | Development mode (default) | Extended quota mode |
|---|---|---|
| Who can log in | Up to 25 users you allow-list manually | **Any Spotify user** |
| Rate limits | Low | Higher |
| How you get it | Automatic | **Quota Extension Request** reviewed by Spotify |
| Cost | Free | Free |

Without the extension, a stranger who installs WakeTune from a store will
fail at the Spotify login step. The app still works for them as a regular
alarm clock (built-in sounds) — but the headline feature is locked.

## 2. Before you apply — reality check

- Spotify has **tightened approval criteria over the last couple of years**
  (they also removed some endpoints for new apps). Reviews can take weeks,
  rejections happen, and policies change — read the current
  [Developer Policy](https://developer.spotify.com/policy) and
  [Design Guidelines](https://developer.spotify.com/documentation/design)
  on the day you apply.
- Spotify may prefer (or require) the app to be registered under a
  **business/organization** rather than a personal hobby account. If you
  have any business entity, use it in the dashboard profile.
- Your app must already look finished: working build, screenshots/video,
  hosted privacy policy, and full branding compliance (below).

## 3. Compliance checklist (what reviewers look for)

Already implemented in the codebase:

- ✅ Official OAuth (PKCE), no password handling, minimal scopes
- ✅ No scraping, no unofficial endpoints, no downloading, no DRM bypass
- ✅ Premium required for playback — enforced and explained to the user
- ✅ Metadata (title/artist/art) shown only alongside Spotify playback
- ✅ Content links back to Spotify: tapping the track card on the alarm
  screen opens the track in the Spotify app
- ✅ No lyrics display without a license
- ✅ Privacy policy with a Spotify section (`PRIVACY_POLICY.md`)
- ✅ "WakeTune is not affiliated with or endorsed by Spotify" disclaimer in
  the store listing (`docs/STORE_LISTING.md`)

You must still do manually:

- 🔲 Use the official Spotify logo/icon per the Design Guidelines wherever
  the UI says "Play on Spotify" (download assets from the design page —
  don't recreate them)
- 🔲 App name/icon must not imitate Spotify ("WakeTune" is fine)
- 🔲 Screenshots for the submission that show the attribution

## 4. Submitting the Quota Extension Request

Dashboard → your app → **Extension Request** (or "Request extension").
Fill honestly. Ready-to-paste answers:

**App description:**

> WakeTune is a mobile alarm clock for iOS and Android. At the alarm time it
> plays a song from the user's own Spotify library (Liked Songs, Top Tracks,
> playlists or followed artists) via Spotify Connect, and the alarm stops
> only after the user completes a short interactive wake-up challenge
> (typing, singing, or movement). Spotify Premium is required for playback
> and this is clearly communicated in-app; non-Premium users get a built-in
> alarm sound instead.

**Why each scope is needed:**

> user-read-private: detect Premium status to enable/disable playback
> features honestly. user-read-email: identify the connected account in the
> settings screen. user-top-read / user-library-read /
> playlist-read-private: let the user choose which of their own music
> sources wakes them up. user-read-playback-state /
> user-modify-playback-state: start and stop the alarm song on the user's
> own device at the alarm time, and adjust volume gradually.

**Data usage / privacy:**

> WakeTune has no backend. Tokens are stored in the device secure store
> (Keychain/Keystore). No Spotify data is stored beyond the currently
> selected track's metadata for the active alarm, nothing is shared with
> third parties, there are no analytics/ads, and no data is used for any
> form of machine learning. Users can revoke access at any time; the app
> links to Spotify's app-revocation page.

Attach: screenshots of the login screen, source-selection, and active-alarm
screen (with Spotify attribution visible), plus the privacy policy URL.

**Then wait.** Weeks is normal. Meanwhile you can ship (see below) — the
25-user allowlist covers you, friends and reviewers.

## 5. Ship strategy (don't block the launch on Spotify)

Launch order that works even while the extension is pending:

1. **Release the app to the stores now.** For everyone, WakeTune is a
   polished challenge alarm clock with built-in sounds. Spotify appears as
   "connect your Spotify" — if login fails because the app is still in
   development mode, the UI already explains and falls back gracefully.
2. Allow-list your 25 dev-mode slots for yourself, testers, and the
   **store reviewers** (Google/Apple test accounts).
3. When the extension is approved — everyone's login starts working, with
   **zero app update needed** (the gate is on Spotify's side).

## 6. Plan B if Spotify rejects or stalls

- **Re-apply with fixes.** Rejections state a reason; address it and
  resubmit.
- **Local music alarm source** (no gatekeeper): let users pick an audio file
  on the device as the alarm track. Small feature, works for 100% of users.
- **Apple Music on iOS** via MusicKit: Apple's API allows full playback for
  Apple Music subscribers and has **no user cap or extension process** —
  a realistic second integration if Spotify blocks growth.
- What NOT to do: unofficial APIs, scraping, or shipping multiple dashboard
  apps to multiply the 25-user cap — all violate Spotify's terms and risk a
  permanent ban.
