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

await page.keyboard.press("Escape");
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1200);

const pos = await page.evaluate(() => {
  const els = [...document.querySelectorAll("div,span,button,a")]
    .filter((el) => (el.innerText || "").trim() === "设置封面");
  const el = els[0];
  if (!el) return null;
  el.scrollIntoView({ block: "center" });
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
});
log("设置封面 pos = " + JSON.stringify(pos));
if (pos) {
  await page.mouse.click(pos.x, pos.y);
  log("clicked 设置封面");
}
await page.waitForTimeout(2500);

const dlg = await page.evaluate(() => {
  const t = document.body.innerText || "";
  const i = t.indexOf("上传图片");
  return {
    hasUpload: i >= 0,
    around: i >= 0 ? t.slice(Math.max(0, i - 80), i + 160) : t.slice(0, 200),
    tabs: [...document.querySelectorAll("div,span,button")].map((e) => (e.innerText || "").trim()).filter((s) => /上传图片|上传封面|本地上传/.test(s)).slice(0, 6),
  };
});
console.log(JSON.stringify(dlg, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-xhs-4.png" });
await browser.close();
