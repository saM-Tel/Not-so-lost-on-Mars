// WHAT:    Camera moves: globe to a site, a site back to the globe, and the slow idle turn of the globe (F14, F7).
// IN:      The map; a site's centre and box in degrees.
// OUT:     Nothing. Moves the camera and resolves when it has arrived.
// USED BY: src/main.ts, src/ui/sitePicker.ts.
// RULES:   The idle turn stops on the first touch and respects the reduced-motion setting.
// TRAPS:   PITFALLS 11.
// OWNER:   Role B.
