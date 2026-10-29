import { chromium } from "playwright-core";
const COVER = "D:\\Software\\AI Video\\out\\ep04-cover-34.png";
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

const clickText = async (label, minW = 40) => {
  const pos = await page.evaluate(
    ({ label, minW }) => {
      const els = [...document.querySelectorAll("div,span,button")]
        .filter((e) => (e.innerText || "").trim() === label)
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), w: Math.round(r.width) };
        })
        .filter((x) => x.w >= minW);
      return els.length ? els[els.length - 1] : null;
    },
    { label, minW },
  );
  log(`${label} = ${JSON.stringify(pos)}`);
  if (pos) await page.mouse.click(pos.x, pos.y);
  return pos;
};

// 1) bottom-right black button 设置竖封面
await clickText("设置竖封面", 60);
await page.waitForTimeout(2500);
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-dy-6.png" });

// 2) any secondary dialog button
const dialogState = await page.evaluate(() => {
  const t = document.body.innerText || "";
  return {
    hasDialog: /设置竖封面获更多流量|设置竖封面将|暂不设置/.test(t),
    btns: [...document.querySelectorAll("button,div,span")]
      .map((e) => (e.innerText || "").trim())
      .filter((s) => s && s.length <= 8 && /设置竖封面|暂不设置|完成/.test(s))
      .slice(0, 8),
  };
});
log("dialog: " + JSON.stringify(dialogState));

if (dialogState.hasDialog) {
  await clickText("设置竖封面", 60);
  await page.waitForTimeout(2500);
  log("clicked dialog confirm");
}

await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-dy-7.png" });

// 3) upload vertical cover: click 上传封面 tile (or the plus tile)
const chooser = new Promise((resolve) => client.once("Page.fileChooserOpened", resolve));
await clickText("上传封面", 50);
const ev = await Promise.race([chooser, new Promise((r) => setTimeout(() => r(null), 8000))]);
log("chooser = " + JSON.stringify(ev));
if (ev && ev.backendNodeId) {
  await client.send("DOM.setFileInputFiles", { files: [COVER], backendNodeId: ev.backendNodeId });
  log("竖封面 injected");
} else {
  try {
    const inputs = page.locator('input[type=file][accept*="png"]');
    const n = await inputs.count();
    log("image inputs = " + n);
    if (n) {
      await inputs.last().setInputFiles(COVER);
      log("setInputFiles on last image input");
    }
  } catch (e) {
    log("fallback failed " + e.message);
  }
}
await page.waitForTimeout(4000);
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-dy-8.png" });
log("done");
await browser.close();
