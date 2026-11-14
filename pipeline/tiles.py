# WHAT:    Stage 3: cuts image and terrain tiles in the layout MapLibre reads.
# IN:      Image and terrain arrays with their grid definition; the mask.
# OUT:     tiles/<layer id>/{z}/{x}/{y} under the site folder.
# USED BY: build_site.py, build_globe.py.
# RULES:   Tile maths comes from mars.py. Missing data is transparent, never a pit or spike. Stays inside the size budget.
# TRAPS:   PITFALLS 3, 4, 5, 10.
# OWNER:   Role A.
