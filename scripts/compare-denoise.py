"""Compare denoisers on one line: raw vs noisereduce vs MossFormer2, plus an A/B file."""
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / "public" / "audio"

CANDIDATES = [
    ("raw", AUDIO / "vo-intro.trimmed.wav"),
    ("noisereduce", AUDIO / "vo-intro.denoised.wav"),
    ("mossformer2", ROOT / "out" / "denoise-test-clearvoice.wav"),
]


def stats(path: Path):
    y, sr = sf.read(str(path), dtype="float32", always_2d=True)
    y = y.mean(axis=1)
    hop = int(sr * 0.02)
    n = len(y) // hop
    rms = np.array([np.sqrt(np.mean(y[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
    db = 20 * np.log10(np.maximum(rms, 1e-9))
    floor = float(np.percentile(db, 10))
    speech = float(np.percentile(db, 95))
    return floor, speech, speech - floor, float(np.max(np.abs(y))), sr


print(f"{'candidate':14s} {'noise':>8s} {'speech':>8s} {'SNR':>7s} {'peak':>6s}")
for name, path in CANDIDATES:
    if not path.exists():
        print(f"{name:14s}  (missing)")
        continue
    floor, speech, snr, peak, sr = stats(path)
    print(f"{name:14s} {floor:8.1f} {speech:8.1f} {snr:7.1f} {peak:6.3f}")

# A/B: same loudness so the only difference is noise
parts = []
sr_out = None
for name, path in CANDIDATES:
    if not path.exists():
        continue
    y, sr = sf.read(str(path), dtype="float32", always_2d=True)
    y = y.mean(axis=1)
    sr_out = sr
    loud = pyln.Meter(sr).integrated_loudness(y)
    y = y * (10 ** ((-23.0 - loud) / 20.0))  # all to the same loudness for fair comparison
    parts.append(y.astype(np.float32))
    parts.append(np.zeros(int(0.7 * sr), dtype=np.float32))

ab = np.concatenate(parts)
ab = ab / max(1.0, float(np.max(np.abs(ab)))) * 0.89
out = ROOT / "out" / "denoise-ab.wav"
sf.write(str(out), np.clip(ab, -1, 1), sr_out, subtype="PCM_16")
print(f"\nA/B written: {out.name}  (raw -> noisereduce -> mossformer2, all at -23 LUFS)")
