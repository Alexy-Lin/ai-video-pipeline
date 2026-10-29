import { chromium } from "playwright-core";
const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];

// keep the 小红书 tab untouched: open a new tab for 抖音
const page = await ctx.newPage();
await page.bringToFront();
await page.goto("https://creator.douyin.com/creator-micro/content/upload", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(4000);
log("url = " + (await page.url()));

const st = await page.evaluate(() => {
  const t = document.body.innerText || "";
  return {
    needLogin: /扫码登录|登录后|手机号登录|验证码/.test(t),
    head: t.slice(0, 260),
    files: document.querySelectorAll('input[type=file]').length,
  };
});
console.log(JSON.stringify(st, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-dy-1.png" });
await browser.close();
