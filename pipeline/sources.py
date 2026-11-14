# WHAT:    Finds each source file and reads only the site's box from it.
# IN:      A source address; a box in degrees; MARS_DATA_URL from the ignored .env file.
# OUT:     Arrays for the box with their grid definition, and which source was used.
# USED BY: build_site.py and the stage files.
# RULES:   Tries the team data server, then ../data/raw/, then the original address. Works with no server set. Never writes to the server.
# TRAPS:   PITFALLS 4, 10.
# OWNER:   Role A.
