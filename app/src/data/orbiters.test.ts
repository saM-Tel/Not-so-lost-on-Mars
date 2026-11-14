// WHAT:    Tests for src/data/orbiters.ts: positions between saved points, track lines, elevations and walk coverage.
// IN:      Nothing. Every track and pass below is a made-up test fixture.
// OUT:     Pass or fail.
// USED BY: npm test.
// RULES:   Fixtures are named as such and stay in this file.
// TRAPS:   PITFALLS 4.
// OWNER:   Role B.

import { describe, expect, it } from 'vitest';
import {
  elevationAt, IMAGING_MIN_ELEVATION_DEG, LINK_MIN_ELEVATION_DEG, positionAt, stretchesInGaps, trackAround, walkCoverage,
  type OrbiterTrack, type SitePasses,
} from './orbiters';

const FIXTURE_TRACK: OrbiterTrack = {
  id: 'relay-fixture', name: 'Fixture relay', short: 'R', agency: 'test', relay: true, camera: 'Fixture camera',
  roleSourceUrl: 'https://example.invalid', startUtc: '2026-01-01T00:00:00Z', endUtc: '2026-01-01T00:08:00Z', stepMin: 2,
  // 170 E to -170 E crosses longitude 180; then a jump of 150 degrees, as near a pole.
  lonEastDeg: [160, 170, -170, -160, 0], latDeg: [0, 10, 20, 30, 80], trajectoryNote: [],
};

const FIXTURE_UNCONFIRMED: OrbiterTrack = { ...FIXTURE_TRACK, id: 'unconfirmed-fixture', relay: null, camera: null };

describe('positionAt', () => {
  it('blends between saved points, across longitude 180', () => {
    const [lon, lat] = positionAt(FIXTURE_TRACK, new Date('2026-01-01T00:03:00Z'))!;
    // Halfway from 170 E to 170 W is the 180 meridian, written -180 in the app's range.
    expect(Math.abs(lon)).toBeCloseTo(180, 6);
    expect(lat).toBeCloseTo(15, 6);
  });
  it('takes the nearer point where the track jumps near a pole', () => {
    expect(positionAt(FIXTURE_TRACK, new Date('2026-01-01T00:06:30Z'))).toEqual([-160, 30]);
  });
  it('is null outside the prediction', () => {
    expect(positionAt(FIXTURE_TRACK, new Date('2025-12-31T23:59:00Z'))).toBeNull();
    expect(positionAt(FIXTURE_TRACK, new Date('2026-01-01T00:09:00Z'))).toBeNull();
  });
});

describe('trackAround', () => {
  it('breaks the line where it crosses longitude 180 or jumps', () => {
    const lines = trackAround(FIXTURE_TRACK, new Date('2026-01-01T00:04:00Z'), 10, 10);
    expect(lines).toEqual([[[160, 0], [170, 10]], [[-170, 20], [-160, 30]]]);
  });
});

const FIXTURE_SITE: SitePasses = {
  builtUtc: '2026-01-01T00:00:00Z', siteId: 'fixture',
  orbiters: [
    { id: 'relay-fixture', startUtc: '2026-01-01T00:00:00Z', endUtc: '2026-01-01T01:00:00Z', stepMin: 1,
      // Up from minute 2 to minute 6: 5, 20, 70, 20, 5 degrees.
      passes: [{ startUtc: '2026-01-01T00:02:00Z', elevationDeg: [5, 20, 70, 20, 5] }] },
    { id: 'unconfirmed-fixture', startUtc: '2026-01-01T00:00:00Z', endUtc: '2026-01-01T01:00:00Z', stepMin: 1,
      passes: [{ startUtc: '2026-01-01T00:00:00Z', elevationDeg: [80, 80, 80, 80, 80, 80, 80, 80, 80, 80] }] },
  ],
};

describe('elevationAt', () => {
  it('reads the minute of a pass, 0 between passes, null outside the prediction', () => {
    const orbiter = FIXTURE_SITE.orbiters[0]!;
    expect(elevationAt(orbiter, new Date('2026-01-01T00:04:30Z'))).toBe(70);
    expect(elevationAt(orbiter, new Date('2026-01-01T00:10:00Z'))).toBe(0);
    expect(elevationAt(orbiter, new Date('2026-01-01T02:00:00Z'))).toBeNull();
  });
});

describe('stretchesInGaps', () => {
  it('spreads each leg over its minutes by distance and keeps the points walked in a gap', () => {
    // Fixture: out 10 minutes over 4 points 0, 10, 20, 30 m; back 10 minutes over 2 points. Gap from minute 4 to 12.
    const out = { line: [[0, 0], [1, 0], [2, 0], [3, 0]] as [number, number][], distancesM: [0, 10, 20, 30], minutes: 10 };
    const back = { line: [[3, 0], [0, 0]] as [number, number][], distancesM: [0, 30], minutes: 10 };
    // Out points fall at minutes 0, 3.3, 6.7, 10; back points at 10 and 20.
    expect(stretchesInGaps([out, back], [[4, 12]])).toEqual([[[2, 0], [3, 0], [3, 0]]]);
    expect(stretchesInGaps([out, back], [])).toEqual([]);
  });
});

describe('walkCoverage', () => {
  it('counts only confirmed roles, above the assumed thresholds, cameras only by day', () => {
    expect(LINK_MIN_ELEVATION_DEG).toBe(10);
    expect(IMAGING_MIN_ELEVATION_DEG).toBe(60);
    const coverage = walkCoverage(FIXTURE_SITE, [FIXTURE_TRACK, FIXTURE_UNCONFIRMED], new Date('2026-01-01T00:00:00Z'), 10, () => true);
    // Link at minutes 3, 4, 5 (20, 70, 20 degrees); the unconfirmed orbiter at 80 degrees is not counted.
    expect(coverage.linkGaps).toEqual([[0, 3], [6, 10]]);
    // Imaging only at minute 4 (70 degrees).
    expect(coverage.imagingGaps).toEqual([[0, 4], [5, 10]]);
    expect(coverage.minutes[4]!.up.map((u) => u.id)).toEqual(['relay-fixture', 'unconfirmed-fixture']);
    const night = walkCoverage(FIXTURE_SITE, [FIXTURE_TRACK], new Date('2026-01-01T00:00:00Z'), 10, () => false);
    expect(night.imagingGaps).toEqual([[0, 10]]);
  });
});
