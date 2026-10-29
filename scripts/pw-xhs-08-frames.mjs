import { chromium } from "playwright-core";
const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
await page.bringToFront();

log("frames = " + page.frames().length);
for (const f of page.frames()) {
  const u = f.url();
  const t = await f.evaluate(() => (document.body ? document.body.innerText.slice(0, 120) : "")).catch(() => "");
  log(`frame ${u} :: ${t.replace(/\s+/g, " ")}`);
}

// hover the thumbnail area then dump any overlay text
const box = await page.locator(".cover-plugin-preview").first().boundingBox();
await page.mouse.move(box.x + 80, box.y + 120);
await page.waitForTimeout(1500);
const overlay = await page.evaluate(() =>
  [...document.querySelectorAll("*")]
    .map((e) => (e.innerText || "").trim())
    .filter((s) => s && s.length <= 10 && /编辑|更换|上传|封面/.test(s))
    .slice(0, 20),
);
log("overlay texts = " + JSON.stringify(overlay));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-xhs-7.png" });
await browser.close();
