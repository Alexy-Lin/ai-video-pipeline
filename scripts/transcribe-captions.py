"""Transcribe the final voiceover with a large ASR model, with word timestamps.

    python scripts/transcribe-captions.py

Writes:
    src/generated/captions.json   per-line word timings (ms, relative to the line)
    out/voice-transcript-v2.txt   readable transcript
"""
import json
import os
import sys
from pathlib import Path

os.environ.setdefault("HF_ENDPOINT", "https://hf-mirror.com")

import librosa
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / "public" / "audio"
OUT_JSON = ROOT / "src" / "generated" / "captions.json"
OUT_TXT = ROOT / "out" / "voice-transcript-v2.txt"
MODEL_DIR = ROOT / "models" / "whisper"

ORDER = ["intro", "problem", "player", "teams", "transfers", "national", "quick", "safety", "outro"]
MODEL_NAME = os.environ.get("ASR_MODEL", "large-v3")
MODEL_PATH = os.environ.get("ASR_MODEL_DIR") or MODEL_NAME


def load_model():
    # ctranslate2 needs cuBLAS; torch ships it, but the DLL directory is not on
    # PATH by default. Point at it, and fall back to CPU if CUDA still fails.
    try:
        import torch

        torch_lib = Path(torch.__file__).parent / "lib"
        if torch_lib.exists():
            os.add_dll_directory(str(torch_lib))
    except Exception:
        pass

    from faster_whisper import WhisperModel

    attempts = [
        ("cuda", "float16"),
        ("cpu", "int8"),
    ]
    for device, compute in attempts:
        try:
            print(f"loading {MODEL_PATH} on {device}/{compute} (downloads weights on first run) ...")
            model = WhisperModel(MODEL_PATH, device=device, compute_type=compute, download_root=str(MODEL_DIR))
            # smoke test
            audio, sr = sf.read(str(AUDIO / "vo-intro.wav"), dtype="float32", always_2d=True)
            audio = audio.mean(axis=1)
            if sr != 16000:
                audio = librosa.resample(audio, orig_sr=sr, target_sr=16000)
            list(model.transcribe(audio.astype("float32"), language="zh", beam_size=1)[0])
            print(f"using {device}/{compute}")
            return model, device
        except Exception as error:
            print(f"  {device} failed: {type(error).__name__}: {str(error)[:120]}")
    sys.exit("could not load whisper on any device")


def main():
    model, device = load_model()

    captions = {}
    transcript_lines = []
    for key in ORDER:
        path = AUDIO / f"vo-{key}.wav"
        if not path.exists():
            sys.exit(f"missing {path}")

        audio, sr = sf.read(str(path), dtype="float32", always_2d=True)
        audio = audio.mean(axis=1)
        if sr != 16000:
            audio = librosa.resample(audio, orig_sr=sr, target_sr=16000)

        segments, info = model.transcribe(
            audio.astype("float32"),
            language="zh",
            beam_size=5,
            word_timestamps=True,
            vad_filter=False,
            initial_prompt="FC27 存档编辑器，球员能力值，球衣号码，国家队名单，快捷功能。",
        )

        words = []
        for seg in segments:
            for w in seg.words or []:
                text = w.word.strip()
                if not text:
                    continue
                words.append(
                    {
                        "text": text,
                        "startMs": int(round(w.start * 1000)),
                        "endMs": int(round(w.end * 1000)),
                    }
                )

        text = "".join(w["text"] for w in words)
        captions[key] = {
            "durationSeconds": round(len(audio) / sr, 3),
            "text": text,
            "words": words,
        }
        print(f"\n[{key}] {len(words)} words  {len(audio)/sr:.2f}s")
        print(f"  {text}")
        transcript_lines.append(f"[{key}] {text}")

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(
        json.dumps(
            {"model": MODEL_NAME, "modelPath": str(MODEL_PATH), "device": device, "language": "zh", "lines": captions},
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    OUT_TXT.write_text("\n".join(transcript_lines) + "\n", encoding="utf-8")
    print(f"\ncaptions -> {OUT_JSON}")
    print(f"transcript -> {OUT_TXT}")


main()
