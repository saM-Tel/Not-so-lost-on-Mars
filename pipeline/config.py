# WHAT:    Reads and checks a site config.
# IN:      A YAML file from ../sites/.
# OUT:     A checked config object, or a list of what is missing.
# USED BY: build_site.py, build_globe.py.
# RULES:   A position without a source is an error. Longitudes are converted to east-positive, -180 to 180.
# TRAPS:   PITFALLS 2, 4.
# OWNER:   Role A.
