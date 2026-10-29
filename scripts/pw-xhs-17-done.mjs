import { chromium } from "playwright-core";
const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
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
log("完成 pos = " + JSON.stringify(pos));
if (pos) {
  await page.mouse.click(pos.x, pos.y);
  log("clicked 完成");
}
await page.waitForTimeout(3000);

const st = await page.evaluate(() => {
  const t = document.body.innerText || "";
  return {
    dialogGone: !/设置封面[\s\S]{0,20}裁剪/.test(t),
    hasPublish: /发布/.test(t),
    coverHint: (t.match(/设置封面[\s\S]{0,100}/) || [])[0],
  };
});
console.log(JSON.stringify(st, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-xhs-15.png" });
await browser.close();
