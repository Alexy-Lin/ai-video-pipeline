"""One contact sheet across every captured flow: 25% and 75% through each sequence."""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "frames"
OUT = ROOT / "out" / "flows-sheet.png"

FLOWS = ["player", "teams", "transfers", "national", "quick"]
CELL_W, CELL_H = 620, 349
COLS, PAD, LABEL_H = 2, 12, 40


def load_font(size):
    for name in (r"C:\Windows\Fonts\msyh.ttc", r"C:\Windows\Fonts\simhei.ttf"):
        if Path(name).exists():
            try:
                return ImageFont.truetype(name, size)
            except OSError:
                continue
    return ImageFont.load_default()


font = load_font(26)
width = PAD + COLS * (CELL_W + PAD)
height = PAD + len(FLOWS) * (CELL_H + LABEL_H + PAD)
sheet = Image.new("RGB", (width, height), (16, 20, 18))
draw = ImageDraw.Draw(sheet)

y = PAD
for flow in FLOWS:
    files = sorted((SRC / flow).glob("*.jpg"))
    if not files:
        sys.exit(f"no frames for {flow}")
    picks = [files[int(len(files) * 0.25)], files[int(len(files) * 0.75)]]
    draw.text((PAD, y + 4), f"{flow}  ({len(files)} frames)", font=font, fill=(61, 220, 132))
    for i, src in enumerate(picks):
        tile = Image.open(src).convert("RGB").resize((CELL_W, CELL_H), Image.LANCZOS)
        sheet.paste(tile, (PAD + i * (CELL_W + PAD), y + LABEL_H))
    y += CELL_H + LABEL_H + PAD

sheet.save(OUT)
print(f"wrote {OUT} ({sheet.width}x{sheet.height})")
