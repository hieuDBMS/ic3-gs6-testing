import { describe, it, expect } from 'vitest';
import { formatDurationLabel } from './format';

describe('formatDurationLabel', () => {
  it('formats whole minutes and seconds', () => {
    expect(formatDurationLabel(125)).toBe('2m 5s');
  });

  it('formats zero seconds as 0m 0s, not the fallback', () => {
    expect(formatDurationLabel(0)).toBe('0m 0s');
  });

  it('formats sub-minute durations', () => {
    expect(formatDurationLabel(45)).toBe('0m 45s');
  });

  it('falls back to "--" for null/undefined', () => {
    expect(formatDurationLabel(null)).toBe('--');
    expect(formatDurationLabel(undefined)).toBe('--');
  });
});
