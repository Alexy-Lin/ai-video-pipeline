"""Hand-correct whisper's homophone mistakes in the caption words.

    python scripts/fix-captions.py

Whisper large-v3 gets the timing right but mixes up a few homophones
(看/开, 只/支, 类/里, 编上条/批量调, 立成/另存, 球甲器/编辑器). Captions are burned
into the video, so these are fixed by index rather than left raw.
"""
import json
from pathlib import Path

import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
CAPTIONS = ROOT / "src" / "generated" / "captions.json"
TRANSCRIPT = ROOT / "out" / "voice-transcript-v2.txt"
AUDIO = ROOT / "public" / "audio"

# line -> {word index: replacement text}
FIXES = {
    "player": {9: "开"},
    "transfers": {8: "支"},
    "national": {8: "里"},
    "quick": {6: "批", 7: "量", 8: "调", 23: "齐"},
    "safety": {13: "另", 14: "存", 16: "一个"},
    "outro": {1: "编", 2: "辑"},
}

ORDER = ["intro", "problem", "player", "teams", "transfers", "national", "quick", "safety", "outro"]


def main():
    data = json.loads(CAPTIONS.read_text(encoding="utf-8"))

    for key, fixes in FIXES.items():
        words = data["lines"][key]["words"]
        for index, replacement in fixes.items():
            old = words[index]["text"]
            words[index]["text"] = replacement
            print(f"{key}[{index}]: {old} -> {replacement}")

    # tidy spacing and refresh the text/duration fields
    lines = []
    for key in ORDER:
        line = data["lines"][key]
        for word in line["words"]:
            word["text"] = word["text"].strip().replace(",", "，")
        line["text"] = "".join(w["text"] for w in line["words"])
        path = AUDIO / f"vo-{key}.wav"
        line["durationSeconds"] = round(sf.info(str(path)).duration, 3)
        last_end = max(w["endMs"] for w in line["words"])
        if last_end > line["durationSeconds"] * 1000 + 50:
            print(f"WARN {key}: last word ends at {last_end}ms beyond audio {line['durationSeconds']}s")
        lines.append(f"[{key}] {line['text']}")

    CAPTIONS.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    TRANSCRIPT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\ncorrected transcript:")
    for line in lines:
        print("  " + line)


main()
