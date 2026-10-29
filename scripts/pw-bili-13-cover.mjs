import { chromium } from "playwright-core";
const COVER = "D:\\Software\\AI Video\\out\\ep04-cover-169.png";
const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
await page.bringToFront();

const client = await ctx.newCDPSession(page);
await client.send("Page.enable");
await client.send("Page.setInterceptFileChooserDialog", { enabled: true });

// open the cover panel
const opened = await page.evaluate(() => {
  const el = [...document.querySelectorAll("div,span,button")].find(
    (n) => (n.innerText || "").trim() === "添加封面",
  );
  if (!el) return false;
  el.click();
  return true;
});
log("clicked 添加封面 = " + opened);
await page.waitForTimeout(2500);

const modal = await page.evaluate(() => {
  const t = document.body.innerText || "";
  const btns = [...document.querySelectorAll("button,div,span")]
    .map((el) => ({ s: (el.innerText || "").trim(), cls: (el.className || "").toString().slice(0, 40) }))
    .filter((b) => b.s && b.s.length <= 8 && /上传|完成|确定|保存|裁剪|选择/.test(b.s))
    .slice(0, 30);
  return { heads: (t.match(/设置封面|上传封面|封面[^\n]{0,20}/g) || []).slice(0, 6), btns };
});
log("modal: " + JSON.stringify(modal));

const chooserEvent = new Promise((resolve) => client.once("Page.fileChooserOpened", resolve));
await page.evaluate(() => {
  const el = [...document.querySelectorAll("div,span,button")]
    .filter((n) => /上传封面|上传图片|从本地上传|上传/.test((n.innerText || "").trim()))
    .pop();
  if (el) el.click();
});
const ev = await Promise.race([chooserEvent, new Promise((r) => setTimeout(() => r(null), 10000))]);
log("chooser event: " + JSON.stringify(ev));
if (ev && ev.backendNodeId) {
  await client.send("DOM.setFileInputFiles", { files: [COVER], backendNodeId: ev.backendNodeId });
  log("cover file set");
  await page.waitForTimeout(4000);
}

const st = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll("img")].map((i) => i.src).filter((s) => s && s.startsWith("blob:"));
  const t = document.body.innerText || "";
  return {
    blobImgs: imgs.length,
    btns: [...document.querySelectorAll("button,div,span")]
      .map((el) => (el.innerText || "").trim())
      .filter((s) => s && s.length <= 6 && /完成|确定|取消|裁剪|应用/.test(s))
      .slice(0, 12),
    snap: t.slice(0, 200),
  };
});
console.log(JSON.stringify(st, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-cover.png" });
await browser.close();
