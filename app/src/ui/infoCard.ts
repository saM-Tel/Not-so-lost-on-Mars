// WHAT:    Information card for a layer: mission, instrument, dates, detail, accuracy, grade and caveats (F2).
//          Still to add: cards for predictions.
// IN:      A layer record.
// OUT:     A card element that folds open.
// USED BY: src/ui/layerPanel.ts.
// RULES:   Uses the fixed words in docs/CONFIDENCE.md section 4. Shows the acquisition date, not the download date.
//          A value the pipeline could not find is shown as "not found", never left out or guessed.
// TRAPS:   PITFALLS 2.
// OWNER:   Role B.

import { NOT_APPLICABLE, type Grade, type LayerRecord } from '../data/contract';

/** What each confidence grade means, from docs/CONFIDENCE.md section 2. */
export const GRADE_MEANING: Record<Grade, string> = {
  A: 'measured at this place by an instrument on the ground',
  B: 'measured at this place from orbit',
  C: 'measured somewhere else, or modelled, and applied here',
  D: 'an assumption or engineering judgement',
};

function row(list: HTMLElement, term: string, value: string): void {
  if (value === NOT_APPLICABLE) return;
  const dt = document.createElement('dt');
  dt.textContent = term;
  const dd = document.createElement('dd');
  dd.textContent = value;
  list.append(dt, dd);
}

/** The card for one layer, folded shut until the person opens it. */
export function infoCard(record: LayerRecord): HTMLElement {
  const card = document.createElement('details');
  card.className = 'info-card';
  const summary = document.createElement('summary');
  const fromYear = record.acquiredFrom.slice(0, 4);
  const toYear = record.acquiredTo.slice(0, 4);
  summary.textContent = `About this layer: ${record.mission}, ${fromYear === toYear ? fromYear : `${fromYear} to ${toYear}`}`;
  const list = document.createElement('dl');
  row(list, 'Measured by', `${record.mission}, ${record.instrument} (${record.agency})`);
  row(list, 'Measured', `${record.acquiredFrom} to ${record.acquiredTo}`);
  row(list, 'Published', record.published);
  row(list, 'Cell size', record.gridSpacing);
  row(list, 'Real detail', record.realDetail);
  row(list, 'Position accuracy', record.positionAccuracy);
  row(list, 'Height accuracy', record.heightAccuracy);
  row(list, 'What we did to it', record.processing);
  row(list, 'Confidence', `Grade ${record.grade}: ${GRADE_MEANING[record.grade]}`);
  card.append(summary, list);

  const title = document.createElement('p');
  title.className = 'info-card__heading';
  title.textContent = 'Do not conclude from it';
  const caveats = document.createElement('ul');
  for (const caveat of record.caveats) {
    const item = document.createElement('li');
    item.textContent = caveat;
    caveats.append(item);
  }
  const credit = document.createElement('p');
  credit.textContent = `Credit: ${record.credit}. Product: ${record.productId}.`;
  card.append(title, caveats, credit);
  if (/^https?:\/\//.test(record.sourceUrl)) {
    const link = document.createElement('a');
    link.className = 'source';
    link.href = record.sourceUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Source';
    card.append(link);
  }
  return card;
}
