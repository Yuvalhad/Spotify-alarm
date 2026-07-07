/**
 * Tiny logger wrapper so we can later route logs to a file / local analytics
 * without touching call sites. No remote logging - privacy by default.
 */
const PREFIX = '[WakeTune]';

export const logger = {
  debug: (...args: unknown[]) => {
    if (__DEV__) {
      console.log(PREFIX, ...args);
    }
  },
  info: (...args: unknown[]) => console.log(PREFIX, ...args),
  warn: (...args: unknown[]) => console.warn(PREFIX, ...args),
  error: (...args: unknown[]) => console.error(PREFIX, ...args),
};
