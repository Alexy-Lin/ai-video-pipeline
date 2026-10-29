import { chromium } from "playwright-core";
const VIDEO = "D:\\Software\\AI Video\\out\\ep04-v4.mp4";
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

const client = await ctx.newCDPSession(page);
await client.send("Page.enable");
await client.send("Page.setInterceptFileChooserDialog", { enabled: true });

await page.goto("https://creator.xiaohongshu.com/publish/publish?source=official", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(4000);
log("page loaded: " + (await page.url()));

const login = await page.evaluate(() => /登录|扫码/.test(document.body.innerText || "") && !/发布笔记|上传视频/.test(document.body.innerText || ""));
log("需要登录 = " + login);

const info = await page.evaluate(() => ({
  text: (document.body.innerText || "").slice(0, 200),
  files: [...document.querySelectorAll("input[type=file]")].map((f) => ({ accept: f.accept, visible: !!(f.offsetWidth || f.offsetHeight) })),
}));
console.log(JSON.stringify(info, null, 2));

let uploaded = false;
const chooserEvent = new Promise((resolve) => client.once("Page.fileChooserOpened", resolve));
// 上传视频 tab first
const tab = page.locator("text=上传视频").first();
if (await tab.count()) {
  await tab.click({ force: true }).catch(() => {});
  log("clicked 上传视频 tab");
  await page.waitForTimeout(1500);
}
try {
  await page.setInputFiles('input[type="file"]', [VIDEO]);
  log("setInputFiles sent");
  uploaded = true;
} catch (e) {
  log("setInputFiles failed: " + e.message);
}
if (!uploaded) {
  const ev = await Promise.race([chooserEvent, new Promise((r) => setTimeout(() => r(null), 10000))]);
  log("chooser: " + JSON.stringify(ev));
}

for (let i = 0; i < 15; i++) {
  await page.waitForTimeout(2000);
  const s = await page.evaluate(() => {
    const t = document.body.innerText || "";
    return {
      form: !!document.querySelector('input[placeholder*="填写标题"]'),
      pct: (t.match(/(\d{1,3})%/) || [])[1] || null,
      t100: /上传成功|重新上传|已上传/.test(t),
    };
  });
  if (i % 3 === 0) log(`poll ${i}: ${JSON.stringify(s)}`);
  if (s.form || s.t100) break;
}

await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-xhs-2.png" });
await browser.close();
