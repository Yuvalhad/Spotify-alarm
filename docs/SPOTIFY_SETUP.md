# Spotify setup

WakeTune talks ONLY to the official Spotify Web API, authenticated with
Authorization Code + PKCE (no client secret in the app, no backend needed).

## 1. Create a Spotify app

1. Go to https://developer.spotify.com/dashboard and create an app.
2. Add the redirect URI: `waketune://oauth-callback`
3. Copy the **Client ID** into `SPOTIFY_CLIENT_ID` in
   `src/services/spotify/spotifyAuth.ts`.

While the app is in "development mode" on the dashboard, add your Spotify
account (and testers) under *Users and access*.

## 2. Scopes requested (and why)

| Scope | Used for |
|---|---|
| `user-read-private` | account type (Premium check) |
| `user-read-email` | account identification in Settings |
| `user-top-read` | Top Tracks / Top Artists music source |
| `user-library-read` | Liked Songs music source |
| `playlist-read-private` | playlist picker |
| `user-read-playback-state` | finding an active Spotify Connect device |
| `user-modify-playback-state` | starting/stopping the alarm song, volume ramp |

## 3. Hard policy/product constraints (respected by design)

- **Premium-only playback**: `PUT /me/player/play` returns 403 for free
  accounts. WakeTune detects this and uses the local fallback sound, with a
  clear message to the user.
- **A Spotify Connect device must exist**: if the Spotify app isn't running
  anywhere, there is nothing to control. WakeTune tries `spotify:` deep link
  to wake the app (foreground only), polls devices, then falls back.
- **No downloading, no DRM bypass, no scraping, no unofficial APIs.** The
  lyrics feature is architected behind a `LyricsProvider` interface and ships
  with demo data only until a licensed provider is integrated.
- Users can revoke access at https://www.spotify.com/account/apps/ (linked
  from the Settings screen).
