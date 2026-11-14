// WHAT:    Keeps the view in the address bar so any view can be shared (F7). So far: which site is chosen.
// IN:      The chosen site id, or none.
// OUT:     A hash string, and the state read back from one.
// USED BY: src/main.ts.
// RULES:   Reloading a copied link restores the same view. No site in the address means the globe.
// TRAPS:   PITFALLS 10.
// OWNER:   Role B.

export interface UrlState {
  /** The chosen site, or null for the globe with nothing chosen. */
  siteId: string | null;
}

/** Site ids are kebab-case; anything else in the address is ignored. */
const SITE_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function parseHash(hash: string): UrlState {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const site = params.get('site');
  return { siteId: site !== null && SITE_ID.test(site) ? site : null };
}

export function formatHash(state: UrlState): string {
  return state.siteId === null ? '' : `#site=${state.siteId}`;
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
