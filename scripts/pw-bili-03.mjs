import { chromium } from "playwright-core";

const VIDEO = "D:\\Software\\AI Video\\out\\ep04-v4.mp4";
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
await page.goto("https://member.bilibili.com/platform/upload/video/frame", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);
log("page ready");

const inputCount = await page.locator('input[name="buploader"][accept*="mp4"]').count();
log(`video input count = ${inputCount}`);

await page.setInputFiles('input[name="buploader"][accept*="mp4"]', [VIDEO]);
log("setInputFiles sent");

const formReady = await page
  .waitForSelector('input[placeholder="请输入稿件标题"]', { state: "visible", timeout: 180_000 })
  .then(() => true)
  .catch(() => false);
log(`formReady = ${formReady}`);
await page.waitForTimeout(3000);

if (formReady) {
  await page.fill('input[placeholder="请输入稿件标题"]', TITLE);
  log("title filled");

  for (const t of TAGS) {
    await page.fill('input[placeholder*="回车"]', t);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(350);
  }
  log("tags filled");

  try {
    await page.click(".ql-editor");
    await page.keyboard.insertText(DESC);
    log("desc filled");
  } catch (e) {
    log("desc failed: " + e.message);
  }
  await page.waitForTimeout(1000);
}

const state = await page.evaluate(() => {
  const t = document.body.innerText || "";
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  };
  const hits = [...document.querySelectorAll("button,div,span,a,li")]
    .map((el) => ({ s: (el.innerText || "").trim(), r: rect(el), tag: el.tagName }))
    .filter((b) => b.s.length > 1 && b.s.length <= 10 && /封面|分区|投稿|草稿|标签|上传/.test(b.s))
    .slice(0, 80);
  return {
    title: document.querySelector('input[placeholder="请输入稿件标题"]')?.value || null,
    desc: (document.querySelector(".ql-editor")?.innerText || "").slice(0, 200),
    coverSnippets: (t.match(/[^\n]{0,20}封面[^\n]{0,40}/g) || []).slice(0, 6),
    catSnippets: (t.match(/[^\n]{0,10}分区[^\n]{0,40}/g) || []).slice(0, 6),
    hits,
    bodyHead: t.slice(0, 400),
  };
});
console.log(JSON.stringify(state, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-state-2.png" });
log("done");
await browser.close();
