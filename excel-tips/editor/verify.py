import json, time, urllib.request, ctypes, os
ctypes.windll.shcore.SetProcessDpiAwareness(2)
import win32gui
from PIL import ImageGrab

BASE = "http://127.0.0.1:8771"

# 1) 读
with urllib.request.urlopen(BASE + "/api/text") as r:
    text = json.load(r)["text"]
print("read bytes:", len(text.encode()))

# 2) 原样写回，验证保存链路
req = urllib.request.Request(
    BASE + "/api/save",
    data=json.dumps({"text": text}).encode(),
    headers={"Content-Type": "application/json"},
)
with urllib.request.urlopen(req) as r:
    print("save:", json.load(r))

# 3) 重新读，确认一致
with urllib.request.urlopen(BASE + "/api/text") as r:
    again = json.load(r)["text"]
print("roundtrip equal:", again == text)

# 4) 截图浏览器窗口
hwnd = win32gui.FindWindow(None, "EP03 口播稿 · 编辑器 和另外 6 个页面 - 个人 - Microsoft\u200bEdge")
if hwnd == 0:
    found = []
    def cb(h, _):
        t = win32gui.GetWindowText(h)
        if "口播稿" in t and win32gui.IsWindowVisible(h):
            found.append(h)
        return True
    win32gui.EnumWindows(cb, None)
    hwnd = found[0] if found else 0
print("hwnd:", hwnd)
if hwnd:
    win32gui.SetForegroundWindow(hwnd)
    time.sleep(0.8)
    ImageGrab.grab(bbox=win32gui.GetWindowRect(hwnd)).save(
        r"D:\Software\AI Video\excel-tips\editor\editor-shot.png")
    print("shot saved")
