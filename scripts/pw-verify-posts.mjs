import { chromium } from "playwright-core";
const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];

// 抖音内容管理
const dy = (await Promise.all(ctx.pages().map(async (p) => ({ p, u: await p.url() })))).find((x) =>
  x.u.includes("creator.douyin.com"),
)?.p;
if (dy) {
  await dy.bringToFront();
  await dy.goto("https://creator.douyin.com/creator-micro/content/manage", { waitUntil: "domcontentloaded" });
  await dy.waitForTimeout(4000);
  const t = await dy.evaluate(() => {
    const txt = document.body.innerText || "";
    return { works: (txt.match(/作品\s*\(\d+\)/) || [])[0] || null, head: txt.slice(0, 300) };
  });
  console.log("DOUYIN " + JSON.stringify(t));
  await dy.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-dy-manage.png" });
}

// 小红书笔记管理
const xhs = (await Promise.all(ctx.pages().map(async (p) => ({ p, u: await p.url() })))).find((x) =>
  x.u.includes("creator.xiaohongshu.com"),
)?.p;
if (xhs) {
  await xhs.bringToFront();
  await xhs.goto("https://creator.xiaohongshu.com/new/note-manager", { waitUntil: "domcontentloaded" }).catch(() => {});
  await xhs.waitForTimeout(4000);
  const t = await xhs.evaluate(() => {
    const txt = document.body.innerText || "";
    return { url: location.href, head: txt.slice(0, 300) };
  });
  console.log("XHS " + JSON.stringify(t));
  await xhs.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-xhs-manage.png" });
}
await browser.close();
