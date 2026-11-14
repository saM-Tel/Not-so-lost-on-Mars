// WHAT:    Switches between the habitat planner, the field tablet and the helmet display (F13). The tablet is the map with
//          one large status card and three large buttons; the helmet is a concept view drawn over a real rover photograph.
// IN:      The field state worked out by src/ui/routePanel.ts for the planned walk; the person's choice of mode.
// OUT:     A mode switch, the tablet card and the helmet view; body classes that hide the planner's panels.
// USED BY: src/ui/routePanel.ts.
// RULES:   Tablet and helmet show cautious values only. The helmet display is labelled as a concept. Touch targets on the
//          tablet are large enough for gloves (at least 64 px). Red only for danger.
// TRAPS:   PITFALLS 7, 11.
// OWNER:   Role B.

import { formatDistance, formatDuration } from './format';

export type Mode = 'planner' | 'tablet' | 'helmet';

/** Everything the field displays show. All times are the cautious case. */
export interface FieldState {
  targetName: string;
  /** Length of the way out, metres, and the compass bearing from home to the target, degrees from north. */
  distanceM: number;
  bearingDeg: number;
  /** Walk home from the target, cautious case, seconds. */
  homeFromTargetS: number;
  /** How much more time-from-home the tether allows at the target, seconds; negative when the walk leaves it. */
  tetherMarginS: number;
  /** The longest walk home the tether allows at the target, seconds: the full length of the margin bar. */
  tetherAllowedS: number;
  /** How long you can stay at the target before you must start back, seconds; 0 or less means turn back now. */
  stayAtTargetS: number;
  /** One line of alert, or null when all is well. */
  alert: string | null;
  /** A real rover photo taken near the target, for the helmet view. */
  photo: { url: string; caption: string } | null;
}

export interface ModeSwitch {
  /** Show a planned walk, or with null that there is none. `message` says why there is none, when a target was refused. */
  setState(state: FieldState | null, message?: string | null): void;
  remove(): void;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function createModeSwitch(actions: {
  onNextTarget(): void; onGoHome(): void; onStorm(): void;
  /** Called after the layout changes, so the map can take its new size. */
  onLayoutChange?(): void;
}): ModeSwitch {
  let mode: Mode = 'planner';
  let state: FieldState | null = null;
  /** Why there is no walk to show, when the last target was refused. */
  let noWalkMessage: string | null = null;
  /** The helmet view is offered only once a real rover photo near the target has loaded: it has nothing else to show. */
  let helmetReady = false;

  // ---- The switch ----
  const bar = el('nav', 'mode-switch');
  bar.setAttribute('aria-label', 'Display');
  const buttons = new Map<Mode, HTMLButtonElement>();
  for (const [id, label] of [['planner', 'Planner'], ['tablet', 'Field tablet'], ['helmet', 'Helmet (concept)']] as const) {
    const button = el('button', 'mode-switch__button', label);
    button.type = 'button';
    button.addEventListener('click', () => setMode(id));
    buttons.set(id, button);
    bar.append(button);
  }

  // ---- Field tablet: one status card and three big buttons ----
  const tablet = el('section', 'field-card');
  tablet.setAttribute('aria-label', 'Field tablet');
  const tabletStatus = el('div', 'field-card__status');
  tabletStatus.setAttribute('role', 'status');
  const tabletButtons = el('div', 'field-card__buttons');
  for (const [label, action, danger] of [
    ['Next target', actions.onNextTarget, false], ['Go home', actions.onGoHome, false], ['Storm', actions.onStorm, true],
  ] as const) {
    const button = el('button', danger ? 'field-card__button field-card__button--storm' : 'field-card__button', label);
    button.type = 'button';
    button.addEventListener('click', () => { action(); });
    tabletButtons.append(button);
  }
  tablet.append(tabletStatus, tabletButtons, el('p', 'field-card__note', 'Cautious values only.'));

  // ---- Helmet: a concept view over a real rover photograph ----
  const helmet = el('section', 'helmet');
  helmet.setAttribute('aria-label', 'Helmet display, concept');
  const photo = el('img', 'helmet__photo');
  photo.alt = '';
  photo.referrerPolicy = 'no-referrer';
  photo.addEventListener('load', () => { helmetReady = true; render(); });
  photo.addEventListener('error', () => {
    helmetReady = false;
    if (mode === 'helmet') mode = 'planner';
    render();
  });
  const arrow = el('div', 'helmet__arrow', '↑');
  arrow.setAttribute('aria-hidden', 'true');
  const readout = el('div', 'helmet__readout');
  const marginBar = el('div', 'helmet__bar');
  const marginFill = el('div', 'helmet__bar-fill');
  marginBar.append(marginFill);
  const alertLine = el('p', 'helmet__alert');
  alertLine.setAttribute('role', 'alert');
  const concept = el('p', 'helmet__concept', 'Concept view: what the same numbers could look like inside a helmet. Not a real display.');
  const credit = el('p', 'helmet__credit');
  helmet.append(photo, arrow, readout, marginBar, alertLine, concept, credit);

  document.body.append(bar, tablet, helmet);

  const render = (): void => {
    if (mode === 'helmet' && !helmetReady) mode = 'planner';
    buttons.get('helmet')!.hidden = !helmetReady;
    for (const [id, button] of buttons) button.setAttribute('aria-pressed', String(id === mode));
    document.body.classList.toggle('mode-tablet', mode === 'tablet');
    document.body.classList.toggle('mode-helmet', mode === 'helmet');
    tablet.hidden = mode !== 'tablet';
    helmet.hidden = mode !== 'helmet';
    if (!state) {
      tabletStatus.replaceChildren(
        el('p', 'field-card__big', noWalkMessage ? 'No walk to this point' : 'Working out the walk…'),
        ...(noWalkMessage ? [el('p', 'field-card__row', noWalkMessage)] : []),
        el('p', 'field-card__row', 'Press Next target, or choose one in the planner.'));
      readout.textContent = noWalkMessage ?? 'No walk planned.';
      alertLine.textContent = '';
      return;
    }
    const s = state;
    const stay = s.stayAtTargetS > 0 ? formatDuration(s.stayAtTargetS) : 'none: turn back now';
    tabletStatus.replaceChildren(
      el('p', 'field-card__label', s.targetName),
      el('p', 'field-card__big', `${formatDistance(s.distanceM)} at ${s.bearingDeg.toFixed(0)}°`),
      el('p', 'field-card__row', `Walk home from there: ${formatDuration(s.homeFromTargetS)}`),
      el('p', s.tetherMarginS >= 0 ? 'field-card__row' : 'field-card__row field-card__row--danger',
        s.tetherMarginS >= 0 ? `Tether margin: ${formatDuration(s.tetherMarginS)}` : `Outside the tether by ${formatDuration(-s.tetherMarginS)}`),
      el('p', 'field-card__row', `Time at the target before turning back: ${stay}`),
      ...(s.alert ? [el('p', 'field-card__row field-card__row--danger', s.alert)] : []),
    );
    arrow.style.transform = `rotate(${s.bearingDeg}deg)`;
    readout.textContent = `${s.targetName}  ·  ${formatDistance(s.distanceM)}  ·  bearing ${s.bearingDeg.toFixed(0)}°  ·  turn back in ${stay}`;
    const share = s.tetherAllowedS > 0 ? Math.max(0, Math.min(1, s.tetherMarginS / s.tetherAllowedS)) : 0;
    marginFill.style.width = `${(share * 100).toFixed(0)}%`;
    marginFill.classList.toggle('helmet__bar-fill--danger', s.tetherMarginS < 0);
    marginBar.title = `Tether margin ${formatDuration(Math.max(0, s.tetherMarginS))}`;
    alertLine.textContent = s.alert ?? '';
    if (s.photo) {
      // Loaded even while another view is shown, so the helmet option can appear as soon as the photo is ready.
      if (photo.getAttribute('src') !== s.photo.url) { helmetReady = false; photo.src = s.photo.url; }
      credit.textContent = s.photo.caption;
    } else if (photo.getAttribute('src')) {
      photo.removeAttribute('src');
      helmetReady = false;
      if (mode === 'helmet') { mode = 'planner'; render(); return; }
      buttons.get('helmet')!.hidden = true;
    }
  };

  const setMode = (next: Mode): void => {
    mode = next;
    render();
    // The map's box changes size when panels are hidden; MapLibre must be told after the page has laid out again.
    requestAnimationFrame(() => actions.onLayoutChange?.());
  };
  render();
  return {
    setState(next, message = null) { state = next; noWalkMessage = next ? null : message; render(); },
    remove() {
      document.body.classList.remove('mode-tablet', 'mode-helmet');
      bar.remove();
      tablet.remove();
      helmet.remove();
    },
  };
}
