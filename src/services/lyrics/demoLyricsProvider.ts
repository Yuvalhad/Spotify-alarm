/**
 * Demo lyrics provider for development ONLY.
 * Contains a handful of ORIGINAL placeholder lines (not real copyrighted
 * lyrics) keyed by demo track ids, so the lyrics challenge flow can be
 * developed and tested end-to-end without a licensed lyrics API.
 *
 * In production this provider returns null for real tracks, which makes the
 * lyrics challenge fall back to typing the song title / artist name.
 */
import {pickRandom} from '@/utils/random';
import type {LyricsLine, LyricsProvider} from './lyricsProvider';

const DEMO_LYRICS: Record<string, string[]> = {
  'demo-track-1': [
    'Morning light is calling out your name',
    'Open up your eyes and start the game',
    'Every single sunrise is brand new',
  ],
  'demo-track-2': [
    'Wake up, the beat is on the way',
    'No more sleeping through another day',
  ],
};

export const demoLyricsProvider: LyricsProvider = {
  name: 'Demo (development only)',

  async getLyrics(trackId: string): Promise<LyricsLine[] | null> {
    const lines = DEMO_LYRICS[trackId];
    return lines ? lines.map(text => ({text})) : null;
  },

  async getRandomLine(trackId: string): Promise<LyricsLine | null> {
    const lines = DEMO_LYRICS[trackId];
    return lines ? {text: pickRandom(lines)} : null;
  },
};

/**
 * The provider the app actually uses. Swap this for a licensed provider when
 * one is integrated (keep the demo provider for tests).
 */
export const activeLyricsProvider: LyricsProvider = demoLyricsProvider;
