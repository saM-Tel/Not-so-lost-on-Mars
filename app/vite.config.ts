// Build settings. The site is served under the repository name on GitHub Pages,
// so every address must be relative: keep `base` as './' (docs/PITFALLS.md section 10).
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: { target: 'es2022' },
  worker: { format: 'es' },
});
