// WHAT:    Tests for the scale bar's arithmetic in scaleBar.ts.
// IN:      Nothing.
// OUT:     Pass or fail under Vitest.
// USED BY: npm run check.
// RULES:   Expected lengths are worked by hand from the Mars radius.
// TRAPS:   PITFALLS 3.
// OWNER:   Role B.

import { describe, expect, it } from 'vitest';
import { metresPerPixel } from '../mars/geometry';
import { scaleBarFor } from './scaleBar';

describe('scaleBarFor', () => {
  it('picks the longest round length that fits', () => {
    // 3.3 m per pixel, 140 pixels available: 462 m fits, so the bar is 200 m and 60.6 pixels wide.
    const bar = scaleBarFor(3.3, 140);
    expect(bar.lengthM).toBe(200);
    expect(bar.widthPx).toBeCloseTo(200 / 3.3, 6);
    expect(bar.label).toBe('200 m');
  });

  it('switches to kilometres', () => {
    expect(scaleBarFor(40, 140).label).toBe('5 km');
    expect(scaleBarFor(8, 140).label).toBe('1 km');
  });

  it('handles lengths under a metre', () => {
    expect(scaleBarFor(0.004, 140).label).toBe('0.5 m');
  });

  it('never draws a bar wider than the space given', () => {
    for (const mpp of [0.003, 0.07, 1, 3.3, 19, 250, 4100]) {
      const bar = scaleBarFor(mpp, 140);
      expect(bar.widthPx).toBeLessThanOrEqual(140);
      expect(bar.widthPx).toBeGreaterThan(140 / 2.6);
    }
  });

  it('is a Mars length: at zoom 13.5 on 512-pixel tiles at Jezero the bar is 200 m', () => {
    // 2 * pi * 3,396,190 * cos(18.5 deg) / (512 * 2^13.5) = 3.41 m per pixel. Earth would give 6.40 m and a 500 m bar.
    const mpp = metresPerPixel(13.5, 18.5, 512);
    expect(mpp).toBeCloseTo(3.41, 2);
    expect(scaleBarFor(mpp, 140).label).toBe('200 m');
  });
});
