// WHAT:    Creates the MapLibre map: globe view with the global Mars image, and the corrections MapLibre needs for Mars (F14, F1).
// IN:      A page element; the global image record from public/data/globe/.
// OUT:     The map object.
// USED BY: src/main.ts and the other files in src/map.
// RULES:   Built-in scale bar off. Terrain heights scaled by the Earth to Mars radius ratio. No Earth-like atmosphere glow. The image credit is always visible.
// TRAPS:   PITFALLS 3, 4, 11.
// OWNER:   Role B.
