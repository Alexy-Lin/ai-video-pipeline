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

const chooserEvent = new Promise((resolve) => client.once("Page.fileChooserOpened", resolve));

await page.locator(".cover-empty-pill").first().click({ force: true });
log("clicked .cover-empty-pill");

const ev = await Promise.race([chooserEvent, new Promise((r) => setTimeout(() => r(null), 12000))]);
log("chooser event: " + JSON.stringify(ev));

if (ev && ev.backendNodeId) {
  await client.send("DOM.setFileInputFiles", { files: [COVER], backendNodeId: ev.backendNodeId });
  log("cover file injected");
  await page.waitForTimeout(4000);
}

const st = await page.evaluate(() => {
  const t = document.body.innerText || "";
  return {
    dialogOpen: !!document.querySelector("[class*=cover-dialog],[class*=cover-crop],[class*=upload-cover]"),
    btns: [...document.querySelectorAll("button")]
      .map((b) => (b.innerText || "").trim())
      .filter(Boolean)
      .slice(0, 25),
    hasUploaded: /重新上传|重新选择|完成/.test(t),
  };
});
console.log(JSON.stringify(st, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-cover6.png" });
await browser.close();
