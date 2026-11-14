// WHAT:    Radiation dose for a planned walk, with its range (F5).
// IN:      Walk duration in s; dose rate and its range; sky exposure along the route.
// OUT:     Absorbed dose in gray and dose equivalent in sievert, each with a range.
// USED BY: src/ui/safetyPanel.ts.
// RULES:   Gray and sievert are never converted 1:1. Gale measurements applied to Jezero are labelled as such.
// TRAPS:   PITFALLS 2, 8.
// OWNER:   Role B.
