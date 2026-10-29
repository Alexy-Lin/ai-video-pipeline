import { chromium } from "playwright-core";
const COVER = "D:\\Software\\AI Video\\out\\ep04-cover-43.png";
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

const pos = await page.evaluate(() => {
  const els = [...document.querySelectorAll("div,span,button")]
    .filter((e) => (e.innerText || "").trim() === "上传封面")
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), w: Math.round(r.width), h: Math.round(r.height) };
    })
    .filter((x) => x.w > 50);
  return els.length ? els[els.length - 1] : null;
});
log("上传封面 = " + JSON.stringify(pos));

const chooser = new Promise((resolve) => client.once("Page.fileChooserOpened", resolve));
if (pos) await page.mouse.click(pos.x, pos.y);
const ev = await Promise.race([chooser, new Promise((r) => setTimeout(() => r(null), 8000))]);
log("chooser = " + JSON.stringify(ev));
if (ev && ev.backendNodeId) {
  await client.send("DOM.setFileInputFiles", { files: [COVER], backendNodeId: ev.backendNodeId });
  log("横封面 injected");
}
await page.waitForTimeout(4000);

const st = await page.evaluate(() => {
  const t = document.body.innerText || "";
  return {
    thumbs: [...document.querySelectorAll("img")].map((i) => i.src).filter((s) => s.startsWith("blob:") || s.includes("douyinpic")).length,
    tail: t.slice(-400),
  };
});
console.log(JSON.stringify(st, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-dy-5.png" });
await browser.close();
