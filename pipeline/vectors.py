# WHAT:    Stage 6: converts geology, the rover path, rover stops and science targets to GeoJSON.
# IN:      Source vector files and feeds; targets from the site config.
# OUT:     vectors/ under the site folder.
# USED BY: build_site.py.
# RULES:   Every source's longitude convention is converted at the boundary. Any shift applied to the geology is stated.
# TRAPS:   PITFALLS 4.
# OWNER:   Role A.
