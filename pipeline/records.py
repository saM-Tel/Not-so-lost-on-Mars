# WHAT:    Stage 9: writes layers.json and site.json, including file sizes.
# IN:      Everything the earlier stages produced; source details from the config.
# OUT:     layers.json and site.json under the site folder.
# USED BY: build_site.py, build_globe.py.
# RULES:   Every layer record is complete per docs/CONFIDENCE.md. A field that cannot be found is marked missing, not guessed.
# TRAPS:   PITFALLS 2.
# OWNER:   Role A.
