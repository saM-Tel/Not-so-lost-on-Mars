// WHAT:    Entry point. Opens the Mars globe with a marker at every site, flies to a chosen site, and opens a built site's
//          own image and 3D terrain, its layer panel and route planning there, and shows the space-weather banner (F14, F1, F2, F3, F5, F7).
// IN:      public/data/globe/layers.json, public/data/sites.json and a built site's folder; the site named in the address bar, if any.
// OUT:     Nothing. Starts the app.
// USED BY: index.html.
// RULES:   Wiring only, no logic of its own. A site's files load only when that site is opened.
// TRAPS:   PITFALLS 10, 11.
// OWNER:   Role B.

import { loadLayers } from './data/layers';
import { loadSite } from './data/loadSite';
import { loadSites } from './data/loadSites';
import { addApproachLayers, loadApproachLayers } from './map/approach';
import { flyIntoSite, flyToGlobe, flyToSite, startIdleTurn } from './map/flight';
import { createGlobeMap } from './map/mapView';
import { addOverlays } from './map/overlays';
import { addScaleBar } from './map/scaleBar';
import { removeSiteLayers, showSiteLayers } from './map/siteLayers';
import { addSiteMarkers } from './map/siteMarkers';
import { watchZoomSelect } from './map/zoomSelect';
import { setUpInstall } from './ui/install';
import { createLayerPanel } from './ui/layerPanel';
import { startRoutePlanner } from './ui/routePanel';
import { createSitePicker } from './ui/sitePicker';
import { readUrlState, writeUrlState, type UrlState } from './ui/urlState';
import { addWeatherBanner } from './ui/weatherBanner';
import { addEarthLink } from './ui/earthLink';

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

  const [globe, loaded, approachRings] = await Promise.all([
    loadLayers(`${DATA_URL}globe/layers.json`),
    loadSites(`${DATA_URL}sites.json`),
    loadApproachLayers(`${DATA_URL}approach/layers.json`),
  ]);
  const image = globe.usable.find((layer) => layer.tiles !== undefined);
  if (!image) {
    const reasons = globe.rejected.map((r) => `${r.id}: ${r.problems.join(', ')}`).join('; ');
    throw new Error(`The globe image cannot be shown because its record is incomplete. ${reasons}`);
  }

  const { sites, rejected, file } = loaded;
  // The place to start is the highest-readiness site, built ones first. Today that is the hero site.
  const startSite = [...sites].sort((a, b) => Number(b.built) - Number(a.built) || a.level - b.level || a.name.localeCompare(b.name))[0];
  /** What the address bar asked for when the page opened: a site, and perhaps a walk there. */
  let linked: UrlState | null = readUrlState();
  const chosenAtStart = sites.find((site) => site.id === linked?.siteId) ?? null;
  const facing = chosenAtStart ?? startSite;

  const map = createGlobeMap({
    container,
    image,
    folderUrl: `${DATA_URL}globe/`,
    center: facing ? [facing.lonEastDeg, facing.latDeg] : [0, 0],
  });
  if (import.meta.env.DEV) (window as unknown as { tetherMap: unknown }).tetherMap = map;
  await new Promise<void>((resolve) => { void map.once('load', () => resolve()); });
  // Sharp land around every site while zooming in. Added before the markers and the site image, so both sit on top.
  addApproachLayers(map, approachRings, `${DATA_URL}approach/`);
  addScaleBar(map);
  addWeatherBanner(container, DATA_URL);
  addEarthLink(container);

  let stopIdleTurn = (): void => {};
  /** Takes the route card, the route, the layer panel and the site's overlays away when the person leaves a site. */
  let stopRoutePlanner = (): void => {};
  /** Counts choices, so a slow load for one site cannot overwrite a later choice. */
  let choice = 0;
  /** The site now chosen, and how many camera flights the app itself has under way. */
  let selectedId: string | null = null;
  let flights = 0;

  const select = async (siteId: string | null): Promise<void> => {
    const thisChoice = ++choice;
    stopIdleTurn();
    stopRoutePlanner();
    stopRoutePlanner = () => {};
    const site = siteId === null ? undefined : sites.find((s) => s.id === siteId);
    selectedId = site?.id ?? null;
    flights++;
    try {
      await open(site, thisChoice);
    } finally {
      flights--;
    }
  };

  /** Show a site, or the globe when there is none, and fly there. */
  const open = async (site: (typeof sites)[number] | undefined, thisChoice: number): Promise<void> => {
    markers.setSelected(site?.id ?? null);
    picker.show(site?.id ?? null);
    writeUrlState({ siteId: site?.id ?? null });

    if (!site?.built) {
      // The globe, or a site with no map of its own: show the markers and no site layers.
      removeSiteLayers(map);
      markers.setVisible(true);
      await (site ? flyToSite(map, site) : flyToGlobe(map));
      return;
    }
    try {
      const builtSite = await loadSite(DATA_URL, site.id);
      if (thisChoice !== choice) return;
      const notShown = showSiteLayers(map, builtSite, markers.firstLayerId);
      for (const message of notShown) showProblem(message);
      // The column and the name would stand in the middle of the ground the person came to see.
      markers.setVisible(false);
      await flyIntoSite(map, builtSite.site);
      if (thisChoice !== choice) return;
      const drawn = await addOverlays(map, builtSite);
      if (thisChoice !== choice) { drawn.remove(); return; }
      const layerPanel = createLayerPanel(picker.slot, drawn.overlays, builtSite.layers.rejected, builtSite.validation);
      const stopRoute = builtSite.site.grid
        ? startRoutePlanner(map, builtSite, {
          onOverlay: (overlay) => layerPanel.add(overlay),
          // The walk in a shared link is restored once, at the site the link named.
          ...(linked?.siteId === site.id ? { restore: linked } : {}),
        })
        : (): void => {};
      linked = null;
      stopRoutePlanner = () => {
        stopRoute();
        layerPanel.remove();
        drawn.remove();
      };
    } catch (error) {
      if (thisChoice !== choice) return;
      showProblem(error instanceof Error ? error.message : String(error));
      await flyToSite(map, site);
    }
  };

  const markers = addSiteMarkers(map, sites, file.levels, (siteId) => void select(siteId));
  const picker = createSitePicker({
    parent: document.body,
    sites,
    levels: file.levels,
    rejected,
    image,
    startSiteId: startSite?.id ?? null,
    onSelect: (siteId) => void select(siteId),
    onShowAll: () => void select(null),
    onOpen: (siteId) => void select(siteId),
  });

  // Zooming in on a site by hand selects it, as clicking its marker does.
  watchZoomSelect(map, sites, {
    isFlying: () => flights > 0,
    selectedId: () => selectedId,
    onSelect: (siteId) => void select(siteId),
  });

  if (chosenAtStart) void select(chosenAtStart.id);
  else stopIdleTurn = startIdleTurn(map);
}

setUpInstall();
start().catch((error: unknown) => {
  showProblem(error instanceof Error ? error.message : String(error));
});
