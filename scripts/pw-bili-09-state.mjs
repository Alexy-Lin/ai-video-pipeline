import { chromium } from "playwright-core";

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
await page.bringToFront();

const st = await page.evaluate(() => {
  const txt = (el) => (el?.innerText || "").trim();
  const tagBox = document.querySelector('input[placeholder*="回车"]')?.parentElement;
  const catRow = [...document.querySelectorAll("*")].filter(
    (el) => el.children.length === 0 && (el.innerText || "").trim() === "vlog",
  );
  return {
    title: document.querySelector('input[placeholder="请输入稿件标题"]')?.value,
    tagsArea: txt(tagBox).replace(/\s+/g, " ").slice(0, 200),
    desc: txt(document.querySelector(".ql-editor")).slice(0, 200),
    descLen: txt(document.querySelector(".ql-editor")).length,
    catTexts: catRow.map((el) => txt(el.parentElement).replace(/\s+/g, " ").slice(0, 80)),
    coverThumbs: document.querySelectorAll("[class*=cover] img").length,
  };
});
console.log(JSON.stringify(st, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-full.png", fullPage: true });
await browser.close();
