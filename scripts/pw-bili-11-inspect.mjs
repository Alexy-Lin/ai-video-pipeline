import { chromium } from "playwright-core";
const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
await page.bringToFront();

const info = await page.evaluate(() => {
  const find = (needle) => {
    const els = [...document.querySelectorAll("*")].filter(
      (el) => (el.innerText || "").trim() === needle && el.children.length <= 2,
    );
    if (!els.length) return null;
    const el = els[els.length - 1];
    const r = el.getBoundingClientRect();
    return {
      html: el.outerHTML.slice(0, 400),
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    };
  };
  const sel = [...document.querySelectorAll("input")].map((i) => ({
    ph: i.placeholder,
    val: i.value,
    cls: (i.className || "").toString().slice(0, 40),
  }));
  return { dance: find("舞蹈翻跳"), korean: find("韩国女主播"), inputs: sel.filter((s) => s.val || s.ph).slice(0, 12) };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
