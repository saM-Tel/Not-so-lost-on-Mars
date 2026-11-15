// WHAT:    Tests for choosing the site the person has zoomed in on, in zoomSelect.ts.
// IN:      Made-up site positions, built in this file as test fixtures.
// OUT:     Pass or fail under Vitest.
// USED BY: npm run check.
// RULES:   Expected distances are worked by hand from the Mars radius.
// TRAPS:   PITFALLS 3.
// OWNER:   Role B.

import { describe, expect, it } from 'vitest';
import type { SiteEntry } from '../data/contract';
import { DESELECT_BELOW_ZOOM, SELECT_FROM_ZOOM, shouldDeselect, siteInFocus } from './zoomSelect';

/** Test fixture: a site with only the fields the function reads. */
function fixtureSite(id: string, lonEastDeg: number, latDeg: number): SiteEntry {
  return { id, lonEastDeg, latDeg } as SiteEntry;
}

describe('siteInFocus', () => {
  // At zoom 4 on the equator one pixel is 2 * pi * 3,396,190 / (512 * 16) = 2,604.8 m.
  // In a 1000 x 800 view the middle reaches a quarter of 800 pixels: 520,960 m, which is 8.79 degrees.
  const sites = [fixtureSite('near', 8, 0), fixtureSite('far', 9, 0)];

  it('picks a site in the middle of a zoomed-in view', () => {
    expect(siteInFocus([0, 0], 4, 1000, 800, sites)?.id).toBe('near');
  });

  it('ignores a site outside the middle', () => {
    expect(siteInFocus([0, 0], 4, 1000, 800, [fixtureSite('far', 9, 0)])).toBeNull();
  });

  it('does nothing while zoomed out', () => {
    expect(siteInFocus([8, 0], 3.9, 1000, 800, sites)).toBeNull();
  });

  it('picks the nearest when two are in the middle', () => {
    expect(siteInFocus([8.6, 0], 4, 1000, 800, sites)?.id).toBe('far');
  });
});

describe('shouldDeselect', () => {
  it('lets a chosen site go only when zoomed out past the threshold, below the zoom that chooses one', () => {
    expect(DESELECT_BELOW_ZOOM).toBeLessThan(SELECT_FROM_ZOOM);
    expect(shouldDeselect(3.4, 'bright-angel')).toBe(true);
    expect(shouldDeselect(3.6, 'bright-angel')).toBe(false);
    expect(shouldDeselect(12, 'bright-angel')).toBe(false);
    expect(shouldDeselect(2, null)).toBe(false);
  });
});
