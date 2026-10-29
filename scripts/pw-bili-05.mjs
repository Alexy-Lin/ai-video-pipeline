import { chromium } from "playwright-core";

const VIDEO = "D:\\Software\\AI Video\\out\\ep04-v4.mp4";
const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
log(`api: waitForEvent=${typeof page.waitForEvent} waitForFileChooser=${typeof page.waitForFileChooser}`);

await page.bringToFront();
await page.goto("https://member.bilibili.com/platform/upload/video/frame", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);
log("page ready");

let chooserOk = false;
try {
  const fcPromise = page.waitForEvent("filechooser", { timeout: 20000 });
  await page.click("text=上传视频", { timeout: 8000 });
  log("clicked upload button, waiting chooser");
  const fc = await fcPromise;
  await fc.setFiles(VIDEO);
  chooserOk = true;
  log("chooser set files OK");
} catch (e) {
  log("chooser path failed: " + e.message);
}

if (chooserOk) {
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
    if (i % 2 === 0) log(`poll ${i}: ${JSON.stringify(s)}`);
    if (s.form || s.done) break;
  }
}

const st = await page.evaluate(() => ({
  form: !!document.querySelector('input[placeholder="请输入稿件标题"]'),
  body: (document.body.innerText || "").slice(0, 300),
}));
console.log(JSON.stringify({ chooserOk, st }, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-state-5.png" });
await browser.close();
