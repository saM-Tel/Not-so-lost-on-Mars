# WHAT:    Stage 8: checks our terrain against the rover's own measurements (F9, and the F1 height check).
# IN:      Terrain heights and slope; rover stops with tilt and height.
# OUT:     validation.json under the site folder, with sample sizes and typical error.
# USED BY: build_site.py.
# RULES:   Compares like with like: areoid heights with areoid heights.
# TRAPS:   PITFALLS 3, 4, 5.
# OWNER:   Role A.
