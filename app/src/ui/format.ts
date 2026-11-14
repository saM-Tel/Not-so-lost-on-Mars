// WHAT:    Turns numbers into text: units and ranges so far. Still to add: dates in Earth UTC and Mars time.
// IN:      Values in SI units.
// OUT:     Strings such as 2 h 10 min (1 h 50 min to 2 h 45 min).
// USED BY: Everything in src/ui.
// RULES:   Every value carries its unit. Micro and milli are never mixed. Ranges are written as docs/CONFIDENCE.md section 5.
// TRAPS:   PITFALLS 8.
// OWNER:   Role B.

/** A length on the ground: metres to the nearest 10 m under a kilometre, then kilometres with two decimals. */
export function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres / 10) * 10} m`;
  return `${(metres / 1000).toFixed(2)} km`;
}

/** A height difference, to the nearest metre. */
export function formatHeight(metres: number): string {
  return `${Math.round(metres)} m`;
}

/** A duration to the nearest minute: "45 min" or "2 h 10 min". */
export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

/** Energy in kilojoules, to two significant figures above 100 kJ, with thousands separated. */
export function formatEnergy(joules: number): string {
  const kJ = joules / 1000;
  const rounded = kJ >= 100 ? Number(kJ.toPrecision(2)) : Math.round(kJ);
  return `${rounded.toLocaleString('en-GB')} kJ`;
}

/** The expected value with the favourable and cautious values after it: "2 h 10 min (1 h 50 min to 2 h 45 min)". */
export function formatRange(expected: number, favourable: number, cautious: number, format: (value: number) => string): string {
  return `${format(expected)} (${format(favourable)} to ${format(cautious)})`;
}
