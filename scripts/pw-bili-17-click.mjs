import { chromium } from "playwright-core";
const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
await page.bringToFront();

const before = await page.evaluate(() => ({
  hit: (() => {
    const el = document.elementFromPoint(594, 607);
    return el ? { tag: el.tagName, cls: (el.className || "").toString().slice(0, 50), t: (el.innerText || "").trim().slice(0, 20) } : null;
  })(),
}));
log("elementFromPoint(594,607) = " + JSON.stringify(before));

await page.mouse.click(594, 607);
await page.waitForTimeout(2500);
const after = await page.evaluate(() => {
  const el = document.elementFromPoint(594, 607);
  return {
    url: location.href,
    dialogText: /上传封面|从本地上传|上传图片|设置封面/.test(document.body.innerText || ""),
    centerNow: el ? { tag: el.tagName, cls: (el.className || "").toString().slice(0, 50) } : null,
    modals: [...document.querySelectorAll("[class*=modal],[class*=dialog]")].map((m) => (m.innerText || "").trim().slice(0, 40)).slice(0, 5),
  };
});
console.log(JSON.stringify(after, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-cover5.png" });
await browser.close();
