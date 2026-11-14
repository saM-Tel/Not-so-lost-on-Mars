// WHAT:    The routing grid: indexing, neighbours, and step lengths from the corrected cell spacing (F3, F4).
// IN:      The grid definition from site.json and the grid files as typed arrays.
// OUT:     Cell lookups by position, cell centres, and the eight steps a walker can take from a cell.
// USED BY: src/route/search.ts, src/route/stats.ts, src/route/worker.ts, src/data/loadSite.ts.
// RULES:   Layout exactly as docs/DATA_CONTRACT.md "Grid definition". Cells are narrower east to west than north to south.
// TRAPS:   PITFALLS 4, 6.
// OWNER:   Role B.

import type { GridDefinition } from '../data/contract';
import type { LonLat } from '../mars/geometry';

export interface RoutingGrid {
  rows: number;
  cols: number;
  /** Outer corner of the first cell. */
  westLonDeg: number;
  northLatDeg: number;
  cellLonDeg: number;
  cellLatDeg: number;
  cellNorthSouthM: number;
  cellEastWestM: number;
  /** Mean height of each cell, metres relative to the areoid; NaN where there is no data. North row first. */
  heightM: Float32Array;
  /** Steepest slope found in each cell, degrees; NaN where there is no data. */
  slopeMaxDeg: Float32Array;
}

/** Put a grid together from its definition and its two files. Throws if a file is not the size the definition says. */
export function makeGrid(definition: GridDefinition, heightM: Float32Array, slopeMaxDeg: Float32Array): RoutingGrid {
  const cells = definition.rows * definition.cols;
  if (heightM.length !== cells || slopeMaxDeg.length !== cells) {
    throw new Error(`A routing grid file does not match its definition: expected ${cells} cells, got ${heightM.length} and ${slopeMaxDeg.length}.`);
  }
  return {
    rows: definition.rows,
    cols: definition.cols,
    westLonDeg: definition.northWestCorner.lonEastDeg,
    northLatDeg: definition.northWestCorner.latDeg,
    cellLonDeg: definition.cellLonDeg,
    cellLatDeg: definition.cellLatDeg,
    cellNorthSouthM: definition.cellNorthSouthM,
    cellEastWestM: definition.cellEastWestM,
    heightM,
    slopeMaxDeg,
  };
}

/** Index of the cell that holds a position, or -1 if it is outside the grid. */
export function cellAt(grid: RoutingGrid, position: LonLat): number {
  const col = Math.floor((position[0] - grid.westLonDeg) / grid.cellLonDeg);
  const row = Math.floor((grid.northLatDeg - position[1]) / grid.cellLatDeg);
  if (row < 0 || col < 0 || row >= grid.rows || col >= grid.cols) return -1;
  return row * grid.cols + col;
}

/** Centre of a cell. */
export function cellCentre(grid: RoutingGrid, index: number): LonLat {
  const row = Math.floor(index / grid.cols);
  const col = index - row * grid.cols;
  return [grid.westLonDeg + (col + 0.5) * grid.cellLonDeg, grid.northLatDeg - (row + 0.5) * grid.cellLatDeg];
}

/** One of the eight steps from a cell to a neighbour. */
export interface Step {
  dRow: number;
  dCol: number;
  /** Length on the map, metres, from the corrected cell spacing. */
  lengthM: number;
}

/** The eight steps, with their true lengths: north-south, east-west and diagonal all differ. */
export function steps(grid: RoutingGrid): Step[] {
  const ns = grid.cellNorthSouthM;
  const ew = grid.cellEastWestM;
  const diagonal = Math.hypot(ns, ew);
  return [
    { dRow: -1, dCol: 0, lengthM: ns }, { dRow: 1, dCol: 0, lengthM: ns },
    { dRow: 0, dCol: -1, lengthM: ew }, { dRow: 0, dCol: 1, lengthM: ew },
    { dRow: -1, dCol: -1, lengthM: diagonal }, { dRow: -1, dCol: 1, lengthM: diagonal },
    { dRow: 1, dCol: -1, lengthM: diagonal }, { dRow: 1, dCol: 1, lengthM: diagonal },
  ];
}
