import { chromium } from "playwright-core";
const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
await page.bringToFront();

const cropper = await page.evaluate(() => {
  const els = [...document.querySelectorAll("[class*=cropper], [class*=canvas], [class*=crop]")]
    .map((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        cls: (el.className || "").toString().slice(0, 50),
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        tf: cs.transform,
        ratio: (r.width / r.height).toFixed(2),
      };
    })
    .filter((x) => x.rect.w > 150 && x.rect.h > 150);
  return els.slice(0, 8);
});
console.log(JSON.stringify(cropper, null, 2));

// try ctrl+wheel and minus key over the canvas
await page.mouse.move(800, 360);
await page.keyboard.down("Control");
for (let i = 0; i < 3; i++) {
  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(300);
}
await page.keyboard.up("Control");
for (let i = 0; i < 3; i++) {
  await page.keyboard.press("-");
  await page.waitForTimeout(300);
}
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-xhs-13.png" });
await browser.close();
