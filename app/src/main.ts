// WHAT:    Entry point. Opens the Mars globe with a marker at every site, and flies to a site when one is chosen (F14, F7).
//          Still to add: opening a built site's own map, the other panels and the route worker.
// IN:      public/data/globe/layers.json and public/data/sites.json; the site named in the address bar, if any.
// OUT:     Nothing. Starts the app.
// USED BY: index.html.
// RULES:   Wiring only, no logic of its own. A site's files load only when that site is opened.
// TRAPS:   PITFALLS 10, 11.
// OWNER:   Role B.

import { loadLayers } from './data/layers';
import { loadSites } from './data/loadSites';
import { flyToGlobe, flyToSite, startIdleTurn } from './map/flight';
import { createGlobeMap } from './map/mapView';
import { addSiteMarkers } from './map/siteMarkers';
import { createSitePicker } from './ui/sitePicker';
import { readUrlState, writeUrlState } from './ui/urlState';

/** Everything the pipeline wrote is under this address. Relative, so it works under the repository name. */
const DATA_URL = new URL('data/', document.baseURI).href;

function showProblem(message: string): void {
  const box = document.createElement('p');
  box.className = 'problem';
  box.setAttribute('role', 'alert');
  box.textContent = message;
  document.body.append(box);
}

async function start(): Promise<void> {
  const container = document.getElementById('map');
  if (!container) throw new Error('The page has no map element.');

  const [globe, loaded] = await Promise.all([
    loadLayers(`${DATA_URL}globe/layers.json`),
    loadSites(`${DATA_URL}sites.json`),
  ]);
  const image = globe.usable.find((layer) => layer.tiles !== undefined);
  if (!image) {
    const reasons = globe.rejected.map((r) => `${r.id}: ${r.problems.join(', ')}`).join('; ');
    throw new Error(`The globe image cannot be shown because its record is incomplete. ${reasons}`);
  }

  const { sites, rejected, file } = loaded;
  // The place to start is the highest-readiness site, built ones first. Today that is the hero site.
  const startSite = [...sites].sort((a, b) => Number(b.built) - Number(a.built) || a.level - b.level || a.name.localeCompare(b.name))[0];
  const chosenAtStart = sites.find((site) => site.id === readUrlState().siteId) ?? null;
  const facing = chosenAtStart ?? startSite;

  const map = createGlobeMap({
    container,
    image,
    folderUrl: `${DATA_URL}globe/`,
    center: facing ? [facing.lonEastDeg, facing.latDeg] : [0, 0],
  });
  if (import.meta.env.DEV) (window as unknown as { tetherMap: unknown }).tetherMap = map;
  await new Promise<void>((resolve) => { void map.once('load', () => resolve()); });

  let stopIdleTurn = (): void => {};

  const select = (siteId: string | null): void => {
    stopIdleTurn();
    const site = siteId === null ? undefined : sites.find((s) => s.id === siteId);
    markers.setSelected(site?.id ?? null);
    picker.show(site?.id ?? null);
    writeUrlState({ siteId: site?.id ?? null });
    void (site ? flyToSite(map, site) : flyToGlobe(map));
  };

  const markers = addSiteMarkers(map, sites, file.levels, (siteId) => select(siteId));
  const picker = createSitePicker({
    parent: document.body,
    sites,
    levels: file.levels,
    rejected,
    image,
    startSiteId: startSite?.id ?? null,
    onSelect: (siteId) => select(siteId),
    onShowAll: () => select(null),
    // Opening a built site's own map comes with F1. Until then no site is built, so this is never offered.
    onOpen: (siteId) => select(siteId),
  });

  if (chosenAtStart) select(chosenAtStart.id);
  else stopIdleTurn = startIdleTurn(map);

}

start().catch((error: unknown) => {
  showProblem(error instanceof Error ? error.message : String(error));
});
