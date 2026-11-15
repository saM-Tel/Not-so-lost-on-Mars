// WHAT:    The tether: the boundary where the walk home takes as long as is allowed (F4).
// IN:      Time-to-home for every grid cell, for the cautious and expected cases; the longest walk home allowed.
// OUT:     A picture of the boundary, one pixel per grid cell; how far from home, in time, a route gets; the margin at
//          every point of a walk at the moment the walker is there.
// USED BY: src/map/routeLayer.ts, src/ui/routePanel.ts.
// RULES:   Protection uses the cautious case. The boundary shrinks as elapsed time rises. The expected-case line is
//          drawn lighter, outside the cautious one.
// TRAPS:   PITFALLS 6, 7.
// OWNER:   Role B.

import type { GridDefinition } from '../data/contract';
import type { LonLat } from '../mars/geometry';

/** Whether this machine stores the low byte of a 32-bit number first. Nearly all do. */
const LITTLE_ENDIAN = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;

/** A colour as one 32-bit number that lands in memory as red, green, blue, opacity, each 0 to 255. */
function packed(red: number, green: number, blue: number, opacity: number): number {
  return (LITTLE_ENDIAN
    ? (opacity << 24) | (blue << 16) | (green << 8) | red
    : (red << 24) | (green << 16) | (blue << 8) | opacity) >>> 0;
}

/** None of these is red: red means danger only. */
const OUTSIDE = packed(8, 9, 14, 120);             // ground beyond the cautious tether is dimmed
const CAUTIOUS_LINE = packed(255, 255, 255, 255);
const EXPECTED_LINE = packed(255, 255, 255, 120);

/**
 * Cells on the edge of "can get home in time": inside, with a neighbour that can be walked home from but
 * not in time. A neighbour with no way home at all (keep-out ground) does not make an edge, so the line
 * follows the time limit and does not outline every steep patch.
 */
function edgeCells(timeHomeS: Float32Array, allowedS: number, rows: number, cols: number): Uint8Array {
  const edge = new Uint8Array(rows * cols);
  // "Too far" for a neighbour: over the limit, yet with a way home. Infinity and NaN both fail this.
  const tooFar = (t: number): boolean => t > allowedS && t !== Infinity;
  for (let row = 0; row < rows; row++) {
    const top = row > 0;
    const bottom = row < rows - 1;
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col;
      if (!(timeHomeS[i]! <= allowedS)) continue;
      // The four neighbours written out: this runs for every cell on every slider step (review item R17).
      if ((top && tooFar(timeHomeS[i - cols]!)) || (bottom && tooFar(timeHomeS[i + cols]!))
        || (col > 0 && tooFar(timeHomeS[i - 1]!)) || (col < cols - 1 && tooFar(timeHomeS[i + 1]!))) edge[i] = 1;
    }
  }
  return edge;
}

/**
 * The tether as a picture, four bytes per grid cell, north row first: ground beyond the cautious boundary dimmed,
 * the cautious boundary as a strong line three cells wide, and the expected-case boundary as a fainter line one cell wide.
 */
export function tetherPicture(
  cautiousS: Float32Array, expectedS: Float32Array, allowedS: number, rows: number, cols: number,
): Uint8ClampedArray {
  const picture = new Uint8ClampedArray(rows * cols * 4);
  // One 32-bit write for each cell, in place of four byte writes and a small array.
  const cells = new Uint32Array(picture.buffer);
  for (let i = 0; i < rows * cols; i++) if (!(cautiousS[i]! <= allowedS)) cells[i] = OUTSIDE;
  const expectedEdge = edgeCells(expectedS, allowedS, rows, cols);
  for (let i = 0; i < expectedEdge.length; i++) if (expectedEdge[i]) cells[i] = EXPECTED_LINE;
  const cautiousEdge = edgeCells(cautiousS, allowedS, rows, cols);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!cautiousEdge[row * cols + col]) continue;
      for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) cells[r * cols + c] = CAUTIOUS_LINE;
      }
    }
  }
  return picture;
}

/** The grid cell that holds a position, or -1 outside the grid. */
function cellOf(definition: GridDefinition, position: LonLat): number {
  const col = Math.floor((position[0] - definition.northWestCorner.lonEastDeg) / definition.cellLonDeg);
  const row = Math.floor((definition.northWestCorner.latDeg - position[1]) / definition.cellLatDeg);
  if (row < 0 || col < 0 || row >= definition.rows || col >= definition.cols) return -1;
  return row * definition.cols + col;
}

/** The longest time-to-home found along a line, seconds. Infinity if any point has no way home. */
export function farthestFromHomeS(timeHomeS: Float32Array, definition: GridDefinition, line: readonly LonLat[]): number {
  let worst = 0;
  for (const position of line) {
    const cell = cellOf(definition, position);
    worst = Math.max(worst, cell < 0 ? Infinity : timeHomeS[cell]!);
  }
  return worst;
}

/**
 * How far from home, in cautious walking time, the planned walk gets: seconds. It is the largest of the quickest
 * time home from any point on the way out, the same along the way back, and the time the planned way back itself
 * takes. The planned way back is the least-effort route, which can be slower than the quickest one, and it is the
 * one the walker will follow, so the tether must hold for it too (review item R3).
 */
export function walkFarthestFromHomeS(
  timeHomeS: Float32Array, definition: GridDefinition, outLine: readonly LonLat[], backLine: readonly LonLat[], plannedBackS: number,
): number {
  return Math.max(farthestFromHomeS(timeHomeS, definition, outLine), farthestFromHomeS(timeHomeS, definition, backLine), plannedBackS);
}

/**
 * The tether checked at every point of a walk against the moment the walker is there (F3, F4): at each point, the
 * longest walk home allowed by then minus the cautious walk home from there. Infinity in the field (no way home) gives
 * a margin of minus Infinity. Returns every margin, the walk home used at each point, and the index of the tightest.
 *
 * From `backFromIndex` on (the far end and the way back), the walk home is the planned way back from that point when
 * it is slower than the quickest way: that is the way the walker will follow (review item R3). This one rule drives
 * both the card's verdict and the margin chart, so they cannot disagree (review item S5).
 */
export function marginsAlongWalk(
  timeHomeS: Float32Array, definition: GridDefinition, points: readonly LonLat[], timesS: readonly number[],
  allowedAt: (elapsedS: number) => number, startElapsedS: number, backFromIndex = points.length,
): { marginsS: number[]; homeS: number[]; tightestIndex: number } {
  const endS = timesS[timesS.length - 1] ?? 0;
  const homeS = points.map((point, i) => {
    const cell = cellOf(definition, point);
    const quickest = cell < 0 ? Infinity : timeHomeS[cell]!;
    return i >= backFromIndex ? Math.max(quickest, endS - timesS[i]!) : quickest;
  });
  const marginsS = homeS.map((home, i) => allowedAt(startElapsedS + timesS[i]!) - home);
  let tightestIndex = 0;
  marginsS.forEach((m, i) => { if (m < marginsS[tightestIndex]!) tightestIndex = i; });
  return { marginsS, homeS, tightestIndex };
}
