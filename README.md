# FC27 Editor 介绍视频（自动化流水线）

用 [Remotion](https://www.remotion.dev/) 把**真实运行的 FC27 编辑器操作过程**录成帧序列，
配上**开源模型克隆的中文配音**，自动合成一条 1080p 介绍视频。
改文案、改操作流程、重录配音、重新渲染，全程不需要开剪辑软件。

产物：`out/fc27-intro.mp4`（1920×1080 · 30fps · 67.9 秒 · 配音 + 逐词字幕）

## 字幕与配音

- 配音是真人录音（`public/audio/raw/` 保存未裁剪的原始音频）。
- 字幕用 **whisper large-v3** 识别（词级时间戳），逐词绿色高亮，位于画面下方的深色区，不遮挡界面。
- 识别出的同音错在 `scripts/fix-captions.py` 里按词索引手工校正（看/开、只/支、类/里、编上条/批量调、立成/另存、球甲器/编辑器）。
- 句尾留白 0.2 秒（`voice.json` 的 `gapSeconds`）。

音频处理链（`scripts/process-voice.py`）：原始录音 → 保守裁剪（头 0.25s / 尾 0.60s）→ **MossFormer2_SE_48K** 神经网络降噪 → 迭代对齐到 **−16 LUFS** → 前瞻限幅（峰值 −1dBFS）。

> 踩过的坑：压缩器会把降噪白做——它只压语音、不动噪声，随后补增益又把噪声抬起来（SNR 30dB → 21dB）。所以这条链里**没有压缩器**，只有 LUFS 对齐 + 限幅。

## 三块拼起来

| 环节 | 做法 | 工具 |
|---|---|---|
| **画面** | Playwright 操作真实 UI + CDP 逐帧采集 → 重采样 30fps | Chromium |
| **配音** | 零样本音色克隆，逐句生成 | F5-TTS（MIT） |
| **合成** | 帧序列 + 标注 + 字幕条 + 转场 + 音轨，逐帧渲染 | Remotion |

## 目录

```
scripts/
  capture-frames.mjs     录 5 条真实操作流程 -> 帧序列 + 清单（画面主力）
  capture.mjs            截 7 张静态 2x 图（备用素材）
  record-voice.mjs       浏览器录音工具，存 ref/voice.wav
  prep_voice_ref.py      去首尾静音 + 峰值归一化
  make_ref_clip.py       裁 12s 参考片段 + whisper 转写
  generate-voice.py      克隆音色逐句生成配音 + 写帧数清单
  contact_sheet.py       九幕预览拼图（审片）
src/
  Video.tsx              分镜表：画面、文案、标注、时长（自动让位于配音）
  scenes/LiveFeatureScene.tsx  帧序列播放器 + 浏览器外壳 + 标注
  scenes/Intro|Problem|Safety|Outro.tsx  文字幕 + 配音
  generated/*Frames.json 帧清单   generated/voice.json 配音帧数
public/frames/           真实帧序列（133MB）   public/audio/ 配音 wav
ref/                     参考录音、12s 片段、转写文本
.venv/                   torch(cu128) + f5-tts + faster-whisper
out/                     渲染结果
```

## 完整流程

```powershell
# 0. 启动编辑器（另开窗口，保持运行）
cd "D:\Software\FC27 Editor"; python web_app.py

# 1. 录真实操作画面（约 1.5 分钟，产出 ~133MB 素材）
cd "D:\Software\AI Video"; node scripts/capture-frames.mjs

# 2. 录参考人声（浏览器里点一下就行；只需做一次）
node scripts/record-voice.mjs --open            # http://127.0.0.1:8799
.\.venv\Scripts\python.exe scripts\prep_voice_ref.py
.\.venv\Scripts\python.exe scripts\make_ref_clip.py

# 3. 生成配音（首次会从镜像下模型，之后 20 秒/句）
$env:HF_ENDPOINT = "https://hf-mirror.com"
.\.venv\Scripts\python.exe scripts\generate-voice.py

# 4. 渲染成片
npx remotion render src/index.ts FC27Intro out/fc27-intro.mp4 `
  --browser-executable="C:\Program Files\Google\Chrome\Application\chrome.exe"
```

实时预览：`npx remotion studio src/index.ts`

## 配音是怎么克隆的

1. **录参考音**：网页录音工具直接存 48kHz 单声道 WAV，带实时电平表和 25 秒上限。
2. **裁 12 秒**：F5-TTS 会把参考音频裁到 12 秒，但**不会**裁你的参考文本——直接给 25 秒的
   录音配 25 秒的文本，两者对不上，克隆就废了。所以先裁一段 12 秒、再单独转写它。
3. **转写**：faster-whisper(small) 转写这 12 秒，人工校正同音字（一箭→一键）。
4. **生成**：F5-TTS `F5TTS_v1_Base` 零样本克隆，逐句生成，固定 seed 保证可复现。

改文案：编辑 `scripts/generate-voice.py` 里的 `LINES`，重跑第 3 步即可。
只重做某一句：`generate-voice.py player`。

## 时长怎么对齐

每句配音生成后会算出帧数写进 `src/generated/voice.json`，
`Video.tsx` 里每个镜头取 **`max(画面时长, 配音帧数 + 12)`**：

- 配音比画面短 → 用画面时长，动作录完后停住等语音说完
- 配音比画面长 → 镜头自动拉长，最后一帧静止

所以**改文案不用手动改时长**，重新生成配音 + 重渲即可。

## 改内容在哪改

| 想改的东西 | 改哪里 |
| --- | --- |
| 某一幕文案/标注位置/标注时点 | `src/Video.tsx` 的 `SHOTS` |
| 配音台词 | `scripts/generate-voice.py` 的 `LINES` |
| 操作流程本身 | `scripts/capture-frames.mjs` 的 `FLOWS` |
| 开场/痛点/安全/结尾文字 | `src/scenes/*.tsx` |
| 配色、字号 | `src/theme.ts` |

> 刻意**不做任何缩放/推镜头**：屏幕内容信息密度高，再加镜头运动会让人看着难受。
> 动感只来自真实录制的操作过程。

## 环境说明

- Node.js 24 + 本机 Chrome（渲染时用 `--browser-executable`，省掉再下一个 Headless Shell）
- CUDA 版 torch 必须匹配 Blackwell：`torch 2.10.0+cu128`（`cu128` 索引里的版本才对 sm_120 有效）
- 模型权重走 `HF_ENDPOINT=https://hf-mirror.com`
- 已知坑：`download-r2.pytorch.org` 的 CDN 在本机连不上，要用 `download.pytorch.org` 主站直连下载 wheel
