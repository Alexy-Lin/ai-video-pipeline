import { chromium } from "playwright-core";
const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
await page.bringToFront();

const pos = await page.evaluate(() => {
  const el = [...document.querySelectorAll("*")].find((e) => (e.innerText || "").trim() === "裁剪");
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
});
console.log("裁剪 pos = " + JSON.stringify(pos));
if (pos) {
  await page.mouse.click(pos.x, pos.y);
  await page.waitForTimeout(1500);
}
const panel = await page.evaluate(() => {
  const t = document.body.innerText || "";
  const i = t.indexOf("裁剪");
  return {
    around: i >= 0 ? t.slice(Math.max(0, i - 30), i + 300) : null,
    sliders: [...document.querySelectorAll("input[type=range], [class*=slider]")].map((el) => ({ cls: (el.className || "").toString().slice(0, 40), val: el.value || "" })).slice(0, 8),
  };
});
console.log(JSON.stringify(panel, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-xhs-14.png" });
await browser.close();
