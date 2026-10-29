import { chromium } from "playwright-core";
const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
await page.bringToFront();

await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1500);

const st = await page.evaluate(() => {
  const t = document.body.innerText || "";
  const catInput = [...document.querySelectorAll("input")].filter((i) =>
    /知识|分区|vlog|请选择/.test(i.value || ""),
  ).map((i) => ({ ph: i.placeholder, val: i.value }));
  return {
    catInputs: catInput,
    warnings: (t.match(/请[^。\n]{0,20}(分区|封面|标题|分类|填写)[^。\n]{0,20}/g) || []).slice(0, 6),
    footer: t.slice(-500),
    buttons: [...document.querySelectorAll("div,span,button")]
      .filter((el) => /^(存草稿|立即投稿|发布)$/.test((el.innerText || "").trim()))
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { t: (el.innerText || "").trim(), cls: (el.className || "").toString().slice(0, 40), x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
      }),
  };
});
console.log(JSON.stringify(st, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-final.png" });
await browser.close();
