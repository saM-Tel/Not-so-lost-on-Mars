// WHAT:    Mars orbiters overhead (F18): loads the predictions saved by pipeline/build_orbiters.py, works out where each
//          orbiter is at a moment (the point on Mars below it), its ground track, and for a walk at a site, minute by
//          minute, whether a relay orbiter is high enough for a link and whether a camera orbiter is high overhead in
//          daylight.
// IN:      public/data/orbiters/globe.json and orbiters/<site id>.json (docs/DATA_CONTRACT.md); a time; thresholds.
// OUT:     Positions, track lines and coverage timelines. Nothing outside the saved prediction window: there it is null.
// USED BY: src/map/orbiters.ts, src/ui/orbitPanel.ts.
// RULES:   Predicted, never "live" or "measured". Only orbiters whose role was confirmed from a source count for links
//          or imaging; the others are shown but not counted. The elevation thresholds are assumed, and say so.
// TRAPS:   PITFALLS 4.
// OWNER:   Role B.

import type { LayerRecord } from './contract';

export interface OrbiterTrack {
  id: string;
  name: string;
  short: string;
  agency: string;
  /** True when a source read on 14 Nov confirms the orbiter relays for surface missions; null when not confirmed. */
  relay: boolean | null;
  /** The camera a source confirms, or null when not confirmed. */
  camera: string | null;
  roleSourceUrl: string;
  startUtc: string;
  endUtc: string;
  stepMin: number;
  lonEastDeg: number[];
  latDeg: number[];
  trajectoryNote: string[];
}

export interface GlobeOrbiters {
  builtUtc: string;
  word: 'predicted';
  source: LayerRecord;
  orbiters: OrbiterTrack[];
  leftOut: { name: string; why: string }[];
}

export interface OrbiterPasses {
  id: string;
  startUtc: string;
  endUtc: string;
  stepMin: number;
  /** Each time above the horizon: the first minute, then the elevation in whole degrees for each minute. */
  passes: { startUtc: string; elevationDeg: number[] }[];
}

export interface SitePasses {
  builtUtc: string;
  siteId: string;
  orbiters: OrbiterPasses[];
}

/**
 * Assumed thresholds, grade D: no sourced figure was found for either on 14 Nov.
 * A relay link is counted from 10 degrees above the horizon. An orbiter "could image" the walker when it is within
 * 30 degrees of straight overhead (60 degrees up or more) while the Sun is up.
 */
export const LINK_MIN_ELEVATION_DEG = 10;
export const IMAGING_MIN_ELEVATION_DEG = 60;

async function readJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json() as T;
  } catch {
    return null;
  }
}

/** The globe predictions, or null when the file is absent: the feature then stays off. */
export function loadGlobeOrbiters(dataUrl: string): Promise<GlobeOrbiters | null> {
  return readJson<GlobeOrbiters>(`${dataUrl}orbiters/globe.json`);
}

/** A site's passes, or null when the file is absent. */
export function loadSitePasses(dataUrl: string, siteId: string): Promise<SitePasses | null> {
  return readJson<SitePasses>(`${dataUrl}orbiters/${siteId}.json`);
}

const MINUTE_MS = 60_000;

/** Longitude difference b - a, folded into -180 to 180. */
function lonStep(a: number, b: number): number {
  return ((b - a + 540) % 360) - 180;
}

/**
 * The point on Mars below the orbiter at `utc`, or null outside the prediction. Between two saved points the position
 * is blended in a straight line, except where the track crosses near a pole (a jump of more than 90 degrees of
 * longitude in one step): there the nearer saved point is used, since a straight blend would cut across the planet.
 */
export function positionAt(track: OrbiterTrack, utc: Date): [number, number] | null {
  const start = Date.parse(track.startUtc);
  const index = (utc.getTime() - start) / (track.stepMin * MINUTE_MS);
  const last = track.lonEastDeg.length - 1;
  if (!(index >= 0) || index > last) return null;
  const i = Math.min(Math.floor(index), last - 1);
  const f = index - i;
  if (last === 0) return [track.lonEastDeg[0]!, track.latDeg[0]!];
  const step = lonStep(track.lonEastDeg[i]!, track.lonEastDeg[i + 1]!);
  if (Math.abs(step) > 90) {
    const k = f < 0.5 ? i : i + 1;
    return [track.lonEastDeg[k]!, track.latDeg[k]!];
  }
  const lon = track.lonEastDeg[i]! + step * f;
  return [((lon + 540) % 360) - 180, track.latDeg[i]! + (track.latDeg[i + 1]! - track.latDeg[i]!) * f];
}

/**
 * The ground track from `beforeMin` minutes before `utc` to `afterMin` after, as lines that break where the track
 * crosses longitude 180 or jumps near a pole, so no segment is drawn across the planet. Empty outside the prediction.
 */
export function trackAround(track: OrbiterTrack, utc: Date, beforeMin: number, afterMin: number): [number, number][][] {
  const start = Date.parse(track.startUtc);
  const step = track.stepMin * MINUTE_MS;
  const from = Math.max(0, Math.ceil((utc.getTime() - beforeMin * MINUTE_MS - start) / step));
  const to = Math.min(track.lonEastDeg.length - 1, Math.floor((utc.getTime() + afterMin * MINUTE_MS - start) / step));
  const lines: [number, number][][] = [];
  let current: [number, number][] = [];
  for (let i = from; i <= to; i++) {
    const point: [number, number] = [track.lonEastDeg[i]!, track.latDeg[i]!];
    const previous = current[current.length - 1];
    if (previous && Math.abs(point[0] - previous[0]) > 90) {
      if (current.length > 1) lines.push(current);
      current = [];
    }
    current.push(point);
  }
  if (current.length > 1) lines.push(current);
  return lines;
}

/** Elevation of an orbiter above the site's horizon at `utc`, whole degrees; 0 when below; null outside the prediction. */
export function elevationAt(orbiter: OrbiterPasses, utc: Date): number | null {
  const t = utc.getTime();
  if (t < Date.parse(orbiter.startUtc) || t > Date.parse(orbiter.endUtc)) return null;
  for (const pass of orbiter.passes) {
    const index = Math.floor((t - Date.parse(pass.startUtc)) / (orbiter.stepMin * MINUTE_MS));
    if (index >= 0 && index < pass.elevationDeg.length) return pass.elevationDeg[index]!;
  }
  return 0;
}

export interface Coverage {
  /** One entry per minute of the walk from its start. */
  minutes: {
    /** Orbiters with a confirmed relay role at or above the link threshold. */
    link: string[];
    /** Orbiters with a confirmed camera at or above the imaging threshold, while the Sun is up. */
    imaging: string[];
    /** Every orbiter above the horizon, counted or not, with its elevation. */
    up: { id: string; elevationDeg: number }[];
    /** False when this minute is outside some orbiter's prediction. */
    known: boolean;
  }[];
  /** Stretches with no link, and with no chance of an orbital image, as [first minute, minute after the last]. */
  linkGaps: [number, number][];
  imagingGaps: [number, number][];
}

/**
 * The stretches of a walk walked during gaps, for the map. Each leg's walking time is spread along it by distance,
 * which is approximate (the walking model is faster on the flat than on slopes) and is said so where it is shown.
 * `distancesM[i]` is the distance from the leg's start to `line[i]`; minutes are counted from the walk's start.
 */
export function stretchesInGaps(
  legs: { line: readonly [number, number][]; distancesM: readonly number[]; minutes: number }[], gapList: readonly [number, number][],
): [number, number][][] {
  const timed: { point: [number, number]; minute: number }[] = [];
  let offset = 0;
  for (const leg of legs) {
    const total = leg.distancesM[leg.distancesM.length - 1] ?? 0;
    leg.line.forEach((point, i) => {
      const share = leg.distancesM.length === leg.line.length && total > 0
        ? leg.distancesM[i]! / total
        : i / Math.max(1, leg.line.length - 1);
      timed.push({ point, minute: offset + share * leg.minutes });
    });
    offset += leg.minutes;
  }
  const inGap = (minute: number): boolean => gapList.some(([from, to]) => minute >= from && minute < to);
  const stretches: [number, number][][] = [];
  let current: [number, number][] = [];
  for (const { point, minute } of timed) {
    if (inGap(minute)) current.push(point);
    else if (current.length > 0) { if (current.length > 1) stretches.push(current); current = []; }
  }
  if (current.length > 1) stretches.push(current);
  return stretches;
}

/** Turn a list of yes/no minutes into the stretches where it is no. */
function gaps(flags: boolean[]): [number, number][] {
  const found: [number, number][] = [];
  let start = -1;
  flags.forEach((ok, i) => {
    if (!ok && start < 0) start = i;
    if (ok && start >= 0) { found.push([start, i]); start = -1; }
  });
  if (start >= 0) found.push([start, flags.length]);
  return found;
}

/**
 * Minute-by-minute coverage for a walk that starts at `startUtc` and lasts `durationMin` minutes. `sunUp(utc)` says
 * whether the Sun is above the horizon at the site. Roles come from `tracks` (the globe file holds them).
 */
export function walkCoverage(
  site: SitePasses, tracks: readonly OrbiterTrack[], startUtc: Date, durationMin: number, sunUp: (utc: Date) => boolean,
): Coverage {
  const role = new Map(tracks.map((t) => [t.id, t]));
  const minutes: Coverage['minutes'] = [];
  for (let m = 0; m < Math.max(1, Math.ceil(durationMin)); m++) {
    const utc = new Date(startUtc.getTime() + m * MINUTE_MS);
    const day = sunUp(utc);
    const entry: Coverage['minutes'][number] = { link: [], imaging: [], up: [], known: true };
    for (const orbiter of site.orbiters) {
      const elevation = elevationAt(orbiter, utc);
      if (elevation === null) { entry.known = false; continue; }
      if (elevation <= 0) continue;
      entry.up.push({ id: orbiter.id, elevationDeg: elevation });
      const track = role.get(orbiter.id);
      if (track?.relay === true && elevation >= LINK_MIN_ELEVATION_DEG) entry.link.push(orbiter.id);
      if (track?.camera && day && elevation >= IMAGING_MIN_ELEVATION_DEG) entry.imaging.push(orbiter.id);
    }
    minutes.push(entry);
  }
  return {
    minutes,
    linkGaps: gaps(minutes.map((m) => m.link.length > 0)),
    imagingGaps: gaps(minutes.map((m) => m.imaging.length > 0)),
  };
}
