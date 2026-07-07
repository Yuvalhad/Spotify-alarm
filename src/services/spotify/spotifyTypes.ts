/**
 * Minimal typed subset of the official Spotify Web API responses.
 * https://developer.spotify.com/documentation/web-api
 */

export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  /** Epoch ms when the access token expires. */
  accessTokenExpiresAt: number;
}

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyArtistSimple {
  id: string;
  name: string;
}

export interface SpotifyAlbumSimple {
  id: string;
  name: string;
  images: SpotifyImage[];
}

export interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  duration_ms: number;
  is_playable?: boolean;
  artists: SpotifyArtistSimple[];
  album: SpotifyAlbumSimple;
}

export interface SpotifyPaging<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
}

export interface SpotifySavedTrackItem {
  added_at: string;
  track: SpotifyTrack;
}

export interface SpotifyPlaylistSimple {
  id: string;
  name: string;
  images: SpotifyImage[];
  tracks: {total: number};
}

export interface SpotifyPlaylistTrackItem {
  track: SpotifyTrack | null; // null for removed/local tracks
}

export interface SpotifyUserProfile {
  id: string;
  display_name: string | null;
  email?: string;
  /** 'premium' | 'free' | 'open' - playback control requires 'premium'. */
  product?: string;
  images?: SpotifyImage[];
}

export interface SpotifyDevice {
  id: string | null;
  is_active: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number | null;
}

export interface SpotifyDevicesResponse {
  devices: SpotifyDevice[];
}

export interface SpotifyTopArtist {
  id: string;
  name: string;
  images: SpotifyImage[];
}
