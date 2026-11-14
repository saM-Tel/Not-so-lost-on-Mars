// WHAT:    Mars time from Earth time: season (solar longitude), the equation of time, Mars mean and true solar time at a
//          longitude, and the Sun's declination (F11, information cards).
// IN:      A UTC instant; east-positive longitude in degrees.
// OUT:     Solar longitude in degrees, local mean and true solar time in Mars hours, declination in degrees.
// USED BY: src/mars/sun.ts, src/ui/timeSlider.ts.
// RULES:   A sol is 88,775.244 s. Each mission counts sols from its own landing. Follows NASA GISS's Mars24 algorithm
//          (Allison and McEwen 2000, Planetary and Space Science 48, 215-235; updated in Allison 1997 and on the Mars24 pages).
// TRAPS:   PITFALLS 3.
// OWNER:   Role B.

const DEG = Math.PI / 180;
/** TAI minus UTC since 1 January 2017, seconds. No leap second has been added since. */
const TAI_MINUS_UTC_S = 37;
const TT_MINUS_TAI_S = 32.184;

/** Julian date in Terrestrial Time. */
export function julianDateTT(utc: Date): number {
  const jdUtc = utc.getTime() / 86_400_000 + 2_440_587.5;
  return jdUtc + (TAI_MINUS_UTC_S + TT_MINUS_TAI_S) / 86_400;
}

interface Orbit {
  /** Days since J2000 in Terrestrial Time. */
  dtJ2000: number;
  /** Mean anomaly, degrees. */
  meanAnomalyDeg: number;
  /** Equation of centre (true minus mean anomaly), degrees. */
  centreDeg: number;
  /** Solar longitude, degrees from 0 to 360. */
  lsDeg: number;
}

/** Perturbations by the other planets (Mars24 step B-4): amplitude in degrees, period in Julian years, phase in degrees. */
const PERTURBATIONS: readonly [number, number, number][] = [
  [0.0071, 2.2353, 49.409], [0.0057, 2.7543, 168.173], [0.0039, 1.1177, 191.837], [0.0037, 15.7866, 21.736],
  [0.0021, 2.1354, 15.704], [0.0020, 2.4694, 95.528], [0.0018, 32.8493, 49.095],
];

function orbit(utc: Date): Orbit {
  const dt = julianDateTT(utc) - 2_451_545.0;
  const m = 19.3871 + 0.52402073 * dt;
  const alphaFms = 270.3871 + 0.524038496 * dt;
  const pbs = PERTURBATIONS.reduce((sum, [a, tau, phi]) => sum + a * Math.cos(((0.985626 * dt) / tau + phi) * DEG), 0);
  const centre =
    (10.691 + 3.0e-7 * dt) * Math.sin(m * DEG) + 0.623 * Math.sin(2 * m * DEG) + 0.05 * Math.sin(3 * m * DEG) +
    0.005 * Math.sin(4 * m * DEG) + 0.0005 * Math.sin(5 * m * DEG) + pbs;
  const ls = (((alphaFms + centre) % 360) + 360) % 360;
  return { dtJ2000: dt, meanAnomalyDeg: m, centreDeg: centre, lsDeg: ls };
}

/** Season: the angle of Mars along its orbit from northern spring, degrees. 0 spring, 90 summer, 180 autumn, 270 winter in the north. */
export function solarLongitudeDeg(utc: Date): number {
  return orbit(utc).lsDeg;
}

/** Equation of time: true minus mean solar time, in degrees of longitude (15 degrees is one Mars hour). */
export function equationOfTimeDeg(utc: Date): number {
  const { lsDeg, centreDeg } = orbit(utc);
  return 2.861 * Math.sin(2 * lsDeg * DEG) - 0.071 * Math.sin(4 * lsDeg * DEG) + 0.002 * Math.sin(6 * lsDeg * DEG) - centreDeg;
}

/** Mars mean solar time at longitude 0 (Airy-0), Mars hours from 0 to 24. */
export function meanSolarTimePrimeHours(utc: Date): number {
  const msd = (julianDateTT(utc) - 2_451_549.5) / 1.0274912517 + 44_796.0 - 0.0009626;
  return (((24 * msd) % 24) + 24) % 24;
}

/** Local mean solar time at an east longitude, Mars hours from 0 to 24. Rover clocks keep this time. */
export function localMeanSolarTimeHours(utc: Date, lonEastDeg: number): number {
  return (((meanSolarTimePrimeHours(utc) + lonEastDeg / 15) % 24) + 24) % 24;
}

/** Local true solar time: where the Sun actually is. Noon is when it is highest. */
export function localTrueSolarTimeHours(utc: Date, lonEastDeg: number): number {
  return (((localMeanSolarTimeHours(utc, lonEastDeg) + equationOfTimeDeg(utc) / 15) % 24) + 24) % 24;
}

/** The Sun's declination for a season, degrees (Mars24 step D-1, planetographic). */
export function sunDeclinationDeg(lsDeg: number): number {
  return Math.asin(0.42565 * Math.sin(lsDeg * DEG)) / DEG + 0.25 * Math.sin(lsDeg * DEG);
}

/** Mars month 1 to 12: each covers 30 degrees of solar longitude, month 1 starting at northern spring. */
export function marsMonth(lsDeg: number): number {
  return Math.floor((((lsDeg % 360) + 360) % 360) / 30) + 1;
}

/** Plain words for the northern season at a solar longitude; the south has the opposite season. */
export function seasonName(lsDeg: number, latDeg: number): string {
  const northern = ['spring', 'summer', 'autumn', 'winter'][Math.floor((((lsDeg % 360) + 360) % 360) / 90)]!;
  const southern: Record<string, string> = { spring: 'autumn', summer: 'winter', autumn: 'spring', winter: 'summer' };
  return latDeg >= 0 ? `northern ${northern}` : `southern ${southern[northern]}`;
}
