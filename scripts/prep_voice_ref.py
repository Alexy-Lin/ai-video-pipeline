"""Trim silence and normalise the recorded voice-cloning reference.

    python scripts/prep_voice_ref.py

Reads  ref/voice.wav
Writes ref/voice-clean.wav  (trimmed + peak normalised, full length)
       ref/voice-12s.wav    (densest 12s window; F5-TTS style models prefer <12s)
"""
import sys
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "ref" / "voice.wav"
CLEAN = ROOT / "ref" / "voice-clean.wav"
SHORT = ROOT / "ref" / "voice-12s.wav"

FLOOR_DB = -42.0        # anything under this counts as silence
PAD = 0.12              # seconds kept around speech
TARGET_PEAK = 0.89      # -1 dBFS


def read_wav(path: Path):
    with wave.open(str(path), "rb") as w:
        sr = w.getframerate()
        ch = w.getnchannels()
        width = w.getsampwidth()
        frames = w.readframes(w.getnframes())
    if width != 2:
        sys.exit(f"expected 16-bit PCM, got {width * 8}-bit")
    data = np.frombuffer(frames, dtype="<i2").astype(np.float32) / 32768.0
    if ch > 1:
        data = data.reshape(-1, ch).mean(axis=1)
    return data, sr


def write_wav(path: Path, samples: np.ndarray, sr: int):
    clipped = np.clip(samples, -1.0, 1.0)
    ints = (clipped * 32767.0).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(ints.tobytes())


def db(x: float) -> float:
    return 20.0 * np.log10(max(x, 1e-9))


def main():
    if not SRC.exists():
        sys.exit(f"missing {SRC} — record first with scripts/record-voice.mjs")

    data, sr = read_wav(SRC)
    total = len(data) / sr
    print(f"input : {total:.2f}s  {sr}Hz  peak={db(np.abs(data).max()):.1f}dBFS  rms={db(np.sqrt((data**2).mean())):.1f}dBFS")

    hop = int(sr * 0.05)
    frames = len(data) // hop
    rms = np.array([
        np.sqrt(np.mean(data[i * hop:(i + 1) * hop] ** 2)) for i in range(frames)
    ])
    env_db = 20 * np.log10(np.maximum(rms, 1e-9))

    # compact envelope map, 0.5s per cell
    cells = []
    for i in range(0, len(env_db), 10):
        chunk = env_db[i:i + 10]
        level = chunk.max()
        cells.append("#" if level > -20 else "+" if level > -30 else "-" if level > FLOOR_DB else ".")
    print("envelope (0.5s per char, # loud + mid - quiet . silence):")
    for start in range(0, len(cells), 80):
        print(f"  {start * 0.5:5.1f}s  {''.join(cells[start:start + 80])}")

    voiced = np.where(env_db > FLOOR_DB)[0]
    if len(voiced) == 0:
        sys.exit("no speech detected above the noise floor")
    start = max(0, int(voiced[0] * hop - PAD * sr))
    end = min(len(data), int((voiced[-1] + 1) * hop + PAD * sr))

    trimmed = data[start:end].copy()
    peak = np.abs(trimmed).max()
    trimmed *= TARGET_PEAK / max(peak, 1e-6)
    write_wav(CLEAN, trimmed, sr)
    print(f"\nclean : {len(trimmed)/sr:.2f}s  peak={db(np.abs(trimmed).max()):.1f}dBFS  rms={db(np.sqrt((trimmed**2).mean())):.1f}dBFS")
    print(f"        -> {CLEAN}")

    # densest 12s window (by voiced energy) for models that want a short reference
    win = int(min(12.0, len(trimmed) / sr) * sr)
    step = int(sr * 0.25)
    best_start, best_score = 0, -1.0
    for s in range(0, max(1, len(trimmed) - win + 1), step):
        seg = trimmed[s:s + win]
        score = float(np.sqrt((seg ** 2).mean()))
        if score > best_score:
            best_score, best_start = score, s
    short = trimmed[best_start:best_start + win]
    write_wav(SHORT, short, sr)
    print(f"short : {len(short)/sr:.2f}s (from {best_start/sr:.1f}s)  -> {SHORT}")


main()
