# WHAT:    Builds what the globe needs (F14): Web Mercator tiles of a global Mars image, and sites.json from every site config.
# IN:      The global image source; every config in ../sites/.
# OUT:     ../app/public/data/globe/ and ../app/public/data/sites.json.
# USED BY: People and AI sessions from the command line.
# RULES:   The image keeps its mission, dates and credit in a layer record. No position without a cited source.
# TRAPS:   PITFALLS 2, 4, 10.
# OWNER:   Role A.
