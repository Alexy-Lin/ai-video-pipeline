import { chromium } from "playwright-core";
const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
await page.bringToFront();

// canvas area center (crop frame) from previous screenshot: approx CSS x 520..1080, y 150..570
await page.mouse.move(800, 360);
await page.waitForTimeout(500);
for (let i = 0; i < 6; i++) {
  await page.mouse.wheel(0, 120);
  await page.waitForTimeout(400);
}
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-xhs-12.png" });
const t = await page.evaluate(() => (document.body.innerText || "").match(/\d{1,3}%/g)?.slice(0, 4) || []);
console.log("pct labels = " + JSON.stringify(t));
await browser.close();
