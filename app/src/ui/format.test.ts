// WHAT:    Tests for format.ts.
// IN:      Nothing.
// OUT:     Pass or fail.
// USED BY: npm test.
// RULES:   Every expected string carries its unit.
// TRAPS:   PITFALLS 8.
// OWNER:   Role B.

import { describe, expect, it } from 'vitest';
import { formatDistance, formatDuration, formatEnergy, formatHeight, formatRange } from './format';

describe('formatting', () => {
  it('writes distances in metres, then kilometres', () => {
    expect(formatDistance(436)).toBe('440 m');
    expect(formatDistance(1238)).toBe('1.24 km');
  });

  it('writes durations to the minute', () => {
    expect(formatDuration(44 * 60 + 20)).toBe('44 min');
    expect(formatDuration(2 * 3600 + 10 * 60)).toBe('2 h 10 min');
  });

  it('writes energy in kilojoules and heights in metres', () => {
    expect(formatEnergy(84_300)).toBe('84 kJ');
    expect(formatEnergy(1_260_000)).toBe('1,300 kJ');
    expect(formatHeight(41.6)).toBe('42 m');
  });

  it('writes a range as the expected value with the other two after it', () => {
    expect(formatRange(7800, 6600, 9900, formatDuration)).toBe('2 h 10 min (1 h 50 min to 2 h 45 min)');
  });
});
