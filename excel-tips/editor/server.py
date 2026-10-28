import http.server
import json
import socketserver
import time

FILE = r"D:\Software\AI Video\excel-tips\EP03-口播稿.txt"
PORT = 8771

PAGE = """<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>EP03 口播稿 · 编辑器</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; height: 100vh; display: flex; flex-direction: column;
         font-family: "Microsoft YaHei", system-ui, sans-serif; background: #0f1319; color: #e6edf3; }
  header { display: flex; align-items: center; gap: 14px; padding: 12px 18px;
           background: #161c25; border-bottom: 1px solid #232c38; }
  h1 { font-size: 16px; margin: 0; font-weight: 700; letter-spacing: .5px; }
  .path { font-size: 12px; color: #6b7787; }
  button { border: 0; border-radius: 8px; padding: 9px 18px; font-size: 14px; font-weight: 700;
           cursor: pointer; font-family: inherit; }
  #save { background: #FFD400; color: #0b0e13; }
  #save:hover { background: #ffdf3d; }
  #reload { background: #232c38; color: #c9d4e0; }
  #status { margin-left: auto; font-size: 13px; color: #7c8899; }
  #status.ok { color: #3DDC84; }
  #status.err { color: #ff6b6b; }
  main { flex: 1; display: flex; min-height: 0; }
  textarea { flex: 1; width: 100%; height: 100%; border: 0; outline: none; resize: none;
             background: #0b0e13; color: #dbe6f0; padding: 26px 34px;
             font-family: "Cascadia Mono", Consolas, "Microsoft YaHei", monospace;
             font-size: 16px; line-height: 1.85; tab-size: 2; }
  .hint { font-size: 12px; color: #5d6a7a; padding: 8px 18px; background: #11161d;
          border-top: 1px solid #1b222c; }
</style>
</head>
<body>
<header>
  <h1>EP03 口播稿</h1>
  <span class="path">__PATH__</span>
  <button id="save">保存 (Ctrl+S)</button>
  <button id="reload">重新载入</button>
  <span id="status">已载入</span>
</header>
<main><textarea id="editor" spellcheck="false"></textarea></main>
<div class="hint">直接改文字，点「保存」写回文件。改完回到对话里说一声，我读取最新版本。</div>
<script>
const ed = document.getElementById('editor');
const st = document.getElementById('status');
function setStatus(msg, cls) { st.textContent = msg; st.className = cls || ''; }
async function load() {
  const r = await fetch('/api/text', { cache: 'no-store' });
  const d = await r.json();
  ed.value = d.text;
  setStatus('已载入 ' + new Date().toLocaleTimeString());
}
async function save() {
  setStatus('保存中…');
  const r = await fetch('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: ed.value }),
  });
  const d = await r.json();
  if (d.ok) setStatus('已保存 ' + d.time + ' · ' + d.bytes + ' 字节', 'ok');
  else setStatus('保存失败：' + d.error, 'err');
}
document.getElementById('save').onclick = save;
document.getElementById('reload').onclick = load;
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
});
load();
</script>
</body>
</html>
"""


class Handler(http.server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.0"

    def log_message(self, *args):
        pass

    def _json(self, obj, code=200):
        data = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            body = PAGE.replace("__PATH__", FILE).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
        elif self.path == "/api/text":
            with open(FILE, encoding="utf-8") as f:
                self._json({"text": f.read(), "path": FILE})
        else:
            self._json({"error": "not found"}, 404)

    def do_POST(self):
        if self.path != "/api/save":
            self._json({"error": "not found"}, 404)
            return
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length)
        try:
            payload = json.loads(raw.decode("utf-8"))
            text = payload["text"]
            if not text.strip():
                raise ValueError("内容为空，没有保存")
            with open(FILE, "w", encoding="utf-8", newline="\n") as f:
                f.write(text)
            self._json({"ok": True, "bytes": len(text.encode("utf-8")), "time": time.strftime("%H:%M:%S")})
        except Exception as exc:  # noqa: BLE001
            self._json({"ok": False, "error": str(exc)}, 400)


socketserver.ThreadingTCPServer.allow_reuse_address = True
with socketserver.ThreadingTCPServer(("127.0.0.1", PORT), Handler) as httpd:
    httpd.daemon_threads = True
    print(f"editor on http://127.0.0.1:{PORT}/", flush=True)
    httpd.serve_forever()
