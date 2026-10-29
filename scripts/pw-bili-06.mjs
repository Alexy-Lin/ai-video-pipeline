import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";

const VIDEO = "D:\\Software\\AI Video\\out\\ep04-v4.mp4";
const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
await page.bringToFront();
await page.goto("https://member.bilibili.com/platform/upload/video/frame", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);
log("page ready");

const client = await ctx.newCDPSession(page);
await client.send("Page.enable");
await client.send("Page.setInterceptFileChooserDialog", { enabled: true });
log("cdp chooser interception on");

let uploaded = false;
try {
  const chooserEvent = new Promise((resolve) => client.once("Page.fileChooserOpened", resolve));
  await page.evaluate(() => {
    const area = document.querySelector(".upload-area") || document.querySelector(".upload-btn");
    area.click();
  });
  log("clicked .upload-area");
  const ev = await Promise.race([
    chooserEvent,
    new Promise((r) => setTimeout(() => r(null), 12000)),
  ]);
  if (ev && ev.backendNodeId) {
    log(`fileChooserOpened backendNodeId=${ev.backendNodeId}`);
    await client.send("DOM.setFileInputFiles", { files: [VIDEO], backendNodeId: ev.backendNodeId });
    uploaded = true;
    log("setFileInputFiles sent");
  } else {
    log("no fileChooserOpened event");
  }
} catch (e) {
  log("cdp path failed: " + e.message);
}

if (!uploaded) {
  // last resort: build a File in the page and dispatch a real drop on the upload area
  const b64 = readFileSync(VIDEO).toString("base64");
  log(`fallback drop with ${b64.length} base64 chars`);
  await page.evaluate(async ({ b64, name }) => {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const file = new File([arr], name, { type: "video/mp4" });
    const dt = new DataTransfer();
    dt.items.add(file);
    const zone = document.querySelector(".upload-area");
    for (const type of ["dragenter", "dragover", "drop"]) {
      zone.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt }));
    }
  }, { b64, name: "ep04-v4.mp4" });
  log("drop dispatched");
}

for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(2000);
  const s = await page.evaluate(() => {
    const t = document.body.innerText || "";
    return {
      form: !!document.querySelector('input[placeholder="请输入稿件标题"]'),
      pct: (t.match(/(\d{1,3})%/) || [])[1] || null,
      done: /上传完成|重新上传/.test(t),
    };
  });
  if (i % 2 === 0 || s.form) log(`poll ${i}: ${JSON.stringify(s)}`);
  if (s.form || s.done) break;
}

await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-state-6.png" });
log("screenshot saved");
await browser.close();
