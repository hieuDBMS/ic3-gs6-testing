import { describe, it, expect } from 'vitest';
import { stripHtml } from './text';

describe('stripHtml', () => {
  it('removes tags and trims whitespace', () => {
    expect(stripHtml('<p>Hello <b>world</b></p>  ')).toBe('Hello world');
  });

  it('returns empty string for null/undefined input', () => {
    expect(stripHtml(null)).toBe('');
    expect(stripHtml(undefined)).toBe('');
  });

  it('treats a whitespace-only or empty question as blank for validation', () => {
    expect(stripHtml('<p>&nbsp;</p>')).not.toBe('');
    expect(stripHtml('   ')).toBe('');
    expect(stripHtml('')).toBe('');
  });

  it('leaves plain text untouched', () => {
    expect(stripHtml('No tags here')).toBe('No tags here');
  });
});
