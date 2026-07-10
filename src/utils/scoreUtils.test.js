import { describe, it, expect } from 'vitest';
import { PASS_THRESHOLD, isPassed } from './scoreUtils';

describe('PASS_THRESHOLD', () => {
  it('is 70', () => {
    expect(PASS_THRESHOLD).toBe(70);
  });
});

describe('isPassed', () => {
  it('returns true at and above the threshold', () => {
    expect(isPassed(70)).toBe(true);
    expect(isPassed(85)).toBe(true);
    expect(isPassed(100)).toBe(true);
  });

  it('returns false below the threshold', () => {
    expect(isPassed(69.9)).toBe(false);
    expect(isPassed(0)).toBe(false);
  });

  it('coerces string/null scores like ResultPage does', () => {
    expect(isPassed('70')).toBe(true);
    expect(isPassed(null)).toBe(false);
    expect(isPassed(undefined)).toBe(false);
  });
});
