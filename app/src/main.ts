// WHAT:    Entry point. Opens the Mars globe (F14). Still to add: reading the address bar, opening a named site (F7), panels and the route worker.
// IN:      public/data/globe/layers.json.
// OUT:     Nothing. Starts the app.
// USED BY: index.html.
// RULES:   Wiring only, no logic of its own. A site's files load only when that site is opened.
// TRAPS:   PITFALLS 10, 11.
// OWNER:   Role B.

import { loadLayers } from './data/layers';
import { createGlobeMap } from './map/mapView';

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

  const globe = await loadLayers(`${DATA_URL}globe/layers.json`);
  const image = globe.usable.find((layer) => layer.tiles !== undefined);
  if (!image) {
    const reasons = globe.rejected.map((r) => `${r.id}: ${r.problems.join(', ')}`).join('; ');
    throw new Error(`The globe image cannot be shown because its record is incomplete. ${reasons}`);
  }

  const map = createGlobeMap({ container, image, folderUrl: `${DATA_URL}globe/`, center: [0, 0] });
  if (import.meta.env.DEV) (window as unknown as { tetherMap: unknown }).tetherMap = map;
}

start().catch((error: unknown) => {
  showProblem(error instanceof Error ? error.message : String(error));
});
