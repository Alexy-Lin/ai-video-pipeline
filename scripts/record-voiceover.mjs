/**
 * Line-by-line voiceover recorder.
 *
 *   node scripts/record-voiceover.mjs --open      ->  http://127.0.0.1:8799
 *
 * Records each narration line separately into public/audio/vo-<key>.wav,
 * trims silence, peak-normalises, and finally writes src/generated/voice.json
 * (per-line frame counts) so the video re-times itself.
 */
import http from 'node:http';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const PORT = Number(process.env.PORT ?? 8799);
const ROOT = process.cwd();
// Raw, untrimmed captures. Trimming happens later, with a generous tail pad —
// cutting silence at record time is what clipped the ends of sentences before.
const AUDIO_DIR = path.join(ROOT, 'public', 'audio', 'raw');
const MANIFEST = path.join(ROOT, 'src', 'generated', 'voice.json');
const FPS = 30;
const GAP_SECONDS = 0.45;

/** Same order and wording as the video's scenes. Editable in the page. */
const DEFAULT_LINES = [
  { key: 'intro', label: '开场', text: '这是一个能直接修改 EA SPORTS FC 27 存档的工具，FC27 存档编辑器。' },
  { key: 'problem', label: '痛点', text: '球员能力、阵容号码、国家队名单，在游戏里改起来都很麻烦。' },
  { key: 'player', label: '球员编辑', text: '输入名字搜索，点开就是完整资料，能力值直接改。' },
  { key: 'teams', label: '球队编辑', text: '球队页面能看阵容，批量改球衣号码。' },
  { key: 'transfers', label: '快捷转会', text: '转会只要选两支球队，点一下，人就过去了。' },
  { key: 'national', label: '国家队选拔', text: '国家队选拔自动补满名单，号码一键分配。' },
  { key: 'quick', label: '快捷功能', text: '快捷功能可以批量调年龄、恢复老将巅峰、补齐缺失球员。' },
  { key: 'safety', label: '安全机制', text: '所有修改先暂存，确认后另存为新文件，原存档永远不会被覆盖。' },
  { key: 'outro', label: '结尾', text: '本地运行，不联网，开源。' },
];

const LINES_FILE = path.join(ROOT, 'src', 'generated', 'lines.json');
let LINES = DEFAULT_LINES.map((line) => ({ ...line }));

/** Load edited copy texts, if any. */
async function loadLines() {
  try {
    const saved = JSON.parse(await readFile(LINES_FILE, 'utf8'));
    if (!Array.isArray(saved)) return;
    LINES = DEFAULT_LINES.map((line) => {
      const hit = saved.find((item) => item.key === line.key);
      const text = hit && typeof hit.text === 'string' && hit.text.trim() ? hit.text.trim() : line.text;
      return { ...line, text };
    });
  } catch {
    /* no saved edits yet */
  }
}

async function persistLines() {
  await mkdir(path.dirname(LINES_FILE), { recursive: true });
  const payload = LINES.map(({ key, label, text }) => ({ key, label, text }));
  await writeFile(LINES_FILE, JSON.stringify(payload, null, 2) + '\n', 'utf8');
}

await loadLines();

const PAGE = /* html */ `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>逐句配音录制 · FC27 介绍视频</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: radial-gradient(1200px 700px at 70% 10%, #123a28, #0a2018 45%, #050f0b);
    color: #f2f7f4; font-family: "Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif;
    padding: 26px 26px 60px; min-height: 100vh;
  }
  .wrap { max-width: 1180px; margin: 0 auto; }
  h1 { font-size: 25px; margin: 0 0 4px; }
  .sub { color: #9db3a8; font-size: 14px; margin-bottom: 18px; }
  .tip {
    padding: 13px 18px; border-radius: 12px; font-size: 13.5px; line-height: 1.7;
    background: rgba(61,220,132,.07); border: 1px solid rgba(61,220,132,.25); margin-bottom: 20px;
  }
  .tip b { color: #3ddc84; }
  .row {
    display: grid; grid-template-columns: 150px 1fr 300px; gap: 18px; align-items: center;
    padding: 15px 18px; border-radius: 14px; margin-bottom: 10px;
    background: rgba(6,18,13,.72); border: 1px solid rgba(255,255,255,.08);
  }
  .row.recording { border-color: rgba(255,95,87,.6); box-shadow: 0 0 0 1px rgba(255,95,87,.25); }
  .row.done { border-color: rgba(61,220,132,.45); }
  .name { font-weight: 700; font-size: 15px; }
  .name small { display: block; color: #6f8b7e; font-weight: 400; font-size: 12px; margin-top: 3px; }
  .text { font-size: 17.5px; line-height: 1.65; }
  textarea {
    width: 100%; resize: vertical; min-height: 54px; font-family: inherit; font-size: 16.5px;
    line-height: 1.6; color: #f2f7f4; background: rgba(255,255,255,.045);
    border: 1px solid rgba(255,255,255,.14); border-radius: 10px; padding: 9px 12px;
  }
  textarea:focus { outline: none; border-color: rgba(61,220,132,.65); background: rgba(61,220,132,.06); }
  .meta { display: flex; gap: 12px; font-size: 12px; color: #6f8b7e; margin-top: 5px; min-height: 16px; }
  .meta .saved { color: #3ddc84; }
  .ctrl { display: flex; align-items: center; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
  button {
    font-family: inherit; font-size: 13.5px; font-weight: 700; padding: 9px 15px; border-radius: 10px;
    border: 1px solid transparent; cursor: pointer; background: #3ddc84; color: #04140c; white-space: nowrap;
  }
  button.ghost { background: transparent; border-color: rgba(255,255,255,.22); color: #f2f7f4; }
  button:disabled { opacity: .35; cursor: not-allowed; }
  .meter { display: flex; gap: 2px; align-items: flex-end; height: 26px; width: 96px; }
  .meter i { flex: 1; height: 4px; background: rgba(255,255,255,.12); border-radius: 2px; }
  .meter i.on { background: #3ddc84; }
  .meter i.hot { background: #f5c542; }
  .meter i.clip { background: #ff5f57; }
  .status { font-size: 12.5px; color: #9db3a8; min-width: 92px; text-align: right; }
  .status.rec { color: #ff8a80; }
  .status.ok { color: #3ddc84; }
  .bar {
    position: fixed; left: 0; right: 0; bottom: 0; padding: 14px 26px;
    background: rgba(4,14,10,.92); border-top: 1px solid rgba(255,255,255,.1);
    display: flex; align-items: center; justify-content: space-between; backdrop-filter: blur(8px);
  }
  .bar .sum { font-size: 14px; color: #9db3a8; }
  .bar .sum b { color: #3ddc84; }
</style>
</head>
<body>
<div class="wrap">
  <h1>逐句配音录制</h1>
  <div class="sub">每句单独录，可以单独重录；录完最后点右下角「生成时长清单」。</div>

  <div class="tip">
    <b>录音要点：</b>安静房间（关风扇/空调/音乐）· 嘴离麦克风 15~20 厘米 · 正常语速、带点精神，别念得很沉 ·
    每句一次录完，念错就重录这一句。<br>
    <b>这次保存的是原始音频，不做任何裁剪</b>，句尾不用刻意停顿，但也别一说完就立刻按停止——
    多留半秒更保险。
  </div>

  <div id="rows"></div>
</div>

<div class="bar">
  <div class="sum" id="sum">已录 <b>0</b> / 9 句</div>
  <div style="display:flex; gap:12px; align-items:center;">
    <span class="status" id="globalStatus"></span>
    <button id="reset" class="ghost">恢复默认文案</button>
    <button id="finish" disabled>全部录完</button>
  </div>
</div>

<script>
const LINES = __LINES__;
const state = {};
let audioCtx = null, stream = null, analyser = null, processor = null;
let recordingKey = null, chunks = [], startedAt = 0, rafId = 0, sourceNode = null;
const MAX_SECONDS = 25;

const rowsEl = document.getElementById('rows');
const sumEl = document.getElementById('sum');
const globalStatus = document.getElementById('globalStatus');
const finishBtn = document.getElementById('finish');

function setGlobal(text, cls = '') { globalStatus.textContent = text; globalStatus.className = 'status ' + cls; }

LINES.forEach((line) => {
  const row = document.createElement('div');
  row.className = 'row';
  row.id = 'row-' + line.key;
  row.innerHTML = \`
    <div class="name">\${line.label}<small>vo-\${line.key}.wav</small></div>
    <div>
      <textarea data-text spellcheck="false">\${line.text}</textarea>
      <div class="meta"><span data-count></span><span class="saved" data-saved></span></div>
    </div>
    <div class="ctrl">
      <div class="meter" data-meter></div>
      <span class="status" data-status>未录</span>
      <button data-record>录音</button>
      <button data-stop class="ghost" disabled>停止</button>
      <audio data-preview controls hidden style="height:28px;width:150px"></audio>
    </div>\`;
  rowsEl.appendChild(row);

  const meter = row.querySelector('[data-meter]');
  for (let i = 0; i < 12; i += 1) meter.appendChild(document.createElement('i'));

  line.el = row;
  line.recordBtn = row.querySelector('[data-record]');
  line.stopBtn = row.querySelector('[data-stop]');
  line.statusEl = row.querySelector('[data-status]');
  line.preview = row.querySelector('[data-preview]');
  line.bars = [...meter.children];

  line.textEl = row.querySelector('[data-text]');
  line.countEl = row.querySelector('[data-count]');
  line.savedEl = row.querySelector('[data-saved]');

  const updateCount = () => {
    const chars = line.textEl.value.trim().length;
    line.countEl.textContent = chars + ' 字 · 约 ' + (chars / 4.3).toFixed(1) + ' 秒';
  };
  updateCount();

  let saveTimer = null;
  line.textEl.addEventListener('input', () => {
    updateCount();
    line.savedEl.textContent = '';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      try {
        const res = await fetch('/line', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: line.key, text: line.textEl.value }),
        });
        const out = await res.json();
        line.savedEl.textContent = out.ok ? '文案已保存' : '保存失败：' + out.error;
      } catch (error) {
        line.savedEl.textContent = '保存失败';
      }
    }, 600);
  });

  line.recordBtn.addEventListener('click', () => startRecording(line));
  line.stopBtn.addEventListener('click', () => stopRecording());
  line.preview.addEventListener('play', () => stopPlayback(line));
});

function stopPlayback(except) {
  LINES.forEach((l) => { if (l !== except && !l.preview.paused) l.preview.pause(); });
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
  processor.onaudioprocess = (e) => {
    if (recordingKey) chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
  };
}

function drawMeter(bars, peak) {
  const lit = Math.min(bars.length, Math.round(peak * 14));
  bars.forEach((b, i) => {
    b.className = i < lit ? (i > 9 ? 'clip' : i > 7 ? 'hot' : 'on') : '';
    b.style.height = i < lit ? Math.min(24, 6 + i * 1.6) + 'px' : '4px';
  });
}

function tick() {
  const elapsed = (performance.now() - startedAt) / 1000;
  const line = LINES.find((l) => l.key === recordingKey);
  if (line) line.statusEl.textContent = elapsed.toFixed(1) + 's';
  const data = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(data);
  let peak = 0;
  for (let i = 0; i < data.length; i += 1) peak = Math.max(peak, Math.abs(data[i]));
  if (line) drawMeter(line.bars, Math.min(1, peak * 3.2));
  if (elapsed >= MAX_SECONDS) { stopRecording(); return; }
  rafId = requestAnimationFrame(tick);
}

async function startRecording(line) {
  await ensureAudio();
  if (audioCtx.state === 'suspended') await audioCtx.resume();
  stopPlayback(null);
  LINES.forEach((l) => { l.recordBtn.disabled = true; l.stopBtn.disabled = true; l.el.classList.remove('recording'); });
  line.el.classList.add('recording');
  line.statusEl.textContent = '准备…';
  line.statusEl.className = 'status';

  for (let n = 3; n > 0; n -= 1) {
    line.statusEl.textContent = '准备 ' + n;
    await new Promise((r) => setTimeout(r, 600));
  }

  chunks = [];
  recordingKey = line.key;
  startedAt = performance.now();
  line.stopBtn.disabled = false;
  line.statusEl.className = 'status rec';
  setGlobal('正在录：' + line.label);
  rafId = requestAnimationFrame(tick);
}

function trimAndNormalise(samples, sampleRate) {
  const threshold = 0.012;
  let start = 0;
  let end = samples.length - 1;
  while (start < samples.length && Math.abs(samples[start]) < threshold) start += 1;
  while (end > start && Math.abs(samples[end]) < threshold) end -= 1;
  const pad = Math.round(0.1 * sampleRate);
  start = Math.max(0, start - pad);
  end = Math.min(samples.length - 1, end + pad);
  const trimmed = samples.slice(start, end + 1);
  let peak = 0;
  for (let i = 0; i < trimmed.length; i += 1) peak = Math.max(peak, Math.abs(trimmed[i]));
  if (peak > 0) {
    const gain = 0.89 / peak;
    for (let i = 0; i < trimmed.length; i += 1) trimmed[i] *= gain;
  }
  return { samples: trimmed, peak };
}

function encodeWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const str = (o, t) => { for (let i = 0; i < t.length; i += 1) view.setUint8(o + i, t.charCodeAt(i)); };
  str(0, 'RIFF'); view.setUint32(4, 36 + samples.length * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  str(36, 'data'); view.setUint32(40, samples.length * 2, true);
  let o = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    o += 2;
  }
  return new Blob([view], { type: 'audio/wav' });
}

async function stopRecording() {
  if (!recordingKey) return;
  const key = recordingKey;
  recordingKey = null;
  cancelAnimationFrame(rafId);
  const line = LINES.find((l) => l.key === key);
  line.stopBtn.disabled = true;
  line.statusEl.textContent = '处理中…';

  const total = chunks.reduce((n, c) => n + c.length, 0);
  const merged = new Float32Array(total);
  let off = 0;
  for (const c of chunks) { merged.set(c, off); off += c.length; }
  chunks = [];

  if (total === 0) {
    line.statusEl.textContent = '没录到声音';
    line.statusEl.className = 'status rec';
    LINES.forEach((l) => { l.recordBtn.disabled = false; });
    setGlobal('', '');
    return;
  }

  const { samples, peak } = { samples: merged, peak: 0 };
  const seconds = samples.length / audioCtx.sampleRate;
  const blob = encodeWav(samples, audioCtx.sampleRate);

  line.preview.src = URL.createObjectURL(blob);
  line.preview.hidden = false;

  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  const res = await fetch('/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, wav: btoa(binary), seconds, sampleRate: audioCtx.sampleRate }),
  });
  const out = await res.json();

  if (out.ok) {
    state[key] = { seconds: out.seconds };
    line.el.classList.remove('recording');
    line.el.classList.add('done');
    line.statusEl.textContent = out.seconds.toFixed(1) + 's';
    line.statusEl.className = 'status ok';
    line.recordBtn.textContent = '重录';
  } else {
    line.statusEl.textContent = '保存失败';
    line.statusEl.className = 'status rec';
  }

  LINES.forEach((l) => { l.recordBtn.disabled = false; l.stopBtn.disabled = true; });
  setGlobal('', '');
  refreshSummary();
}

function refreshSummary() {
  const done = LINES.filter((l) => state[l.key]).length;
  sumEl.innerHTML = '已录 <b>' + done + '</b> / ' + LINES.length + ' 句';
  finishBtn.disabled = done < LINES.length;
}

document.getElementById('reset').addEventListener('click', async () => {
  if (!confirm('恢复成默认文案？已保存的修改会丢失。')) return;
  await fetch('/reset-lines', { method: 'POST' });
  location.reload();
});

finishBtn.addEventListener('click', async () => {  finishBtn.disabled = true;
  setGlobal('正在写时长清单…');
  const res = await fetch('/finish', { method: 'POST' });
  const out = await res.json();
  if (out.ok) {
    setGlobal('全部录完（原始音频已保存）。回去告诉 agent 处理音频即可', 'ok');
  } else {
    setGlobal('失败：' + out.error, 'rec');
    finishBtn.disabled = false;
  }
});

// restore state if the page is reloaded
fetch('/state').then((r) => r.json()).then((data) => {
  data.lines.forEach((l) => {
    if (l.exists) {
      state[l.key] = { seconds: l.seconds };
      const line = LINES.find((x) => x.key === l.key);
      line.el.classList.add('done');
      line.statusEl.textContent = l.seconds.toFixed(1) + 's';
      line.statusEl.className = 'status ok';
      line.recordBtn.textContent = '重录';
      line.preview.src = '/audio/vo-' + l.key + '.wav';
      line.preview.hidden = false;
    }
  });
  refreshSummary();
});
</script>
</body>
</html>`;

function wavSeconds(buffer) {
  if (buffer.length < 44) return 0;
  const byteRate = buffer.readUInt32LE(28);
  const dataSize = buffer.length - 44;
  return byteRate > 0 ? dataSize / byteRate : 0;
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const parts = [];
    req.on('data', (chunk) => parts.push(chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(parts).toString('utf8')));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

async function lineState() {
  const out = [];
  for (const line of LINES) {
    const file = path.join(AUDIO_DIR, `vo-${line.key}.wav`);
    try {
      const info = await stat(file);
      const buffer = await readFile(file);
      out.push({ key: line.key, exists: true, bytes: info.size, seconds: wavSeconds(buffer) });
    } catch {
      out.push({ key: line.key, exists: false, seconds: 0 });
    }
  }
  return out;
}

const server = http.createServer(async (req, res) => {
  const json = (code, payload) => {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
  };

  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(PAGE.replace('__LINES__', JSON.stringify(LINES.map(({ key, label, text }) => ({ key, label, text })))));
    return;
  }

  if (req.method === 'GET' && req.url === '/state') {
    return json(200, { lines: await lineState() });
  }

  if (req.method === 'GET' && req.url.startsWith('/audio/')) {
    try {
      const file = path.join(AUDIO_DIR, path.basename(req.url));
      const data = await readFile(file);
      res.writeHead(200, { 'Content-Type': 'audio/wav' });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/save') {
    try {
      const body = await new Promise((resolve, reject) => {
        const parts = [];
        req.on('data', (c) => parts.push(c));
        req.on('end', () => resolve(Buffer.concat(parts).toString('utf8')));
        req.on('error', reject);
      });
      const { key, wav, seconds } = JSON.parse(body);
      if (!LINES.some((l) => l.key === key)) throw new Error('unknown line ' + key);
      const bytes = Buffer.from(wav, 'base64');
      if (bytes.length < 44) throw new Error('payload too small');
      await mkdir(AUDIO_DIR, { recursive: true });
      await writeFile(path.join(AUDIO_DIR, `vo-${key}.wav`), bytes);
      console.log(`saved vo-${key}.wav (${(bytes.length / 1024).toFixed(0)} KB, ${Number(seconds).toFixed(2)}s)`);
      return json(200, { ok: true, seconds: wavSeconds(bytes) });
    } catch (error) {
      return json(500, { ok: false, error: error.message });
    }
  }

  if (req.method === 'POST' && req.url === '/finish') {
    try {
      const states = await lineState();
      const missing = states.filter((s) => !s.exists).map((s) => s.key);
      if (missing.length) throw new Error('still missing: ' + missing.join(', '));
      const total = states.reduce((n, s) => n + s.seconds, 0);
      console.log(`all ${states.length} raw lines captured (${total.toFixed(1)}s total)`);
      return json(200, { ok: true, totalSeconds: total, totalFrames: 0 });
    } catch (error) {
      return json(500, { ok: false, error: error.message });
    }
  }

  if (req.method === 'POST' && req.url === '/line') {
    try {
      const { key, text } = await readJson(req);
      const line = LINES.find((item) => item.key === key);
      if (!line) throw new Error('unknown line ' + key);
      const clean = String(text ?? '').trim();
      if (!clean) throw new Error('文案不能为空');
      line.text = clean;
      await persistLines();
      console.log(`edited ${key}: ${clean}`);
      return json(200, { ok: true });
    } catch (error) {
      return json(500, { ok: false, error: error.message });
    }
  }

  if (req.method === 'POST' && req.url === '/reset-lines') {
    LINES = DEFAULT_LINES.map((line) => ({ ...line }));
    await persistLines();
    console.log('lines reset to defaults');
    return json(200, { ok: true });
  }

  res.writeHead(404);
  res.end('not found');
});

server.listen(PORT, '127.0.0.1', async () => {
  const url = `http://127.0.0.1:${PORT}`;
  console.log(`voiceover recorder ready: ${url}`);
  console.log(`writing into: ${AUDIO_DIR}`);
  console.log(`manifest    : ${MANIFEST}`);
  if (process.argv.includes('--open')) {
    spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
  }
});
