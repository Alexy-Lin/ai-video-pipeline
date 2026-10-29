import { chromium } from "playwright-core";
const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
await page.bringToFront();

// list selected tag chips with their close-button rect
const chips = await page.evaluate(() => {
  return [...document.querySelectorAll(".label-item-v2, [class*=label-item]")]
    .map((el) => {
      const t = (el.innerText || "").trim();
      const close = el.querySelector("[class*=close], svg, i, [class*=del]");
      const cr = close ? close.getBoundingClientRect() : null;
      const r = el.getBoundingClientRect();
      return {
        t,
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        close: cr ? { x: Math.round(cr.x + cr.width / 2), y: Math.round(cr.y + cr.height / 2) } : null,
      };
    })
    .filter((c) => c.t && c.t.length < 24);
});
console.log("CHIPS " + JSON.stringify(chips, null, 2));

const BAD = ["舞蹈翻跳", "韩国女主播"];
for (const c of chips) {
  if (!BAD.some((b) => c.t.startsWith(b)) || !c.close) continue;
  await page.mouse.move(c.close.x, c.close.y);
  await page.waitForTimeout(250);
  await page.mouse.click(c.close.x, c.close.y);
  log(`clicked close for ${c.t} at ${c.close.x},${c.close.y}`);
  await page.waitForTimeout(600);
}

const after = await page.evaluate(() =>
  [...document.querySelectorAll(".label-item-v2, [class*=label-item]")]
    .map((el) => (el.innerText || "").trim())
    .filter((t) => t && t.length < 24),
);
log("tags now: " + JSON.stringify(after));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-tags2.png" });
await browser.close();
