// WHAT:    Oxygen breathed on a planned walk (F3), from the metabolic energy the walking model gives, for each case.
// IN:      Metabolic energy in joules for the favourable, expected and cautious cases.
// OUT:     Oxygen in grams and litres for each case, with what the figure rests on.
// USED BY: src/ui/routePanel.ts.
// RULES:   Modelled, never measured: shown with its range and grade. Covers breathing only, not suit leaks or a reserve.
// TRAPS:   PITFALLS 7.
// OWNER:   Role B.

/**
 * Weir (1949): energy in kcal = 3.941 x litres of oxygen + 1.106 x litres of carbon dioxide. With a respiratory
 * quotient (carbon dioxide out per oxygen in) of 0.85, typical for mixed food and assumed here, one litre of oxygen
 * goes with 3.941 + 1.106 x 0.85 = 4.88 kcal, about 20.4 kJ.
 */
export const RESPIRATORY_QUOTIENT = 0.85;
const KCAL_PER_LITRE_O2 = 3.941 + 1.106 * RESPIRATORY_QUOTIENT;
export const JOULES_PER_LITRE_O2 = KCAL_PER_LITRE_O2 * 4184;
/** Mass of one litre of oxygen at 0 degrees C and one standard atmosphere, the conditions litres of oxygen are quoted at. */
export const GRAMS_PER_LITRE_O2 = 1.429;

export interface OxygenUse {
  litres: number;
  grams: number;
}

export function oxygenForEnergy(energyJ: number): OxygenUse {
  const litres = energyJ / JOULES_PER_LITRE_O2;
  return { litres, grams: litres * GRAMS_PER_LITRE_O2 };
}

export const OXYGEN_BASIS =
  `Modelled from the walking energy with Weir's 1949 equation, assuming a respiratory quotient of ${RESPIRATORY_QUOTIENT} ` +
  `(about ${(JOULES_PER_LITRE_O2 / 1000).toFixed(1)} kJ per litre of oxygen). Breathing during the walk only: no suit leakage, ` +
  'no time at the target and no reserve. Grade C, because the energy itself is modelled.';
