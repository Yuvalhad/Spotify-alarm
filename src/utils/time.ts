import type {Alarm, AlarmTime} from '@/types';

/** Formats an AlarmTime as HH:MM. */
export function formatTime(time: AlarmTime): string {
  const h = String(time.hour).padStart(2, '0');
  const m = String(time.minute).padStart(2, '0');
  return `${h}:${m}`;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatDays(daysOfWeek: number[]): string {
  if (daysOfWeek.length === 0) {
    return 'Once';
  }
  if (daysOfWeek.length === 7) {
    return 'Every day';
  }
  return [...daysOfWeek]
    .sort((a, b) => a - b)
    .map(d => DAY_LABELS[d])
    .join(', ');
}

/**
 * Computes the next Date at which the alarm should fire, from `from` (exclusive).
 * One-shot alarms: next occurrence of hour:minute (today if still ahead, else tomorrow).
 * Repeating alarms: next occurrence on one of daysOfWeek.
 */
export function nextOccurrence(alarm: Alarm, from: Date = new Date()): Date {
  const candidate = new Date(from);
  candidate.setHours(alarm.time.hour, alarm.time.minute, 0, 0);

  const matchesDay = (d: Date) =>
    alarm.daysOfWeek.length === 0 || alarm.daysOfWeek.includes(d.getDay());

  // Search up to 8 days ahead (covers all weekly cases).
  for (let i = 0; i < 8; i++) {
    if (candidate.getTime() > from.getTime() && matchesDay(candidate)) {
      return new Date(candidate);
    }
    candidate.setDate(candidate.getDate() + 1);
  }
  // Unreachable, but keep TS happy.
  return new Date(candidate);
}

/** Human readable "rings in 7h 32m" style string. */
export function formatUntil(target: Date, from: Date = new Date()): string {
  const diffMs = target.getTime() - from.getTime();
  if (diffMs <= 0) {
    return 'now';
  }
  const totalMinutes = Math.round(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) {
    return `in ${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `in ${hours}h ${minutes}m`;
  }
  return `in ${minutes}m`;
}
