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

const box = await page.locator(".cover-plugin-preview").first().boundingBox();
await page.mouse.move(box.x + 80, box.y + 120);
await page.waitForTimeout(1200);

const btn = await page.evaluate(() => {
  const els = [...document.querySelectorAll("*")].filter((e) => (e.innerText || "").trim() === "编辑封面");
  const vis = els
    .map((el) => {
      const r = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      return { el, r, op: st.opacity, disp: st.display };
    })
    .filter((x) => x.r.width > 10 && x.r.height > 10 && x.op !== "0" && x.disp !== "none");
  if (!vis.length) return null;
  const t = vis[0].r;
  return { x: Math.round(t.x + t.width / 2), y: Math.round(t.y + t.height / 2) };
});
log("编辑封面 btn = " + JSON.stringify(btn));
if (btn) {
  await page.mouse.move(btn.x, btn.y);
  await page.waitForTimeout(300);
  await page.mouse.click(btn.x, btn.y);
  log("clicked");
}
await page.waitForTimeout(3000);

const dlg = await page.evaluate(() => {
  const t = document.body.innerText || "";
  const i = t.indexOf("上传图片");
  return {
    hasUpload: i >= 0,
    around: i >= 0 ? t.slice(Math.max(0, i - 120), i + 220) : t.slice(0, 200),
    files: document.querySelectorAll("input[type=file]").length,
  };
});
console.log(JSON.stringify(dlg, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-xhs-8.png" });
await browser.close();
