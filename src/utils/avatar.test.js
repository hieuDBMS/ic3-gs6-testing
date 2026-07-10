import { describe, it, expect } from 'vitest';
import { getInitials } from './avatar';

describe('getInitials', () => {
  it('takes first and last initials for a full name', () => {
    expect(getInitials('Nguyen Van A')).toBe('NA');
  });

  it('takes both initials for a two-word name', () => {
    expect(getInitials('Minh Hieu')).toBe('MH');
  });

  it('uses the single initial for a one-word name', () => {
    expect(getInitials('Admin')).toBe('A');
  });

  it('falls back to "?" for empty/missing names', () => {
    expect(getInitials('')).toBe('?');
    expect(getInitials(null)).toBe('?');
    expect(getInitials(undefined)).toBe('?');
  });
});
