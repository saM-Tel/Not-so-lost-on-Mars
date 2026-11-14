// WHAT:    The tether: the boundary where the walk home takes as long as is allowed (F4).
// IN:      Time-to-home for every grid cell, for the cautious and expected cases; the longest walk home allowed.
// OUT:     A picture of the boundary, one pixel per grid cell; how far from home, in time, a route gets.
// USED BY: src/map/routeLayer.ts, src/ui/routePanel.ts.
// RULES:   Protection uses the cautious case. The boundary shrinks as elapsed time rises. The expected-case line is
//          drawn lighter, outside the cautious one.
// TRAPS:   PITFALLS 6, 7.
// OWNER:   Role B.

import type { GridDefinition } from '../data/contract';
import type { LonLat } from '../mars/geometry';

/** Colours as red, green, blue, opacity, each 0 to 255. None is red: red means danger only. */
const OUTSIDE = [8, 9, 14, 120] as const;          // ground beyond the cautious tether is dimmed
const CAUTIOUS_LINE = [255, 255, 255, 255] as const;
const EXPECTED_LINE = [255, 255, 255, 120] as const;

/**
 * Cells on the edge of "can get home in time": inside, with a neighbour that can be walked home from but
 * not in time. A neighbour with no way home at all (keep-out ground) does not make an edge, so the line
 * follows the time limit and does not outline every steep patch.
 */
function edgeCells(timeHomeS: Float32Array, allowedS: number, rows: number, cols: number): Uint8Array {
  const edge = new Uint8Array(rows * cols);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col;
      if (!(timeHomeS[i]! <= allowedS)) continue;
      for (const [dRow, dCol] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
        const r = row + dRow;
        const c = col + dCol;
        if (r < 0 || c < 0 || r >= rows || c >= cols) continue;
        const other = timeHomeS[r * cols + c]!;
        if (Number.isFinite(other) && other > allowedS) { edge[i] = 1; break; }
      }
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
  const paint = (i: number, colour: readonly number[]): void => { picture.set(colour, i * 4); };
  for (let i = 0; i < rows * cols; i++) if (!(cautiousS[i]! <= allowedS)) paint(i, OUTSIDE);
  const expectedEdge = edgeCells(expectedS, allowedS, rows, cols);
  for (let i = 0; i < expectedEdge.length; i++) if (expectedEdge[i]) paint(i, EXPECTED_LINE);
  const cautiousEdge = edgeCells(cautiousS, allowedS, rows, cols);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!cautiousEdge[row * cols + col]) continue;
      for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) paint(r * cols + c, CAUTIOUS_LINE);
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
