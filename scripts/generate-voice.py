"""Generate the Chinese voiceover with a cloned voice (F5-TTS, zero-shot).

    .\\.venv\\Scripts\\python.exe scripts\\generate-voice.py

Clones the voice from ref/voice-clean.wav (recorded with scripts/record-voice.mjs),
generates one wav per scene into public/audio/, and writes the per-scene frame
counts to src/generated/voice.json so video.tsx can size each shot to its line.

Env:
    HF_ENDPOINT   defaults to the mirror that actually works here
    VOICE_DEVICE  auto | cuda | cpu
"""
import json
import math
import os
import sys
import wave
from pathlib import Path

os.environ.setdefault("HF_ENDPOINT", "https://hf-mirror.com")

ROOT = Path(__file__).resolve().parent.parent
# 12s clip + its exact transcript: F5-TTS clips the reference to 12s but keeps the
# transcript verbatim, so a longer reference would silently misalign.
REF_AUDIO = ROOT / "ref" / "voice-ref12.wav"
REF_TEXT_FILE = ROOT / "ref" / "ref-text.txt"
AUDIO_DIR = ROOT / "public" / "audio"
MANIFEST = ROOT / "src" / "generated" / "voice.json"
FPS = 30
GAP_SECONDS = 0.45  # breathing room after each line

MODEL = os.environ.get("VOICE_MODEL", "F5TTS_v1_Base")

# Must match ref/voice-ref12.wav verbatim — the model aligns text to that clip.
# Produced by scripts/make_ref_clip.py (whisper transcript, hand-corrected).

LINES = [
    ("intro", "这是一个能直接修改 EA SPORTS FC 27 存档的工具，FC27 存档编辑器。"),
    ("problem", "球员能力、阵容号码、国家队名单，在游戏里改起来都很麻烦。"),
    ("player", "输入名字搜索，点开就是完整资料，能力值直接改。"),
    ("teams", "球队页面能看阵容，批量改球衣号码。"),
    ("transfers", "转会只要选两支球队，点一下，人就过去了。"),
    ("national", "国家队选拔自动补满名单，号码一键分配。"),
    ("quick", "快捷功能可以批量调年龄、恢复老将巅峰、补齐缺失球员。"),
    ("safety", "所有修改先暂存，确认后另存为新文件，原存档永远不会被覆盖。"),
    ("outro", "本地运行，不联网，开源。"),
]


def wav_seconds(path: Path) -> float:
    with wave.open(str(path), "rb") as w:
        return w.getnframes() / float(w.getframerate())


def main():
    if not REF_AUDIO.exists():
        sys.exit(f"missing reference audio: {REF_AUDIO} — run scripts/make_ref_clip.py first")
    ref_text = REF_TEXT_FILE.read_text(encoding="utf-8").strip()
    if not ref_text:
        sys.exit(f"missing transcript: {REF_TEXT_FILE}")
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)

    device = os.environ.get("VOICE_DEVICE", "auto")
    if device == "auto":
        import torch

        device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"device   : {device}")
    print(f"model    : {MODEL}")
    print(f"reference: {REF_AUDIO.name} ({wav_seconds(REF_AUDIO):.2f}s)")
    print(f"ref text : {ref_text[:40]}...")
    print(f"hf       : {os.environ['HF_ENDPOINT']}")

    # torchaudio >= 2.9 removed its own decoders: load() now requires torchcodec,
    # which wants system FFmpeg. soundfile covers everything we need here.
    import soundfile as sf
    import torch
    import torchaudio

    def _sf_load(filepath, frame_offset=0, num_frames=-1, normalize=True, channels_first=True, **kwargs):
        data, sr = sf.read(str(filepath), dtype="float32", always_2d=True)
        wav = torch.from_numpy(data.T)
        if frame_offset:
            wav = wav[..., frame_offset:]
        if num_frames is not None and num_frames > 0:
            wav = wav[..., :num_frames]
        return wav, sr

    def _sf_save(filepath, src, sample_rate, **kwargs):
        array = src.detach().cpu().numpy()
        if array.ndim == 2:
            array = array.T
        sf.write(str(filepath), array, sample_rate)

    torchaudio.load = _sf_load
    torchaudio.save = _sf_save

    from f5_tts.api import F5TTS

    tts = F5TTS(model=MODEL, device=device)

    only = sys.argv[1] if len(sys.argv) > 1 else None
    durations = {}
    for index, (key, text) in enumerate(LINES):
        if only and key != only:
            continue
        out = AUDIO_DIR / f"vo-{key}.wav"
        print(f"[{index + 1}/{len(LINES)}] {key}: {text}")
        tts.infer(
            ref_file=str(REF_AUDIO),
            ref_text=ref_text,
            gen_text=text,
            file_wave=str(out),
            seed=20261026,
        )
        seconds = wav_seconds(out)
        frames = int(math.ceil((seconds + GAP_SECONDS) * FPS))
        durations[key] = {"seconds": round(seconds, 2), "frames": frames, "text": text}
        print(f"          -> {out.name}  {seconds:.2f}s = {frames} frames")

    if only:
        # merge into the existing manifest when regenerating a single line
        if MANIFEST.exists():
            old = json.loads(MANIFEST.read_text(encoding="utf-8"))
            old.get("lines", {}).update(durations)
            old["fps"] = FPS
            MANIFEST.write_text(json.dumps(old, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(f"updated {MANIFEST}")
        return

    total = sum(item["frames"] for item in durations.values())
    payload = {
        "fps": FPS,
        "gapSeconds": GAP_SECONDS,
        "totalFrames": total,
        "totalSeconds": round(sum(item["seconds"] for item in durations.values()), 2),
        "lines": durations,
    }
    MANIFEST.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\nvoice total: {payload['totalSeconds']}s ({total} frames + {GAP_SECONDS}s gaps per line)")
    print(f"manifest   : {MANIFEST}")


main()
