import { chromium } from "playwright-core";
const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = (await Promise.all(ctx.pages().map(async (p) => ({ p, u: await p.url() })))).find((x) =>
  x.u.includes("creator.xiaohongshu.com"),
)?.p;
await page.bringToFront();

const pos = await page.evaluate(() => {
  const els = [...document.querySelectorAll("*")].filter((e) => (e.innerText || "").trim() === "3:4");
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width > 5 && r.height > 5) return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  }
  return null;
});
log("3:4 = " + JSON.stringify(pos));
if (pos) await page.mouse.click(pos.x, pos.y);
await page.waitForTimeout(2500);
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-xhs-crop2.png" });
log("screenshot after 3:4");

const state = await page.evaluate(() => {
  const stage = document.querySelector(".canvas-stage");
  const r = stage ? stage.getBoundingClientRect() : null;
  return { stageRatio: r ? (r.width / r.height).toFixed(2) : null, w: r ? Math.round(r.width) : null, h: r ? Math.round(r.height) : null };
});
console.log(JSON.stringify(state));
await browser.close();
