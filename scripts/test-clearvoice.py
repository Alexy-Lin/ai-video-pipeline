"""Try ClearVoice (MossFormer2_SE_48K) on one line and write a test output."""
from pathlib import Path

from clearvoice import ClearVoice
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "public" / "audio" / "vo-intro.trimmed.wav"
OUT = ROOT / "out" / "denoise-test-clearvoice.wav"

print("loading MossFormer2_SE_48K (downloads weights on first run) ...")
cv = ClearVoice(task="speech_enhancement", model_names=["MossFormer2_SE_48K"])
print("model ready")

results = cv(input_path=str(RAW), online_write=False)
print("result type:", type(results), "len:", len(results) if hasattr(results, "__len__") else "n/a")
cv.write(results, output_path=str(OUT))
print("wrote ->", OUT)

y, sr = sf.read(str(OUT), dtype="float32", always_2d=True)
print(f"out: {len(y)/sr:.2f}s @ {sr}Hz")
