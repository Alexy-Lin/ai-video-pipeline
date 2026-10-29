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

const pos = await page.evaluate(() => {
  const els = [...document.querySelectorAll("*")].filter((e) => (e.innerText || "").trim() === "上传");
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width > 20 && r.width < 140 && r.height > 20 && r.y > 500) {
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
    }
  }
  return els.length ? (() => { const r = els[els.length - 1].getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; })() : null;
});
log("上传 tile = " + JSON.stringify(pos));

const chooserEvent = new Promise((resolve) => client.once("Page.fileChooserOpened", resolve));
await page.mouse.click(pos.x, pos.y);
log("clicked 上传");
const ev = await Promise.race([chooserEvent, new Promise((r) => setTimeout(() => r(null), 8000))]);
log("chooser = " + JSON.stringify(ev));
if (ev && ev.backendNodeId) {
  await client.send("DOM.setFileInputFiles", { files: [COVER], backendNodeId: ev.backendNodeId });
  log("cover injected");
  await page.waitForTimeout(5000);
}

const st = await page.evaluate(() => {
  const t = document.body.innerText || "";
  return {
    dialog: /设置封面/.test(t),
    hasDone: /完成/.test(t),
    thumbs: [...document.querySelectorAll("img")].map((i) => i.src).filter((s) => s.startsWith("blob:")).length,
  };
});
console.log(JSON.stringify(st, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-xhs-11.png" });
await browser.close();
