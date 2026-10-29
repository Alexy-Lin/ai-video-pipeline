import { chromium } from "playwright-core";

const TITLE = "预测工作表，一图帮你看未来";
const TAGS = ["Excel技巧", "Excel教程", "预测工作表", "办公软件", "数据分析"];
const DESC =
  "选中 24 个月销售数据，数据 → 预测工作表 → 点创建，Excel 自动补出未来 6 个月的预测曲线和 95% 置信区间，不用写公式。\n" +
  "Excel 2016 及以后版本自带这个入口（「数据」选项卡里）；WPS 暂无同名功能。\n" +
  "每天一个 Excel 小技巧。";

const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
await page.bringToFront();

// title
const titleInput = page.locator('input[placeholder="请输入稿件标题"]');
await titleInput.fill(TITLE);
log("title = " + (await titleInput.inputValue()));

// tags
for (const t of TAGS) {
  const tagInput = page.locator('input[placeholder*="回车"]').first();
  await tagInput.fill(t);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(350);
}
const tagState = await page.evaluate(() => {
  const el = document.querySelector('input[placeholder*="回车"]');
  return { ph: el?.placeholder, parent: (el?.parentElement?.innerText || "").slice(0, 160) };
});
log("tags: " + JSON.stringify(tagState));

// description
await page.locator(".ql-editor").first().click();
await page.keyboard.insertText(DESC);
await page.waitForTimeout(500);
const descState = await page.evaluate(() => ({
  len: (document.querySelector(".ql-editor")?.innerText || "").length,
  head: (document.querySelector(".ql-editor")?.innerText || "").slice(0, 80),
}));
log("desc: " + JSON.stringify(descState));

// open the partition dropdown to see options
const catCell = page.locator("text=分区").first();
const box = await catCell.boundingBox();
log("cat label box = " + JSON.stringify(box));
await page.evaluate(() => {
  const cells = [...document.querySelectorAll("div,span")].filter(
    (el) => (el.innerText || "").trim() === "vlog",
  );
  const target = cells[cells.length - 1];
  if (target) target.click();
});
await page.waitForTimeout(1500);

const options = await page.evaluate(() => {
  const txt = document.body.innerText || "";
  const pickers = [...document.querySelectorAll("[class*=select],[class*=dropdown],[class*=option],[role=listbox]")]
    .map((el) => ({ cls: (el.className || "").toString().slice(0, 50), t: (el.innerText || "").replace(/\s+/g, " ").slice(0, 200) }))
    .filter((x) => x.t && x.t.length > 2)
    .slice(0, 25);
  return { pickers, hasKnowledge: /知识/.test(txt), hasTech: /科技/.test(txt) };
});
console.log(JSON.stringify(options, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-cat.png", fullPage: false });
await browser.close();
