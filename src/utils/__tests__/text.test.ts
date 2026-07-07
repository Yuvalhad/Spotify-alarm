import {levenshtein, normalizeForComparison, similarity} from '../text';

describe('normalizeForComparison', () => {
  it('lowercases, strips punctuation, collapses whitespace', () => {
    expect(normalizeForComparison("  Hello,   World! It's ME. ")).toBe('hello world its me');
  });

  it('keeps non-latin letters (Hebrew)', () => {
    expect(normalizeForComparison('שלום, עולם!')).toBe('שלום עולם');
  });
});

describe('levenshtein', () => {
  it('computes distances', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('same', 'same')).toBe(0);
  });
});

describe('similarity', () => {
  it('is 1 for equal strings after normalization', () => {
    expect(similarity('Hello World', 'hello, world!')).toBe(1);
  });

  it('tolerates small typos', () => {
    expect(similarity('wake up in the morning', 'wake up in the mornin')).toBeGreaterThan(0.9);
  });

  it('rejects unrelated text', () => {
    expect(similarity('completely different', 'wake up song')).toBeLessThan(0.5);
  });
});
