import { chromium } from "playwright-core";

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

// real file chooser via the blue "上传视频" button
let chooserOk = false;
try {
  const fcPromise = page.waitForFileChooser({ timeout: 15000 });
  await page.click("text=上传视频", { timeout: 8000 });
  const fc = await fcPromise;
  await fc.setFiles(VIDEO);
  chooserOk = true;
  log("file chooser: file set");
} catch (e) {
  log("file chooser failed: " + e.message);
}

if (!chooserOk) {
  // fallback: let the browser open the picker by clicking the hidden input itself
  try {
    const fcPromise = page.waitForFileChooser({ timeout: 15000 });
    await page.evaluate(() => document.querySelector('input[name="buploader"][accept*="mp4"]').click());
    const fc = await fcPromise;
    await fc.setFiles(VIDEO);
    chooserOk = true;
    log("fallback chooser: file set");
  } catch (e) {
    log("fallback failed: " + e.message);
  }
}

// watch upload progress text for up to 60s
const seen = [];
for (let i = 0; i < 30; i++) {
  await page.waitForTimeout(2000);
  const snap = await page.evaluate(() => {
    const t = document.body.innerText || "";
    const m = t.match(/(\d{1,3})%/);
    return { pct: m ? m[1] : null, form: !!document.querySelector('input[placeholder="请输入稿件标题"]'), done: /上传完成|重新上传/.test(t), snippet: t.slice(0, 160) };
  });
  seen.push(snap);
  if (i % 3 === 0 || snap.form || snap.done) log(`poll ${i}: ${JSON.stringify(snap)}`);
  if (snap.form || snap.done) break;
}

console.log(JSON.stringify({ chooserOk, last: seen[seen.length - 1] }, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-state-4.png" });
await browser.close();
