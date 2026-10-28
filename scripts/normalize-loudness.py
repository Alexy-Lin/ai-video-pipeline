"""Even out loudness across the spoken lines.

    python scripts/normalize-loudness.py

Peak normalisation (what the recorder does) does not equalise perceived volume:
one plosive drags a whole line down, which reads as "the sound keeps getting
louder and quieter". This does it properly:

    1. gentle compression   - narrows within-line dynamics
    2. LUFS normalisation   - every line to the same integrated loudness
    3. look-ahead limiter   - transparent peak control *after* the makeup gain

pedalboard's Limiter clamps its input to +/-1 first, so it cannot limit a signal
that has already been boosted past full scale. The limiter here is a small
numpy one that works on unbounded floats.

Reads from vo-<key>.denoised.wav so it can be re-run safely.
"""
import os
import sys
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from pedalboard import Compressor, Pedalboard
from scipy.ndimage import minimum_filter1d

ROOT = Path(__file__).resolve().parent.parent
AUDIO_DIR = ROOT / "public" / "audio"

TARGET_LUFS = float(os.environ.get("TARGET_LUFS", "-16.0"))
CEILING = float(os.environ.get("PEAK_CEILING", "0.89"))  # ~ -1 dBFS
COMP_THRESHOLD = float(os.environ.get("COMP_THRESHOLD", "-24.0"))
COMP_RATIO = float(os.environ.get("COMP_RATIO", "3.0"))
LOOKAHEAD_MS = 4.0
RELEASE_MS = 90.0

ORDER = ["intro", "problem", "player", "teams", "transfers", "national", "quick", "safety", "outro"]


def loudness(samples: np.ndarray, sr: int) -> float:
    return float(pyln.Meter(sr).integrated_loudness(samples))


def limit(samples: np.ndarray, sr: int, ceiling: float = CEILING) -> np.ndarray:
    """Look-ahead peak limiter: instant attack, smooth release."""
    peak = np.abs(samples)
    if peak.max() <= ceiling:
        return samples

    needed = np.ones(len(samples), dtype=np.float32)
    over = peak > ceiling
    needed[over] = ceiling / peak[over]

    lookahead = max(1, int(sr * LOOKAHEAD_MS / 1000.0))
    target = minimum_filter1d(needed, size=lookahead * 2 + 1, mode="nearest")

    release_coef = float(np.exp(-1.0 / (sr * RELEASE_MS / 1000.0)))
    gain = np.empty_like(target)
    current = 1.0
    for i, wanted in enumerate(target):
        if wanted < current:
            current = wanted  # attack immediately
        else:
            current = release_coef * current + (1.0 - release_coef) * wanted
        gain[i] = current
    return (samples * gain).astype(np.float32)


def main():
    board = Pedalboard(
        [Compressor(threshold_db=COMP_THRESHOLD, ratio=COMP_RATIO, attack_ms=6.0, release_ms=150.0)]
    )

    print(f"target={TARGET_LUFS} LUFS  comp={COMP_THRESHOLD}dB/{COMP_RATIO}:1  ceiling={CEILING:.2f}")
    print(f"{'line':10s} {'LUFS in':>8s} {'LUFS out':>9s} {'gain':>7s} {'peak in':>8s} {'peak out':>8s}")

    for key in ORDER:
        out_path = AUDIO_DIR / f"vo-{key}.wav"
        source = AUDIO_DIR / f"vo-{key}.denoised.wav"
        if not source.exists():
            sys.exit(f"missing {source} — run denoise-voice.py first")

        samples, sr = sf.read(str(source), dtype="float32", always_2d=True)
        mono = samples.mean(axis=1)
        before = loudness(mono, sr)

        compressed = np.asarray(board(mono, sr), dtype=np.float32)

        # Iterate gain -> limit until the line actually lands on the target.
        # A single pass undershoots on high-crest lines because the limiter
        # shaves back whatever the makeup gain added.
        out = compressed
        gain_db = 0.0
        peak_in = float(np.max(np.abs(out)))
        for _ in range(6):
            delta = TARGET_LUFS - loudness(out, sr)
            if abs(delta) < 0.25:
                break
            gain_db += delta
            peak_in = float(np.max(np.abs(out * (10 ** (delta / 20.0)))))
            out = limit(out * (10 ** (delta / 20.0)), sr)

        final = loudness(out, sr)
        peak_out = float(np.max(np.abs(out)))

        sf.write(str(out_path), np.clip(out, -1, 1), sr, subtype="PCM_16")
        print(
            f"{key:10s} {before:7.1f}  {final:8.1f} {gain_db:+6.1f}dB "
            f"{peak_in:8.2f} {peak_out:8.3f}"
        )

    print("\ndone — lines share one loudness target, peaks capped just under full scale")


main()
