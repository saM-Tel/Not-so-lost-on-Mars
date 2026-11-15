// WHAT:    Keeps the view in the address bar so any view can be shared (F7): the site, the walk's target or its stops
//          with the minutes at each, and the tether settings.
// IN:      The chosen site id, or none; the target or the stops of the planned walk; the walk-back limit and time since
//          leaving home.
// OUT:     A hash string, and the state read back from one.
// USED BY: src/main.ts, src/ui/routePanel.ts.
// RULES:   Reloading a copied link restores the same view. No site in the address means the globe.
//          Anything in the address that is not a value the app could have written is ignored, never guessed at.
// TRAPS:   PITFALLS 10.
// OWNER:   Role B.

export interface UrlState {
  /** The chosen site, or null for the globe with nothing chosen. */
  siteId: string | null;
  /** Target of the planned walk as [east-positive longitude, planetocentric latitude] in degrees. `to=lon,lat`. */
  target?: [number, number] | null;
  /** The longest walk home allowed, minutes. `back=30`. Left out when it is the default. */
  walkBackMin?: number | null;
  /** Time since leaving home, minutes. `t=120`. Left out when zero. */
  elapsedMin?: number | null;
  /** A walk through several stops (F3), in walking order, each with whole minutes spent there:
   *  `stops=lon,lat,min;lon,lat,min`. Takes the place of `to=` (team decision of 15 Nov, review item S7). */
  stops?: LinkStop[] | null;
}

export interface LinkStop {
  position: [number, number];
  stayMin: number;
}

/** The most stops a link may hold; anything longer is ignored, never cut short silently. */
export const MAX_LINK_STOPS = 12;

/** A longitude and latitude in degrees as the app writes them, or null. */
function lonLat(lonText: string | undefined, latText: string | undefined): [number, number] | null {
  const number = /^-?\d{1,3}(\.\d{1,7})?$/;
  if (lonText === undefined || latText === undefined || !number.test(lonText) || !number.test(latText)) return null;
  const lon = Number(lonText);
  const lat = Number(latText);
  return lon > -180 && lon <= 180 && lat >= -90 && lat <= 90 ? [lon, lat] : null;
}

function parseStops(text: string | null): LinkStop[] | null {
  if (text === null) return null;
  const parts = text.split(';');
  if (parts.length === 0 || parts.length > MAX_LINK_STOPS) return null;
  const stops: LinkStop[] = [];
  for (const part of parts) {
    const [lon, lat, min, ...rest] = part.split(',');
    const position = lonLat(lon, lat);
    const stayMin = min === '0' ? 0 : wholeNumber(min ?? null, 1, 240);
    if (!position || stayMin === null || rest.length > 0) return null;
    stops.push({ position, stayMin });
  }
  return stops;
}

/** Site ids are kebab-case; anything else in the address is ignored. */
const SITE_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function wholeNumber(text: string | null, min: number, max: number): number | null {
  if (text === null || !/^\d{1,4}$/.test(text)) return null;
  const value = Number(text);
  return value >= min && value <= max ? value : null;
}

export function parseHash(hash: string): UrlState {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const site = params.get('site');
  const state: UrlState = { siteId: site !== null && SITE_ID.test(site) ? site : null };
  if (state.siteId === null) return state;
  const to = params.get('to')?.split(',') ?? [];
  const target = to.length === 2 ? lonLat(to[0], to[1]) : null;
  if (target) state.target = target;
  const stops = parseStops(params.get('stops'));
  if (stops) state.stops = stops;
  const back = wholeNumber(params.get('back'), 1, 600);
  if (back !== null) state.walkBackMin = back;
  const elapsed = wholeNumber(params.get('t'), 1, 6000);
  if (elapsed !== null) state.elapsedMin = elapsed;
  return state;
}

export function formatHash(state: UrlState): string {
  if (state.siteId === null) return '';
  let hash = `#site=${state.siteId}`;
  // Five decimal places of a degree is about 0.6 m on Mars: finer than a routing cell.
  if (state.stops && state.stops.length > 0) {
    hash += `&stops=${state.stops.slice(0, MAX_LINK_STOPS)
      .map((s) => `${s.position[0].toFixed(5)},${s.position[1].toFixed(5)},${Math.max(0, Math.min(240, Math.round(s.stayMin)))}`).join(';')}`;
  } else if (state.target) {
    hash += `&to=${state.target[0].toFixed(5)},${state.target[1].toFixed(5)}`;
  }
  if (state.walkBackMin) hash += `&back=${Math.round(state.walkBackMin)}`;
  if (state.elapsedMin) hash += `&t=${Math.round(state.elapsedMin)}`;
  return hash;
}

export function readUrlState(): UrlState {
  return parseHash(window.location.hash);
}

/** Put the state in the address bar without adding a step to the browser's history. */
export function writeUrlState(state: UrlState): void {
  const hash = formatHash(state);
  const url = window.location.pathname + window.location.search + hash;
  window.history.replaceState(null, '', url);
}

/** Change part of the state in the address bar and keep the rest. */
export function updateUrlState(patch: Partial<UrlState>): void {
  writeUrlState({ ...readUrlState(), ...patch });
}
