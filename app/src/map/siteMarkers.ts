// WHAT:    Draws a tall column, a name and a pulse at each landing site on the globe, and reports clicks (F14).
// IN:      The map, once its style has loaded; site records from src/data/loadSites.ts.
// OUT:     Map layers and markers; a callback with the clicked site id; a handle to mark one site as chosen or hide them all.
// USED BY: src/main.ts.
// RULES:   Colour shows readiness level and is never red. Columns shrink as the view zooms in. Positions come only from sites.json.
// TRAPS:   PITFALLS 3, 11.
// OWNER:   Role B.

import { Marker, type Map as MapLibreMap } from 'maplibre-gl';
import type { ReadinessLevel, SiteEntry } from '../data/contract';
import { MAPLIBRE_METRES_PER_MARS_METRE, MARS_RADIUS_M } from '../mars/constants';
import { destination, type LonLat } from '../mars/geometry';

/** How tall and how wide a column should look on screen, whatever the zoom. */
const COLUMN_HEIGHT_PX = 46;
const COLUMN_HALF_WIDTH_PX = 3.5;
/** A polygon cannot change size with zoom, so each half step of zoom gets its own set of columns. */
const BAND_STEP = 0.5;
/** Columns are a way to find sites from far away. Closer than this they would hide the ground. */
const COLUMNS_END_ZOOM = 9;
const COLUMN_SIDES = 6;

/** Ground size on Mars of one screen pixel at the middle of the view. MapLibre counts zoom on 512-pixel tiles. */
function marsMetresPerPixel(zoom: number): number {
  return (2 * Math.PI * MARS_RADIUS_M) / (512 * 2 ** zoom);
}

function columnOutline(centre: LonLat, radiusM: number): LonLat[] {
  const ring: LonLat[] = [];
  for (let k = 0; k <= COLUMN_SIDES; k++) ring.push(destination(centre, (k % COLUMN_SIDES) * (360 / COLUMN_SIDES), radiusM));
  return ring;
}

/** The readiness-level colours are defined once, in style.css, so the list and the columns always agree. */
function levelColour(level: number): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(`--level-${level}`).trim();
  return value || '#ffffff';
}

export interface SiteMarkers {
  /** Mark one site as chosen, or none. */
  setSelected(siteId: string | null): void;
  /** Hide every column and name, for when a site's own map is open. */
  setVisible(visible: boolean): void;
}

export function addSiteMarkers(
  map: MapLibreMap,
  sites: SiteEntry[],
  levels: Record<string, ReadinessLevel>,
  onSelect: (siteId: string) => void,
): SiteMarkers {
  const levelNumbers = Object.keys(levels).map(Number);
  const colourByLevel: (string | number)[] = [];
  for (const level of levelNumbers) colourByLevel.push(level, levelColour(level));

  // Height in real Mars metres that looks COLUMN_HEIGHT_PX tall at zoom 0, then halves with each zoom level.
  // MapLibre believes the planet is Earth-sized, so the height it is given is scaled up to match.
  const heightAtZoom0 = COLUMN_HEIGHT_PX * marsMetresPerPixel(0) * MAPLIBRE_METRES_PER_MARS_METRE;
  const farZoom = 14;

  const layerIds: string[] = [];
  for (let zoom = 0; zoom < COLUMNS_END_ZOOM; zoom += BAND_STEP) {
    const id = `site-columns-${zoom}`;
    const radiusM = COLUMN_HALF_WIDTH_PX * marsMetresPerPixel(zoom);
    map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: sites.map((site) => ({
          type: 'Feature',
          properties: { id: site.id, level: site.level },
          geometry: { type: 'Polygon', coordinates: [columnOutline([site.lonEastDeg, site.latDeg], radiusM)] },
        })),
      },
    });
    map.addLayer({
      id,
      type: 'fill-extrusion',
      source: id,
      minzoom: zoom,
      maxzoom: zoom + BAND_STEP,
      paint: {
        'fill-extrusion-color': ['match', ['get', 'level'], ...colourByLevel, '#ffffff'] as never,
        'fill-extrusion-height': [
          'interpolate', ['exponential', 0.5], ['zoom'],
          0, heightAtZoom0,
          farZoom, heightAtZoom0 / 2 ** farZoom,
        ],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.95,
      },
    });
    map.on('click', id, (event) => {
      const siteId = event.features?.[0]?.properties?.id;
      if (typeof siteId === 'string') onSelect(siteId);
    });
    map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
    layerIds.push(id);
  }

  // The name and the pulse are ordinary page elements, so they stay sharp and can be reached by keyboard.
  const pins = new Map<string, HTMLButtonElement>();
  const markers: Marker[] = [];
  for (const site of sites) {
    const level = levels[String(site.level)];
    const pin = document.createElement('button');
    pin.type = 'button';
    pin.className = `site-pin level-${site.level}`;
    pin.setAttribute(
      'aria-label',
      `${site.name}, ${site.place}. ${site.mission}. Level ${site.level}, ${level?.name ?? ''}. ${site.built ? 'Built' : 'Not built yet'}.`,
    );
    const pulse = document.createElement('span');
    pulse.className = 'site-pin__pulse';
    const name = document.createElement('span');
    name.className = 'site-pin__name';
    name.textContent = site.name;
    pin.append(pulse, name);
    pin.addEventListener('click', (event) => {
      event.stopPropagation();
      onSelect(site.id);
    });
    pins.set(site.id, pin);
    // A site on the far side of the planet is hidden completely; a faint label floating over other ground misleads.
    markers.push(
      new Marker({ element: pin, anchor: 'center', opacityWhenCovered: 0 })
        .setLngLat([site.lonEastDeg, site.latDeg])
        .addTo(map),
    );
  }

  // Sites close together would print their names on top of each other. Keep the name of the more
  // important site (chosen first, then built, then readiness level) and show only the dot for the other.
  let selectedId: string | null = null;
  const rank = (site: SiteEntry): number => (site.id === selectedId ? 0 : site.built ? 1 : 1 + site.level);
  let tidyQueued = false;
  const tidyNames = (): void => {
    tidyQueued = false;
    const kept: DOMRect[] = [];
    for (const site of [...sites].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))) {
      const pin = pins.get(site.id);
      const name = pin?.querySelector<HTMLElement>('.site-pin__name');
      if (!pin || !name) continue;
      name.hidden = false;
      const box = name.getBoundingClientRect();
      const farSide = pin.style.opacity === '0';
      const overlaps = kept.some((k) => box.left < k.right && box.right > k.left && box.top < k.bottom && box.bottom > k.top);
      if (farSide) continue;
      if (overlaps) name.hidden = true;
      else kept.push(box);
    }
  };
  const queueTidy = (): void => {
    if (tidyQueued) return;
    tidyQueued = true;
    requestAnimationFrame(tidyNames);
  };
  map.on('move', queueTidy);
  queueTidy();

  return {
    setSelected(siteId) {
      selectedId = siteId;
      for (const [id, pin] of pins) pin.classList.toggle('is-selected', id === siteId);
      queueTidy();
    },
    setVisible(visible) {
      for (const id of layerIds) map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
      for (const pin of pins.values()) pin.hidden = !visible;
    },
  };
}
