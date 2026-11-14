# WHAT:    Draws the PNG copies of the app icon (public/icons/icon.svg) that browsers need to offer installation (F8).
# IN:      Nothing; the shapes are the same as in icon.svg.
# OUT:     public/icons/icon-192.png, icon-512.png and maskable-512.png.
# USED BY: People, once, after changing the icon: run from app/ with the pipeline's Python, which has Pillow:
#          ..\pipeline\.venv\Scripts\python pwa\make_icons.py
# RULES:   Simple drawn shapes only. No generated imagery.
# TRAPS:   None.
# OWNER:   Role B.

import pathlib

from PIL import Image, ImageDraw

OUT = pathlib.Path(__file__).resolve().parent.parent / "public" / "icons"
SCALE = 4  # drawn large and shrunk, for smooth edges


def draw(size: int, maskable: bool) -> Image.Image:
    big = size * SCALE
    image = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    pen = ImageDraw.Draw(image)
    unit = big / 512
    if maskable:
        # A maskable icon fills the square and keeps its picture inside the middle 80%.
        pen.rectangle([0, 0, big, big], fill="#07080c")
        shrink, shift = 0.78, 256 * (1 - 0.78)
    else:
        pen.rounded_rectangle([0, 0, big - 1, big - 1], radius=96 * unit, fill="#07080c")
        shrink, shift = 1.0, 0.0

    def p(value: float) -> float:
        return (value * shrink + shift) * unit

    def circle(cx: float, cy: float, r: float, **style) -> None:
        pen.ellipse([p(cx) - r * shrink * unit, p(cy) - r * shrink * unit, p(cx) + r * shrink * unit, p(cy) + r * shrink * unit], **style)

    circle(256, 256, 150, fill="#b8673a")
    circle(256, 256, 196, outline="#ffffff", width=round(18 * shrink * unit))
    pen.line([p(256), p(256), p(352), p(168)], fill="#56b4e9", width=round(18 * shrink * unit))
    circle(352, 168, 9, fill="#56b4e9")  # round end of the line
    circle(256, 256, 26, fill="#ffffff")
    circle(352, 168, 22, fill="#f0e442")
    return image.resize((size, size), Image.LANCZOS)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    draw(192, False).save(OUT / "icon-192.png", optimize=True)
    draw(512, False).save(OUT / "icon-512.png", optimize=True)
    draw(512, True).save(OUT / "maskable-512.png", optimize=True)
    print(f"wrote three icons to {OUT}")
