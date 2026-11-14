# WHAT:    Stage 5: writes the routing grids as raw binary arrays.
# IN:      Heights, slope, mask and footing for the box.
# OUT:     grid/ under the site folder, and the grid definition for site.json.
# USED BY: build_site.py.
# RULES:   Layout matches docs/DATA_CONTRACT.md exactly. Three slope classes: passable, possibly too steep, too steep.
# TRAPS:   PITFALLS 4, 5, 6.
# OWNER:   Role A.
