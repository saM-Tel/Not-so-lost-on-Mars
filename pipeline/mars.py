# WHAT:    Mars constants and geometry for the pipeline: radius, gravity, sol length, cell spacing, longitude conversion, tile maths,
#          and the season (solar longitude) at a UTC time by NASA's Mars24 method, the same as app/src/mars/time.ts.
# IN:      East-positive longitude and planetocentric latitude, degrees.
# OUT:     Metres, degrees and tile indices.
# USED BY: Every other file in this folder.
# RULES:   Values match the root AGENTS.md and app/src/mars/constants.ts. The only place they are defined in Python.
# TRAPS:   PITFALLS 3, 4.
# OWNER:   Role A.

import datetime
import math

# The sphere the USGS map products use. Source: root AGENTS.md, "Conventions".
MARS_RADIUS_M = 3_396_190.0
MARS_GRAVITY_M_S2 = 3.71
SOL_S = 88_775.244

# Ground distance covered by one degree of latitude, or of longitude at the equator.
METRES_PER_DEGREE = MARS_RADIUS_M * math.pi / 180.0

# Web Mercator cannot show the poles. This is the latitude where the square map ends.
MERCATOR_MAX_LAT_DEG = math.degrees(math.atan(math.sinh(math.pi)))

TILE_SIZE_PX = 256


def lon_to_180(lon_east_deg: float) -> float:
    """East-positive longitude in any range, returned in -180 (exclusive) to 180 (inclusive)."""
    lon = math.fmod(lon_east_deg, 360.0)
    if lon > 180.0:
        lon -= 360.0
    elif lon <= -180.0:
        lon += 360.0
    return lon


def west_to_east(lon_west_deg: float) -> float:
    """West-positive longitude, as in older products, to east-positive in -180 to 180."""
    return lon_to_180(-lon_west_deg)


def east_west_spacing_m(north_south_spacing_m: float, lat_deg: float) -> float:
    """Ground width of a cell in a grid that is true to scale at the equator.

    The USGS mosaics are equirectangular with their true scale at the equator, so a cell
    that is `north_south_spacing_m` tall is narrower than that east to west by cos(latitude).
    """
    return north_south_spacing_m * math.cos(math.radians(lat_deg))


def distance_m(lon1_deg: float, lat1_deg: float, lon2_deg: float, lat2_deg: float) -> float:
    """Great-circle distance on the Mars sphere, in metres."""
    p1, p2 = math.radians(lat1_deg), math.radians(lat2_deg)
    dp = p2 - p1
    dl = math.radians(lon2_deg - lon1_deg)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * MARS_RADIUS_M * math.asin(min(1.0, math.sqrt(a)))


# ---- Web Mercator tile maths -------------------------------------------------------------
# MapLibre reads tiles cut on the Web Mercator square. The maths below works on longitude and
# latitude only, so it holds for any sphere; nothing here uses a radius.


def mercator_fraction(lon_deg: float, lat_deg: float) -> tuple[float, float]:
    """Position on the Web Mercator square: x from 0 (180 W) to 1 (180 E), y from 0 (north) to 1 (south)."""
    x = (lon_deg + 180.0) / 360.0
    lat = max(-MERCATOR_MAX_LAT_DEG, min(MERCATOR_MAX_LAT_DEG, lat_deg))
    y = 0.5 - math.asinh(math.tan(math.radians(lat))) / (2 * math.pi)
    return x, y


def mercator_y_to_lat_deg(y: float) -> float:
    """Latitude in degrees for a y position on the Web Mercator square (0 north, 1 south)."""
    return math.degrees(math.atan(math.sinh(math.pi * (1.0 - 2.0 * y))))


def tile_bounds_deg(z: int, x: int, y: int) -> tuple[float, float, float, float]:
    """West, south, east, north of a tile in degrees."""
    n = 2**z
    west = x / n * 360.0 - 180.0
    east = (x + 1) / n * 360.0 - 180.0
    north = mercator_y_to_lat_deg(y / n)
    south = mercator_y_to_lat_deg((y + 1) / n)
    return west, south, east, north


def tile_pixel_size_m(z: int, lat_deg: float) -> float:
    """Ground size on Mars of one tile pixel at this zoom and latitude, in metres."""
    world_px = TILE_SIZE_PX * 2**z
    return 2 * math.pi * MARS_RADIUS_M * math.cos(math.radians(lat_deg)) / world_px


# Mars24 (Allison and McEwen 2000), as in app/src/mars/time.ts. TAI minus UTC since 1 January 2017, then TT minus TAI.
TAI_MINUS_UTC_S = 37
TT_MINUS_TAI_S = 32.184
# Perturbations by the other planets (Mars24 step B-4): amplitude in degrees, period in Julian years, phase in degrees.
_PERTURBATIONS = [
    (0.0071, 2.2353, 49.409), (0.0057, 2.7543, 168.173), (0.0039, 1.1177, 191.837), (0.0037, 15.7866, 21.736),
    (0.0021, 2.1354, 15.704), (0.0020, 2.4694, 95.528), (0.0018, 32.8493, 49.095),
]


def solar_longitude_deg(utc: datetime.datetime) -> float:
    """The season: Mars's angle along its orbit from northern spring, degrees from 0 to 360 (Mars24 steps A to B)."""
    if utc.tzinfo is None:
        utc = utc.replace(tzinfo=datetime.timezone.utc)
    jd_utc = utc.timestamp() / 86_400 + 2_440_587.5
    dt = jd_utc + (TAI_MINUS_UTC_S + TT_MINUS_TAI_S) / 86_400 - 2_451_545.0
    m = 19.3871 + 0.52402073 * dt
    alpha_fms = 270.3871 + 0.524038496 * dt
    pbs = sum(a * math.cos(math.radians(0.985626 * dt / tau + phi)) for a, tau, phi in _PERTURBATIONS)
    rad = math.radians
    centre = ((10.691 + 3.0e-7 * dt) * math.sin(rad(m)) + 0.623 * math.sin(rad(2 * m)) + 0.05 * math.sin(rad(3 * m))
              + 0.005 * math.sin(rad(4 * m)) + 0.0005 * math.sin(rad(5 * m)) + pbs)
    return (alpha_fms + centre) % 360
