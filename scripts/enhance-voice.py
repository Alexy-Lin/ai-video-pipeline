"""Rebuild the voiceover with a clean chain: neural denoise -> LUFS -> limiter.

    python scripts/enhance-voice.py

No compressor. Compression + makeup gain was what destroyed the denoising
(SNR 30 dB -> 21 dB), because a compressor only squashes speech and then the
makeup gain lifts the untouched noise floor.

Input : vo-<key>.trimmed.wav   (raw recording, trimmed + peak normalised)
Output: vo-<key>.wav           (denoised, -16 LUFS, peaks < -1 dBFS)
"""
import os
import sys
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy.ndimage import minimum_filter1d

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / "public" / "audio"

TARGET_LUFS = float(os.environ.get("TARGET_LUFS", "-16.0"))
CEILING = 0.891
LOOKAHEAD_MS = 4.0
RELEASE_MS = 90.0

ORDER = ["intro", "problem", "player", "teams", "transfers", "national", "quick", "safety", "outro"]


def loudness(y, sr):
    return float(pyln.Meter(sr).integrated_loudness(y))


def stats(y, sr):
    hop = int(sr * 0.02)
    n = len(y) // hop
    rms = np.array([np.sqrt(np.mean(y[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
    db = 20 * np.log10(np.maximum(rms, 1e-9))
    floor = float(np.percentile(db, 10))
    speech = float(np.percentile(db, 95))
    return floor, speech, speech - floor


def limit(y, sr, ceiling=CEILING):
    peak = np.abs(y)
    if peak.max() <= ceiling:
        return y
    need = np.ones(len(y), dtype=np.float32)
    over = peak > ceiling
    need[over] = ceiling / peak[over]
    la = max(1, int(sr * LOOKAHEAD_MS / 1000))
    target = minimum_filter1d(need, size=la * 2 + 1, mode="nearest")
    coef = float(np.exp(-1.0 / (sr * RELEASE_MS / 1000.0)))
    gain = np.empty_like(target)
    cur = 1.0
    for i, want in enumerate(target):
        cur = want if want < cur else coef * cur + (1 - coef) * want
        gain[i] = cur
    return (y * gain).astype(np.float32)


def main():
    from clearvoice import ClearVoice

    print("loading MossFormer2_SE_48K ...")
    cv = ClearVoice(task="speech_enhancement", model_names=["MossFormer2_SE_48K"])

    print(f"target={TARGET_LUFS} LUFS, no compressor, ceiling={CEILING:.2f}")
    print(f"{'line':10s} {'SNR raw':>8s} {'SNR new':>8s} {'gain':>7s} {'LUFS':>7s} {'peak':>6s} {'dur':>7s}")

    for key in ORDER:
        src = AUDIO / f"vo-{key}.trimmed.wav"
        if not src.exists():
            sys.exit(f"missing {src}")

        y, sr = sf.read(str(src), dtype="float32", always_2d=True)
        y = y.mean(axis=1)
        _, _, snr_raw = stats(y, sr)

        # 1) neural denoise (model resamples internally, returns 48k)
        enhanced = cv(input_path=str(src), online_write=False)[0]
        enhanced = np.asarray(enhanced, dtype=np.float32)
        if enhanced.ndim > 1:
            enhanced = enhanced.mean(axis=0) if enhanced.shape[0] <= 2 else enhanced.mean(axis=1)

        # 2) loudness target with no dynamics processing; iterate gain -> limit
        #    so quiet lines actually land on the target instead of undershooting.
        out = enhanced
        gain_db = 0.0
        for _ in range(5):
            delta = TARGET_LUFS - loudness(out, sr)
            if abs(delta) < 0.3:
                break
            gain_db += delta
            out = limit(out * (10 ** (delta / 20.0)), sr)

        _, _, snr_new = stats(out, sr)
        final_lufs = loudness(out, sr)
        sf.write(str(AUDIO / f"vo-{key}.wav"), np.clip(out, -1, 1), sr, subtype="PCM_16")
        print(
            f"{key:10s} {snr_raw:8.1f} {snr_new:8.1f} {gain_db:+6.1f}dB {final_lufs:7.1f} "
            f"{float(np.max(np.abs(out))):6.3f} {len(out)/sr:6.2f}s"
        )


main()
