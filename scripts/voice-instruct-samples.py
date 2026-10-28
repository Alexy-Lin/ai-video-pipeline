"""Render the same line with several emotion instructions so one can be picked by ear.

    .\\.venv\\Scripts\\python.exe scripts\\voice-instruct-samples.py

Loads CosyVoice-300M-Instruct once and renders every variant in VARIANTS.
Output: out/voice-samples/<stem>.wav
"""
import os
import sys
from pathlib import Path

os.environ.setdefault("HF_ENDPOINT", "https://hf-mirror.com")

ROOT = Path(__file__).resolve().parent.parent
REPO = ROOT / "third_party" / "CosyVoice"
MODEL_DIR = ROOT / "models" / "CosyVoice-300M-Instruct"
OUT_DIR = ROOT / "out" / "voice-samples"

TEXT = "这是一个能直接修改 EA SPORTS FC 27 存档的工具，FC27 存档编辑器。"
SPK = "中文男"

# (output stem, instruction, speed)
VARIANTS = [
    ("instr-happy", "用开心的语气说这句话", 1.0),
    ("instr-excited", "用兴奋的语气说这句话", 1.05),
    ("instr-light", "用轻快的语气说这句话", 1.1),
    ("instr-fast", "用尽可能快的语速说这句话", 1.1),
]


def main():
    sys.path.insert(0, str(REPO))
    sys.path.insert(0, str(REPO / "third_party" / "Matcha-TTS"))

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

    from cosyvoice.cli.cosyvoice import CosyVoice

    if not MODEL_DIR.exists():
        sys.exit(f"missing model: {MODEL_DIR}")
    print(f"loading instruct model from {MODEL_DIR} ...")
    model = CosyVoice(str(MODEL_DIR), load_jit=False, load_trt=False, fp16=False)
    print("preset speakers:", model.list_available_spks())

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for stem, instruct, speed in VARIANTS:
        print(f"\n[{stem}] {instruct} (speed={speed})")
        chunks = list(model.inference_instruct(TEXT, SPK, instruct, stream=False, speed=speed))
        speech = torch.cat([c["tts_speech"] for c in chunks], dim=1) if len(chunks) > 1 else chunks[0]["tts_speech"]
        out = OUT_DIR / f"{stem}.wav"
        torchaudio.save(str(out), speech, model.sample_rate)
        seconds = speech.shape[1] / model.sample_rate
        print(f"  -> {out.name}  {seconds:.2f}s")
    print("\ndone")


main()
