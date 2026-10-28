"""Cut a <=12s reference clip from the recording and transcribe it with whisper.

F5-TTS clips the reference to 12s but keeps your reference *text* verbatim, so a
25s recording + 25s transcript would be misaligned. This builds a 12s clip whose
spoken content is known exactly, by transcribing it with faster-whisper.

    python scripts/make_ref_clip.py

Writes ref/voice-ref12.wav and ref/ref-text.txt
"""
import os
import sys
import wave
from pathlib import Path

os.environ.setdefault("HF_ENDPOINT", "https://hf-mirror.com")

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "ref" / "voice-clean.wav"
CLIP = ROOT / "ref" / "voice-ref12.wav"
TEXT = ROOT / "ref" / "ref-text.txt"

# starts right after a 1.7s pause, ends at the end of the last voiced chunk
START = 12.46
MAX_SECONDS = 12.0


def read_wav(path: Path):
    with wave.open(str(path), "rb") as w:
        sr = w.getframerate()
        frames = w.readframes(w.getnframes())
    return np.frombuffer(frames, dtype="<i2").astype(np.float32) / 32768.0, sr


def write_wav(path: Path, samples: np.ndarray, sr: int):
    ints = (np.clip(samples, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(ints.tobytes())


def main():
    data, sr = read_wav(SRC)
    start = int(START * sr)
    end = min(len(data), start + int(MAX_SECONDS * sr))
    clip = data[start:end]
    write_wav(CLIP, clip, sr)
    print(f"clip: {len(clip)/sr:.2f}s -> {CLIP}")

    from faster_whisper import WhisperModel
    import librosa
    import soundfile as sf

    print("loading whisper (small) via mirror ...")
    # CPU is plenty for 12s of audio, and avoids ctranslate2 hunting for cuBLAS DLLs.
    model = WhisperModel("small", device="cpu", compute_type="int8", download_root=str(ROOT / "ref" / "whisper"))
    # Pass a numpy array: faster-whisper's file path branch goes through PyAV,
    # whose API drifted from the version this faster-whisper expects.
    audio, sample_rate = sf.read(str(CLIP), dtype="float32")
    if sample_rate != 16000:
        audio = librosa.resample(audio, orig_sr=sample_rate, target_sr=16000)
    segments, info = model.transcribe(
        audio.astype("float32"), language="zh", beam_size=5, vad_filter=False
    )
    text = "".join(seg.text for seg in segments).strip()
    print(f"language={info.language} prob={info.language_probability:.2f}")
    print(f"transcript: {text}")
    if len(text) < 8:
        sys.exit("transcription looks empty — check the clip")
    TEXT.write_text(text + "\n", encoding="utf-8")
    print(f"-> {TEXT}")


main()
