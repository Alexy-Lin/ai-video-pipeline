import { chromium } from "playwright-core";
const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
await page.bringToFront();

const info = await page.evaluate(() => {
  const t = document.body.innerText || "";
  const nums = (t.match(/\d{1,3}%/g) || []).slice(0, 6);
  const ctrls = [...document.querySelectorAll("[class*=zoom], [class*=scale], input[type=range], [class*=slider]")].map((el) => ({
    cls: (el.className || "").toString().slice(0, 40),
    tag: el.tagName,
    val: el.value || "",
    t: (el.innerText || "").trim().slice(0, 20),
  }));
  const btns = [...document.querySelectorAll("div,span,button")]
    .map((el) => ({ t: (el.innerText || "").trim(), cls: (el.className || "").toString().slice(0, 30) }))
    .filter((b) => b.t && b.t.length <= 6 && /裁剪|旋转|缩放|适应|填满|还原|完成|取消/.test(b.t))
    .slice(0, 20);
  return { nums, ctrls: ctrls.slice(0, 10), btns };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
