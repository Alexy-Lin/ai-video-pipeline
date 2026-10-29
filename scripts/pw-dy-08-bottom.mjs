import { chromium } from "playwright-core";
const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = (await Promise.all(ctx.pages().map(async (p) => ({ p, u: await p.url() })))).find((x) =>
  x.u.includes("creator.douyin.com"),
)?.p;
await page.bringToFront();
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1500);

const st = await page.evaluate(() => {
  const btns = [...document.querySelectorAll("button,div,span")]
    .filter((el) => /^(发布|存草稿|定时发布)$/.test((el.innerText || "").trim()))
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { t: el.innerText.trim(), x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
    });
  return { btns, scrollY: Math.round(window.scrollY) };
});
console.log(JSON.stringify(st, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-dy-10.png" });
await browser.close();
