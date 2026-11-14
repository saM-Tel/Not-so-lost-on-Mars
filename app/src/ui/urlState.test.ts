// WHAT:    Tests for urlState.ts: reading and writing the chosen site in the address bar.
// IN:      Nothing.
// OUT:     Pass or fail under Vitest.
// USED BY: npm run check.
// RULES:   Covers the two pure functions only; the ones that touch the browser are thin wrappers.
// TRAPS:   PITFALLS 10.
// OWNER:   Role B.

import { describe, expect, it } from 'vitest';
import { formatHash, parseHash } from './urlState';

describe('parseHash', () => {
  it('reads a site id', () => {
    expect(parseHash('#site=bright-angel')).toEqual({ siteId: 'bright-angel' });
    expect(parseHash('site=gale-crater')).toEqual({ siteId: 'gale-crater' });
  });

  it('means the globe when no site is named', () => {
    expect(parseHash('')).toEqual({ siteId: null });
    expect(parseHash('#')).toEqual({ siteId: null });
    expect(parseHash('#other=1')).toEqual({ siteId: null });
  });

  it('ignores anything that is not a kebab-case id', () => {
    expect(parseHash('#site=Bright Angel')).toEqual({ siteId: null });
    expect(parseHash('#site=../etc')).toEqual({ siteId: null });
    expect(parseHash('#site=')).toEqual({ siteId: null });
  });
});

describe('formatHash', () => {
  it('round-trips', () => {
    expect(formatHash({ siteId: 'bright-angel' })).toBe('#site=bright-angel');
    expect(formatHash({ siteId: null })).toBe('');
    expect(parseHash(formatHash({ siteId: 'utopia-planitia' }))).toEqual({ siteId: 'utopia-planitia' });
  });
});

describe('a walk in the address', () => {
  it('round-trips the target and the tether settings', () => {
    const state = { siteId: 'bright-angel', target: [77.31589, 18.49948] as [number, number], walkBackMin: 30, elapsedMin: 120 };
    expect(formatHash(state)).toBe('#site=bright-angel&to=77.31589,18.49948&back=30&t=120');
    expect(parseHash(formatHash(state))).toEqual(state);
  });

  it('leaves out what is not set', () => {
    expect(formatHash({ siteId: 'bright-angel', target: null, walkBackMin: null, elapsedMin: 0 })).toBe('#site=bright-angel');
  });

  it('ignores a target or setting it could not have written', () => {
    expect(parseHash('#site=bright-angel&to=abc,1')).toEqual({ siteId: 'bright-angel' });
    expect(parseHash('#site=bright-angel&to=500,18.5')).toEqual({ siteId: 'bright-angel' });
    expect(parseHash('#site=bright-angel&to=77.3')).toEqual({ siteId: 'bright-angel' });
    expect(parseHash('#site=bright-angel&back=-5&t=1e9')).toEqual({ siteId: 'bright-angel' });
    expect(parseHash('#to=77.3,18.5')).toEqual({ siteId: null });
  });
});
