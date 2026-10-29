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

// file inputs overview
const inputs = await page.evaluate(() =>
  [...document.querySelectorAll("input[type=file]")].map((el) => ({
    accept: el.accept,
    cls: (el.className || "").toString().slice(0, 30),
    visible: !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length),
  })),
);
log("file inputs: " + JSON.stringify(inputs));

// scroll the cover tile into view, then click it with the real mouse
const rect = await page.evaluate(() => {
  const els = [...document.querySelectorAll("div,span,button")].filter(
    (n) => (n.innerText || "").trim() === "添加封面",
  );
  const el = els[0];
  if (!el) return null;
  el.scrollIntoView({ block: "center" });
  return new Promise((res) =>
    setTimeout(() => {
      const r = el.getBoundingClientRect();
      res({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
    }, 400),
  );
});
log("add-cover rect = " + JSON.stringify(rect));
await page.mouse.click(rect.x, rect.y);
log("clicked");

const appeared = await page
  .waitForFunction(() => /上传封面|从本地上传|上传图片|设置封面/.test(document.body.innerText || ""), undefined, {
    timeout: 15000,
  })
  .then(() => true)
  .catch(() => false);
log("dialog appeared = " + appeared);

const info = await page.evaluate(() => {
  const t = document.body.innerText || "";
  const i = t.indexOf("上传封面");
  return {
    around: i >= 0 ? t.slice(Math.max(0, i - 60), i + 200) : null,
    anyModal: !!document.querySelector("[class*=modal],[class*=dialog]"),
  };
});
log("info: " + JSON.stringify(info));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-cover3.png" });
await browser.close();
