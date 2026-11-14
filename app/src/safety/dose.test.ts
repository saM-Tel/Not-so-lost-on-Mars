// WHAT:    Tests for dose.ts.
// IN:      Nothing.
// OUT:     Pass or fail under Vitest.
// USED BY: npm run check.
// RULES:   Expected values are worked by hand from the published rates. Gray and sievert stay separate.
// TRAPS:   PITFALLS 8.
// OWNER:   Role B.

import { describe, expect, it } from 'vitest';
import { walkDose } from './dose';

describe('dose on a walk', () => {
  it('multiplies each measured rate by the time outside', () => {
    // Two hours in every case is one twelfth of a day: 210 / 12 = 17.5 uGy and 700 / 12 = 58.3 uSv.
    const dose = walkDose({ favourable: 7200, expected: 7200, cautious: 7200 });
    expect(dose.absorbedUGy.expected).toBeCloseTo(17.5, 6);
    expect(dose.equivalentUSv.expected).toBeCloseTo(58.333, 2);
    // Rate range alone: 170 to 250 uGy a day and 350 to 1150 uSv a day.
    expect(dose.absorbedUGy.lowest).toBeCloseTo(170 / 12, 6);
    expect(dose.absorbedUGy.highest).toBeCloseTo(250 / 12, 6);
    expect(dose.equivalentUSv.lowest).toBeCloseTo(350 / 12, 6);
    expect(dose.equivalentUSv.highest).toBeCloseTo(1150 / 12, 6);
  });

  it('widens the range with the walking time of the three cases', () => {
    // One hour at best, two expected, four at worst.
    const dose = walkDose({ favourable: 3600, expected: 7200, cautious: 14400 });
    expect(dose.absorbedUGy.lowest).toBeCloseTo(170 / 24, 6);
    expect(dose.absorbedUGy.highest).toBeCloseTo(250 / 6, 6);
  });

  it('never derives sieverts from grays', () => {
    const dose = walkDose({ favourable: 86400, expected: 86400, cautious: 86400 });
    // A full day gives back the two published rates, which are not in a fixed ratio across their ranges.
    expect(dose.absorbedUGy).toEqual({ expected: 210, lowest: 170, highest: 250 });
    expect(dose.equivalentUSv).toEqual({ expected: 700, lowest: 350, highest: 1150 });
  });
});
