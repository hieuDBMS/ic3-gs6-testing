import { describe, it, expect } from 'vitest';
import { getEffectiveStreak, isStreakAtRisk } from './streak';

const toDateStr = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

describe('getEffectiveStreak', () => {
  it('returns 0 when there is no last streak date', () => {
    expect(getEffectiveStreak(null, 5)).toBe(0);
    expect(getEffectiveStreak(undefined, 5)).toBe(0);
  });

  it('keeps the streak when last activity was today', () => {
    const today = toDateStr(new Date());
    expect(getEffectiveStreak(today, 7)).toBe(7);
  });

  it('keeps the streak when last activity was yesterday (not broken yet)', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(getEffectiveStreak(toDateStr(yesterday), 3)).toBe(3);
  });

  it('resets to 0 when last activity was more than 1 day ago', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    expect(getEffectiveStreak(toDateStr(threeDaysAgo), 10)).toBe(0);
  });

  it('coerces a non-numeric currentStreak to 0', () => {
    const today = toDateStr(new Date());
    expect(getEffectiveStreak(today, null)).toBe(0);
    expect(getEffectiveStreak(today, undefined)).toBe(0);
  });
});

describe('isStreakAtRisk', () => {
  it('is false when there is no last streak date', () => {
    expect(isStreakAtRisk(null, 5)).toBe(false);
    expect(isStreakAtRisk(undefined, 5)).toBe(false);
  });

  it('is false when current streak is 0 (nothing to lose)', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isStreakAtRisk(toDateStr(yesterday), 0)).toBe(false);
  });

  it('is false when already practiced today (streak not at risk yet)', () => {
    const today = toDateStr(new Date());
    expect(isStreakAtRisk(today, 5)).toBe(false);
  });

  it('is true when last activity was yesterday and streak is still positive', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isStreakAtRisk(toDateStr(yesterday), 5)).toBe(true);
  });

  it('is false when the streak has already broken (more than 1 day ago)', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    expect(isStreakAtRisk(toDateStr(threeDaysAgo), 5)).toBe(false);
  });
});
