import { chromium } from "playwright-core";

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const pages = ctx.pages();
const page = pages[0] || (await ctx.newPage());

await page.goto("https://member.bilibili.com/platform/upload/video/frame", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);

const state = await page.evaluate(() => {
  const t = document.body.innerText || "";
  return {
    url: location.href,
    title: document.title,
    loggedIn: /成为UP主的第|内容管理|稿件管理/.test(t),
    needLogin: /登录|扫码|请先登录/.test(t),
    head: t.slice(0, 300),
  };
});
console.log(JSON.stringify({ pageCount: pages.length, state }, null, 2));
await browser.close();
