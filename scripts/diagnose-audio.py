"""Diagnose noise floor / SNR at each processing stage."""
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / "public" / "audio"
ORDER = ["intro", "problem", "player", "teams", "transfers", "national", "quick", "safety", "outro"]


def stats(path: Path):
    y, sr = sf.read(str(path), dtype="float32", always_2d=True)
    y = y.mean(axis=1)
    hop = int(sr * 0.02)
    n = len(y) // hop
    rms = np.array([np.sqrt(np.mean(y[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
    db = 20 * np.log10(np.maximum(rms, 1e-9))
    # a real noise floor: 10th percentile of frame energy (pauses between words)
    floor = float(np.percentile(db, 10))
    speech = float(np.percentile(db, 95))
    return floor, speech, speech - floor, float(np.max(np.abs(y)))


def main():
    stages = [
        ("raw (recorded)", "vo-{}.trimmed.wav"),
        ("noisereduce", "vo-{}.denoised.wav"),
        ("final", "vo-{}.wav"),
    ]
    header = "{:10s} {:20s} {:>8s} {:>8s} {:>7s} {:>6s}".format("line", "stage", "noise", "speech", "SNR", "peak")
    print(header)
    print("-" * len(header))
    for key in ORDER:
        for label, pattern in stages:
            path = AUDIO / pattern.format(key)
            if not path.exists():
                continue
            floor, speech, snr, peak = stats(path)
            print(f"{key:10s} {label:20s} {floor:8.1f} {speech:8.1f} {snr:7.1f} {peak:6.3f}")
        print()


main()
