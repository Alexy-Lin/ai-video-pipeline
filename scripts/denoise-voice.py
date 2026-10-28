"""Denoise the recorded voiceover.

    python scripts/denoise-voice.py

Per line: 80 Hz high-pass (removes rumble) -> spectral-gating denoise
(noisereduce, stationary mode) -> peak normalise. Originals are kept as
vo-<key>.trimmed.wav so the step can be redone with a different strength.

Also writes out/voice-ab-intro.wav: the intro line before/after, back to back.
"""
import os
import sys
import wave
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, filtfilt

ROOT = Path(__file__).resolve().parent.parent
AUDIO_DIR = ROOT / "public" / "audio"
AB_OUT = ROOT / "out" / "voice-ab-intro.wav"

PROP_DECREASE = float(os.environ.get("DENOISE_STRENGTH", "0.85"))
TARGET_PEAK = 0.89
HIGHPASS_HZ = 80.0

ORDER = ["intro", "problem", "player", "teams", "transfers", "national", "quick", "safety", "outro"]


def read_wav(path: Path):
    data, sr = sf.read(str(path), dtype="float32", always_2d=True)
    return data.mean(axis=1), sr


def write_wav(path: Path, samples: np.ndarray, sr: int):
    sf.write(str(path), np.clip(samples, -1, 1), sr, subtype="PCM_16")


def metrics(samples: np.ndarray, sr: int):
    hop = max(1, int(sr * 0.02))
    count = len(samples) // hop
    rms = np.array([np.sqrt(np.mean(samples[i * hop:(i + 1) * hop] ** 2)) for i in range(count)])
    db = 20 * np.log10(np.maximum(rms, 1e-9))
    return float(np.percentile(db, 15)), float(np.percentile(db, 95))


def denoise(samples: np.ndarray, sr: int):
    import noisereduce as nr

    b, a = butter(4, HIGHPASS_HZ / (sr / 2), btype="highpass")
    filtered = filtfilt(b, a, samples).astype(np.float32)
    reduced = nr.reduce_noise(
        y=filtered,
        sr=sr,
        stationary=True,
        prop_decrease=PROP_DECREASE,
        n_fft=1024,
        win_length=1024,
    )
    return np.asarray(reduced, dtype=np.float32)


def main():
    print(f"strength={PROP_DECREASE}  highpass={HIGHPASS_HZ:.0f}Hz")
    print(f"{'line':10s} {'floor':>7s} {'->':>7s} {'speech':>7s} {'->':>7s} {'SNR':>7s} {'->':>7s}")
    ab_parts = []
    for key in ORDER:
        path = AUDIO_DIR / f"vo-{key}.wav"
        if not path.exists():
            sys.exit(f"missing {path}")
        samples, sr = read_wav(path)
        backup = AUDIO_DIR / f"vo-{key}.trimmed.wav"
        if not backup.exists():
            write_wav(backup, samples, sr)

        before_floor, before_speech = metrics(samples, sr)
        clean = denoise(samples, sr)
        after_floor, after_speech = metrics(clean, sr)

        peak = float(np.max(np.abs(clean))) or 1.0
        clean = clean * (TARGET_PEAK / peak)
        write_wav(path, clean, sr)

        if key == "intro":
            silence = np.zeros(int(0.6 * sr), dtype=np.float32)
            ab_parts = [samples / (np.max(np.abs(samples)) or 1.0) * 0.7, silence, clean]

        print(
            f"{key:10s} {before_floor:6.1f} {after_floor:6.1f} "
            f"{before_speech:7.1f} {after_speech:7.1f} "
            f"{before_speech - before_floor:6.1f} {after_speech - after_floor:6.1f}"
        )

    if ab_parts:
        ab = np.concatenate(ab_parts)
        sf.write(str(AB_OUT), np.clip(ab, -1, 1), sr, subtype="PCM_16")
        print(f"\nA/B sample (before -> after): {AB_OUT}")


main()
