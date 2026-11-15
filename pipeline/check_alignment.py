# WHAT:    Checks every built site from the tiles the app reads: whether the site image lines up with its own terrain
#          (brightness fitted to the terrain's slopes, searched over small shifts), whether the site image lines up with
#          the CTX ring under it (correlation of the two images, searched over shifts), and the 3D terrain mesh (holes,
#          spikes, the outer edge, missing tiles). Prints one line of JSON per site.
# IN:      ../app/public/data (site.json, layers.json, tiles, approach/layers.json).
# OUT:     Printed results only; writes nothing.
# USED BY: People and AI sessions: python check_alignment.py ../app/public/data, or for the CTX check alone at zoom 13
#          over +-30 pixels: python check_alignment.py ../app/public/data 13 30. The CTX shifts in the site configs
#          (approach.ctxShiftM) were measured with it on 15 Nov.
# RULES:   A best shift at zero means aligned. A low fit or correlation means the check cannot tell (flat ground, or
#          images taken under different light), not that the site is aligned.
# TRAPS:   PITFALLS 4, 5.
# OWNER:   Role A.

import json
import math
import pathlib
import sys

import numpy as np
from PIL import Image

DATA = pathlib.Path(sys.argv[1])
R = 3_396_190.0


def tile_xy(lon, lat, z):
    n = 2 ** z
    x = (lon + 180) / 360 * n
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    return x, y


def mosaic(folder: pathlib.Path, z: int, kind: str):
    """Tiles at zoom z as one array (NaN where missing), and the tile x, y of its top-left corner."""
    paths = [p for p in (folder / str(z)).glob('*/*') if p.suffix in ('.png', '.webp')]
    if not paths:
        return None, None
    xs = [int(p.parent.name) for p in paths]
    ys = [int(p.stem) for p in paths]
    x0, y0 = min(xs), min(ys)
    w, h = (max(xs) - x0 + 1) * 256, (max(ys) - y0 + 1) * 256
    out = np.full((h, w), np.nan, np.float64)
    for p, x, y in zip(paths, xs, ys):
        im = Image.open(p)
        if kind == 'image':
            a = np.asarray(im.convert('LA'), np.float64)
            v = a[..., 0].copy()
            v[a[..., 1] < 128] = np.nan
        else:
            a = np.asarray(im.convert('RGBA'), np.float64)
            v = -10000 + (a[..., 0] * 65536 + a[..., 1] * 256 + a[..., 2]) * 0.1
            v[(a[..., 3] < 128) | ((a[..., 0] == 0) & (a[..., 1] == 0) & (a[..., 2] == 0))] = np.nan
        out[(y - y0) * 256:(y - y0 + 1) * 256, (x - x0) * 256:(x - x0 + 1) * 256] = v
    return out, (x0, y0)


def common(a, ao, b, bo):
    """Crop two mosaics at the same zoom to their common pixel window."""
    ax0, ay0 = ao[0] * 256, ao[1] * 256
    bx0, by0 = bo[0] * 256, bo[1] * 256
    x0, y0 = max(ax0, bx0), max(ay0, by0)
    x1, y1 = min(ax0 + a.shape[1], bx0 + b.shape[1]), min(ay0 + a.shape[0], by0 + b.shape[0])
    if x1 <= x0 or y1 <= y0:
        return None, None
    return a[y0 - ay0:y1 - ay0, x0 - ax0:x1 - ax0], b[y0 - by0:y1 - by0, x0 - bx0:x1 - bx0]


def shading_fit(image, terrain, max_shift):
    """Best shift (dx, dy) in pixels of the image against the terrain, by how well the image's brightness is explained
    by the terrain's slopes (I = a*hx + b*hy + c, any Sun direction). Returns (dx, dy, r2 at best, r2 at zero)."""
    hy, hx = np.gradient(terrain)
    m = max_shift
    core = (slice(m, -m), slice(m, -m))
    hxc, hyc = hx[core], hy[core]
    best = (0, 0, -1.0)
    r2_zero = None
    for dy in range(-m, m + 1):
        for dx in range(-m, m + 1):
            img = image[m + dy:image.shape[0] - m + dy, m + dx:image.shape[1] - m + dx]
            ok = np.isfinite(img) & np.isfinite(hxc) & np.isfinite(hyc)
            if ok.sum() < 2000:
                continue
            A = np.column_stack([hxc[ok], hyc[ok], np.ones(ok.sum())])
            y = img[ok]
            coef, *_ = np.linalg.lstsq(A, y, rcond=None)
            res = y - A @ coef
            r2 = 1 - res.var() / y.var() if y.var() > 0 else 0
            if dx == 0 and dy == 0:
                r2_zero = r2
            if r2 > best[2]:
                best = (dx, dy, r2)
    return best[0], best[1], best[2], r2_zero


def highpass(a, k=7):
    """Brightness minus its local mean over a k x k window, NaN kept as NaN."""
    filled = np.where(np.isfinite(a), a, 0.0)
    w = np.isfinite(a).astype(float)
    pad = k // 2
    def box(x):
        c = np.cumsum(np.cumsum(np.pad(x, pad + 1, mode='constant'), 0), 1)
        return (c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k])[: a.shape[0], : a.shape[1]]
    mean = box(filled) / np.maximum(box(w), 1)
    out = filled - mean
    out[~np.isfinite(a)] = np.nan
    return out


def ncc_shift(a, b, max_shift):
    """Best shift of a against b by normalised cross-correlation of their high-passed brightness."""
    a, b = highpass(a), highpass(b)
    m = max_shift
    bc = b[m:-m, m:-m]
    best = (0, 0, -2.0)
    zero = None
    for dy in range(-m, m + 1):
        for dx in range(-m, m + 1):
            ac = a[m + dy:a.shape[0] - m + dy, m + dx:a.shape[1] - m + dx]
            ok = np.isfinite(ac) & np.isfinite(bc)
            if ok.sum() < 1500:
                continue
            x, y = ac[ok] - ac[ok].mean(), bc[ok] - bc[ok].mean()
            c = (x * y).sum() / math.sqrt((x * x).sum() * (y * y).sum() + 1e-9)
            if dx == 0 and dy == 0:
                zero = c
            if c > best[2]:
                best = (dx, dy, c)
    return best[0], best[1], best[2], zero


approach = {x['id']: x for x in json.loads((DATA / 'approach' / 'layers.json').read_text(encoding='utf-8'))['layers']}
results = []
for site_file in sorted(DATA.glob('*/site.json')):
    site = json.loads(site_file.read_text(encoding='utf-8'))
    sid = site['id']
    folder = site_file.parent
    layers = {x['id']: x for x in json.loads((folder / 'layers.json').read_text(encoding='utf-8'))['layers']}
    img = next((x for x in layers.values() if x['id'].startswith('image-') and x.get('tiles')), None)
    ter = next((x for x in layers.values() if x['id'].startswith('terrain-') and x.get('tiles')), None)
    lat = site['centre']['latDeg']
    row = {'site': sid, 'level': site['level']}
    # 1. Image against terrain, at the finest zoom both have.
    z = min(img['tiles']['maxZoom'], ter['tiles']['maxZoom'])
    mpp = 2 * math.pi * R * math.cos(math.radians(lat)) / (256 * 2 ** z)
    im, io = mosaic(folder / pathlib.Path(img['tiles']['path']).parts[0] / pathlib.Path(img['tiles']['path']).parts[1], z, 'image')
    te, to = mosaic(folder / pathlib.Path(ter['tiles']['path']).parts[0] / pathlib.Path(ter['tiles']['path']).parts[1], z, 'terrain')
    a, b = common(im, io, te, to)
    dx, dy, r2, r2z = shading_fit(a, b, 6) if len(sys.argv) <= 2 else (0, 0, 0, 0)
    row['imageVsTerrain'] = ('skipped: CTX check only' if len(sys.argv) > 2 else
                             f"z{z} ({mpp:.1f} m/px): best shift {dx * mpp:+.1f} m east, {-dy * mpp:+.1f} m north; fit {r2:.2f} (at zero {r2z:.2f})")
    # 2. Site image against the near CTX ring, at zoom 14.
    near = approach.get(f'image-ctx-{sid}-near')
    if near:
        zn = int(sys.argv[2]) if len(sys.argv) > 2 else 14
        mppn = 2 * math.pi * R * math.cos(math.radians(lat)) / (256 * 2 ** zn)
        si, so = mosaic(folder / pathlib.Path(img['tiles']['path']).parts[0] / pathlib.Path(img['tiles']['path']).parts[1], zn, 'image')
        ci, co = mosaic(DATA / 'approach' / pathlib.Path(near['tiles']['path']).parts[0] / pathlib.Path(near['tiles']['path']).parts[1], zn, 'image')
        if si is not None and ci is not None:
            a2, b2 = common(si, so, ci, co)
            if a2 is not None:
                dx2, dy2, c, cz = ncc_shift(a2, b2, int(sys.argv[3]) if len(sys.argv) > 3 else 16)
                row['siteVsCtx'] = f"z{zn} ({mppn:.1f} m/px): best shift {dx2 * mppn:+.0f} m east, {-dy2 * mppn:+.0f} m north; correlation {c:.2f} (at zero {cz if cz is None else round(cz, 2)})"
    # 3. The terrain mesh at its finest zoom.
    tz = ter['tiles']['maxZoom']
    tm, tor = mosaic(folder / pathlib.Path(ter['tiles']['path']).parts[0] / pathlib.Path(ter['tiles']['path']).parts[1], tz, 'terrain')
    box = site['box']
    bx0, by0 = tile_xy(box['westLonDeg'], box['northLatDeg'], tz)
    bx1, by1 = tile_xy(box['eastLonDeg'], box['southLatDeg'], tz)
    px0, py0 = int(bx0 * 256) - tor[0] * 256, int(by0 * 256) - tor[1] * 256
    px1, py1 = int(bx1 * 256) - tor[0] * 256, int(by1 * 256) - tor[1] * 256
    inbox = tm[max(py0, 0):py1, max(px0, 0):px1]
    holes = int(np.isnan(inbox).sum())
    med = np.nanmedian(np.stack([np.roll(np.roll(inbox, i, 0), j, 1) for i in (-1, 0, 1) for j in (-1, 0, 1)]), axis=0)
    spikes = int((np.abs(inbox - med)[2:-2, 2:-2] > 15).sum())
    # Missing tiles over the terrain's bounds, at every zoom.
    tb = ter['tiles'].get('bounds') or box
    missing = []
    for zz in range(ter['tiles']['minZoom'], ter['tiles']['maxZoom'] + 1):
        x0, y0 = tile_xy(tb['westLonDeg'], tb['northLatDeg'], zz)
        x1, y1 = tile_xy(tb['eastLonDeg'], tb['southLatDeg'], zz)
        want = {(x, y) for x in range(int(x0), int(x1) + 1) for y in range(int(y0), int(y1) + 1)}
        have = {(int(p.parent.name), int(p.stem)) for p in (folder / pathlib.Path(ter['tiles']['path']).parts[0] / pathlib.Path(ter['tiles']['path']).parts[1] / str(zz)).glob('*/*.png')}
        if want - have:
            missing.append(f"z{zz}: {len(want - have)} of {len(want)}")
    finite = tm[np.isfinite(tm)]
    edge = np.concatenate([tm[0, :], tm[-1, :], tm[:, 0], tm[:, -1]])
    edge = edge[np.isfinite(edge)]
    row['mesh'] = (f"z{tz}: holes in box {holes}, spikes over 15 m {spikes}, heights {finite.min():.0f} to {finite.max():.0f} m "
                   f"(box lowest {site['terrainHeightM']['lowest']:.0f}), outer edge {edge.min():.0f} to {edge.max():.0f} m; "
                   f"missing tiles: {', '.join(missing) or 'none'}")
    results.append(row)
    print(json.dumps(row, ensure_ascii=False))
