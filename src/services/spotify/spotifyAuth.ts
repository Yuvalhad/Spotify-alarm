/**
 * Spotify OAuth via Authorization Code + PKCE (official flow for mobile apps
 * without a backend). Uses react-native-app-auth, which drives the platform
 * browser (ASWebAuthenticationSession / Custom Tabs).
 *
 * Tokens are stored ONLY in the platform secure store (Keychain/Keystore).
 *
 * Setup required (see docs/SPOTIFY_SETUP.md):
 *  1. Create an app at https://developer.spotify.com/dashboard
 *  2. Add redirect URI: waketune://oauth-callback
 *  3. Put your client id in SPOTIFY_CLIENT_ID below (or wire it to a config file).
 */
import {authorize, refresh, type AuthConfiguration} from 'react-native-app-auth';

import {getSecureItem, removeSecureItem, setSecureItem} from '@/services/storage/secureStorage';
import {logger} from '@/utils/logger';
import type {SpotifyTokens} from './spotifyTypes';

// TODO(config): replace with your Spotify app client id. With PKCE there is no
// client secret in the app - never embed one.
export const SPOTIFY_CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID';
export const SPOTIFY_REDIRECT_URL = 'waketune://oauth-callback';

/**
 * Only the scopes we actually need. Do not add more.
 */
export const SPOTIFY_SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'user-library-read',
  'playlist-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
];

const AUTH_CONFIG: AuthConfiguration = {
  clientId: SPOTIFY_CLIENT_ID,
  redirectUrl: SPOTIFY_REDIRECT_URL,
  scopes: SPOTIFY_SCOPES,
  usePKCE: true,
  serviceConfiguration: {
    authorizationEndpoint: 'https://accounts.spotify.com/authorize',
    tokenEndpoint: 'https://accounts.spotify.com/api/token',
  },
};

const KEY_ACCESS = 'spotify.accessToken';
const KEY_REFRESH = 'spotify.refreshToken';
const KEY_EXPIRES = 'spotify.expiresAt';

/** Interactive login. Must be called from a user gesture (button press). */
export async function loginWithSpotify(): Promise<SpotifyTokens> {
  const result = await authorize(AUTH_CONFIG);
  const tokens: SpotifyTokens = {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    accessTokenExpiresAt: Date.parse(result.accessTokenExpirationDate),
  };
  await persistTokens(tokens);
  logger.info('Spotify login OK');
  return tokens;
}

async function persistTokens(tokens: SpotifyTokens): Promise<void> {
  await Promise.all([
    setSecureItem(KEY_ACCESS, tokens.accessToken),
    // Spotify may not always rotate the refresh token - keep the old one then.
    tokens.refreshToken ? setSecureItem(KEY_REFRESH, tokens.refreshToken) : Promise.resolve(),
    setSecureItem(KEY_EXPIRES, String(tokens.accessTokenExpiresAt)),
  ]);
}

export async function getStoredTokens(): Promise<SpotifyTokens | null> {
  const [accessToken, refreshToken, expiresRaw] = await Promise.all([
    getSecureItem(KEY_ACCESS),
    getSecureItem(KEY_REFRESH),
    getSecureItem(KEY_EXPIRES),
  ]);
  if (!accessToken || !refreshToken) {
    return null;
  }
  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt: Number(expiresRaw ?? 0),
  };
}

export async function isSpotifyConnected(): Promise<boolean> {
  return (await getStoredTokens()) != null;
}

/**
 * Returns a valid access token, refreshing it if it expires within 60s.
 * Throws SpotifyAuthError when the user must re-login.
 */
export async function getValidAccessToken(): Promise<string> {
  const tokens = await getStoredTokens();
  if (!tokens) {
    throw new SpotifyAuthError('Not connected to Spotify');
  }
  if (tokens.accessTokenExpiresAt - Date.now() > 60_000) {
    return tokens.accessToken;
  }
  try {
    const result = await refresh(AUTH_CONFIG, {refreshToken: tokens.refreshToken});
    const next: SpotifyTokens = {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken ?? tokens.refreshToken,
      accessTokenExpiresAt: Date.parse(result.accessTokenExpirationDate),
    };
    await persistTokens(next);
    return next.accessToken;
  } catch (e) {
    logger.warn('Spotify token refresh failed', e);
    throw new SpotifyAuthError('Spotify session expired - please reconnect');
  }
}

export async function logoutSpotify(): Promise<void> {
  await Promise.all([
    removeSecureItem(KEY_ACCESS),
    removeSecureItem(KEY_REFRESH),
    removeSecureItem(KEY_EXPIRES),
  ]);
  // Note: this clears local tokens only. Users can fully revoke access at
  // https://www.spotify.com/account/apps/ - we link to it from Settings.
}

export class SpotifyAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SpotifyAuthError';
  }
}
