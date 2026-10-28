"""Final QC on the processed voiceover: SNR, loudness spread, and a listen-through file."""
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / "public" / "audio"
OUT = ROOT / "out" / "voice-final-check.wav"
ORDER = ["intro", "problem", "player", "teams", "transfers", "national", "quick", "safety", "outro"]


def stats(y, sr):
    hop = max(1, int(sr * 0.01))
    n = len(y) // hop
    rms = np.array([np.sqrt(np.mean(y[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
    db = 20 * np.log10(np.maximum(rms, 1e-9))
    return float(np.percentile(db, 10)), float(np.percentile(db, 95))


print(f"{'line':10s} {'dur':>6s} {'noise':>7s} {'speech':>7s} {'SNR':>6s} {'LUFS':>7s} {'peak':>6s}")
lufs_values = []
total = 0.0
parts = []
sr_out = None
for key in ORDER:
    y, sr = sf.read(str(AUDIO / f"vo-{key}.wav"), dtype="float32", always_2d=True)
    y = y.mean(axis=1)
    sr_out = sr
    floor, speech = stats(y, sr)
    loud = float(pyln.Meter(sr).integrated_loudness(y))
    lufs_values.append(loud)
    total += len(y) / sr
    parts.append(y)
    parts.append(np.zeros(int(0.45 * sr), dtype=np.float32))
    print(
        f"{key:10s} {len(y)/sr:5.2f}s {floor:7.1f} {speech:7.1f} {speech-floor:6.1f} "
        f"{loud:7.1f} {float(np.max(np.abs(y))):6.3f}"
    )

out = np.concatenate(parts)
out = out / max(1.0, float(np.max(np.abs(out)))) * 0.891
sf.write(str(OUT), np.clip(out, -1, 1), sr_out, subtype="PCM_16")
print(f"\ntotal speech : {total:.2f}s")
print(f"loudness span: {max(lufs_values)-min(lufs_values):.2f} LU")
print(f"listen file  : {OUT.name}  ({len(out)/sr_out:.2f}s)")
