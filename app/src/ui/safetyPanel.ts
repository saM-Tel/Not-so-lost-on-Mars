// WHAT:    The tether's controls and verdict: the walk-back limit, time since leaving home, and whether the planned walk
//          stays inside the tether (F4). Still to add: suit settings, dose and storm advice (F5, F10).
// IN:      The person's choices; a verdict from src/ui/routePanel.ts.
// OUT:     Page elements, and the tether settings they stand for.
// USED BY: src/ui/routePanel.ts.
// RULES:   Shows cautious values for anything that protects the crew.
// TRAPS:   PITFALLS 7, 8, 11.
// OWNER:   Role B.

import {
  allowedTimeHomeS, DEFAULT_WALK_BACK_LIMIT_S, timeLeftS, WALK_BACK_LIMITS_S, WALK_DURATION_S, type TetherSettings,
} from '../safety/budget';
import { formatDuration } from './format';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Slope limits offered in the suit settings, degrees. 20 is NASA's Artemis III figure and the default. */
const SLOPE_LIMITS_DEG = [
  { deg: 15, label: '15° (more careful; your choice)' },
  { deg: 20, label: '20° (NASA Artemis III figure; default)' },
  { deg: 25, label: '25° (beyond the NASA figure; your choice)' },
] as const;

/**
 * Suit settings (F4): the steepest ground the person will walk on. Changing it redraws keep-out ground, the
 * tether and the walk. The walking speeds and suit masses of the three cases are listed with their sources.
 */
export function createSuitSettings(onChange: (slopeLimitDeg: number) => void): { element: HTMLElement } {
  const box = el('section', 'suit');
  box.append(el('h3', undefined, 'Suit settings'));
  const select = el('select');
  select.id = 'suit-slope-limit';
  for (const option of SLOPE_LIMITS_DEG) {
    const item = el('option', undefined, option.label);
    item.value = String(option.deg);
    item.selected = option.deg === 20;
    select.append(item);
  }
  const label = el('label', undefined, 'Steepest ground to walk on ');
  label.htmlFor = select.id;
  const row = el('p', 'tether__row');
  row.append(label, select);
  select.addEventListener('change', () => onChange(Number(select.value)));
  box.append(row, el('p', 'route-card__note',
    'A limit other than 20 degrees is your own choice, not a sourced figure. Changing it works out the ways from home again, about a second.'));
  return { element: box };
}

export interface TetherControls {
  element: HTMLElement;
  settings(): TetherSettings;
  /** Put the controls at given settings, as when a shared link is opened. A limit that is not offered is ignored. */
  set(settings: Partial<TetherSettings>): void;
  /** Say whether the planned walk stays inside the tether, or clear the line with null. */
  showVerdict(verdict: { inside: boolean; text: string } | null): void;
}

/** Build the tether's controls. `onChange` is called whenever the person changes a setting. */
export function createTetherControls(onChange: () => void): TetherControls {
  const box = el('section', 'tether');
  box.append(
    el('h3', undefined, 'Tether'),
    el('p', 'route-card__note',
      'White line: how far you can go and still walk home in time, cautious case. Fainter line: expected case. Ground outside is dimmed.'),
  );

  const limit = el('select');
  limit.id = 'tether-limit';
  for (const seconds of [...WALK_BACK_LIMITS_S].sort((a, b) => b - a)) {
    const option = el('option', undefined, formatDuration(seconds));
    option.value = String(seconds);
    option.selected = seconds === DEFAULT_WALK_BACK_LIMIT_S;
    limit.append(option);
  }
  const limitLabel = el('label', undefined, 'Longest walk home allowed ');
  limitLabel.htmlFor = limit.id;

  const elapsed = el('input');
  elapsed.id = 'tether-elapsed';
  elapsed.type = 'range';
  elapsed.min = '0';
  elapsed.max = String(WALK_DURATION_S);
  elapsed.step = String(5 * 60);
  elapsed.value = '0';
  const elapsedLabel = el('label', undefined, 'Time since leaving home');
  elapsedLabel.htmlFor = elapsed.id;

  const state = el('p', 'tether__state');
  const verdict = el('p', 'tether__verdict');
  verdict.setAttribute('role', 'status');
  verdict.hidden = true;

  const settings = (): TetherSettings => ({ walkBackLimitS: Number(limit.value), elapsedS: Number(elapsed.value) });
  const describe = (): void => {
    const now = settings();
    const left = timeLeftS(now.elapsedS);
    const allowed = allowedTimeHomeS(now);
    state.textContent =
      `${formatDuration(now.elapsedS)} gone, ${formatDuration(left)} left of the ${WALK_DURATION_S / 3600}-hour walk. ` +
      (allowed > 0 ? `Stay within ${formatDuration(allowed)} of home.` : 'The walk is over: you should be home.');
  };
  const changed = (): void => { describe(); onChange(); };
  limit.addEventListener('change', changed);
  elapsed.addEventListener('input', changed);
  describe();

  const row1 = el('p', 'tether__row');
  row1.append(limitLabel, limit);
  const row2 = el('p', 'tether__row');
  row2.append(elapsedLabel, elapsed);
  const basis = el('details', 'route-card__basis');
  basis.append(
    el('summary', undefined, 'What the tether rests on'),
    el('p', undefined,
      'Modelled. The 8-hour walk and the 30-minute and 1-hour walk-back limits are NASA planning figures for Mars suits that do not exist yet (Ogilvie and others 2026). Time home is the quickest walkable way in the cautious case (grade C). No separate reserve is taken off.'),
  );
  box.append(row1, row2, state, verdict, basis);

  return {
    element: box,
    settings,
    set(wanted) {
      if (wanted.walkBackLimitS !== undefined && (WALK_BACK_LIMITS_S as readonly number[]).includes(wanted.walkBackLimitS)) {
        limit.value = String(wanted.walkBackLimitS);
      }
      if (wanted.elapsedS !== undefined) elapsed.value = String(Math.min(WALK_DURATION_S, Math.max(0, wanted.elapsedS)));
      describe();
    },
    showVerdict(result) {
      verdict.hidden = result === null;
      if (!result) return;
      verdict.textContent = result.text;
      verdict.className = result.inside ? 'tether__verdict' : 'tether__verdict tether__verdict--outside';
      verdict.setAttribute('role', result.inside ? 'status' : 'alert');
    },
  };
}
