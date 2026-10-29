import { chromium } from "playwright-core";
const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
await page.bringToFront();

const out = await page.evaluate(() => {
  const html = document.documentElement.outerHTML;
  const i = html.indexOf("添加封面");
  return { found: i >= 0, slice: i >= 0 ? html.slice(Math.max(0, i - 1200), i + 300) : null };
});
console.log(out.found);
console.log(out.slice);
await browser.close();
