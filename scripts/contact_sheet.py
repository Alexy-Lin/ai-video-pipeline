"""Build a 3x3 contact sheet from out/stills so a reviewer can scan every scene."""
import sys
from pathlib import Path

from PIL import Image

FRAMES = [90, 220, 400, 560, 740, 900, 1060, 1180, 1330]
ROOT = Path(__file__).resolve().parent.parent
STILLS = ROOT / "out" / "stills"
OUT = ROOT / "out" / "contact-sheet.png"

CELL_W, CELL_H = 640, 360
COLS, ROWS = 3, 3
PAD = 12

sheet = Image.new("RGB", (COLS * CELL_W + PAD * (COLS + 1), ROWS * CELL_H + PAD * (ROWS + 1)), (18, 22, 20))

for index, frame in enumerate(FRAMES):
    path = STILLS / f"f{frame}.png"
    if not path.exists():
        print(f"missing {path}", file=sys.stderr)
        continue
    tile = Image.open(path).convert("RGB").resize((CELL_W, CELL_H), Image.LANCZOS)
    col, row = index % COLS, index // COLS
    x = PAD + col * (CELL_W + PAD)
    y = PAD + row * (CELL_H + PAD)
    sheet.paste(tile, (x, y))

sheet.save(OUT)
print(f"wrote {OUT} ({sheet.width}x{sheet.height})")
