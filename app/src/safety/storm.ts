// WHAT:    Storm mode (F10): compares going home with sheltering against terrain when a solar storm is coming, and holds the
//          record of the 20 May 2024 event measured by Curiosity at Gale, for the replay.
// IN:      The cautious time to walk home from the far end of the planned walk; the warning time before the storm.
// OUT:     A recommendation with its reasons; the replay record.
// USED BY: src/ui/routePanel.ts, src/ui/safetyPanel.ts.
// RULES:   The default advice is to go home when time allows. Terrain shelter is described as a small reduction, never a
//          number we do not have. The replay is labelled as a past event measured at Gale. Gray and sievert never mixed.
// TRAPS:   PITFALLS 2, 8.
// OWNER:   Role B.

/** The biggest solar particle event Curiosity's radiation detector has measured. NASA/JPL news, 10 June 2024. */
export const MAY_2024_EVENT = {
  date: '20 May 2024',
  place: 'Gale crater',
  instrument: "Curiosity's Radiation Assessment Detector (RAD)",
  /** Absorbed dose an astronaut beside Curiosity would have received over the event, micrograys. */
  absorbedUGy: 8100,
  comparison: 'about 30 chest X-rays',
  sourceUrl: 'https://www.jpl.nasa.gov/news/nasa-watches-mars-light-up-during-epic-solar-storm/',
  published: '10 June 2024',
} as const;

export type StormAction = 'go-home' | 'shelter';

export interface StormAdvice {
  action: StormAction;
  headline: string;
  reasons: string[];
}

/**
 * What to do if a storm is coming. `timeHomeS` is the cautious walk home from the farthest point of the walk;
 * `warningS` is the time until the earliest expected arrival. Going home is the advice whenever it fits.
 */
export function stormAdvice(timeHomeS: number, warningS: number, format: (seconds: number) => string): StormAdvice {
  if (!Number.isFinite(timeHomeS)) {
    return {
      action: 'shelter',
      headline: 'No way home was found from the far end of this walk. Do not start it while a storm is forecast.',
      reasons: ['Choose a walk that stays inside the tether.'],
    };
  }
  if (timeHomeS <= warningS) {
    return {
      action: 'go-home',
      headline: `Go home now. From the far end of this walk you reach the rover in ${format(timeHomeS)} or less, before the earliest arrival in ${format(warningS)}.`,
      reasons: [
        'Home is the best shelter: the rover or habitat has far more shielding than any slope or boulder.',
        `Margin at the cautious walking speed: ${format(warningS - timeHomeS)}.`,
      ],
    };
  }
  return {
    action: 'shelter',
    headline: `Start home at once, but you may not make it: the walk home can take ${format(timeHomeS)} and the earliest arrival is in ${format(warningS)}.`,
    reasons: [
      'If the storm arrives first, stay close against the foot of a steep slope or cliff on the way. Rock blocks part of the sky, which cuts the dose a little; NASA says cliffsides would give additional shielding. It is a small reduction, not protection.',
      'Keep walking home as soon as the worst has passed. Solar particle events can last hours to days.',
      'Next time, keep walks inside the 30-minute tether when a storm is forecast.',
    ],
  };
}
