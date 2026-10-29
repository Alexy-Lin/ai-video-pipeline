import { chromium } from "playwright-core";
const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
await page.bringToFront();

const chain = await page.evaluate(() => {
  const els = [...document.querySelectorAll("div,span,button")].filter(
    (n) => (n.innerText || "").trim() === "添加封面",
  );
  if (!els.length) return null;
  const el = els[0];
  const out = [];
  let n = el;
  for (let i = 0; i < 5 && n; i++) {
    const r = n.getBoundingClientRect();
    out.push({
      tag: n.tagName,
      cls: (n.className || "").toString().slice(0, 50),
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    });
    n = n.parentElement;
  }
  return out;
});
console.log("CHAIN " + JSON.stringify(chain, null, 2));

if (chain) {
  const tile = chain.find((c) => c.rect.w > 100 && c.rect.w < 220 && c.rect.h > 100) || chain[chain.length - 1];
  const x = tile.rect.x + Math.round(tile.rect.w / 2);
  const y = tile.rect.y + Math.round(tile.rect.h / 2);
  log(`clicking tile ${tile.cls} at ${x},${y}`);
  await page.mouse.click(x, y);
  await page.waitForTimeout(3000);
}

const st = await page.evaluate(() => {
  const t = document.body.innerText || "";
  return {
    dialog: /上传封面|从本地上传|上传图片/.test(t),
    snippet: (t.match(/[\s\S]{0,80}封面[\s\S]{0,200}/) || [])[0],
    fileChooserBtns: [...document.querySelectorAll("button")]
      .map((b) => (b.innerText || "").trim())
      .filter(Boolean)
      .slice(0, 20),
  };
});
console.log(JSON.stringify(st, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-cover4.png" });
await browser.close();
