"""Side-by-side comparison: frozen screenshot shot vs real frame-sequence shot."""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out" / "compare-static-vs-live.png"

STATIC = ROOT / "out" / "stills" / "f480.png"
LIVE = [ROOT / "out" / f"live-f{n}.png" for n in (24, 78, 150)]

CELL_W, CELL_H = 620, 349
COLS, PAD, LABEL_H = 3, 12, 46


def load_font(size):
    for name in (r"C:\Windows\Fonts\msyh.ttc", r"C:\Windows\Fonts\msyhbd.ttc", r"C:\Windows\Fonts\simhei.ttf"):
        if Path(name).exists():
            try:
                return ImageFont.truetype(name, size)
            except OSError:
                continue
    return ImageFont.load_default()


font = load_font(30)
rows = [("静态版（整幕只有 1 张图，靠放大制造动感）", [STATIC] * 3),
        ("帧序列版（每秒 30 张真实画面，自动采集）", LIVE)]

width = COLS * CELL_W + PAD * (COLS + 1)
height = len(rows) * (CELL_H + LABEL_H + PAD) + PAD
sheet = Image.new("RGB", (width, height), (16, 20, 18))
draw = ImageDraw.Draw(sheet)

y = PAD
for title, images in rows:
    draw.text((PAD, y), title, font=font, fill=(235, 245, 240))
    y += LABEL_H
    for i, src in enumerate(images):
        if not src.exists():
            sys.exit(f"missing {src}")
        tile = Image.open(src).convert("RGB").resize((CELL_W, CELL_H), Image.LANCZOS)
        sheet.paste(tile, (PAD + i * (CELL_W + PAD), y))
    y += CELL_H + PAD

sheet.save(OUT)
print(f"wrote {OUT} ({sheet.width}x{sheet.height})")
