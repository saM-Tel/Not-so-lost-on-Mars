# WHAT:    Stage 2: finds missing data and seams between source terrain models.
# IN:      Terrain heights for the box and the file's no-data value.
# OUT:     A mask array: valid, missing or seam.
# USED BY: terrain.py, tiles.py, grids.py.
# RULES:   The no-data value is detected before any calculation.
# TRAPS:   PITFALLS 5.
# OWNER:   Role A.
