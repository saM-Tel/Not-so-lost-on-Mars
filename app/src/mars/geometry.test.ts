// WHAT:    Tests for constants.ts and geometry.ts. Expected values are worked by hand from the Mars radius.
// IN:      Nothing.
// OUT:     Pass or fail under Vitest.
// USED BY: npm run check.
// RULES:   No Earth values except where a test shows the difference. Tolerances are stated beside each check.
// TRAPS:   PITFALLS 3, 4.
// OWNER:   Role B.

import { describe, expect, it } from 'vitest';
import {
  MAPLIBRE_METRES_PER_MARS_METRE,
  MARS_GRAVITY_M_S2,
  MARS_RADIUS_M,
  METRES_PER_DEGREE,
  SOL_S,
} from './constants';
import { bearingDeg, destination, distanceM, eastWestSpacingM, lonTo180, metresPerPixel, zoomForMetresPerPixel } from './geometry';

describe('constants', () => {
  it('match the brief and the pipeline', () => {
    expect(MARS_RADIUS_M).toBe(3_396_190);
    expect(MARS_GRAVITY_M_S2).toBe(3.71);
    expect(SOL_S).toBe(88_775.244);
  });

  it('give 59,274.70 m for one degree on the ground', () => {
    expect(METRES_PER_DEGREE).toBeCloseTo(59_274.7, 1);
  });

  it('scale MapLibre metres by about 1.876', () => {
    // 6,371,008.8 / 3,396,190 = 1.87593
    expect(MAPLIBRE_METRES_PER_MARS_METRE).toBeCloseTo(1.87593, 5);
  });
});

describe('lonTo180', () => {
  it('converts 0 to 360 east into -180 to 180', () => {
    expect(lonTo180(77.45)).toBeCloseTo(77.45, 12);
    expect(lonTo180(312.05)).toBeCloseTo(-47.95, 10); // Viking 1 as published
    expect(lonTo180(360)).toBe(0);
    expect(lonTo180(180)).toBe(180);
    expect(lonTo180(-180)).toBe(180);
  });
});

describe('distanceM', () => {
  it('uses the Mars radius', () => {
    const quarter = (Math.PI * 3_396_190) / 2; // equator to pole
    expect(distanceM([0, 0], [0, 90])).toBeCloseTo(quarter, 6);
    expect(distanceM([10, 0], [11, 0])).toBeCloseTo(METRES_PER_DEGREE, 6);
    expect(distanceM([77.3, 18.5], [77.3, 18.5])).toBe(0);
  });

  it('halves a degree of longitude at 60 degrees north', () => {
    const ratio = distanceM([10, 60], [11, 60]) / METRES_PER_DEGREE;
    expect(ratio).toBeCloseTo(0.5, 4);
  });
});

describe('bearingDeg and destination', () => {
  it('point north, east, south and west', () => {
    expect(bearingDeg([0, 0], [0, 1])).toBeCloseTo(0, 9);
    expect(bearingDeg([0, 0], [1, 0])).toBeCloseTo(90, 9);
    expect(bearingDeg([0, 0], [0, -1])).toBeCloseTo(180, 9);
    expect(bearingDeg([0, 0], [-1, 0])).toBeCloseTo(270, 9);
  });

  it('go one degree north in 59,274.70 m', () => {
    const [lon, lat] = destination([77.45, 18.44], 0, METRES_PER_DEGREE);
    expect(lon).toBeCloseTo(77.45, 9);
    expect(lat).toBeCloseTo(19.44, 9);
  });

  it('agree with distanceM on a round trip', () => {
    const start: [number, number] = [77.305, 18.497];
    for (const bearing of [0, 37, 90, 141, 180, 233, 270, 322]) {
      const end = destination(start, bearing, 1500);
      expect(distanceM(start, end)).toBeCloseTo(1500, 6);
      expect(bearingDeg(start, end)).toBeCloseTo(bearing, 3);
    }
  });
});

describe('cell spacing', () => {
  it('is narrower east to west away from the equator', () => {
    // cos(18.45 deg) = 0.9486, the figure for Jezero in docs/PITFALLS.md section 4
    expect(eastWestSpacingM(1, 18.45)).toBeCloseTo(0.9486, 4);
    expect(eastWestSpacingM(1, 0)).toBe(1);
  });
});

describe('metresPerPixel', () => {
  it('is for Mars, not Earth', () => {
    // 2 * pi * 3,396,190 / 256 = 83,355.0 m at zoom 0 on the equator. Earth would give 156,543 m.
    expect(metresPerPixel(0, 0)).toBeCloseTo(83_355.0, 0);
    expect(metresPerPixel(5, 0)).toBeCloseTo(83_355.05 / 32, 1);
  });

  it('is undone by zoomForMetresPerPixel', () => {
    for (const [zoom, lat] of [[0, 0], [13.5, 18.5], [17, -4.6], [5, 68.2]] as const) {
      expect(zoomForMetresPerPixel(metresPerPixel(zoom, lat), lat)).toBeCloseTo(zoom, 9);
      expect(zoomForMetresPerPixel(metresPerPixel(zoom, lat, 512), lat, 512)).toBeCloseTo(zoom, 9);
    }
  });
});
