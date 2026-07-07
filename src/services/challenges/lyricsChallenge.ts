/**
 * Challenge 1: type the lyrics (or fallback text).
 *
 * Order of preference:
 *  1. licensed lyrics line from the active LyricsProvider (short excerpt only)
 *  2. no lyrics available -> type the song title / artist name
 *  3. no track at all (fallback-sound ring) -> type a generated wake-up sentence
 */
import {activeLyricsProvider} from '@/services/lyrics/demoLyricsProvider';
import {similarity} from '@/utils/text';
import {pickRandom} from '@/utils/random';
import type {ChallengeContext, ChallengeResult, LyricsChallengeSpec} from './challengeTypes';

const WAKE_SENTENCES = [
  'I am awake and ready to start my day',
  'The early bird catches the worm every time',
  'Today is going to be a great morning',
  'No more snoozing, the day is waiting for me',
];

const THRESHOLDS = {easy: 0.75, medium: 0.85, hard: 0.95} as const;

export async function buildLyricsChallenge(
  ctx: ChallengeContext,
): Promise<LyricsChallengeSpec> {
  const passThreshold = THRESHOLDS[ctx.difficulty];

  if (ctx.track) {
    const line = await activeLyricsProvider
      .getRandomLine(ctx.track.id, ctx.track.artist, ctx.track.title)
      .catch(() => null);

    if (line) {
      return {
        kind: 'lyrics',
        prompt:
          ctx.difficulty === 'hard'
            ? 'Type this lyric from memory (it will disappear in 5 seconds):'
            : 'Type this lyric exactly:',
        targetText: line.text,
        showTarget: ctx.difficulty !== 'hard',
        passThreshold,
      };
    }

    // No licensed lyrics -> official metadata fallback (title/artist are not
    // copyrighted lyrics, safe to display).
    const useTitle = Math.random() < 0.5;
    return {
      kind: 'lyrics',
      prompt: useTitle ? 'Type the name of the song that is playing:' : 'Type the artist name:',
      targetText: useTitle ? ctx.track.title : ctx.track.artist,
      // Easy shows the answer (pure typing task); medium/hard require knowing it.
      showTarget: ctx.difficulty === 'easy',
      passThreshold,
    };
  }

  const sentence = pickRandom(WAKE_SENTENCES);
  return {
    kind: 'lyrics',
    prompt: 'Type this sentence to prove you are awake:',
    targetText: sentence,
    showTarget: true,
    passThreshold,
  };
}

export function evaluateLyricsChallenge(
  spec: LyricsChallengeSpec,
  userInput: string,
): ChallengeResult {
  const score = similarity(userInput, spec.targetText);
  const success = score >= spec.passThreshold;
  return {
    success,
    score: Math.round(score * 100),
    reason: success ? undefined : 'Not quite - check the spelling and try again',
  };
}
