// WHAT:    The time budget behind the tether: how long a walk lasts and how far from home, in walking time, a person may be (F4).
//          Still to add: energy and oxygen budgets, and a reserve.
// IN:      The walk-back limit chosen by the user; elapsed time in s.
// OUT:     The longest walk home allowed at that moment, in s.
// USED BY: src/safety/tether.ts, src/ui/safetyPanel.ts, src/ui/routePanel.ts.
// RULES:   Every default has a cited source or is labelled assumed. Standing at home gives the full budget.
//          Both figures are from Ogilvie and others 2026 (NASA, ICES-2026-127, docs/REFERENCES.md): it sizes work for
//          "an 8-hour EVA", and says that for Mars "either 30 minute or 1-hour walkback are being considered" and that the
//          greatest distance from the craft is expected not to exceed a one-hour walk back. Planning figures for suits
//          that do not exist yet, applied by us: grade C.
// TRAPS:   PITFALLS 7. No separate reserve is taken off: we have no sourced figure for one.
// OWNER:   Role B.

/** Length of a walk outside, in seconds: 8 hours. */
export const WALK_DURATION_S = 8 * 3600;

/** The walk-back limits NASA is considering for Mars, in seconds: 30 minutes and 1 hour. */
export const WALK_BACK_LIMITS_S = [30 * 60, 60 * 60] as const;

/** The limit used until the person picks another: the longer one, which the paper gives as the most to expect. */
export const DEFAULT_WALK_BACK_LIMIT_S = 60 * 60;

export interface TetherSettings {
  /** The longest walk home allowed at any time, seconds. */
  walkBackLimitS: number;
  /** Time since leaving home, seconds. */
  elapsedS: number;
}

/** Time left of the walk, seconds. Never below zero. */
export function timeLeftS(elapsedS: number): number {
  return Math.max(0, WALK_DURATION_S - elapsedS);
}

/**
 * The longest walk home allowed right now, seconds: the walk-back limit, or the time left if that is shorter.
 * So the tether shrinks as elapsed time rises, and at the end of the walk it closes on home.
 */
export function allowedTimeHomeS(settings: TetherSettings): number {
  return Math.min(settings.walkBackLimitS, timeLeftS(settings.elapsedS));
}
