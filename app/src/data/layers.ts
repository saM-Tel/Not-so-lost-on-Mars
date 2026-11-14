// WHAT:    Loads a layers.json file and checks that each layer's record is complete (F2, F14).
// IN:      The address of a layers.json written by the pipeline.
// OUT:     The layers whose records are complete, and the reasons any others were left out.
// USED BY: src/main.ts, src/data/loadSite.ts.
// RULES:   A layer with an incomplete record is never returned as usable. The check matches pipeline/records.py.
// TRAPS:   PITFALLS 2, 10.
// OWNER:   Role B.

import { NOT_APPLICABLE, NOT_FOUND, type LayerRecord, type LayersFile } from './contract';

const ALL_FIELDS = [
  'id', 'title', 'dataType', 'mission', 'instrument', 'agency', 'productId', 'sourceUrl', 'doi',
  'acquiredFrom', 'acquiredTo', 'published', 'gridSpacing', 'realDetail', 'positionAccuracy',
  'heightAccuracy', 'processing', 'grade', 'caveats', 'credit',
] as const;

/** The information card needs every one of these, so a layer without them does not appear. */
const MUST_BE_KNOWN = [
  'id', 'title', 'dataType', 'mission', 'instrument', 'agency', 'productId', 'sourceUrl',
  'acquiredFrom', 'acquiredTo', 'gridSpacing', 'realDetail', 'processing', 'grade', 'caveats', 'credit',
] as const;

/** Every reason this record may not be shown. An empty list means it is complete. */
export function layerRecordProblems(record: Partial<LayerRecord>): string[] {
  const problems: string[] = [];
  for (const field of ALL_FIELDS) {
    const value = record[field];
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
      problems.push(`'${field}' is missing`);
    }
  }
  for (const field of MUST_BE_KNOWN) {
    const value = record[field];
    if (value === NOT_FOUND || value === NOT_APPLICABLE) problems.push(`'${field}' must be known`);
  }
  if (record.grade !== undefined && !['A', 'B', 'C', 'D'].includes(record.grade)) {
    problems.push(`grade '${record.grade}' is not A, B, C or D`);
  }
  if (record.caveats !== undefined && !Array.isArray(record.caveats)) problems.push(`'caveats' must be a list`);
  return problems;
}

export interface LoadedLayers {
  file: LayersFile;
  /** Layers that may be shown. */
  usable: LayerRecord[];
  /** Layers left out, each with its reasons, so the app can say why. */
  rejected: { id: string; problems: string[] }[];
}

/** Fetch and check a layers.json. Throws with a plain message if the file cannot be read. */
export async function loadLayers(url: string): Promise<LoadedLayers> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url} (status ${response.status}).`);
  const file = (await response.json()) as LayersFile;
  if (!Array.isArray(file.layers)) throw new Error(`${url} has no list of layers.`);
  const usable: LayerRecord[] = [];
  const rejected: LoadedLayers['rejected'] = [];
  for (const record of file.layers) {
    const problems = layerRecordProblems(record);
    if (problems.length === 0) usable.push(record);
    else rejected.push({ id: String(record.id ?? 'unnamed layer'), problems });
  }
  return { file, usable, rejected };
}
