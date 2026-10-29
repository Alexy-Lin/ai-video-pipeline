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

// hover the cover preview so the operator shows, then click the 编辑封面 text precisely
const box = await page.locator(".cover-plugin-preview").first().boundingBox();
await page.mouse.move(box.x + box.width * 0.12, box.y + box.height * 0.55);
await page.waitForTimeout(1000);

const pos = await page.evaluate(() => {
  const els = [...document.querySelectorAll("*")].filter(
    (e) => (e.innerText || "").trim() === "编辑封面" && (e.className || "").toString().includes("cover-edit-entry"),
  );
  if (!els.length) return null;
  const r = els[0].getBoundingClientRect();
  return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
});
log("edit entry pos = " + JSON.stringify(pos));

const chooserEvent = new Promise((resolve) => client.once("Page.fileChooserOpened", resolve));
await page.mouse.click(pos.x, pos.y);
log("clicked edit entry");
await page.waitForTimeout(2500);

const ev = await Promise.race([chooserEvent, new Promise((r) => setTimeout(() => r(null), 6000))]);
log("chooser = " + JSON.stringify(ev));

const res = await page.evaluate(() => {
  const t = document.body.innerText || "";
  return {
    hasUpload: /上传图片|上传封面|本地上传/.test(t),
    snippet: (t.match(/[\s\S]{0,200}/) || [])[0],
    buttons: [...document.querySelectorAll("div,span,button")]
      .map((e) => (e.innerText || "").trim())
      .filter((s) => s && s.length <= 10 && /上传|完成|确定|保存|取消/.test(s))
      .slice(0, 12),
  };
});
console.log(JSON.stringify(res, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-xhs-10.png" });
await browser.close();
