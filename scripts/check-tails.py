"""Check whether each line ends abruptly (tail cut) or decays naturally."""
import wave
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / "public" / "audio"
ORDER = ["intro", "problem", "player", "teams", "transfers", "national", "quick", "safety", "outro"]

print(f"{'line':10s} {'dur':>6s} {'last-50ms RMS':>14s} {'end sample':>11s} {'silence tail':>13s} verdict")
for key in ORDER:
    y, sr = sf.read(str(AUDIO / f"vo-{key}.wav"), dtype="float32", always_2d=True)
    y = y.mean(axis=1)
    n = len(y)
    tail_rms = float(np.sqrt(np.mean(y[-int(0.05 * sr):] ** 2)))
    speech_rms = float(np.sqrt(np.mean(y ** 2)))
    end_value = float(abs(y[-1]))

    # how much true silence sits at the end
    win = int(0.01 * sr)
    frames = [float(np.sqrt(np.mean(y[i * win:(i + 1) * win] ** 2))) for i in range(n // win)]
    floor = float(np.percentile(frames, 10))
    silent = 0
    for value in reversed(frames):
        if value <= max(floor * 1.8, 1e-4):
            silent += 1
        else:
            break
    verdict = "CUT" if tail_rms > speech_rms * 0.25 and silent < 3 else "ok"
    print(
        f"{key:10s} {n/sr:5.2f}s {20*np.log10(max(tail_rms,1e-9)):11.1f}dB "
        f"{end_value:11.4f} {silent*0.01:11.2f}s  {verdict}"
    )
