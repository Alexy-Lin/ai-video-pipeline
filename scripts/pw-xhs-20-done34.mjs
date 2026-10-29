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
  const els = [...document.querySelectorAll("div,span,button")]
    .filter((e) => (e.innerText || "").trim() === "完成")
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), w: Math.round(r.width), h: Math.round(r.height) };
    })
    .filter((x) => x.w > 40 && x.h > 20);
  return els.length ? els[els.length - 1] : null;
});
log("完成 = " + JSON.stringify(pos));
if (pos) await page.mouse.click(pos.x, pos.y);
await page.waitForTimeout(3500);

const st = await page.evaluate(() => {
  const t = document.body.innerText || "";
  return {
    dialogGone: !/裁剪设置/.test(t),
    hint: (t.match(/封面效果评估[^\n]{0,30}/) || [])[0] || null,
    publishVisible: /发布/.test(t),
  };
});
console.log(JSON.stringify(st, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-xhs-16.png" });
await browser.close();
