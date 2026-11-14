// WHAT:    Types that mirror docs/DATA_CONTRACT.md: layers.json, sites.json and site.json with its routing grid definition so far.
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
  /** For terrain tiles: how heights are stored. 'mapbox' means -10000 + (red * 65536 + green * 256 + blue) * 0.1 metres. */
  encoding?: string;
  /** The area the tiles cover, when it is smaller than the planet (approach imagery). */
  bounds?: BoxDeg;
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
  /** For a layer drawn from a routing grid: the name of the grid file in site.json's `grid.files`. */
  grid?: string;
  /** For a layer of points or lines: where its GeoJSON file is, relative to the folder that holds layers.json. */
  vector?: { path: string; geometry: 'point' | 'line'; count: number; bytes: number };
  /** Approach imagery only: the site the ring surrounds, and which ring it is. */
  siteId?: string;
  ring?: 'wide' | 'mid' | 'near';
}

export interface LayersFile {
  contractVersion: number;
  /** When the pipeline wrote the file, UTC, ISO 8601. */
  builtUtc: string;
  layers: LayerRecord[];
}

/** A readiness level from docs/SITES.md: its name and what the app offers at that level. */
export interface ReadinessLevel {
  name: string;
  offers: string;
}

/** Where a number came from. Shown to the user beside the number. */
export interface SourceNote {
  what?: string;
  source: string;
  sourceUrl: string;
  why?: string;
  whySourceUrl?: string;
}

/** A landing position quoted exactly as its source prints it. It is text, never used for drawing. */
export interface PublishedLanding {
  asPublished: string;
  source: string;
  sourceUrl: string;
  /** Whether that position falls inside the terrain model we hold. Absent when not checked. */
  insideTerrainFootprint?: boolean;
}

export interface TerrainFootprint {
  westLonDeg: number;
  eastLonDeg: number;
  southLatDeg: number;
  northLatDeg: number;
  widthKm: number;
  heightKm: number;
}

/** One site in sites.json, as the globe shows it. */
export interface SiteEntry {
  id: string;
  name: string;
  place: string;
  mission: string;
  missionYears: string;
  /** Readiness level 1 to 4. */
  level: number;
  /** True when the pipeline has written this site's folder, so the app can open it. */
  built: boolean;
  reviewedByPerson: boolean;
  /** East-positive longitude, -180 to 180. */
  lonEastDeg: number;
  /** Planetocentric latitude. */
  latDeg: number;
  position: SourceNote;
  landing: PublishedLanding | null;
  data: string[];
  problems: string[];
  terrainFootprint?: TerrainFootprint;
}

export interface SitesFile {
  contractVersion: number;
  builtUtc: string;
  convention: string;
  levels: Record<string, ReadinessLevel>;
  sites: SiteEntry[];
}

/** A box in the app's convention: east-positive longitude -180 to 180, planetocentric latitude, degrees. */
export interface BoxDeg {
  westLonDeg: number;
  eastLonDeg: number;
  southLatDeg: number;
  northLatDeg: number;
}

/** One check of our terrain against the rover's own measurements, from validation.json. Numbers are absent when too few stops were usable. */
export interface TerrainCheck {
  what: string;
  stopsInBox: number;
  stopsUsed: number;
  caution?: string;
  firstSol?: number;
  lastSol?: number;
  medianAbsoluteDifferenceM?: number;
  percentile90AbsoluteDifferenceM?: number;
  largestAbsoluteDifferenceM?: number;
  medianDifferenceDeg?: number;
  medianAbsoluteDifferenceDeg?: number;
  percentile90AbsoluteDifferenceDeg?: number;
  largestAbsoluteDifferenceDeg?: number;
  correlation?: number;
  roverTiltLargestDeg?: number;
}

/** A built site's validation.json. A check that was not run is null or absent. */
export interface ValidationFile {
  contractVersion: number;
  builtUtc: string;
  heights?: TerrainCheck | null;
  slope?: TerrainCheck | null;
}

/** One routing grid file: `rows * cols` numbers, north row first, west cell first within a row. */
export interface GridFile {
  name: string;
  /** Relative to the site's folder. */
  path: string;
  numberType: 'float32';
  unit: string;
  /** How a cell with no data is stored. 'NaN' so far. */
  noData: string;
  cellsWithNoData: number;
  bytes: number;
  /** The layer record that gives this grid's source, dates and accuracy. */
  fromLayer: string;
  meaning: string;
}

/** The routing grid definition in site.json, as docs/DATA_CONTRACT.md "Grid definition". */
export interface GridDefinition {
  rows: number;
  cols: number;
  /** Outer corner of the first cell. */
  northWestCorner: { lonEastDeg: number; latDeg: number };
  cellLonDeg: number;
  cellLatDeg: number;
  /** A cell's size on the ground, metres. East to west is narrower. */
  cellNorthSouthM: number;
  cellEastWestM: number;
  cellEastWestMeasuredAtLatDeg: number;
  rowOrder: string;
  byteOrder: 'little-endian';
  sourceCellsPerCell: number;
  /** The span each slope was measured over, metres. */
  slopeBaselineM: { northSouthM: number; eastWestM: number };
  files: GridFile[];
}

/** Home or a science target of a site's hero scenario, placed at a rover stop (pipeline/scenario.py). */
export interface ScenarioPlace {
  /** Targets only. */
  id?: string;
  name: string;
  /** The rover stop it stands at, and the sol that stop was first logged. */
  stop: string;
  firstSol: number;
  lonEastDeg: number;
  latDeg: number;
  /** Terrain height there, metres relative to the areoid. */
  heightM: number;
  why: string;
  whySourceUrl: string;
  positionSource: string;
  /** True when the place is a choice made for the scenario, not a fact. */
  assumed: boolean;
}

/** A built site's own file, site.json. */
export interface SiteFile {
  contractVersion: number;
  builtUtc: string;
  id: string;
  name: string;
  place: string;
  mission: string;
  level: number;
  reviewedByPerson: boolean;
  convention: string;
  box: BoxDeg;
  boxSizeKm: { eastWest: number; northSouth: number };
  centre: { lonEastDeg: number; latDeg: number };
  /** Heights in the box, metres relative to the areoid. */
  terrainHeightM: { lowest: number; highest: number; atCentre: number };
  /** The routing grids, when the site has them. */
  grid?: GridDefinition;
  /** The hero scenario, when the site config has one: where home is, and the science targets. */
  home?: ScenarioPlace;
  targets?: ScenarioPlace[];
  /** Which source each input was read from when the site was built, in words. */
  readFrom: Record<string, string>;
  files: { path: string; files: number; bytes: number }[];
  totalBytes: number;
}
