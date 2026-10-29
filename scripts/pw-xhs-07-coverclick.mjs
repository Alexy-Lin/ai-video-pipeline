import { chromium } from "playwright-core";
const COVER = "D:\\Software\\AI Video\\out\\ep04-cover-34.png";
const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
await page.bringToFront();

const client = await ctx.newCDPSession(page);
await client.send("Page.enable");
await client.send("Page.setInterceptFileChooserDialog", { enabled: true });

const block = page.locator(".cover-plugin-preview").first();
const box = await block.boundingBox();
log("cover block box = " + JSON.stringify(box));
await block.click({ position: { x: 90, y: 130 }, force: true }).catch((e) => log("click err " + e.message));
log("clicked preview block");
await page.waitForTimeout(3000);

const dlg = await page.evaluate(() => {
  const t = document.body.innerText || "";
  const i = t.indexOf("上传图片");
  return {
    hasUpload: i >= 0,
    around: i >= 0 ? t.slice(Math.max(0, i - 100), i + 200) : null,
    buttons: [...document.querySelectorAll("div,span,button")]
      .map((e) => (e.innerText || "").trim())
      .filter((s) => s && s.length <= 10 && /上传|完成|确定|保存|确认|生成/.test(s))
      .slice(0, 15),
  };
});
console.log(JSON.stringify(dlg, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-xhs-6.png" });
await browser.close();
