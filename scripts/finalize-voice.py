"""Finalise the human voiceover: adaptive silence trim, normalise, transcribe, manifest.

    python scripts/finalize-voice.py

The browser records at a fixed absolute threshold, which fails on a mic whose
noise floor sits above it (long silent heads/tails stay in). This re-trims with a
threshold derived from each file's own noise floor, then writes:
    public/audio/vo-<key>.wav      (rewritten, trimmed + normalised)
    src/generated/voice.json       (frames = ceil((seconds + gap) * 30))
    out/voice-transcript.txt       (what was actually said, per line)
"""
import json
import math
import os
import sys
import wave
from pathlib import Path

os.environ.setdefault("HF_ENDPOINT", "https://hf-mirror.com")

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
AUDIO_DIR = ROOT / "public" / "audio"
MANIFEST = ROOT / "src" / "generated" / "voice.json"
TRANSCRIPT = ROOT / "out" / "voice-transcript.txt"
WHISPER_DIR = ROOT / "ref" / "whisper"

FPS = 30
GAP_SECONDS = 0.45
PAD_HEAD = 0.12
PAD_TAIL = 0.18
TARGET_PEAK = 0.89

ORDER = [
    ("intro", "开场"),
    ("problem", "痛点"),
    ("player", "球员编辑"),
    ("teams", "球队编辑"),
    ("transfers", "快捷转会"),
    ("national", "国家队选拔"),
    ("quick", "快捷功能"),
    ("safety", "安全机制"),
    ("outro", "结尾"),
]


def read_wav(path: Path):
    data, sr = sf.read(str(path), dtype="float32", always_2d=True)
    mono = data.mean(axis=1)
    return mono, sr


def write_wav(path: Path, samples: np.ndarray, sr: int):
    sf.write(str(path), np.clip(samples, -1, 1), sr, subtype="PCM_16")


def trim(samples: np.ndarray, sr: int):
    hop = max(1, int(sr * 0.02))
    count = len(samples) // hop
    if count == 0:
        return samples, 0.0, 0.0
    rms = np.array([np.sqrt(np.mean(samples[i * hop:(i + 1) * hop] ** 2)) for i in range(count)])
    db = 20 * np.log10(np.maximum(rms, 1e-9))
    floor = float(np.percentile(db, 15))
    loud = float(np.percentile(db, 95))
    threshold = floor + 8.0
    voiced = np.where(db > threshold)[0]
    if len(voiced) == 0:
        return samples, floor, loud
    start = max(0, int(voiced[0] * hop - PAD_HEAD * sr))
    end = min(len(samples), int((voiced[-1] + 1) * hop + PAD_TAIL * sr))
    return samples[start:end], floor, loud


def main():
    files = []
    for key, label in ORDER:
        path = AUDIO_DIR / f"vo-{key}.wav"
        if not path.exists():
            sys.exit(f"missing {path}")
        files.append((key, label, path))

    print(f"{'line':10s} {'before':>7s} {'after':>7s} {'chg':>7s}  noise  speech")
    trimmed = {}
    for key, label, path in files:
        samples, sr = read_wav(path)
        before = len(samples) / sr
        cut, floor, loud = trim(samples, sr)
        peak = float(np.max(np.abs(cut))) if len(cut) else 0.0
        if peak > 0:
            cut = cut * (TARGET_PEAK / peak)
        write_wav(path, cut, sr)
        after = len(cut) / sr
        trimmed[key] = {"label": label, "seconds": after, "sr": sr}
        print(f"{key:10s} {before:6.2f}s {after:6.2f}s {after - before:+6.2f}s  {floor:5.1f}  {loud:5.1f}")

    # transcribe what was actually said (the recording is the source of truth)
    print("\nloading whisper (small, cpu) ...")
    from faster_whisper import WhisperModel

    model = WhisperModel("small", device="cpu", compute_type="int8", download_root=str(WHISPER_DIR))
    lines_out = {}
    transcript_lines = []
    for key, label, path in files:
        samples, sr = read_wav(path)
        if sr != 16000:
            import librosa

            samples = librosa.resample(samples, orig_sr=sr, target_sr=16000)
        segments, _ = model.transcribe(samples.astype("float32"), language="zh", beam_size=5, vad_filter=False)
        text = "".join(seg.text for seg in segments).strip()
        seconds = trimmed[key]["seconds"]
        frames = int(math.ceil((seconds + GAP_SECONDS) * FPS))
        lines_out[key] = {
            "seconds": round(seconds, 2),
            "frames": frames,
            "text": text,
            "source": "recorded",
            "label": label,
        }
        rate = len(text) / seconds if seconds else 0
        print(f"\n[{key}] {seconds:.2f}s  {len(text)}字  {rate:.2f}字/秒")
        print(f"  {text}")
        transcript_lines.append(f"[{key}] {seconds:.2f}s  {text}")

    payload = {
        "fps": FPS,
        "gapSeconds": GAP_SECONDS,
        "speaker": "human",
        "totalFrames": sum(item["frames"] for item in lines_out.values()),
        "totalSeconds": round(sum(item["seconds"] for item in lines_out.values()), 2),
        "lines": lines_out,
    }
    MANIFEST.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    TRANSCRIPT.write_text("\n".join(transcript_lines) + "\n", encoding="utf-8")
    print(f"\ntotal voice: {payload['totalSeconds']}s")
    print(f"manifest   : {MANIFEST}")
    print(f"transcript : {TRANSCRIPT}")


main()
