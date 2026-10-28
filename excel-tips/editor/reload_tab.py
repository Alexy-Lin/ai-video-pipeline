import ctypes, time
ctypes.windll.shcore.SetProcessDpiAwareness(2)
import win32gui, win32con, win32api
from PIL import ImageGrab

found = []
def cb(h, _):
    if win32gui.IsWindowVisible(h) and "Edge" in win32gui.GetWindowText(h):
        found.append(h)
    return True
win32gui.EnumWindows(cb, None)
h = found[0]
win32gui.ShowWindow(h, win32con.SW_MAXIMIZE)
for _ in range(4):
    try:
        win32gui.SetForegroundWindow(h)
    except Exception:
        pass
    time.sleep(0.25)
win32api.keybd_event(win32con.VK_F5, 0, 0, 0)
time.sleep(0.05)
win32api.keybd_event(win32con.VK_F5, 0, win32con.KEYEVENTF_KEYUP, 0)
time.sleep(3.5)
print("title:", win32gui.GetWindowText(h).encode("utf-8", "ignore").decode("utf-8", "ignore").replace("\u200b", ""))
ImageGrab.grab(bbox=win32gui.GetWindowRect(h)).save(
    r"D:\Software\AI Video\excel-tips\editor\editor-final.png")
print("saved")
