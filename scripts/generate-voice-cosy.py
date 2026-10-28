"""Generate the Chinese voiceover with CosyVoice2 preset speakers.

    .\\.venv\\Scripts\\python.exe scripts\\generate-voice-cosy.py
    .\\.venv\\Scripts\\python.exe scripts\\generate-voice-cosy.py --spk 中文男 --sample

CosyVoice2 ships SFT preset speakers (no reference clip needed), which is more
reliable than cloning from a noisy recording.

Writes public/audio/vo-<scene>.wav + src/generated/voice.json
"""
import argparse
import json
import math
import os
import sys
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPO = ROOT / "third_party" / "CosyVoice"
# CosyVoice2-0.5B ships no preset speakers (zero-shot only); the SFT build does.
MODEL_DIR = ROOT / "models" / "CosyVoice-300M-SFT"
AUDIO_DIR = ROOT / "public" / "audio"
MANIFEST = ROOT / "src" / "generated" / "voice.json"
SAMPLE_DIR = ROOT / "out" / "voice-samples"

FPS = 30
GAP_SECONDS = 0.45
SPEED = float(os.environ.get("VOICE_SPEED", "1.0"))

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
    parser = argparse.ArgumentParser()
    parser.add_argument("--spk", default="中文男")
    parser.add_argument("--model-dir", default=str(MODEL_DIR))
    parser.add_argument("--sample", action="store_true", help="only render the intro line into out/voice-samples")
    parser.add_argument("--speed", type=float, default=SPEED)
    parser.add_argument("--out-name", default="cosy-male", help="sample file stem")
    args = parser.parse_args()

    model_dir = Path(args.model_dir)
    if not model_dir.exists():
        sys.exit(f"missing model dir: {model_dir}")

    sys.path.insert(0, str(REPO))
    # CosyVoice's v1 flow matching imports `matcha`, which lives in a submodule.
    sys.path.insert(0, str(REPO / "third_party" / "Matcha-TTS"))
    import soundfile as sf
    import torch
    import torchaudio

    # torchaudio >= 2.9 dropped its own decoders (load/save now need torchcodec,
    # which wants system FFmpeg). CosyVoice only needs plain wav I/O here.
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

    from cosyvoice.cli.cosyvoice import CosyVoice, CosyVoice2

    load_jit = os.environ.get("LOAD_JIT", "0") == "1"
    is_v2 = (model_dir / "cosyvoice2.yaml").exists()
    print(f"loading {'CosyVoice2' if is_v2 else 'CosyVoice'} from {model_dir} (jit={load_jit}) ...")
    cls = CosyVoice2 if is_v2 else CosyVoice
    model = cls(str(model_dir), load_jit=load_jit, load_trt=False, fp16=False)
    spks = model.list_available_spks()
    print(f"preset speakers: {spks}")
    if args.spk not in spks:
        sys.exit(f"speaker {args.spk!r} not in {spks}")

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)

    lines = [LINES[0]] if args.sample else LINES
    durations = {}
    for index, (key, text) in enumerate(lines):
        out = (SAMPLE_DIR if args.sample else AUDIO_DIR) / (
            f"{args.out_name}.wav" if args.sample else f"vo-{key}.wav"
        )
        out.parent.mkdir(parents=True, exist_ok=True)
        print(f"[{index + 1}/{len(lines)}] {key}: {text}")
        chunks = []
        for result in model.inference_sft(text, args.spk, stream=False, speed=args.speed):
            chunks.append(result["tts_speech"])
        speech = torch.cat(chunks, dim=1) if len(chunks) > 1 else chunks[0]
        torchaudio.save(str(out), speech, model.sample_rate)
        seconds = wav_seconds(out)
        frames = int(math.ceil((seconds + GAP_SECONDS) * FPS))
        durations[key] = {"seconds": round(seconds, 2), "frames": frames, "text": text, "spk": args.spk}
        print(f"          -> {out.name}  {seconds:.2f}s = {frames} frames")

    if args.sample:
        print("sample written; listen before generating the rest")
        return

    payload = {
        "fps": FPS,
        "gapSeconds": GAP_SECONDS,
        "speaker": args.spk,
        "speed": args.speed,
        "totalFrames": sum(item["frames"] for item in durations.values()),
        "totalSeconds": round(sum(item["seconds"] for item in durations.values()), 2),
        "lines": durations,
    }
    MANIFEST.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\nvoice total: {payload['totalSeconds']}s  speaker={args.spk}")
    print(f"manifest   : {MANIFEST}")


main()
