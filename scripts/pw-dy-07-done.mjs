import { chromium } from "playwright-core";
const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = (await Promise.all(ctx.pages().map(async (p) => ({ p, u: await p.url() })))).find((x) =>
  x.u.includes("creator.douyin.com"),
)?.p;
await page.bringToFront();

const pos = await page.evaluate(() => {
  const els = [...document.querySelectorAll("div,span,button")]
    .filter((e) => (e.innerText || "").trim() === "完成")
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), w: Math.round(r.width), cls: (el.className || "").toString().slice(0, 30) };
    })
    .filter((x) => x.w >= 50);
  return els.length ? els[els.length - 1] : null;
});
log("完成 = " + JSON.stringify(pos));
if (pos) await page.mouse.click(pos.x, pos.y);
await page.waitForTimeout(4000);

const st = await page.evaluate(() => {
  const t = document.body.innerText || "";
  return {
    dialogGone: !/设置横封面[\s\S]{0,10}设置竖封面/.test(t),
    assistant: (t.match(/发文助手[\s\S]{0,200}/) || [])[0],
    coverSnippets: (t.match(/横封面[^\n]{0,20}|竖封面[^\n]{0,20}/g) || []).slice(0, 6),
  };
});
console.log(JSON.stringify(st, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-dy-9.png" });
await browser.close();
