// WHAT:    Entry point. Opens the Mars globe with a marker at every site and approach imagery round the site in focus, flies
//          to a site chosen by click, link or picker (a site zoomed into by hand opens where the camera is), and opens a
//          built site's own image and 3D terrain, its layer panel and route planning there; shows the
//          space-weather banner and the link-to-Earth line; sets up installation as an app (F14, F1, F2, F3, F5, F7, F8, F16).
// IN:      public/data/globe/layers.json, public/data/sites.json and a built site's folder; the site named in the address bar, if any.
// OUT:     Nothing. Starts the app.
// USED BY: index.html.
// RULES:   Wiring only, no logic of its own. A site's files load only when that site is opened.
// TRAPS:   PITFALLS 10, 11.
// OWNER:   Role B.

import { loadLayers } from './data/layers';
import { loadSite } from './data/loadSite';
import { loadSites } from './data/loadSites';
import { loadApproachLayers, watchApproachRings } from './map/approach';
import { flyIntoSite, flyToGlobe, flyToSite, startIdleTurn } from './map/flight';
import { createGlobeMap } from './map/mapView';
import { addOverlays } from './map/overlays';
import { addScaleBar } from './map/scaleBar';
import { removeSiteLayers, showSiteLayers } from './map/siteLayers';
import { addSiteMarkers } from './map/siteMarkers';
import { addSlots, SLOT } from './map/slots';
import { addOrbiters } from './map/orbiters';
import { loadGlobeOrbiters } from './data/orbiters';
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

/** Say that something could not be shown. Notes stack in one corner, can be closed, and leave after 20 seconds. */
function showProblem(message: string): void {
  let stack = document.querySelector<HTMLElement>('.problems');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'problems';
    document.body.append(stack);
  }
  const box = document.createElement('p');
  box.className = 'problem';
  box.setAttribute('role', 'alert');
  box.textContent = message;
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'problem__close';
  close.textContent = 'Close';
  close.addEventListener('click', () => box.remove());
  box.append(' ', close);
  stack.append(box);
  window.setTimeout(() => box.remove(), 20_000);
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
  // Fixed places in the layer order, so every later layer lands where it belongs (map/slots.ts).
  addSlots(map);
  // Sharp land around the site in focus while zooming in, beneath the site image and the markers.
  watchApproachRings(map, approachRings, `${DATA_URL}approach/`, SLOT.rings);
  addScaleBar(map);
  addWeatherBanner(container, DATA_URL);
  addEarthLink(container);
  // The orbiters on the globe (F18), loaded after the globe so they never hold it up; absent file, no orbiters.
  const orbitersReady = loadGlobeOrbiters(DATA_URL);
  void orbitersReady.then((orbiters) => { if (orbiters) addOrbiters(map, orbiters); });

  let stopIdleTurn = (): void => {};
  /** Takes the route card, the route, the layer panel and the site's overlays away when the person leaves a site. */
  let stopRoutePlanner = (): void => {};
  /** Counts choices, so a slow load for one site cannot overwrite a later choice. */
  let choice = 0;
  /** The site now chosen, and how many camera flights the app itself has under way. */
  let selectedId: string | null = null;
  let flights = 0;

  /**
   * Choose a site, or the globe for null. `camera` 'fly' moves the camera there (a click, a link, the picker);
   * 'stay' leaves it where the person put it, for a site chosen by zooming in by hand.
   */
  const select = async (siteId: string | null, camera: 'fly' | 'stay' = 'fly'): Promise<void> => {
    const thisChoice = ++choice;
    stopIdleTurn();
    stopRoutePlanner();
    stopRoutePlanner = () => {};
    const site = siteId === null ? undefined : sites.find((s) => s.id === siteId);
    selectedId = site?.id ?? null;
    flights++;
    try {
      await open(site, thisChoice, camera);
    } finally {
      flights--;
    }
  };

  /** Show a site, or the globe when there is none, and fly there unless the person is steering. */
  const open = async (site: (typeof sites)[number] | undefined, thisChoice: number, camera: 'fly' | 'stay'): Promise<void> => {
    markers.setSelected(site?.id ?? null);
    picker.show(site?.id ?? null);
    writeUrlState({ siteId: site?.id ?? null });

    if (!site?.built) {
      // The globe, or a site with no map of its own: show the markers and no site layers.
      document.body.classList.remove('has-walk', 'walk-folded');
      map.resize();
      removeSiteLayers(map);
      markers.setVisible(true);
      if (camera === 'fly') await (site ? flyToSite(map, site) : flyToGlobe(map));
      return;
    }
    try {
      const builtSite = await loadSite(DATA_URL, site.id);
      if (thisChoice !== choice) return;
      const notShown = showSiteLayers(map, builtSite, SLOT.image);
      for (const message of notShown) showProblem(message);
      // The column and the name would stand in the middle of the ground the person came to see.
      markers.setVisible(false);
      // On a wide screen the walk column takes its place beside the map now, so the camera is framed for the
      // width the map will keep, not for a width it is about to lose.
      document.body.classList.toggle('has-walk', Boolean(builtSite.site.grid));
      map.resize();
      // A camera flight started while the person is still zooming fights their hand; they keep control.
      if (camera === 'fly') await flyIntoSite(map, builtSite.site);
      if (thisChoice !== choice) return;
      const drawn = await addOverlays(map, builtSite);
      if (thisChoice !== choice) { drawn.remove(); return; }
      const layerPanel = createLayerPanel(picker.slot, drawn.overlays, builtSite.layers.rejected, builtSite.validation);
      // Set before the route planner starts: if that fails, the layers just drawn must still be taken away when the
      // person leaves or reopens the site, or the next open finds their sources already on the map.
      stopRoutePlanner = () => {
        layerPanel.remove();
        drawn.remove();
      };
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
      if (camera === 'fly') await flyToSite(map, site);
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

  // Zooming in on a site by hand selects it, as clicking its marker does, but leaves the camera to the person.
  watchZoomSelect(map, sites, {
    isFlying: () => flights > 0,
    selectedId: () => selectedId,
    onSelect: (siteId) => void select(siteId, 'stay'),
  });

  if (chosenAtStart) void select(chosenAtStart.id);
  else stopIdleTurn = startIdleTurn(map);
}

setUpInstall();
start().catch((error: unknown) => {
  showProblem(error instanceof Error ? error.message : String(error));
});
