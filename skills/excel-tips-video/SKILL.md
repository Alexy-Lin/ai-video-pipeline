---
name: excel-tips-video
description: 用 Remotion 把「Excel 技巧」类短视频从口播稿一路做到成片：分句时间轴、真鼠标录屏、降噪人声、黄字黑边字幕、BGM 闪避、渲染验收。当需要做软件教学/录屏类短视频、给已有录屏加字幕音轨、或复用 EP03 迷你图那套流程时使用。
metadata:
  version: "1.1.0"
  date: "2026-10-29"
---

# Excel 技巧短视频生产流程

本地工程：`D:\Software\AI Video`（Remotion + Python venv + ffmpeg）。
EP03 迷你图的可复用产物：
- 成片 `out/ep03-v5.mp4`（41.5s / 1920×1080 / 真录屏 + 降噪人声 + 钢琴 BGM）
- 口播稿 `excel-tips/EP03-口播稿.txt`，分句时间 `excel-tips/audio/sentences.json`
- 录音接口 `excel-tips/audio/recorder.py`（http://127.0.0.1:8798/，分段录、可保存/重录）
- 处理链 `excel-tips/audio/prepare.py` → `join.py` → `denoise-moss.py`
- 录屏脚本 `excel-tips/build/rec10.py`（真鼠标）／`kf*.py`（关键帧截图，已淘汰）
- Remotion 入口 `src/excelrec3/index.tsx`（成片）、`src/excelv3/index.tsx`（含开场动画）、`src/excelcoverv2`（封面）

## 一、顺序

1. **口播稿**：8 句以内，一句一个动作；每句写进 `sentences.json`（`text / from / to`，单位秒）。
2. **录音**：用户自己录，用 `recorder.py` 分段（2–3 句一段），每段可保存/重录，导出 `raw/seg-N-<ts>.webm`。
3. **音频处理**（顺序不能颠倒）：
   ```powershell
   .\.venv\Scripts\python.exe excel-tips\audio\prepare.py     # webm→wav，取每段最新一条
   .\.venv\Scripts\python.exe excel-tips\audio\denoise-moss.py # MossFormer2_SE_48K 降噪 + 长度对齐
   .\.venv\Scripts\python.exe excel-tips\audio\join.py         # 0.45s 间隔拼接
   ```
   降噪要点：模型在 `checkpoints/MossFormer2_SE_48K`；降噪会把底噪从 −41dB 打到 −83dB，但**必须断言时长漂移 0%**，否则字幕会错位。人声只做 −16 LUFS + 峰值 −1dBFS，不加压缩。
   开头静音要剪：用 20ms 帧 RMS 找第一帧 > −40dB，前面留 0.13s 气口，**字幕和录屏切入点同步平移**。
4. **录屏**：见下节。输出 2000×1150 @(40,30) 的 mp4。
5. **Remotion 合成**：录屏 + 人声 + 字幕 + BGM + 结论卡，渲染：
   ```powershell
   cmd /c "npx remotion render src/excelrec3/index.tsx Ep03RecB out/ep03-v5.mp4 --log=error"
   ```
   `npx.ps1` 被执行策略挡，必须走 `cmd /c`。
6. **验收**：`ffmpeg -ss <t> -i out.mp4 -frames:v 1` 抽每句句首/句中/句尾各一帧，逐帧对字幕，确认「画面动作不早于口播」。

## 二、录屏（EP03 踩出来的硬规矩）

- 全用 **pyautogui 真鼠标/真键盘**；COM 只用来「事后断言」，绝不用 COM 代替动作（否则画面里什么都没发生）。
- `ffmpeg -f gdigrab -framerate 30 -draw_mouse 1 -offset_x 40 -offset_y 30 -video_size 2000x1150 -i desktop`，crf 16。
- 动作时间锁死口播：每步 `until(plan)` + 记录 `{name, t, plan}`，结束打印最大偏差；超过 ~1.5s 就重录。
- 每步断言看**效果**不看 UI 对象：`Selection.Address`、`SparklineGroups.Count`、`Points.Highpoint.Visible`。
- **对话框关掉后再用 UIA 判断是否关闭**是错的（UIA 对象关窗后仍报存在）→ 用 `EnumWindows` 重新枚举窗口类名判断。
- Excel「创建迷你图」硬性要求「位置范围行数 = 数据范围行数」：选整块 B2:H7 + 位置 I2 会**静默失败**；选第一行 B2:H2 才成功。
- 窗口必须 `HWND_TOPMOST` + `ensure_front()`，否则第一次点击只激活窗口、不选中单元格。
- 录前把功能区切回「开始」页并断言（否则录屏一开始就停在结果页，等于剧透）。

## 三、字幕与画面

- 字：微软雅黑 900、46px、`#FFD400`，黑描边（4 向 3px + 10px 模糊）；整幅 1920 居中，底部 54px。
- 禁整段缓慢推镜；只在段首 8 帧快速推到位。
- 录屏画面按 0.96 倍铺满（2000→1920），清晰、文字够大。
- 结论卡：绿色描边浮层「周末客流 ≈ 工作日 1.8 倍」，在结论句出现时淡入。

## 四、EP04 预测工作表（2026-10-29，横屏 1920×1080）

产物：成片 `out/ep04-v4.mp4`（34s）· 口播 6 句 31.54s（`audio/sentences.json`）· 封面三尺寸（见 `video-cover-design`）

**片头必须是自建动画展示成品，不能用原始数据页/纯录屏开场**（用户明确要求，EP04 就是先做错、被要求重做）。
- `src/excelrec5/Intro.tsx`：SVG 重绘与录屏同一份数据（HIST/FORE/LOW/UP 必须和录屏数字一致），
  顺序＝标题 → 坐标轴 → 蓝线生长（`pathLength=1` + dashoffset）→ 橙预测线延伸（clipPath 揭示）→ 扇形淡入 → 标注 → 定格。
- 节奏（用户两轮反馈后定的）：成品成形 ~3.1s，**定格 ~1.5s**，4.77s 切真录屏；整体比第一版快 0.72×。
  切点要保证后面的「选中 A1→Shift 点 B25」动作还完整在画面里。

录屏（`excel-tips/build/rec22-ep04.py`，2000×1350@(40,30)）：
- 选中范围**用「点 A1 + Shift 点 B25」**，别拖——从已选中单元格起拖会变成「移动单元格内容」。
- 打开「预测工作表」对话框后，生成后要等 `C26 > 1` 再按 Esc，Esc 太早会取消计算，数值全 0。
- 录前把其它窗口最小化 + 点标题栏 + `Ctrl+Home` 验证焦点，否则点击会落到浏览器上。

合成（`src/excelrec5/index.tsx`）：视频 left 60 / top −27 / 1800×1215（缩放 0.9）；BGM 0.72；字幕 46px `#FFD400` 黑描边；
22.7s 起挂 Callout「统计模型/数据不足时仅供参考」；33.1–33.9 淡出。

音频（`excel-tips/audio/build-audio-ep04.py`）：能量 VAD 裁剪 → MossFormer2 降噪 → 两句一段按最长内部停顿切分 → 0.45s 拼接 → −16 LUFS + 前瞻限幅。
录音服务 `recorder-ep04.py`（端口 8798）收工后记得杀掉，否则会一直躺在后台任务列表里。
