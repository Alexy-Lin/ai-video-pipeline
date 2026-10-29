import { chromium } from "playwright-core";
const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const pages = ctx.pages();
// find the xiaohongshu tab
let page = null;
for (const p of pages) {
  const u = await p.url();
  if (u.includes("creator.xiaohongshu.com")) page = p;
}
if (!page) page = pages[0];
await page.bringToFront();
log("xhs page = " + (await page.url()));

// open cover editor: hover the cover preview then click 编辑封面
const box = await page.locator(".cover-plugin-preview").first().boundingBox();
await page.mouse.move(box.x + box.width * 0.12, box.y + box.height * 0.55);
await page.waitForTimeout(1000);
const entry = await page.evaluate(() => {
  const els = [...document.querySelectorAll("*")].filter(
    (e) => (e.innerText || "").trim() === "编辑封面" && (e.className || "").toString().includes("cover-edit-entry"),
  );
  if (!els.length) return null;
  const r = els[0].getBoundingClientRect();
  return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
});
log("edit entry = " + JSON.stringify(entry));
if (entry) await page.mouse.click(entry.x, entry.y);
await page.waitForTimeout(3000);

// click 裁剪 tool
const crop = await page.evaluate(() => {
  const els = [...document.querySelectorAll("*")].filter((e) => (e.innerText || "").trim() === "裁剪");
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width > 20 && r.height > 20) return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  }
  return null;
});
log("裁剪 = " + JSON.stringify(crop));
if (crop) await page.mouse.click(crop.x, crop.y);
await page.waitForTimeout(2000);

const panel = await page.evaluate(() => {
  const texts = [...document.querySelectorAll("*")]
    .map((e) => (e.innerText || "").trim())
    .filter((s) => s && s.length <= 12)
    .slice(0, 80);
  const ratios = [...document.querySelectorAll("*")].filter((e) => /^(3:4|4:3|1:1|9:16|16:9|2:3|3:2)$/.test((e.innerText || "").trim()))
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { t: el.innerText.trim(), x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), w: Math.round(r.width) };
    });
  return { ratios, texts: texts.slice(0, 40) };
});
console.log(JSON.stringify(panel, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-xhs-crop1.png" });
await browser.close();
