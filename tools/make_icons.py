"""Generate the placeholder app icons (white snowflake on blue). Standard library only.

Run from the repo root:  python3 tools/make_icons.py
"""
import math
import struct
import zlib

BG = (37, 99, 235)
FG = (255, 255, 255)


def segments():
    """Snowflake arms and branches in unit coords (center 0,0). Fits within the
    maskable safe zone (radius 0.4 of the icon)."""
    segs = []
    for k in range(6):
        a = math.radians(90 + 60 * k)
        ux, uy = math.cos(a), math.sin(a)
        segs.append((0, 0, 0.32 * ux, 0.32 * uy))
        for t, length in ((0.17, 0.09), (0.25, 0.06)):
            bx, by = t * ux, t * uy
            for side in (-1, 1):
                b = a + side * math.radians(45)
                segs.append((bx, by, bx + length * math.cos(b), by + length * math.sin(b)))
    return segs


def dist_to_segment(px, py, x1, y1, x2, y2):
    dx, dy = x2 - x1, y2 - y1
    t = max(0.0, min(1.0, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))


def render(size):
    segs = [tuple(v * size for v in s) for s in segments()]
    half_width = 0.022 * size
    c = size / 2
    rows = []
    for y in range(size):
        row = bytearray([0])
        py = y + 0.5 - c
        for x in range(size):
            px = x + 0.5 - c
            d = min(dist_to_segment(px, py, *s) for s in segs)
            a = max(0.0, min(1.0, half_width - d + 0.5))
            row += bytes(round(BG[i] + (FG[i] - BG[i]) * a) for i in range(3))
        rows.append(bytes(row))
    return b"".join(rows)


def write_png(path, size):
    def chunk(kind, data):
        body = kind + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body))

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(render(size), 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


if __name__ == "__main__":
    for name, size in (("icon-192.png", 192), ("icon-512.png", 512), ("apple-touch-icon.png", 180)):
        write_png(name, size)
        print(f"wrote {name} ({size}x{size})")
