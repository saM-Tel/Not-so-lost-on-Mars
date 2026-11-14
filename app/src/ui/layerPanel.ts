// WHAT:    Layer panel: one row per layer with a switch, opacity control, legend and information card (F2).
// IN:      Overlays from src/map/overlays.ts and src/ui/routePanel.ts; layers left out because their record is incomplete.
// OUT:     Page elements inside the element given. Returns functions to add a layer later and to clear the panel.
// USED BY: src/main.ts.
// RULES:   No row for a layer whose record is incomplete; such layers are named with the reason instead.
// TRAPS:   PITFALLS 11.
// OWNER:   Role B.

import { legendElement } from '../map/legend';
import type { Overlay } from '../map/overlays';
import { infoCard } from './infoCard';

export interface LayerPanel {
  add(overlay: Overlay): void;
  remove(): void;
}

function layerRow(overlay: Overlay): HTMLElement {
  const row = document.createElement('li');
  row.className = 'layer-row';
  const id = `layer-${overlay.record.id}`;

  const head = document.createElement('div');
  head.className = 'layer-row__head';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.id = id;
  box.checked = overlay.visible;
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = overlay.record.title;
  const grade = document.createElement('span');
  grade.className = 'layer-row__grade';
  grade.textContent = `Grade ${overlay.record.grade}`;
  head.append(box, label, grade);

  const fade = document.createElement('input');
  fade.type = 'range';
  fade.min = '0';
  fade.max = '100';
  fade.step = '5';
  fade.value = String(Math.round(overlay.opacity * 100));
  fade.setAttribute('aria-label', `Opacity of ${overlay.record.title}`);
  fade.disabled = !overlay.visible;

  box.addEventListener('change', () => {
    overlay.setVisible(box.checked);
    fade.disabled = !box.checked;
  });
  fade.addEventListener('input', () => overlay.setOpacity(Number(fade.value) / 100));

  row.append(head, fade);
  if (overlay.legend) row.append(legendElement(overlay.legend));
  row.append(infoCard(overlay.record));
  return row;
}

/** Build the panel inside `parent`. `leftOut` names layers that are not shown and says why. */
export function createLayerPanel(parent: HTMLElement, overlays: Overlay[], leftOut: { id: string; problems: string[] }[]): LayerPanel {
  const section = document.createElement('section');
  section.className = 'layer-panel';
  const title = document.createElement('h3');
  title.textContent = 'Layers';
  const list = document.createElement('ul');
  list.className = 'layer-panel__list';
  for (const overlay of overlays) list.append(layerRow(overlay));
  section.append(title, list);
  if (leftOut.length > 0) {
    const note = document.createElement('p');
    note.className = 'left-out';
    note.textContent = `Not shown, because the record is incomplete: ${leftOut.map((l) => `${l.id} (${l.problems.join(', ')})`).join('; ')}`;
    section.append(note);
  }
  const missing = document.createElement('p');
  missing.className = 'panel__line';
  missing.textContent = 'Geology is not built for this site yet.';
  section.append(missing);
  parent.append(section);
  return {
    add(overlay) { list.append(layerRow(overlay)); },
    remove() { section.remove(); },
  };
}
