import { chromium } from "playwright-core";

const out = process.argv[2] || "D:\\Software\\AI Video\\out\\pw-shot.png";
const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
await page.bringToFront();
await page.screenshot({ path: out, fullPage: false });
const info = await page.evaluate(() => ({ url: location.href, title: document.title }));
console.log(JSON.stringify({ out, info }));
await browser.close();
