/**
 * Song selection logic for a ringing alarm.
 *
 * Flow (per spec):
 *  1. verify Spotify connection (throws SpotifyAuthError otherwise - caller
 *     falls back to local sound)
 *  2. fetch candidates by the alarm's music source
 *  3. unplayable tracks are already filtered in spotifyApi
 *  4. pick by strategy
 *  5. return the Track (caller persists it into the ActiveAlarmSession)
 */
import type {Alarm, Track} from '@/types';
import {pickRandom} from '@/utils/random';
import {logger} from '@/utils/logger';
import {
  getArtistTopTracks,
  getLikedSongs,
  getMyPlaylists,
  getPlaylistTracks,
  getTopArtists,
  getTopTracks,
} from './spotifyApi';

async function fetchCandidates(alarm: Alarm): Promise<Track[]> {
  switch (alarm.musicSourceType) {
    case 'liked_songs':
      return getLikedSongs(50);
    case 'top_tracks':
      return getTopTracks(50);
    case 'playlist': {
      if (!alarm.spotifyPlaylistId) {
        logger.warn('Playlist source without playlistId, falling back to top tracks');
        return getTopTracks(50);
      }
      return getPlaylistTracks(alarm.spotifyPlaylistId);
    }
    case 'artist': {
      const artistId =
        alarm.spotifyArtistId ?? (await getTopArtists(1)).at(0)?.id;
      if (!artistId) {
        return getTopTracks(50);
      }
      return getArtistTopTracks(artistId);
    }
    case 'random_library': {
      // Mix liked songs + top tracks and pick from the union.
      const [liked, top] = await Promise.all([getLikedSongs(50), getTopTracks(50)]);
      const seen = new Set<string>();
      return [...liked, ...top].filter(t => !seen.has(t.id) && seen.add(t.id));
    }
  }
}

function pickByStrategy(alarm: Alarm, candidates: Track[]): Track {
  switch (alarm.trackPickStrategy) {
    case 'most_loved':
      // Top-tracks / liked lists come back ranked by Spotify - first ≈ most loved.
      return candidates[0];
    case 'newest':
      // Liked songs come back newest-first. For other sources this is a
      // best-effort approximation.
      return candidates[0];
    case 'energetic':
      // NOTE: Spotify deprecated the public Audio Features endpoint for new
      // apps (Nov 2024), so real energy-based ranking is not reliably
      // available. TODO(spotify): if your app has access to /audio-features,
      // rank by `energy` here. Until then: random pick.
      return pickRandom(candidates);
    case 'random':
    default:
      return pickRandom(candidates);
  }
}

export async function selectTrackForAlarm(alarm: Alarm): Promise<Track | null> {
  const candidates = await fetchCandidates(alarm);
  if (candidates.length === 0) {
    logger.warn('No playable candidate tracks for alarm', alarm.id);
    return null;
  }
  return pickByStrategy(alarm, candidates);
}

export {getMyPlaylists};
