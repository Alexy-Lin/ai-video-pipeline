/**
 * Local voice-recording tool for building the cloning reference clip.
 *
 *   node scripts/record-voice.mjs        ->  http://127.0.0.1:8799
 *
 * Records mono 16-bit PCM WAV straight into ref/. No ffmpeg, no dependencies:
 * the page captures raw PCM with an AudioContext and the Node server only writes
 * the bytes to disk.
 */
import http from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const PORT = Number(process.env.PORT ?? 8799);
const REF_DIR = path.resolve('ref');

const REFERENCE_TEXT =
  '大家好，这里是 FC27 存档编辑器。它可以直接修改球员的能力值，批量调整球衣号码，' +
  '完成俱乐部之间的转会，也能一键补全国家队名单。所有修改都会先暂存，确认之后另存为新存档，' +
  '原来的存档永远不会被覆盖。';

const PAGE = /* html */ `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>录音 · FC27 视频配音参考</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: radial-gradient(1200px 700px at 70% 15%, #123a28, #0a2018 48%, #050f0b);
    color: #f2f7f4; font-family: "Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif;
    padding: 32px;
  }
  .card {
    width: min(980px, 100%); background: rgba(6,18,13,.82); border: 1px solid rgba(255,255,255,.10);
    border-radius: 20px; padding: 34px 38px 30px; box-shadow: 0 40px 120px rgba(0,0,0,.55);
  }
  h1 { margin: 0 0 6px; font-size: 26px; letter-spacing: .5px; }
  .sub { color: #9db3a8; font-size: 14px; margin-bottom: 22px; }
  .script {
    padding: 20px 22px; border-radius: 14px; background: rgba(61,220,132,.07);
    border: 1px solid rgba(61,220,132,.28); font-size: 21px; line-height: 1.85; letter-spacing: .3px;
  }
  .hints { display: flex; gap: 18px; margin: 16px 0 22px; flex-wrap: wrap; color: #9db3a8; font-size: 13px; }
  .hints span::before { content: "·"; color: #3ddc84; margin-right: 7px; }
  .meter { height: 74px; display: flex; align-items: center; gap: 3px; margin-bottom: 10px; }
  .meter i { flex: 1; background: rgba(255,255,255,.08); border-radius: 2px; transition: height .06s linear; }
  .meter i.on { background: #3ddc84; }
  .meter i.hot { background: #f5c542; }
  .meter i.clip { background: #ff5f57; }
  .row { display: flex; align-items: center; gap: 18px; }
  .timer { font-variant-numeric: tabular-nums; font-size: 30px; font-weight: 700; min-width: 96px; }
  .timer.rec { color: #ff5f57; }
  button {
    font-family: inherit; font-size: 16px; font-weight: 700; padding: 13px 26px; border-radius: 12px;
    border: 1px solid transparent; cursor: pointer; background: #3ddc84; color: #04140c;
  }
  button.ghost { background: transparent; border-color: rgba(255,255,255,.22); color: #f2f7f4; }
  button:disabled { opacity: .4; cursor: not-allowed; }
  .status { margin-top: 18px; font-size: 14px; color: #9db3a8; min-height: 22px; }
  .status.ok { color: #3ddc84; }
  .status.err { color: #ff8a80; }
  audio { width: 100%; margin-top: 16px; }
  .saved { margin-top: 14px; font-size: 13px; color: #bfe9d2; word-break: break-all; }
</style>
</head>
<body>
<div class="card">
  <h1>录制一段参考人声</h1>
  <div class="sub">这段录音会用来克隆音色。请自然朗读下面的文字，不用刻意播音腔。</div>

  <div class="script">${REFERENCE_TEXT}</div>

  <div class="hints">
    <span>安静房间，关掉风扇/音乐</span>
    <span>嘴巴离麦克风 15~20 厘米</span>
    <span>正常语速，约 15~20 秒</span>
    <span>念错不用停，重来即可</span>
  </div>

  <div class="meter" id="meter"></div>

  <div class="row">
    <div class="timer" id="timer">0.0s</div>
    <button id="record">开始录音</button>
    <button id="stop" class="ghost" disabled>停止</button>
    <button id="save" class="ghost" disabled>保存为参考音频</button>
  </div>

  <audio id="preview" controls hidden></audio>
  <div class="status" id="status">点击「开始录音」，会有 3 秒准备时间。</div>
  <div class="saved" id="saved"></div>
</div>

<script>
const MAX_SECONDS = 25;
const meter = document.getElementById('meter');
const bars = [];
for (let i = 0; i < 64; i += 1) {
  const bar = document.createElement('i');
  bar.style.height = '6px';
  meter.appendChild(bar);
  bars.push(bar);
}
const timerEl = document.getElementById('timer');
const statusEl = document.getElementById('status');
const savedEl = document.getElementById('saved');
const previewEl = document.getElementById('preview');
const recordBtn = document.getElementById('record');
const stopBtn = document.getElementById('stop');
const saveBtn = document.getElementById('save');

let audioCtx = null;
let stream = null;
let processor = null;
let analyser = null;
let recording = false;
let chunks = [];
let startedAt = 0;
let rafId = 0;
let blob = null;
let duration = 0;

function setStatus(text, kind = '') {
  statusEl.textContent = text;
  statusEl.className = 'status ' + kind;
}

function drawMeter(level) {
  const lit = Math.round(level * bars.length * 1.6);
  bars.forEach((bar, i) => {
    const on = i < lit;
    bar.className = on ? (i > bars.length * 0.86 ? 'clip' : i > bars.length * 0.68 ? 'hot' : 'on') : '';
    bar.style.height = on ? Math.min(64, 8 + i * 0.9) + 'px' : '6px';
  });
}

async function ensureAudio() {
  if (audioCtx) return;
  stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });
  audioCtx = new AudioContext();
  const source = audioCtx.createMediaStreamSource(stream);
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 1024;
  processor = audioCtx.createScriptProcessor(4096, 1, 1);
  const mute = audioCtx.createGain();
  mute.gain.value = 0;
  source.connect(analyser);
  source.connect(processor);
  processor.connect(mute);
  mute.connect(audioCtx.destination);
  processor.onaudioprocess = (event) => {
    if (recording) chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
  };
}

function encodeWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (offset, text) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Blob([view], { type: 'audio/wav' });
}

function tick() {
  const elapsed = (performance.now() - startedAt) / 1000;
  timerEl.textContent = elapsed.toFixed(1) + 's';
  const data = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(data);
  let peak = 0;
  for (let i = 0; i < data.length; i += 1) peak = Math.max(peak, Math.abs(data[i]));
  drawMeter(Math.min(1, peak * 3.2));
  if (elapsed >= MAX_SECONDS) { stopRecording(); return; }
  rafId = requestAnimationFrame(tick);
}

async function startRecording() {
  await ensureAudio();
  if (audioCtx.state === 'suspended') await audioCtx.resume();
  blob = null;
  duration = 0;
  previewEl.hidden = true;
  saveBtn.disabled = true;
  savedEl.textContent = '';
  recordBtn.disabled = true;
  stopBtn.disabled = true;

  for (let n = 3; n > 0; n -= 1) {
    setStatus('准备… ' + n);
    timerEl.textContent = '0.0s';
    await new Promise((r) => setTimeout(r, 700));
  }

  chunks = [];
  recording = true;
  startedAt = performance.now();
  timerEl.classList.add('rec');
  stopBtn.disabled = false;
  setStatus('正在录音，读完那段文字后点「停止」。');
  rafId = requestAnimationFrame(tick);
}

function stopRecording() {
  if (!recording) return;
  recording = false;
  cancelAnimationFrame(rafId);
  timerEl.classList.remove('rec');
  stopBtn.disabled = true;
  duration = (performance.now() - startedAt) / 1000;
  timerEl.textContent = duration.toFixed(1) + 's';

  const total = chunks.reduce((n, c) => n + c.length, 0);
  const merged = new Float32Array(total);
  let offset = 0;
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.length; }
  chunks = [];

  let peak = 0;
  for (let i = 0; i < merged.length; i += 1) peak = Math.max(peak, Math.abs(merged[i]));

  if (total === 0) {
    setStatus('没有录到声音，检查系统麦克风权限后重试。', 'err');
    recordBtn.disabled = false;
    return;
  }
  if (peak < 0.02) {
    setStatus('录音音量太低（峰值 ' + peak.toFixed(3) + '），离麦克风近一点再录一次。', 'err');
    recordBtn.disabled = false;
    return;
  }

  blob = encodeWav(merged, audioCtx.sampleRate);
  previewEl.src = URL.createObjectURL(blob);
  previewEl.hidden = false;
  saveBtn.disabled = false;
  recordBtn.disabled = false;
  recordBtn.textContent = '重录';
  setStatus('录到 ' + duration.toFixed(1) + ' 秒，峰值 ' + peak.toFixed(2) + '。先试听，满意就保存。', 'ok');
}

async function save() {
  if (!blob) return;
  saveBtn.disabled = true;
  setStatus('正在写入磁盘…');
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  const response = await fetch('/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wav: btoa(binary), duration, sampleRate: audioCtx.sampleRate }),
  });
  const result = await response.json();
  if (result.ok) {
    setStatus('已保存。可以把页面关掉，回去告诉 agent 继续。', 'ok');
    savedEl.textContent = result.path + '  (' + Math.round(result.bytes / 1024) + ' KB)';
  } else {
    setStatus('保存失败：' + result.error, 'err');
    saveBtn.disabled = false;
  }
}

recordBtn.addEventListener('click', () => startRecording().catch((e) => setStatus('麦克风启动失败：' + e.message, 'err')));
stopBtn.addEventListener('click', stopRecording);
saveBtn.addEventListener('click', () => save().catch((e) => setStatus('保存失败：' + e.message, 'err')));
</script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(PAGE);
    return;
  }

  if (req.method === 'POST' && req.url === '/save') {
    try {
      const body = await new Promise((resolve, reject) => {
        const parts = [];
        req.on('data', (chunk) => parts.push(chunk));
        req.on('end', () => resolve(Buffer.concat(parts).toString('utf8')));
        req.on('error', reject);
      });
      const { wav, duration } = JSON.parse(body);
      const bytes = Buffer.from(wav, 'base64');
      if (bytes.length < 44) throw new Error('payload too small');

      await mkdir(REF_DIR, { recursive: true });
      const stamp = new Date()
        .toISOString()
        .replace(/[:T]/g, '-')
        .slice(0, 19);
      const main = path.join(REF_DIR, 'voice.wav');
      const backup = path.join(REF_DIR, `voice-${stamp}.wav`);
      await writeFile(main, bytes);
      await writeFile(backup, bytes);

      console.log(`saved ${main} (${(bytes.length / 1024).toFixed(0)} KB, ${Number(duration).toFixed(1)}s)`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, path: main.replace(/\\/g, '/'), bytes: bytes.length }));
      return;
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: error.message }));
      return;
    }
  }

  res.writeHead(404);
  res.end('not found');
});

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${PORT}`;
  console.log(`recording tool ready: ${url}`);
  console.log(`saving into: ${REF_DIR}`);
  if (process.argv.includes('--open')) {
    spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
  }
});
