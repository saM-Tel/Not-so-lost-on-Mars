# WHAT:    Stage 4: slope, roughness and sky exposure from terrain heights.
# IN:      Terrain heights in metres relative to the areoid; cell spacing north to south and east to west.
# OUT:     Slope in degrees over a stated baseline; roughness; fraction of sky visible.
# USED BY: grids.py, tiles.py, validate.py.
# RULES:   Uses the corrected cell spacing. Slope baseline is at least 5 m and is recorded in the layer record.
# TRAPS:   PITFALLS 4, 5.
# OWNER:   Role A.
