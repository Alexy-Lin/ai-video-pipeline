import { chromium } from "playwright-core";
const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
await page.bringToFront();

const btn = page.locator("button:has-text('完成')").first();
log("done button count = " + (await page.locator("button:has-text('完成')").count()));
await btn.click({ force: true });
log("clicked 完成");
await page.waitForTimeout(3000);

const st = await page.evaluate(() => {
  const t = document.body.innerText || "";
  const coverImgs = [...document.querySelectorAll(".cover-slot img, [class*=cover] img")]
    .map((i) => i.src)
    .filter((s) => s.startsWith("blob:") || s.includes("hdslb"));
  return {
    dialogGone: !/封面制作/.test(t),
    coverImgs: coverImgs.slice(0, 5),
    hasUploadedCover: /重新上传|更换封面|编辑封面/.test(t),
    snippet: (t.match(/封面[\s\S]{0,160}/) || [])[0],
  };
});
console.log(JSON.stringify(st, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-cover8.png" });
await browser.close();
