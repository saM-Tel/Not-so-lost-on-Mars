# WHAT:    One command that builds one site from its config: runs every stage in order and writes the site folder.
# IN:      Path to a site config in ../sites/.
# OUT:     ../app/public/data/<site id>/, written to a temporary folder and renamed when complete.
# USED BY: People and AI sessions from the command line.
# RULES:   Same config, same outputs. Prints the box built, which source each file came from, and the total size.
# TRAPS:   PITFALLS 3, 4, 5, 10.
# OWNER:   Role A.
