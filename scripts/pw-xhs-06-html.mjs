import { chromium } from "playwright-core";
const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
await page.bringToFront();

const out = await page.evaluate(() => {
  const html = document.documentElement.outerHTML;
  const i = html.indexOf("设置封面");
  const html2 = html.indexOf("智能推荐封面");
  return {
    slice1: i >= 0 ? html.slice(i - 200, i + 1500) : null,
    slice2: html2 >= 0 ? html.slice(html2 - 600, html2 + 400) : null,
  };
});
console.log("=== AROUND 设置封面 ===");
console.log(out.slice1);
console.log("=== AROUND 智能推荐封面 ===");
console.log(out.slice2);
await browser.close();
