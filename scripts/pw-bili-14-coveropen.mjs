import { chromium } from "playwright-core";
const COVER = "D:\\Software\\AI Video\\out\\ep04-cover-169.png";
const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
await page.bringToFront();

const client = await ctx.newCDPSession(page);
await client.send("Page.enable");
await client.send("Page.setInterceptFileChooserDialog", { enabled: true });

// real mouse click on the "添加封面" tile
const rect = await page.evaluate(() => {
  const els = [...document.querySelectorAll("div,span,button")].filter(
    (n) => (n.innerText || "").trim() === "添加封面",
  );
  const el = els[0];
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
});
log("add-cover rect = " + JSON.stringify(rect));
if (rect) {
  await page.mouse.click(rect.x, rect.y);
  log("mouse clicked");
}

// wait for the cover dialog
const appeared = await page
  .waitForSelector("text=上传封面", { timeout: 12000 })
  .then(() => true)
  .catch(() => false);
log("dialog appeared = " + appeared);

const dialogInfo = await page.evaluate(() => {
  const t = document.body.innerText || "";
  const idx = t.indexOf("设置封面");
  return {
    around: idx >= 0 ? t.slice(Math.max(0, idx - 40), idx + 240) : t.slice(0, 240),
    fileInputs: document.querySelectorAll('input[type=file]').length,
    hasUploadCover: /上传封面|从本地上传|上传图片/.test(t),
  };
});
log("dialog: " + JSON.stringify(dialogInfo));

await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-cover2.png" });
await browser.close();
