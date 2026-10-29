import { chromium } from "playwright-core";
const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = (await Promise.all(ctx.pages().map(async (p) => ({ p, u: await p.url() })))).find((x) =>
  x.u.includes("creator.douyin.com"),
)?.p;
await page.bringToFront();
log("url = " + (await page.url()));

const client = await ctx.newCDPSession(page);
await client.send("Page.enable");
await client.send("Page.setInterceptFileChooserDialog", { enabled: true });

// make sure we are on the publish form (video already uploaded earlier)
const has = await page.evaluate(() => ({
  title: document.querySelector('input[placeholder*="作品标题"]')?.value || null,
  cover: /设置封面/.test(document.body.innerText || ""),
}));
log("state = " + JSON.stringify(has));

const pos = await page.evaluate(() => {
  const els = [...document.querySelectorAll("div,span,button")]
    .filter((e) => (e.innerText || "").trim() === "选择封面")
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), w: Math.round(r.width) };
    })
    .filter((x) => x.w > 20);
  return els.length ? els[0] : null;
});
log("选择封面 = " + JSON.stringify(pos));
if (pos) await page.mouse.click(pos.x, pos.y);
await page.waitForTimeout(3000);

const st = await page.evaluate(() => {
  const t = document.body.innerText || "";
  return {
    dialogText: (t.match(/设置封面[\s\S]{0,120}/) || [])[0],
    imgInputs: [...document.querySelectorAll("input[type=file]")].map((i) => i.accept),
    tabs: [...document.querySelectorAll("div,span,button")].map((e) => (e.innerText || "").trim()).filter((s) => /设置横封面|设置竖封面|完成|上传封面/.test(s)).slice(0, 10),
  };
});
console.log(JSON.stringify(st, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-dy-4.png" });
await browser.close();
