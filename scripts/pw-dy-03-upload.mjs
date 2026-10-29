import { chromium } from "playwright-core";
const VIDEO = "D:\\Software\\AI Video\\out\\ep04-v4.mp4";
const TITLE = "预测工作表，一图帮你看未来";
const DESC =
  "选中 24 个月销售数据，数据 → 预测工作表 → 点创建，Excel 自动补出未来 6 个月的预测曲线和 95% 置信区间，不用写公式。Excel 2016 及以后版本自带这个入口，WPS 暂无同名功能。 #Excel #Excel技巧 #办公软件 #数据分析 #职场技能";

const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = (await Promise.all(ctx.pages().map(async (p) => ({ p, u: await p.url() })))).find((x) =>
  x.u.includes("creator.douyin.com"),
)?.p;
await page.bringToFront();

const client = await ctx.newCDPSession(page);
await client.send("Page.enable");
await client.send("Page.setInterceptFileChooserDialog", { enabled: true });

await page.goto("https://creator.douyin.com/creator-micro/content/upload", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);
log("upload page: " + (await page.url()));

// click the upload area to trigger the picker
const chooser = new Promise((resolve) => client.once("Page.fileChooserOpened", resolve));
const clicked = await page.evaluate(() => {
  const cands = [...document.querySelectorAll("div,span,button")]
    .filter((e) => /上传视频|点击上传|^上传$/.test((e.innerText || "").trim()))
    .map((e) => {
      const r = e.getBoundingClientRect();
      return { el: e, x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), w: Math.round(r.width), h: Math.round(r.height) };
    })
    .filter((c) => c.w > 40 && c.h > 20);
  if (!cands.length) return null;
  const c = cands[0];
  c.el.click();
  return c;
});
log("clicked upload area = " + JSON.stringify(clicked ? { x: clicked.x, y: clicked.y } : null));

const ev = await Promise.race([chooser, new Promise((r) => setTimeout(() => r(null), 10000))]);
log("chooser = " + JSON.stringify(ev));
if (ev && ev.backendNodeId) {
  await client.send("DOM.setFileInputFiles", { files: [VIDEO], backendNodeId: ev.backendNodeId });
  log("video injected");
} else {
  try {
    await page.setInputFiles('input[type="file"]', [VIDEO]);
    log("fallback setInputFiles ok");
  } catch (e) {
    log("fallback failed: " + e.message);
  }
}

// wait for the form
const ready = await page
  .waitForSelector('input[placeholder*="作品标题"]', { state: "visible", timeout: 120000 })
  .then(() => true)
  .catch(() => false);
log("form ready = " + ready);
await page.waitForTimeout(2000);

if (ready) {
  await page.fill('input[placeholder*="作品标题"]', TITLE);
  log("title set");
  const descSel = "div.zone-container, div[data-placeholder]";
  if (await page.locator(descSel).count()) {
    await page.locator(descSel).first().click();
    await page.keyboard.insertText(DESC);
    log("desc set");
  }
}
await page.waitForTimeout(1500);

const st = await page.evaluate(() => {
  const t = document.body.innerText || "";
  return {
    title: document.querySelector('input[placeholder*="作品标题"]')?.value || null,
    snippets: (t.match(/设置封面[^\n]{0,40}/g) || []).slice(0, 3),
    buttons: [...document.querySelectorAll("button,div,span")]
      .map((e) => (e.innerText || "").trim())
      .filter((s) => s && s.length <= 8 && /发布|封面|作品标题|存草稿/.test(s))
      .slice(0, 12),
  };
});
console.log(JSON.stringify(st, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-dy-3.png" });
await browser.close();
