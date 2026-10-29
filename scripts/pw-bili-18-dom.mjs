import { chromium } from "playwright-core";
const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
await page.bringToFront();

const html = await page.evaluate(() => {
  const label = [...document.querySelectorAll("*")].find(
    (el) => (el.innerText || "").trim() === "封面" && el.className && /label/.test(el.className),
  );
  const item = label ? label.closest(".form-item") : null;
  return { itemHtml: item ? item.innerHTML.slice(0, 3000) : null, labelCls: label ? label.className : null };
});
console.log(JSON.stringify(html, null, 2));
await browser.close();
