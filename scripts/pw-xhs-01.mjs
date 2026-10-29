import { chromium } from "playwright-core";
const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
await page.bringToFront();

// 1) verify bilibili submission
await page.goto("https://member.bilibili.com/platform/upload-manager/article", { waitUntil: "domcontentloaded" }).catch(() => {});
await page.waitForTimeout(3000);
const bili = await page.evaluate(() => {
  const t = document.body.innerText || "";
  return { url: location.href, first: t.slice(0, 400) };
});
console.log("BILI " + JSON.stringify(bili));

// 2) open xiaohongshu creator
await page.goto("https://creator.xiaohongshu.com/publish/publish?source=official", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(4000);
const xhs = await page.evaluate(() => {
  const t = document.body.innerText || "";
  return {
    url: location.href,
    title: document.title,
    needLogin: /登录|扫码|手机号/.test(t),
    head: t.slice(0, 200),
    files: document.querySelectorAll('input[type=file]').length,
  };
});
console.log("XHS " + JSON.stringify(xhs, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-xhs-1.png" });
await browser.close();
