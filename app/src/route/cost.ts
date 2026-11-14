// WHAT:    Walking speed and effort for a suited person on a slope, for the favourable, expected and cautious cases (F3).
// IN:      Slope along the direction of travel in degrees; total mass in kg; case settings.
// OUT:     Speed in m/s; time in s and energy in J for one step.
// USED BY: src/route/search.ts, src/route/stats.ts.
// RULES:   Mars gravity from src/mars/constants.ts. Uphill and downhill differ. Every setting has a cited source or is labelled assumed.
//          The equations are the ones in the SEXTANT traverse planner's public source (norheim/pextant, explorers.py, class
//          Astronaut), which credits Marquez 2008 for speed and Santee and others 2001 for energy. See docs/REFERENCES.md.
//          They come from Apollo lunar data and load-carrying tests on Earth: grade C on Mars.
// TRAPS:   PITFALLS 3, 6, 7. Still to add: a footing factor for sand and rubble.
// OWNER:   Role B.

import { MARS_GRAVITY_M_S2 } from '../mars/constants';

const RAD = Math.PI / 180;

/** One of the three cases of docs/CONFIDENCE.md section 5. */
export interface WalkCase {
  id: 'favourable' | 'expected' | 'cautious';
  /** Walking speed on level ground, m/s. The model's speed at every slope is scaled to match it. */
  levelSpeedMps: number;
  /** Mass of the person and the suit together, kg. */
  totalMassKg: number;
  /** Where the two numbers come from, in words, for the screen. */
  basis: string;
}

/** Level-ground speed of the published model, m/s. */
export const MODEL_LEVEL_SPEED_MPS = 1.6;

/**
 * Walking speed by slope as published (Marquez 2008, as coded in SEXTANT), in m/s.
 * Slope is along the direction of travel, in degrees, positive uphill.
 */
export function modelSpeedMps(slopeDeg: number): number {
  if (slopeDeg <= -20) return 0.05;
  if (slopeDeg <= -10) return 0.095 * slopeDeg + 1.95;
  if (slopeDeg <= 0) return 0.06 * slopeDeg + 1.6;
  if (slopeDeg <= 6) return -0.2 * slopeDeg + 1.6;
  if (slopeDeg <= 15) return -0.039 * slopeDeg + 0.634;
  return 0.05;
}

/** Walking speed for a case: the published shape, scaled to the case's level-ground speed. */
export function speedMps(slopeDeg: number, walkCase: WalkCase): number {
  return modelSpeedMps(slopeDeg) * (walkCase.levelSpeedMps / MODEL_LEVEL_SPEED_MPS);
}

/**
 * Time and metabolic energy for one straight step (Santee and others 2001, as coded in SEXTANT, with Mars gravity).
 * `horizontalM` is the step's length on the map and `riseM` its change in height, positive uphill.
 */
export function stepCost(horizontalM: number, riseM: number, walkCase: WalkCase): { timeS: number; energyJ: number } {
  const slopeRad = Math.atan2(riseM, horizontalM);
  const slopeDeg = slopeRad / RAD;
  const v = speedMps(slopeDeg, walkCase);
  const m = walkCase.totalMassKg;
  const level = (3.28 * m + 71.1) * (0.661 * Math.cos(slopeRad) + 0.115 / v) * horizontalM;
  const lift = m * MARS_GRAVITY_M_S2 * horizontalM * Math.sin(slopeRad);
  // Going down gives a little back: the term is negative and fades as the slope steepens.
  const slope = riseM >= 0 ? 3.5 * lift : 2.4 * lift * 0.3 ** (Math.abs(slopeDeg) / 7.65);
  return { timeS: horizontalM / v, energyJ: level + slope };
}

/**
 * The three cases. Sources, all in docs/REFERENCES.md:
 * - Ogilvie and others 2026 (NASA, ICES-2026-127): an average person of 82 kg; an initial Mars suit mass limit of
 *   104 kg; historical suits from Apollo at 77 kg to the lunar xEMU at 170 kg; Apollo walk-back planning speeds of
 *   3.6 km/h for one hour and 2.7 km/h for longer.
 * - Marquez 2008: 1.6 m/s on level ground, which PITFALLS 7 treats as an upper bound.
 * Which figure goes with which case is our choice (grade D); the figures themselves are published.
 */
export const WALK_CASES: readonly WalkCase[] = [
  {
    id: 'favourable',
    levelSpeedMps: 1.6,
    totalMassKg: 82 + 77,
    basis: 'Walking speed as published from Apollo data (1.6 m/s on the level); an 82 kg person in a suit as light as Apollo\'s (77 kg).',
  },
  {
    id: 'expected',
    levelSpeedMps: 1.0,
    totalMassKg: 82 + 104,
    basis: 'Apollo\'s planning speed for a one-hour walk back (3.6 km/h on the level); an 82 kg person in a suit at NASA\'s initial Mars mass limit (104 kg).',
  },
  {
    id: 'cautious',
    levelSpeedMps: 0.75,
    totalMassKg: 82 + 170,
    basis: 'Apollo\'s planning speed for a walk back longer than an hour (2.7 km/h on the level); an 82 kg person in a suit as heavy as the lunar xEMU (170 kg).',
  },
];
