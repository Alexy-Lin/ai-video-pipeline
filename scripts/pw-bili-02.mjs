import { chromium } from "playwright-core";

const VIDEO = "D:\\Software\\AI Video\\out\\ep04-v4.mp4";
const COVER = "D:\\Software\\AI Video\\out\\ep04-cover-169.png";
const TITLE = "预测工作表，一图帮你看未来";
const TAGS = ["Excel技巧", "Excel教程", "预测工作表", "办公软件", "数据分析"];
const DESC =
  "选中 24 个月销售数据，数据 → 预测工作表 → 点创建，Excel 自动补出未来 6 个月的预测曲线和 95% 置信区间，不用写公式。\n" +
  "Excel 2016 及以后版本自带这个入口（「数据」选项卡里）；WPS 暂无同名功能。\n" +
  "每天一个 Excel 小技巧。";

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
await page.bringToFront();

const log = {};

// 1) video upload
await page.goto("https://member.bilibili.com/platform/upload/video/frame", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
log.loginOk = await page.evaluate(() => /成为UP主的第|内容管理/.test(document.body.innerText || ""));

if (log.loginOk) {
  await page.setInputFiles('input[name="buploader"][accept*="mp4"]', [VIDEO]);
  log.formReady = await page
    .waitForSelector('input[placeholder="请输入稿件标题"]', { state: "visible", timeout: 240_000 })
    .then(() => true)
    .catch(() => false);
  await page.waitForTimeout(3000);

  if (log.formReady) {
    await page.fill('input[placeholder="请输入稿件标题"]', TITLE);
    for (const t of TAGS) {
      await page.fill('input[placeholder*="回车"]', t);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(400);
    }
    await page.click(".ql-editor");
    await page.keyboard.insertText(DESC);
    await page.waitForTimeout(800);
  }

  // 2) inspect state: cover area, category, buttons
  const state = await page.evaluate(() => {
    const t = document.body.innerText || "";
    const btns = [...document.querySelectorAll("button,div,span,a")]
      .map((el) => {
        const s = (el.innerText || "").trim();
        const r = el.getBoundingClientRect();
        return { s, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) };
      })
      .filter((b) => b.s.length > 1 && b.s.length < 12 && /封面|分区|投稿|草稿|标签/.test(b.s))
      .slice(0, 60);
    return {
      title: document.querySelector('input[placeholder="请输入稿件标题"]')?.value || null,
      desc: (document.querySelector(".ql-editor")?.innerText || "").slice(0, 160),
      tagChips: [...document.querySelectorAll('[class*="tag-item"],[class*="tagContent"]')].map((e) => (e.innerText || "").trim()).slice(0, 10),
      coverText: (t.match(/封面[^\n]{0,30}/g) || []).slice(0, 5),
      categoryText: (t.match(/分区[^\n]{0,40}/g) || []).slice(0, 5),
      buttons: btns,
    };
  });
  log.state = state;
}

console.log(JSON.stringify(log, null, 2));
await browser.close();
