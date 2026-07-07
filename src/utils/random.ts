/** Returns a random element from a non-empty array. */
export function pickRandom<T>(items: T[]): T {
  if (items.length === 0) {
    throw new Error('pickRandom called with an empty array');
  }
  return items[Math.floor(Math.random() * items.length)];
}

/** Simple unique id (no external uuid dependency needed for local-only data). */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
