// WHAT:    Turns numbers into text: units, ranges, dates in Earth UTC and Mars time.
// IN:      Values in SI units.
// OUT:     Strings such as 2 h 10 min (1 h 50 min to 2 h 45 min).
// USED BY: Everything in src/ui.
// RULES:   Every value carries its unit. Micro and milli are never mixed.
// TRAPS:   PITFALLS 8.
// OWNER:   Role B.
