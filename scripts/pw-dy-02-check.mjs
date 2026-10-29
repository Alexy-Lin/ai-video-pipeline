import { chromium } from "playwright-core";
const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const all = await Promise.all(ctx.pages().map(async (p) => ({ p, u: await p.url() })));
const page = all.find((x) => x.u.includes("creator.douyin.com"))?.p || (await ctx.newPage());
await page.bringToFront();
if (!(await page.url()).includes("creator.douyin.com")) {
  await page.goto("https://creator.douyin.com/creator-micro/content/upload", { waitUntil: "domcontentloaded" });
}
await page.waitForTimeout(3000);

const st = await page.evaluate(() => {
  const t = document.body.innerText || "";
  return {
    url: location.href,
    needLogin: /扫码登录|验证码登录|密码登录/.test(t),
    head: t.slice(0, 160),
    files: document.querySelectorAll("input[type=file]").length,
  };
});
console.log(JSON.stringify(st, null, 2));
await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-dy-2.png" });
await browser.close();
