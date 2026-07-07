/**
 * =========================================================================
 * THE ONE FILE YOU MUST EDIT BEFORE RUNNING THE APP.
 * =========================================================================
 *
 * 1. Create a Spotify app: https://developer.spotify.com/dashboard
 * 2. In the app settings add this exact Redirect URI:  waketune://oauth-callback
 * 3. Paste the Client ID below.
 *
 * With Authorization Code + PKCE there is NO client secret in the app -
 * the Client ID is public by design and safe to commit.
 *
 * Full walkthrough: docs/SPOTIFY_SETUP.md
 * Store release (extended quota etc.): docs/RELEASE.md
 */
export const SPOTIFY_CLIENT_ID = 'PASTE_YOUR_SPOTIFY_CLIENT_ID_HERE';

export const SPOTIFY_REDIRECT_URL = 'waketune://oauth-callback';
