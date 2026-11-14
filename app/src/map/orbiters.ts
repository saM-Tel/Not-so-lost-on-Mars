// WHAT:    The Mars orbiters on the globe (F18): a small labelled dot at the point on Mars below each one now, and its
//          ground track 45 minutes back and ahead, moved every second from the saved predictions.
// IN:      The map; the globe predictions from src/data/orbiters.ts.
// OUT:     One line source and layer beneath the site image, one marker per orbiter, and a function that removes them.
// USED BY: src/main.ts.
// RULES:   Labelled "predicted" with the fetch date in the map's credit line; never called live. Shown only from the
//          globe down to zoom 8, so the site map stays clear. Not red. Outside the prediction an orbiter is not shown.
// TRAPS:   PITFALLS 4, 11.
// OWNER:   Role B.

import { Marker, type GeoJSONSource, type Map as MapLibreMap } from 'maplibre-gl';
import { positionAt, trackAround, type GlobeOrbiters } from '../data/orbiters';
import { SLOT } from './slots';

const TRACK_ID = 'orbiter-tracks';
/** Orbiters and their tracks are shown up to this zoom; beyond it the person is looking at a site. */
const SHOW_BELOW_ZOOM = 8;
const TRACK_MINUTES = 45;

/** Add the orbiters to the globe. Returns a function that takes them away. */
export function addOrbiters(map: MapLibreMap, data: GlobeOrbiters): () => void {
  const fetched = data.builtUtc.slice(0, 16).replace('T', ' ');
  map.addSource(TRACK_ID, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
    attribution: `Orbiter positions: predicted, from JPL Horizons, fetched ${fetched} UTC`,
  });
  map.addLayer({
    id: TRACK_ID, type: 'line', source: TRACK_ID, maxzoom: SHOW_BELOW_ZOOM,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#ffffff', 'line-opacity': 0.45, 'line-width': 1.2, 'line-dasharray': [2, 2] },
  }, SLOT.image);

  const markers = data.orbiters.map((orbiter) => {
    const element = document.createElement('div');
    element.className = 'orbiter-pin';
    const roles = [orbiter.relay ? 'relays for surface missions' : null, orbiter.camera ? `camera: ${orbiter.camera}` : null]
      .filter(Boolean).join('; ') || 'relay and camera roles not confirmed from a source';
    element.title = `${orbiter.name} (${orbiter.agency}): the point below it now, predicted from JPL Horizons. ${roles}.`;
    const dot = document.createElement('span');
    dot.className = 'orbiter-pin__dot';
    const label = document.createElement('span');
    label.className = 'orbiter-pin__label';
    label.textContent = orbiter.short;
    element.append(dot, label);
    return { orbiter, marker: new Marker({ element, anchor: 'left', offset: [-5, 0], opacityWhenCovered: 0 }) };
  });

  let added = new Set<string>();
  const update = (): void => {
    const now = new Date();
    const visible = map.getZoom() < SHOW_BELOW_ZOOM;
    const features: { type: 'Feature'; properties: { id: string }; geometry: { type: 'LineString'; coordinates: [number, number][] } }[] = [];
    const shown = new Set<string>();
    for (const { orbiter, marker } of markers) {
      const position = visible ? positionAt(orbiter, now) : null;
      if (!position) continue;
      marker.setLngLat(position);
      if (!added.has(orbiter.id)) marker.addTo(map);
      shown.add(orbiter.id);
      for (const line of trackAround(orbiter, now, TRACK_MINUTES, TRACK_MINUTES)) {
        features.push({ type: 'Feature', properties: { id: orbiter.id }, geometry: { type: 'LineString', coordinates: line } });
      }
    }
    for (const { orbiter, marker } of markers) if (added.has(orbiter.id) && !shown.has(orbiter.id)) marker.remove();
    added = shown;
    (map.getSource(TRACK_ID) as GeoJSONSource | undefined)?.setData({ type: 'FeatureCollection', features });
  };
  update();
  const timer = window.setInterval(update, 1000);
  map.on('zoomend', update);

  return () => {
    window.clearInterval(timer);
    map.off('zoomend', update);
    for (const { marker } of markers) marker.remove();
    if (map.getLayer(TRACK_ID)) map.removeLayer(TRACK_ID);
    if (map.getSource(TRACK_ID)) map.removeSource(TRACK_ID);
  };
}
