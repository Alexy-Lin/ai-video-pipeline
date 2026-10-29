import { chromium } from "playwright-core";
const TITLE = "预测工作表，一图帮你看未来";
const BODY =
  "选中 24 个月销售数据，数据 → 预测工作表 → 点创建，Excel 自动补出未来 6 个月的预测曲线和 95% 置信区间，不用写公式。\n" +
  "Excel 2016 及以后版本自带这个入口（「数据」选项卡里），WPS 暂无同名功能。\n" +
  "每天一个 Excel 小技巧。\n" +
  "#Excel #Excel技巧 #办公软件 #数据分析 #职场技能";

const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
await page.bringToFront();

// wait for upload to finish
for (let i = 0; i < 30; i++) {
  const s = await page.evaluate(() => {
    const t = document.body.innerText || "";
    return { done: /上传成功|重新上传|已上传/.test(t) || /100%/.test(t), snip: (t.match(/\d{1,3}%/) || [])[0] || "" };
  });
  if (s.done) { log("upload done-ish: " + JSON.stringify(s)); break; }
  if (i % 5 === 0) log("waiting upload: " + JSON.stringify(s));
  await page.waitForTimeout(2000);
}

// title
const titleSel = 'input[placeholder*="填写标题"]';
if (await page.locator(titleSel).count()) {
  await page.locator(titleSel).first().fill(TITLE);
  log("title filled");
}

// body (tiptap editor)
const bodySel = "div.tiptap, div.ProseMirror, .ql-editor";
if (await page.locator(bodySel).count()) {
  await page.locator(bodySel).first().click();
  await page.keyboard.insertText(BODY);
  log("body filled");
} else {
  log("body editor not found");
}
await page.waitForTimeout(1000);

const st = await page.evaluate(() => {
  const t = document.body.innerText || "";
  const ed = document.querySelector("div.tiptap, div.ProseMirror, .ql-editor");
  return {
    title: document.querySelector('input[placeholder*="填写标题"]')?.value || null,
    bodyLen: (ed?.innerText || "").length,
    bodyHead: (ed?.innerText || "").slice(0, 120),
    sees: {
      cover: /设置封面|编辑封面|封面/.test(t),
      publishBtn: /发布/.test(t),
    },
    tail: t.slice(0, 300),
  };
});
console.log(JSON.stringify(st, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-xhs-3.png" });
await browser.close();
