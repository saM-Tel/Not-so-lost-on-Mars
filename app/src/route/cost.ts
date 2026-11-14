// WHAT:    Walking speed and effort for a suited person on a slope, for the favourable, expected and cautious cases (F3).
// IN:      Slope along the direction of travel in degrees; total mass in kg; footing factor; case settings.
// OUT:     Speed in m/s; time in s and energy in kJ for one step.
// USED BY: src/route/search.ts, src/route/stats.ts.
// RULES:   Mars gravity from src/mars/constants.ts. Uphill and downhill differ. Every setting has a cited source or is labelled assumed.
// TRAPS:   PITFALLS 3, 6, 7.
// OWNER:   Role B.
