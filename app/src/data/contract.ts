// WHAT:    Types that mirror docs/DATA_CONTRACT.md: layers.json so far. Still to add: sites.json, site.json and the grid definition.
// IN:      Nothing.
// OUT:     Types only.
// USED BY: src/data loaders and everything that reads site files.
// RULES:   Change only together with docs/DATA_CONTRACT.md and the pipeline (pipeline/records.py). Names carry units.
// TRAPS:   PITFALLS 4.
// OWNER:   Role B.

/** Confidence grade from docs/CONFIDENCE.md section 2. */
export type Grade = 'A' | 'B' | 'C' | 'D';

/** Written by the pipeline when a value was looked for and not found, or does not apply. */
export const NOT_FOUND = 'not found';
export const NOT_APPLICABLE = 'not applicable';

/** Where a layer's map tiles are, relative to the folder that holds its layers.json. */
export interface TileSet {
  /** Address pattern with {z}, {x} and {y}. */
  path: string;
  minZoom: number;
  maxZoom: number;
  tileSizePx: number;
  count?: number;
  bytes?: number;
}

/** One layer's record: the fields of docs/CONFIDENCE.md section 1. Every field is always present. */
export interface LayerRecord {
  id: string;
  title: string;
  dataType: string;
  mission: string;
  instrument: string;
  agency: string;
  productId: string;
  sourceUrl: string;
  doi: string;
  /** When the measurements were taken. Never the download date. */
  acquiredFrom: string;
  acquiredTo: string;
  published: string;
  gridSpacing: string;
  realDetail: string;
  positionAccuracy: string;
  heightAccuracy: string;
  processing: string;
  grade: Grade;
  caveats: string[];
  credit: string;
  tiles?: TileSet;
}

export interface LayersFile {
  contractVersion: number;
  /** When the pipeline wrote the file, UTC, ISO 8601. */
  builtUtc: string;
  layers: LayerRecord[];
}
