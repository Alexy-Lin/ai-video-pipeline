import { chromium } from "playwright-core";
const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
await page.bringToFront();

const hits = await page.evaluate(() => {
  return [...document.querySelectorAll("div,span,button,li")]
    .filter((el) => (el.innerText || "").trim() === "完成")
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { cls: (el.className || "").toString().slice(0, 40), x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), w: Math.round(r.width) };
    });
});
log("完成 hits: " + JSON.stringify(hits));

if (hits.length) {
  const t = hits[hits.length - 1];
  await page.mouse.click(t.x, t.y);
  log(`clicked 完成 at ${t.x},${t.y}`);
}
await page.waitForTimeout(3000);

const st = await page.evaluate(() => {
  const txt = document.body.innerText || "";
  return {
    dialogGone: !/封面制作/.test(txt),
    hasEditCover: /编辑封面|更换封面|重新上传/.test(txt),
    coverThumb: [...document.querySelectorAll("img")].map((i) => i.src).filter((s) => s.startsWith("blob:")).length,
    head: txt.slice(0, 120),
  };
});
console.log(JSON.stringify(st, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-cover9.png" });
await browser.close();
