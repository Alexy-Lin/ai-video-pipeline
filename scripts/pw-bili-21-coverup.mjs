import { chromium } from "playwright-core";
const COVER = "D:\\Software\\AI Video\\out\\ep04-cover-43.png";
const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
await page.bringToFront();

const client = await ctx.newCDPSession(page);
await client.send("Page.enable");
await client.send("Page.setInterceptFileChooserDialog", { enabled: true });

const chooserEvent = new Promise((resolve) => client.once("Page.fileChooserOpened", resolve));

const up = page.locator("text=上传封面").first();
await up.scrollIntoViewIfNeeded().catch(() => {});
await up.click({ force: true });
log("clicked 上传封面");

const ev = await Promise.race([chooserEvent, new Promise((r) => setTimeout(() => r(null), 12000))]);
log("chooser: " + JSON.stringify(ev));
if (ev && ev.backendNodeId) {
  await client.send("DOM.setFileInputFiles", { files: [COVER], backendNodeId: ev.backendNodeId });
  log("cover injected");
  await page.waitForTimeout(5000);
}

const st = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll("img")].map((i) => i.src).filter((s) => s.startsWith("blob:") || s.includes("bfs"));
  return {
    imgCount: imgs.length,
    imgs: imgs.slice(0, 6),
    text: (document.body.innerText || "").match(/上传封面[\s\S]{0,120}/)?.[0] || null,
  };
});
console.log(JSON.stringify(st, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-cover7.png" });
await browser.close();
