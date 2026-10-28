"""Process the raw voice captures into video-ready audio.

    python scripts/process-voice.py

For every line that has a raw capture under public/audio/raw/:
    raw -> conservative trim -> MossFormer2 denoise -> -16 LUFS -> limiter
and writes public/audio/vo-<key>.wav. Lines without a raw capture keep their
existing processed file. Finally rewrites src/generated/voice.json.

Trimming is deliberately generous: 0.25s head, 0.60s tail, and the cut point is
never closer than 0.35s to the last voiced frame — the previous version clipped
the ends of sentences because the tail pad was too tight for quiet final
syllables.
"""
import json
import math
import os
import sys
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy.ndimage import minimum_filter1d

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / "public" / "audio" / "raw"
OUT_DIR = ROOT / "public" / "audio"
MANIFEST = ROOT / "src" / "generated" / "voice.json"

FPS = 30
GAP_SECONDS = 0.45
TARGET_LUFS = float(os.environ.get("TARGET_LUFS", "-16.0"))
CEILING = 0.891
HEAD_PAD = 0.25
TAIL_PAD = 0.60
MIN_TAIL = 0.35

ORDER = ["intro", "problem", "player", "teams", "transfers", "national", "quick", "safety", "outro"]


def loudness(y, sr):
    return float(pyln.Meter(sr).integrated_loudness(y))


def frames_db(y, sr):
    hop = max(1, int(sr * 0.01))
    n = len(y) // hop
    rms = np.array([np.sqrt(np.mean(y[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
    return rms, 20 * np.log10(np.maximum(rms, 1e-9)), hop


def trim_safe(y, sr):
    """Cut leading/trailing silence without eating quiet final syllables."""
    _, db, hop = frames_db(y, sr)
    floor = float(np.percentile(db, 10))
    # a low threshold: only clearly-below-noise frames count as silence
    threshold = floor + 4.0
    voiced = np.where(db > threshold)[0]
    if len(voiced) == 0:
        return y, 0.0
    start = max(0, int(voiced[0] * hop - HEAD_PAD * sr))
    last_voiced = (voiced[-1] + 1) * hop
    end = min(len(y), int(last_voiced + max(TAIL_PAD, MIN_TAIL) * sr))
    return y[start:end], float(floor)


def limit(y, sr, ceiling=CEILING):
    peak = np.abs(y)
    if peak.max() <= ceiling:
        return y
    need = np.ones(len(y), dtype=np.float32)
    over = peak > ceiling
    need[over] = ceiling / peak[over]
    la = max(1, int(sr * 4.0 / 1000))
    target = minimum_filter1d(need, size=la * 2 + 1, mode="nearest")
    coef = float(np.exp(-1.0 / (sr * 90.0 / 1000.0)))
    gain = np.empty_like(target)
    cur = 1.0
    for i, want in enumerate(target):
        cur = want if want < cur else coef * cur + (1 - coef) * want
        gain[i] = cur
    return (y * gain).astype(np.float32)


def tail_report(y, sr):
    tail = float(np.sqrt(np.mean(y[-int(0.05 * sr):] ** 2)))
    body = float(np.sqrt(np.mean(y ** 2)))
    return 20 * np.log10(max(tail, 1e-9)), 20 * np.log10(max(body, 1e-9))


def main():
    raws = sorted(RAW_DIR.glob("vo-*.wav"))
    if not raws:
        sys.exit(f"no raw captures in {RAW_DIR}")

    from clearvoice import ClearVoice

    print("loading MossFormer2_SE_48K ...")
    cv = ClearVoice(task="speech_enhancement", model_names=["MossFormer2_SE_48K"])

    print(f"target={TARGET_LUFS} LUFS  head={HEAD_PAD}s tail={TAIL_PAD}s")
    print(f"{'line':10s} {'raw':>7s} {'trim':>7s} {'final':>7s} {'tail/body':>10s} {'LUFS':>7s}")

    lines = {}
    if MANIFEST.exists():
        lines = json.loads(MANIFEST.read_text(encoding="utf-8")).get("lines", {})

    # copy texts come from the editor's saved copy, not from ASR
    texts = {}
    lines_json = ROOT / "src" / "generated" / "lines.json"
    if lines_json.exists():
        for item in json.loads(lines_json.read_text(encoding="utf-8")):
            texts[item["key"]] = item.get("text", "")

    for key in ORDER:
        raw_path = RAW_DIR / f"vo-{key}.wav"
        if not raw_path.exists():
            print(f"{key:10s} (no raw capture — keeping existing processed file)")
            continue

        y, sr = sf.read(str(raw_path), dtype="float32", always_2d=True)
        y = y.mean(axis=1)
        raw_seconds = len(y) / sr

        trimmed, floor = trim_safe(y, sr)
        trimmed_path = OUT_DIR / f"vo-{key}.trimmed.wav"
        sf.write(str(trimmed_path), np.clip(trimmed, -1, 1), sr, subtype="PCM_16")

        enhanced = np.asarray(cv(input_path=str(trimmed_path), online_write=False)[0], dtype=np.float32)
        if enhanced.ndim > 1:
            enhanced = enhanced.mean(axis=0) if enhanced.shape[0] <= 2 else enhanced.mean(axis=1)

        out = enhanced
        for _ in range(5):
            delta = TARGET_LUFS - loudness(out, sr)
            if abs(delta) < 0.3:
                break
            out = limit(out * (10 ** (delta / 20.0)), sr)

        sf.write(str(OUT_DIR / f"vo-{key}.wav"), np.clip(out, -1, 1), sr, subtype="PCM_16")
        seconds = len(out) / sr
        frames = int(math.ceil((seconds + GAP_SECONDS) * FPS))
        lines[key] = {
            "seconds": round(seconds, 2),
            "frames": frames,
            "text": texts.get(key, ""),
            "source": "recorded",
        }
        tail_db, body_db = tail_report(out, sr)
        print(
            f"{key:10s} {raw_seconds:6.2f}s {len(trimmed)/sr:6.2f}s {seconds:6.2f}s "
            f"{tail_db:5.0f}/{body_db:3.0f}dB {loudness(out, sr):7.1f}"
        )

    if MANIFEST.exists() and lines:
        payload = json.loads(MANIFEST.read_text(encoding="utf-8"))
        payload["lines"] = lines
        payload["totalSeconds"] = round(sum(v["seconds"] for v in lines.values()), 2)
        payload["totalFrames"] = sum(v["frames"] for v in lines.values())
        payload["fps"] = FPS
        payload["gapSeconds"] = GAP_SECONDS
        MANIFEST.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"\nvoice.json updated: {payload['totalSeconds']}s")


main()
