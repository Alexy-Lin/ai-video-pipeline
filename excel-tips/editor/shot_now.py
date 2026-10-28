import ctypes, time
ctypes.windll.shcore.SetProcessDpiAwareness(2)
import win32gui, win32con
from PIL import ImageGrab

found = []
def cb(h, _):
    if win32gui.IsWindowVisible(h) and "Edge" in win32gui.GetWindowText(h):
        found.append(h)
    return True
win32gui.EnumWindows(cb, None)
print("edge windows:", [(h, win32gui.GetWindowText(h)) for h in found])
if found:
    h = found[0]
    win32gui.ShowWindow(h, win32con.SW_MAXIMIZE)
    try:
        win32gui.SetForegroundWindow(h)
    except Exception:
        pass
    time.sleep(1.2)
    ImageGrab.grab(bbox=win32gui.GetWindowRect(h)).save(
        r"D:\Software\AI Video\excel-tips\editor\editor-now.png")
    print("saved")
