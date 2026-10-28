// Round 14: declaration = 含AI生成内容, then open the cover dialog and inspect it.
const task = await takeOverTaskSpace(3);
let page = null;
try {
  page = task.userPage();
} catch {
  /* ignore */
}
if (!page) page = task.page("p1");

// ---------- 1) declaration ----------
await page.evaluate(() => document.body.click());
await page.waitForTimeout(400);
await page.evaluate(() => {
  const el = document.querySelector('input[placeholder*="创作声明"]');
  if (el) {
    el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    el.click();
  }
});
await page.waitForTimeout(800);
const clicked = await page.evaluate(() => {
  const el = [...document.querySelectorAll("li")].find(
    (n) => n.offsetParent !== null && (n.innerText || "").trim() === "含AI生成内容",
  );
  if (!el) return false;
  el.click();
  return true;
});
await page.waitForTimeout(700);
const decValue = await page.evaluate(() => {
  const el = document.querySelector('input[placeholder*="创作声明"]');
  return el ? el.value : "";
});
console.log("declaration:", clicked, JSON.stringify(decValue));

// ---------- 2) cover dialog ----------
await page.evaluate(() => document.body.click());
await page.waitForTimeout(400);
await page.evaluate(() => {
  const el = [...document.querySelectorAll("span, button, div")].find(
    (n) => n.offsetParent !== null && (n.innerText || "").trim() === "添加封面",
  );
  if (el) el.click();
});
await page.waitForTimeout(2500);

const dialog = await page.evaluate(() => {
  const text = document.body.innerText;
  const inputs = [...document.querySelectorAll('input[type="file"]')].map((el, i) => ({
    i,
    accept: el.accept,
    hidden: el.offsetParent === null,
  }));
  return {
    open: /封面制作/.test(text),
    inputs,
    slots: text.match(/首页推荐封面（4:3）|个人空间封面（16:9）|上传封面|完成/g) || [],
  };
});
console.log("cover dialog:", JSON.stringify(dialog, null, 2));

await page.screenshot({ path: "D:/Software/AI Video/out/bili-cover-dialog.png" });
console.log("screenshot saved");
