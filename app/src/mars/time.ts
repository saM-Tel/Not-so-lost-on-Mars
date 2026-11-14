// WHAT:    Mars time from Earth time: sol number, local mean solar time and season (F11, information cards).
// IN:      A UTC instant; east-positive longitude in degrees.
// OUT:     Sol number for a mission, local time in Mars hours, solar longitude in degrees.
// USED BY: src/mars/sun.ts, src/ui.
// RULES:   A sol is 88,775.244 s. Each mission counts sols from its own landing. Follows the Mars24 algorithm.
// TRAPS:   PITFALLS 3.
// OWNER:   Role B.
