/**
 * LICENSED-LYRICS-ONLY architecture.
 *
 * We do NOT scrape lyrics, do NOT use unofficial APIs, and do NOT display
 * full lyrics without a license. The app codes against this interface; the
 * MVP ships with a demo provider (hand-written sample data) and the lyrics
 * challenge automatically falls back to "type the song/artist name" when no
 * licensed lyrics are available for a track.
 *
 * TODO(lyrics): integrate a licensed provider (e.g. Musixmatch's commercial
 * API with a proper agreement) behind this interface. Display at most a short
 * excerpt as allowed by that license.
 */

export interface LyricsLine {
  text: string;
}

export interface LyricsProvider {
  /** Human-readable provider name (shown in Settings > Privacy/licenses). */
  readonly name: string;
  /**
   * Returns a short licensed excerpt (a few lines) for the track, or null if
   * lyrics are unavailable / unlicensed.
   */
  getLyrics(trackId: string, artist: string, title: string): Promise<LyricsLine[] | null>;
  /** Returns one random licensed line for the track, or null. */
  getRandomLine(trackId: string, artist: string, title: string): Promise<LyricsLine | null>;
}
