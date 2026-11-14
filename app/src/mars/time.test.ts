// WHAT:    Tests for time.ts and sun.ts against the worked example of NASA GISS's Mars24 algorithm (6 January 2000, 00:00 UTC).
// IN:      Nothing.
// OUT:     Test results.
// USED BY: npm test.
// RULES:   Expected values are copied from the Mars24 worked example, not computed by our own code.
// TRAPS:   None.
// OWNER:   Role B.

import { describe, expect, it } from 'vitest';
import { sunriseSunset } from './sun';
import { julianDateTT, meanSolarTimePrimeHours, solarLongitudeDeg } from './time';

describe('Mars24 worked example, 2000-01-06 00:00:00 UTC', () => {
  const t = new Date(Date.UTC(2000, 0, 6, 0, 0, 0));
  it('gives the Julian date in Terrestrial Time', () => {
    // Before 2017 TAI minus UTC was smaller; at this date it was 32 s, so allow for our fixed 37 s.
    expect(julianDateTT(t)).toBeCloseTo(2451549.50074 + 5 / 86400, 5);
  });
  it('gives the season, solar longitude 277.188 degrees', () => {
    expect(solarLongitudeDeg(t)).toBeCloseTo(277.188, 1);
  });
  it('gives mean solar time at longitude 0 of about 23.99 hours', () => {
    expect(meanSolarTimePrimeHours(t)).toBeCloseTo(23.994, 1);
  });
});

describe('sunrise and sunset', () => {
  it('give a 12-hour day at the equator at the equinox', () => {
    const day = sunriseSunset(0, 0)!;
    expect(day.riseHours).toBeCloseTo(6, 6);
    expect(day.setHours).toBeCloseTo(18, 6);
  });
});
