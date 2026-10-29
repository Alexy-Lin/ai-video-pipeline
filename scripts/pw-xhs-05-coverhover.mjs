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

// find the current cover thumbnail (dark 3:4 or 4:3 image in the cover block)
const thumb = await page.evaluate(() => {
  const cands = [...document.querySelectorAll("div,img")].filter((el) => {
    const r = el.getBoundingClientRect();
    return el.tagName === "IMG" && r.width > 120 && r.width < 320 && r.height > 90 && r.top > 100 && r.top < 700;
  });
  if (!cands.length) return null;
  const el = cands[0];
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), w: Math.round(r.width), h: Math.round(r.height) };
});
log("thumb = " + JSON.stringify(thumb));
if (thumb) {
  await page.mouse.move(thumb.x, thumb.y);
  await page.waitForTimeout(1200);
  const hover = await page.evaluate(() =>
    [...document.querySelectorAll("*")]
      .map((e) => (e.innerText || "").trim())
      .filter((s) => s && s.length <= 8 && /编辑封面|更换封面|修改封面|上传封面/.test(s))
      .slice(0, 6),
  );
  log("hover texts = " + JSON.stringify(hover));
  if (hover.length) {
    const box = await page.evaluate((label) => {
      const el = [...document.querySelectorAll("*")].filter((e) => (e.innerText || "").trim() === label).pop();
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
    }, hover[0]);
    await page.mouse.click(box.x, box.y);
    log("clicked " + hover[0] + " at " + JSON.stringify(box));
  } else {
    await page.mouse.click(thumb.x, thumb.y);
    log("clicked thumb directly");
  }
}
await page.waitForTimeout(2500);

const dlg = await page.evaluate(() => {
  const t = document.body.innerText || "";
  return {
    hasUpload: /上传图片|上传封面|本地上传/.test(t),
    tabs: [...document.querySelectorAll("div,span,button")].map((e) => (e.innerText || "").trim()).filter((s) => /上传图片|上传封面|本地上传|生成封面|调整/.test(s)).slice(0, 8),
    snippet: t.slice(0, 200),
  };
});
console.log(JSON.stringify(dlg, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-xhs-5.png" });
await browser.close();
