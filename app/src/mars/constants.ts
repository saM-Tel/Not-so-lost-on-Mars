// WHAT:    Mars constants (radius, gravity, sol length) and the Earth radius MapLibre assumes. The only place they are defined in the app.
// IN:      Nothing.
// OUT:     Named constants with the unit in each name: metres, m/s2, seconds.
// USED BY: Everything in src/.
// RULES:   Values match the root AGENTS.md and pipeline/mars.py. Never redefine one elsewhere.
// TRAPS:   PITFALLS 3.
// OWNER:   Role B.

/** Radius of the sphere the USGS map products use, in metres. */
export const MARS_RADIUS_M = 3_396_190;

/** Surface gravity, in metres per second squared. */
export const MARS_GRAVITY_M_S2 = 3.71;

/** Length of one sol, in seconds. */
export const SOL_S = 88_775.244;

/** Ground distance covered by one degree of latitude, in metres. */
export const METRES_PER_DEGREE = (MARS_RADIUS_M * Math.PI) / 180;

/**
 * The sphere radius MapLibre GL JS uses whenever it turns metres into map units (its `earthRadius`,
 * read from the installed version 6.18.0). We feed MapLibre Mars longitudes and latitudes, so it
 * believes the planet is this large.
 */
export const MAPLIBRE_RADIUS_M = 6_371_008.8;

/**
 * Multiply a real Mars length or height in metres by this before handing it to MapLibre as metres
 * (terrain exaggeration, extrusion heights). About 1.876.
 */
export const MAPLIBRE_METRES_PER_MARS_METRE = MAPLIBRE_RADIUS_M / MARS_RADIUS_M;
