"""Contact sheet of the captured frame sequence, to eyeball whether the flow recorded."""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "frames" / "player"
OUT = ROOT / "out" / "frame-sheet.png"

PICKS = [0, 45, 90, 135, 180, 225, 261]
CELL_W, CELL_H = 640, 360
COLS, PAD = 3, 10

files = sorted(SRC.glob("*.jpg"))
if not files:
    sys.exit(f"no frames in {SRC}")

rows = (len(PICKS) + COLS - 1) // COLS
sheet = Image.new("RGB", (COLS * CELL_W + PAD * (COLS + 1), rows * CELL_H + PAD * (rows + 1)), (18, 22, 20))

for i, idx in enumerate(PICKS):
    idx = min(idx, len(files) - 1)
    tile = Image.open(files[idx]).convert("RGB").resize((CELL_W, CELL_H), Image.LANCZOS)
    col, row = i % COLS, i // COLS
    sheet.paste(tile, (PAD + col * (CELL_W + PAD), PAD + row * (CELL_H + PAD)))

sheet.save(OUT)
print(f"{len(files)} frames -> {OUT} ({sheet.width}x{sheet.height})")
