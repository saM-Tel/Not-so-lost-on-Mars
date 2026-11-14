// WHAT:    Height and direction of the Sun at a place and time, and sunrise and sunset in local true solar time (F11).
// IN:      A UTC instant or a local true solar time with a season; east-positive longitude and planetocentric latitude, degrees.
// OUT:     Sun elevation and azimuth in degrees; sunrise and sunset in Mars hours.
// USED BY: src/ui/timeSlider.ts.
// RULES:   Computed geometry (grade B): the Sun's centre on a smooth sphere, with no hills and no atmospheric bending.
//          Shadows or daylight drawn from this are labelled as computed.
// TRAPS:   PITFALLS 3, 5.
// OWNER:   Role B.

import { localTrueSolarTimeHours, solarLongitudeDeg, sunDeclinationDeg } from './time';

const DEG = Math.PI / 180;

export interface SunPosition {
  /** Degrees above the horizon; negative when the Sun is down. */
  elevationDeg: number;
  /** Degrees clockwise from north. */
  azimuthDeg: number;
}

/** Sun position for a local true solar time (Mars hours) and season at a latitude. */
export function sunAtLocalTime(localTrueHours: number, latDeg: number, lsDeg: number): SunPosition {
  const declination = sunDeclinationDeg(lsDeg) * DEG;
  const lat = latDeg * DEG;
  const hourAngle = (localTrueHours - 12) * 15 * DEG;
  const sinElevation = Math.sin(lat) * Math.sin(declination) + Math.cos(lat) * Math.cos(declination) * Math.cos(hourAngle);
  const elevation = Math.asin(Math.max(-1, Math.min(1, sinElevation)));
  const azimuth = Math.atan2(
    -Math.sin(hourAngle),
    Math.tan(declination) * Math.cos(lat) - Math.sin(lat) * Math.cos(hourAngle),
  );
  return { elevationDeg: elevation / DEG, azimuthDeg: ((azimuth / DEG) + 360) % 360 };
}

/** Sun position at an instant. */
export function sunAt(utc: Date, lonEastDeg: number, latDeg: number): SunPosition {
  return sunAtLocalTime(localTrueSolarTimeHours(utc, lonEastDeg), latDeg, solarLongitudeDeg(utc));
}

/**
 * Sunrise and sunset in local true solar time, Mars hours, when the Sun's centre crosses a flat horizon.
 * Null for polar day or polar night.
 */
export function sunriseSunset(latDeg: number, lsDeg: number): { riseHours: number; setHours: number } | null {
  const cosH = -Math.tan(latDeg * DEG) * Math.tan(sunDeclinationDeg(lsDeg) * DEG);
  if (cosH <= -1 || cosH >= 1) return null;
  const halfDayHours = Math.acos(cosH) / DEG / 15;
  return { riseHours: 12 - halfDayHours, setHours: 12 + halfDayHours };
}
