# WHAT:    Stage 4: slope from terrain heights. Still to add: roughness and sky exposure.
# IN:      Terrain heights in metres relative to the areoid, north row first; cell spacing north to south and east to west.
# OUT:     Steepest slope in degrees at each cell, measured over a stated baseline, with the baselines actually used.
# USED BY: grids.py through build_site.py. tiles.py and validate.py will use it.
# RULES:   Uses the corrected cell spacing. Slope baseline is at least 5 m and is recorded with the output.
#          A cell whose slope cannot be measured (beside missing data or the edge of the box) is NaN, never a guess.
# TRAPS:   PITFALLS 4, 5.
# OWNER:   Role A.

import math

import numpy as np

# docs/CONFIDENCE.md section 6: slope between neighbouring 1 m cells is mostly noise.
MIN_BASELINE_M = 5.0


def slope_deg(heights: np.ndarray, cell_north_south_m: float, cell_east_west_m: float,
              nodata: float | None = None, baseline_m: float = MIN_BASELINE_M) -> tuple[np.ndarray, dict]:
    """Steepest slope at each cell, in degrees from level.

    The height difference is taken between the cells `k` steps to either side, north to south and east to
    west separately, where `k` is the smallest step that makes the span at least `baseline_m`. The two
    spans differ because cells are narrower east to west. Returns the slope and the spans used, in metres.
    """
    if baseline_m < MIN_BASELINE_M:
        raise ValueError(f"slope baseline {baseline_m} m is under the {MIN_BASELINE_M} m minimum")
    z = heights.astype(np.float32)
    if nodata is not None:
        z[heights == nodata] = np.nan
    k_ns = math.ceil(baseline_m / (2 * cell_north_south_m))
    k_ew = math.ceil(baseline_m / (2 * cell_east_west_m))
    span_ns = 2 * k_ns * cell_north_south_m
    span_ew = 2 * k_ew * cell_east_west_m

    rise_north = np.full(z.shape, np.nan, dtype=np.float32)
    rise_east = np.full(z.shape, np.nan, dtype=np.float32)
    # Row 0 is the north edge, so the cell k rows up is further north.
    rise_north[k_ns:-k_ns, :] = (z[:-2 * k_ns, :] - z[2 * k_ns:, :]) / span_ns
    rise_east[:, k_ew:-k_ew] = (z[:, 2 * k_ew:] - z[:, :-2 * k_ew]) / span_ew
    slope = np.degrees(np.arctan(np.hypot(rise_north, rise_east))).astype(np.float32)
    return slope, {"northSouthM": round(span_ns, 3), "eastWestM": round(span_ew, 3)}
