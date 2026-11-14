// WHAT:    Loads the list of every site for the globe (F14).
// IN:      public/data/sites.json.
// OUT:     Site records: id, name, mission, readiness level, position, what data exists, whether it is built.
// USED BY: src/main.ts, src/map/siteMarkers.ts, src/ui/sitePicker.ts.
// RULES:   A record with no cited position is rejected, not guessed.
// TRAPS:   PITFALLS 2, 4.
// OWNER:   Role B.

import type { ReadinessLevel, SiteEntry, SitesFile } from './contract';

export interface LoadedSites {
  file: SitesFile;
  /** Sites that may be shown. */
  sites: SiteEntry[];
  /** Sites left out, each with its reasons, so the app can say why. */
  rejected: { id: string; problems: string[] }[];
}

/** Every reason this site may not be shown. An empty list means it is usable. */
export function siteEntryProblems(site: Partial<SiteEntry>, levels: Record<string, ReadinessLevel>): string[] {
  const problems: string[] = [];
  for (const field of ['id', 'name', 'place', 'mission', 'missionYears'] as const) {
    if (typeof site[field] !== 'string' || site[field] === '') problems.push(`'${field}' is missing`);
  }
  const lon = site.lonEastDeg;
  const lat = site.latDeg;
  if (typeof lon !== 'number' || !Number.isFinite(lon) || lon <= -180 || lon > 180) {
    problems.push('longitude is missing or outside -180 to 180');
  }
  if (typeof lat !== 'number' || !Number.isFinite(lat) || lat < -90 || lat > 90) {
    problems.push('latitude is missing or outside -90 to 90');
  }
  if (!site.position || !site.position.source || !site.position.sourceUrl) {
    problems.push('the position has no cited source');
  }
  if (site.level === undefined || levels[String(site.level)] === undefined) {
    problems.push(`readiness level '${site.level}' is not defined`);
  }
  if (typeof site.built !== 'boolean') problems.push(`'built' is missing`);
  if (!Array.isArray(site.data) || !Array.isArray(site.problems)) problems.push(`'data' and 'problems' must be lists`);
  return problems;
}

/** Fetch and check sites.json. Throws with a plain message if the file cannot be read. */
export async function loadSites(url: string): Promise<LoadedSites> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url} (status ${response.status}).`);
  const file = (await response.json()) as SitesFile;
  if (!Array.isArray(file.sites) || typeof file.levels !== 'object' || file.levels === null) {
    throw new Error(`${url} has no list of sites or no readiness levels.`);
  }
  const sites: SiteEntry[] = [];
  const rejected: LoadedSites['rejected'] = [];
  for (const site of file.sites) {
    const problems = siteEntryProblems(site, file.levels);
    if (problems.length === 0) sites.push(site);
    else rejected.push({ id: String(site.id ?? 'unnamed site'), problems });
  }
  return { file, sites, rejected };
}
