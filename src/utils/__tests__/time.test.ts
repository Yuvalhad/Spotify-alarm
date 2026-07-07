import type {Alarm} from '@/types';
import {formatDays, formatTime, nextOccurrence} from '../time';

const baseAlarm: Alarm = {
  id: 'a1',
  time: {hour: 7, minute: 30},
  daysOfWeek: [],
  enabled: true,
  musicSourceType: 'top_tracks',
  trackPickStrategy: 'random',
  challengeMode: 'lyrics',
  difficulty: 'easy',
  gradualVolumeEnabled: true,
  fallbackSound: 'classic_beep',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('formatTime', () => {
  it('pads hours and minutes', () => {
    expect(formatTime({hour: 7, minute: 5})).toBe('07:05');
    expect(formatTime({hour: 23, minute: 59})).toBe('23:59');
  });
});

describe('formatDays', () => {
  it('handles once / every day / subsets', () => {
    expect(formatDays([])).toBe('Once');
    expect(formatDays([0, 1, 2, 3, 4, 5, 6])).toBe('Every day');
    expect(formatDays([1, 3])).toBe('Mon, Wed');
  });
});

describe('nextOccurrence', () => {
  // Monday 2026-01-05 06:00 local time
  const monday6am = new Date(2026, 0, 5, 6, 0, 0);

  it('one-shot: later today when time is still ahead', () => {
    const next = nextOccurrence(baseAlarm, monday6am);
    expect(next.getDate()).toBe(5);
    expect(next.getHours()).toBe(7);
    expect(next.getMinutes()).toBe(30);
  });

  it('one-shot: tomorrow when time already passed', () => {
    const monday8am = new Date(2026, 0, 5, 8, 0, 0);
    const next = nextOccurrence(baseAlarm, monday8am);
    expect(next.getDate()).toBe(6);
  });

  it('weekly: picks the next matching weekday', () => {
    // Wednesday = 3; from Monday 6am the next Wednesday is Jan 7.
    const alarm = {...baseAlarm, daysOfWeek: [3]};
    const next = nextOccurrence(alarm, monday6am);
    expect(next.getDay()).toBe(3);
    expect(next.getDate()).toBe(7);
  });

  it('weekly: same day when time is ahead', () => {
    const alarm = {...baseAlarm, daysOfWeek: [1]}; // Monday
    const next = nextOccurrence(alarm, monday6am);
    expect(next.getDate()).toBe(5);
  });
});
