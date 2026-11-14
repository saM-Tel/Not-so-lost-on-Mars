// WHAT:    Radiation dose for a planned walk, with its range (F5). Still to add: the small effect of terrain blocking the sky.
// IN:      Walking time in s for the favourable, expected and cautious cases.
// OUT:     Absorbed dose in micrograys and dose equivalent in microsieverts, each as expected, lowest and highest.
// USED BY: src/ui/routePanel.ts.
// RULES:   Gray and sievert are never converted 1:1: each comes from its own measured rate. Gale measurements applied to
//          Jezero are labelled as such (grade C). This is the everyday background from galactic cosmic rays, not a solar storm.
// TRAPS:   PITFALLS 2, 8.
// OWNER:   Role B.

/**
 * Background dose rates on the surface, measured by the RAD instrument on Curiosity at Gale crater.
 *
 * Dose equivalent: "the current surface measurement ~0.7 mSv/day"; over a solar cycle the same paper estimates
 * "from about 0.35 mSv/day to about 1.15 mSv/day" (Guo and others 2015, read on 14 November; docs/REFERENCES.md).
 * Absorbed dose: 0.210 +/- 0.040 mGy/day (Hassler and others 2014, as recorded in docs/DATA_CATALOG.md; not re-read
 * on 14 November). Guo and others 2015 give "around 220 uGy/day", which agrees.
 */
export const DOSE_RATES = {
  absorbedUGyPerDay: { expected: 210, lowest: 170, highest: 250 },
  equivalentUSvPerDay: { expected: 700, lowest: 350, highest: 1150 },
} as const;

/** Earth day in seconds: the rates above are per Earth day. */
const DAY_S = 86_400;

export interface Range {
  expected: number;
  lowest: number;
  highest: number;
}

export interface WalkDose {
  /** Absorbed dose, micrograys. */
  absorbedUGy: Range;
  /** Dose equivalent, microsieverts. */
  equivalentUSv: Range;
}

/**
 * Dose picked up outside over a walk. The lowest value pairs the shortest time with the lowest rate, and the
 * highest pairs the longest time with the highest rate, so the range covers both unknowns together.
 */
export function walkDose(timeS: { favourable: number; expected: number; cautious: number }): WalkDose {
  const over = (rate: Range): Range => ({
    expected: (rate.expected * timeS.expected) / DAY_S,
    lowest: (rate.lowest * timeS.favourable) / DAY_S,
    highest: (rate.highest * timeS.cautious) / DAY_S,
  });
  return { absorbedUGy: over(DOSE_RATES.absorbedUGyPerDay), equivalentUSv: over(DOSE_RATES.equivalentUSvPerDay) };
}
