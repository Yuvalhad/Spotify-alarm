/**
 * Thin, typed wrapper over the OFFICIAL Spotify Web API only.
 * No scraping, no unofficial endpoints, no track downloading, no DRM bypass.
 */
import type {Track} from '@/types';
import {logger} from '@/utils/logger';
import {getValidAccessToken} from './spotifyAuth';
import type {
  SpotifyDevicesResponse,
  SpotifyPaging,
  SpotifyPlaylistSimple,
  SpotifyPlaylistTrackItem,
  SpotifySavedTrackItem,
  SpotifyTopArtist,
  SpotifyTrack,
  SpotifyUserProfile,
} from './spotifyTypes';

const BASE_URL = 'https://api.spotify.com/v1';

export class SpotifyApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'SpotifyApiError';
  }
}

async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  retryOn429 = true,
): Promise<T> {
  const token = await getValidAccessToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (res.status === 429 && retryOn429) {
    // Respect the official rate-limit header, single retry.
    const retryAfter = Number(res.headers.get('Retry-After') ?? '1');
    await new Promise<void>(r => setTimeout(() => r(), Math.min(retryAfter, 5) * 1000));
    return apiFetch<T>(path, init, false);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    logger.warn('Spotify API error', res.status, path, body);
    throw new SpotifyApiError(`Spotify API ${res.status} on ${path}`, res.status);
  }
  return (await res.json()) as T;
}

function toTrack(t: SpotifyTrack): Track {
  return {
    id: t.id,
    uri: t.uri,
    title: t.name,
    artist: t.artists.map(a => a.name).join(', '),
    albumName: t.album?.name ?? '',
    albumArtUrl: t.album?.images?.[0]?.url,
    durationMs: t.duration_ms,
  };
}

/** Filters out unplayable / local / null tracks. */
function playableOnly(tracks: (SpotifyTrack | null)[]): Track[] {
  return tracks
    .filter((t): t is SpotifyTrack => !!t && !!t.id && t.is_playable !== false)
    .map(toTrack);
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export async function getMe(): Promise<SpotifyUserProfile> {
  return apiFetch<SpotifyUserProfile>('/me');
}

/** Playback control via the Web API requires a Premium account. */
export async function isPremiumUser(): Promise<boolean> {
  const me = await getMe();
  return me.product === 'premium';
}

// ---------------------------------------------------------------------------
// Library / catalog reads
// ---------------------------------------------------------------------------

export async function getTopTracks(limit = 50): Promise<Track[]> {
  const page = await apiFetch<SpotifyPaging<SpotifyTrack>>(
    `/me/top/tracks?limit=${limit}&time_range=medium_term`,
  );
  return playableOnly(page.items);
}

export async function getLikedSongs(limit = 50): Promise<Track[]> {
  const page = await apiFetch<SpotifyPaging<SpotifySavedTrackItem>>(
    `/me/tracks?limit=${Math.min(limit, 50)}`,
  );
  return playableOnly(page.items.map(i => i.track));
}

export async function getMyPlaylists(limit = 50): Promise<SpotifyPlaylistSimple[]> {
  const page = await apiFetch<SpotifyPaging<SpotifyPlaylistSimple>>(
    `/me/playlists?limit=${limit}`,
  );
  return page.items;
}

export async function getPlaylistTracks(playlistId: string, limit = 100): Promise<Track[]> {
  const page = await apiFetch<SpotifyPaging<SpotifyPlaylistTrackItem>>(
    `/playlists/${playlistId}/tracks?limit=${Math.min(limit, 100)}&fields=items(track(id,uri,name,duration_ms,is_playable,artists(id,name),album(id,name,images)))`,
  );
  return playableOnly(page.items.map(i => i.track));
}

export async function getTopArtists(limit = 10): Promise<SpotifyTopArtist[]> {
  const page = await apiFetch<SpotifyPaging<SpotifyTopArtist>>(
    `/me/top/artists?limit=${limit}`,
  );
  return page.items;
}

export async function getArtistTopTracks(artistId: string): Promise<Track[]> {
  const res = await apiFetch<{tracks: SpotifyTrack[]}>(
    `/artists/${artistId}/top-tracks?market=from_token`,
  );
  return playableOnly(res.tracks);
}

// ---------------------------------------------------------------------------
// Playback state (control lives in spotifyPlayback.ts)
// ---------------------------------------------------------------------------

export async function getDevices(): Promise<SpotifyDevicesResponse> {
  return apiFetch<SpotifyDevicesResponse>('/me/player/devices');
}

export async function startPlayback(deviceId: string | null, uris: string[]): Promise<void> {
  const qs = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : '';
  await apiFetch<void>(`/me/player/play${qs}`, {
    method: 'PUT',
    body: JSON.stringify({uris}),
  });
}

export async function pausePlayback(): Promise<void> {
  await apiFetch<void>('/me/player/pause', {method: 'PUT'});
}

export async function setVolume(volumePercent: number): Promise<void> {
  const v = Math.max(0, Math.min(100, Math.round(volumePercent)));
  await apiFetch<void>(`/me/player/volume?volume_percent=${v}`, {method: 'PUT'});
}
