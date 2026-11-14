// Build settings. The site is served under the repository name on GitHub Pages,
// so every address must be relative: keep `base` as './' (docs/PITFALLS.md section 10).
// The small plugin below writes the service worker (pwa/sw.js) into the build with this build's id and the
// list of files to keep on the device at install. It needs no extra package.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

const PUBLIC = 'public';
/** Files in public/ that the first screen needs, kept at install so the app opens offline. */
const PRECACHE_PUBLIC = [
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'data/sites.json',
  'data/space-weather.json',
  'data/globe/layers.json',
  'data/approach/layers.json',
];
/** Whole-planet image tiles up to this zoom are kept at install too: 21 small files. */
const PRECACHE_GLOBE_ZOOM = 2;

function filesUnder(folder: string): string[] {
  if (!existsSync(folder)) return [];
  return readdirSync(folder).flatMap((name) => {
    const path = join(folder, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

function serviceWorker(): Plugin {
  return {
    name: 'tether-service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      const built = Object.keys(bundle).filter((name) => name !== 'index.html' && !name.endsWith('.map'));
      const globeTiles: string[] = [];
      for (let zoom = 0; zoom <= PRECACHE_GLOBE_ZOOM; zoom++) {
        const folder = join(PUBLIC, 'data', 'globe', 'tiles', 'image-viking', String(zoom));
        globeTiles.push(...filesUnder(folder).map((path) => relative(PUBLIC, path).replaceAll('\\', '/')));
      }
      const publicFiles = PRECACHE_PUBLIC.filter((path) => existsSync(join(PUBLIC, path)));
      const precache = ['./', ...[...built, ...publicFiles, ...globeTiles].map((path) => `./${path}`)];
      const source = readFileSync('pwa/sw.js', 'utf8')
        .replace("'__BUILD_ID__'", JSON.stringify(new Date().toISOString()))
        .replace('__PRECACHE__', JSON.stringify(precache, null, 2));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  base: './',
  build: { target: 'es2022' },
  worker: { format: 'es' },
  plugins: [serviceWorker()],
});
