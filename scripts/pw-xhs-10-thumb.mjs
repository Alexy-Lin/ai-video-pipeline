import { chromium } from "playwright-core";
const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
await page.bringToFront();

const box = await page.locator(".cover-plugin-preview").first().boundingBox();
log("block = " + JSON.stringify(box));

// probe points inside the block to find the thumbnail element
const probe = await page.evaluate(() => {
  const out = [];
  const block = document.querySelector(".cover-plugin-preview");
  const b = block.getBoundingClientRect();
  for (let fx = 0.05; fx < 0.4; fx += 0.05) {
    for (let fy = 0.3; fy < 1; fy += 0.15) {
      const x = b.x + b.width * fx;
      const y = b.y + b.height * fy;
      const el = document.elementFromPoint(x, y);
      if (el) out.push({ x: Math.round(x), y: Math.round(y), tag: el.tagName, cls: (el.className || "").toString().slice(0, 36), t: (el.innerText || "").trim().slice(0, 12) });
    }
  }
  return out;
});
console.log("PROBE " + JSON.stringify(probe.slice(0, 12), null, 2));

// click on the thumbnail image itself
const target = await page.evaluate(() => {
  const block = document.querySelector(".cover-plugin-preview");
  const b = block.getBoundingClientRect();
  const x = b.x + b.width * 0.12;
  const y = b.y + b.height * 0.55;
  const el = document.elementFromPoint(x, y);
  let node = el;
  while (node && node !== document.body) {
    if (node.tagName === "IMG" || (node.className || "").toString().includes("cover-preview") || (node.className || "").toString().includes("preview")) break;
    node = node.parentElement;
  }
  const r = (node || el).getBoundingClientRect();
  return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), tag: (node || el).tagName, cls: (node || el).className?.toString().slice(0, 40) };
});
log("thumb target = " + JSON.stringify(target));
await page.mouse.move(target.x, target.y);
await page.waitForTimeout(800);
await page.mouse.click(target.x, target.y);
await page.waitForTimeout(3000);

const res = await page.evaluate(() => {
  const t = document.body.innerText || "";
  return {
    hasUpload: /上传图片|上传封面/.test(t),
    snippet: t.slice(0, 260),
    modalCls: [...document.querySelectorAll("[class*=modal],[class*=dialog],[class*=editor]")].map((m) => (m.className || "").toString().slice(0, 40)).slice(0, 8),
  };
});
console.log(JSON.stringify(res, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-xhs-9.png" });
await browser.close();
