import { chromium } from "playwright-core";

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
await page.bringToFront();

const dump = await page.evaluate(() => {
  const label = (el) => {
    let n = el;
    for (let i = 0; i < 6 && n; i++) {
      n = n.parentElement;
      if (!n) break;
      const t = (n.innerText || "").trim();
      if (t && t.length < 40) return t.replace(/\s+/g, " ");
    }
    return "";
  };
  const items = [...document.querySelectorAll("input, textarea, [contenteditable=true], select")].map((el) => ({
    tag: el.tagName,
    type: el.type || "",
    ph: el.placeholder || "",
    val: (el.value || el.innerText || "").slice(0, 30),
    cls: (el.className || "").toString().slice(0, 60),
    ctx: label(el),
  }));
  const btns = [...document.querySelectorAll("button, [class*=btn], [class*=button]")]
    .map((el) => ({ t: (el.innerText || "").trim(), cls: (el.className || "").toString().slice(0, 50) }))
    .filter((b) => b.t && b.t.length <= 12)
    .slice(0, 60);
  return { items, btns, scrollH: document.body.scrollHeight };
});
console.log(JSON.stringify(dump, null, 2));
await browser.close();
