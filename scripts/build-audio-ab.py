"""Build A/B files for the audio fix decision (no video rendering)."""
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / "public" / "audio"
OUT = ROOT / "out"
ORDER = ["intro", "problem", "player", "teams", "transfers", "national", "quick", "safety", "outro"]


def read(path):
    y, sr = sf.read(str(path), dtype="float32", always_2d=True)
    return y.mean(axis=1), sr


def at_lufs(y, sr, target=-23.0):
    loud = pyln.Meter(sr).integrated_loudness(y)
    return (y * (10 ** ((target - loud) / 20.0))).astype(np.float32)


def write(path, parts, sr):
    out = np.concatenate(parts)
    out = out / max(1.0, float(np.max(np.abs(out)))) * 0.89
    sf.write(str(path), np.clip(out, -1, 1), sr, subtype="PCM_16")
    print(f"{path.name}: {len(out)/sr:.2f}s")


def main():
    # 1) old chain (compressor + makeup gain) vs new chain (neural denoise, no comp)
    old_path = AUDIO / "vo-intro.compressed.wav"
    new_path = AUDIO / "vo-intro.wav"
    old, sr = read(old_path)
    new, _ = read(new_path)
    gap = np.zeros(int(0.8 * sr), dtype=np.float32)
    write(OUT / "ab-old-vs-new.wav", [at_lufs(old, sr), gap, at_lufs(new, sr)], sr)

    # 2) all nine in order, to check line-to-line consistency
    parts = []
    for key in ORDER:
        y, _ = read(AUDIO / f"vo-{key}.wav")
        parts.append(y)
        parts.append(np.zeros(int(0.45 * sr), dtype=np.float32))
    write(OUT / "voice-all-nine-v2.wav", parts, sr)


main()
