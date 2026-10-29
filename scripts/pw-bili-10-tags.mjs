import { chromium } from "playwright-core";

const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || (await ctx.newPage());
await page.bringToFront();

// --- inspect tag chips ---
const chips = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll("[class*=tag]").forEach((el) => {
    const t = (el.innerText || "").trim();
    if (t && t.length < 20 && el.children.length <= 3) {
      out.push({
        cls: (el.className || "").toString().slice(0, 60),
        t: t.replace(/\s+/g, " "),
        kids: [...el.children].map((c) => (c.className || "").toString().slice(0, 40)),
      });
    }
  });
  return out.slice(0, 40);
});
console.log("CHIPS " + JSON.stringify(chips, null, 2));

// --- remove auto tags ---
const removed = await page.evaluate(() => {
  const BAD = ["舞蹈翻跳", "韩国女主播"];
  const done = [];
  document.querySelectorAll("[class*=tag]").forEach((el) => {
    const t = (el.innerText || "").trim();
    if (!BAD.some((b) => t.startsWith(b))) return;
    if (el.querySelector("*")) {
      const closer =
        el.querySelector('[class*=close]') ||
        el.querySelector('[class*=del]') ||
        el.querySelector("svg") ||
        el.querySelector("i");
      if (closer) {
        closer.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
        done.push(t);
      }
    }
  });
  return done;
});
log("removed tags: " + JSON.stringify(removed));

// --- partition select ---
const catSelects = await page.evaluate(() => {
  const rows = [...document.querySelectorAll("*")].filter(
    (el) => (el.innerText || "").trim().startsWith("分区") && el.querySelector("input"),
  );
  return rows.slice(0, 3).map((r) => ({
    txt: (r.innerText || "").replace(/\s+/g, " ").slice(0, 40),
    inputs: [...r.querySelectorAll("input")].map((i) => ({ ph: i.placeholder, val: i.value })),
  }));
});
console.log("CAT " + JSON.stringify(catSelects, null, 2));

await page.screenshot({ path: "D:\\Software\\AI Video\\out\\pw-tags.png" });
await browser.close();
