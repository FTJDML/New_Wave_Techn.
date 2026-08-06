import { describe, expect, it } from 'vitest';
import { humanize, formatDuration } from '../../src/lib/formatting';

describe('humanize', () => {
  it('converts SCREAMING_SNAKE_CASE to Title Case', () => {
    expect(humanize('CONFIRMED_FIRST_PARTY')).toBe('Confirmed First Party');
    expect(humanize('CURRENT')).toBe('Current');
  });

  it('returns "Unknown" for empty/null/undefined', () => {
    expect(humanize('')).toBe('Unknown');
    expect(humanize(null)).toBe('Unknown');
    expect(humanize(undefined)).toBe('Unknown');
  });

  it('stringifies numbers as-is', () => {
    expect(humanize(2005)).toBe('2005');
  });
});

describe('formatDuration', () => {
  it('returns null when years is null', () => {
    expect(formatDuration(null, 'EXACT_YEAR_FROM_VENDOR')).toBeNull();
  });

  it('labels approximate precisions with "circa"', () => {
    expect(formatDuration(21, 'APPROXIMATE_MID_2000S')).toBe('circa 21 years');
  });

  it('does not add "circa" for exact precisions', () => {
    expect(formatDuration(21, 'EXACT_YEAR_FROM_VENDOR')).toBe('21 years');
  });
});
