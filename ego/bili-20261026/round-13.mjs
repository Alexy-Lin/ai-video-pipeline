// Round 13: pick 内容无需标注, and drill into the category cascader.
const task = await takeOverTaskSpace(3);
let page = null;
try {
  page = task.userPage();
} catch {
  /* ignore */
}
if (!page) page = task.page("p1");

const closeAll = async () => {
  await page.evaluate(() => document.body.click());
  await page.waitForTimeout(400);
};

// ---------- 1) content declaration ----------
await closeAll();
const opened = await page.evaluate(() => {
  const el = document.querySelector('input[placeholder*="创作声明"]');
  if (!el) return false;
  el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  el.click();
  return true;
});
await page.waitForTimeout(800);
console.log("declaration opened:", opened);

const decList = await page.evaluate(() =>
  [...document.querySelectorAll("li")].filter((el) => el.offsetParent !== null).map((el) => (el.innerText || "").trim()),
);
console.log("declaration items:", JSON.stringify(decList));

const decClicked = await page.evaluate(() => {
  const el = [...document.querySelectorAll("li")].find(
    (n) => n.offsetParent !== null && (n.innerText || "").trim() === "内容无需标注",
  );
  if (!el) return false;
  el.click();
  return true;
});
await page.waitForTimeout(800);
const decValue = await page.evaluate(() => {
  const el = document.querySelector('input[placeholder*="创作声明"]');
  return el ? el.value : "";
});
console.log("declaration clicked:", decClicked, "value:", JSON.stringify(decValue));

// ---------- 2) category ----------
await closeAll();
await page.evaluate(() => {
  const el = document.querySelector(".select-controller");
  if (el) {
    el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    el.click();
  }
});
await page.waitForTimeout(900);

const l1 = await page.evaluate(() =>
  [...document.querySelectorAll("li")].filter((el) => el.offsetParent !== null).map((el) => (el.innerText || "").trim()),
);
console.log("category L1 items:", JSON.stringify(l1));

const gameClicked = await page.evaluate(() => {
  const el = [...document.querySelectorAll("li")].find(
    (n) => n.offsetParent !== null && (n.innerText || "").trim() === "游戏",
  );
  if (!el) return false;
  el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
  el.click();
  return true;
});
await page.waitForTimeout(1200);

const l2 = await page.evaluate(() =>
  [...document.querySelectorAll("li")].filter((el) => el.offsetParent !== null).map((el) => (el.innerText || "").trim()),
);
console.log("game clicked:", gameClicked);
console.log("category L2 items:", JSON.stringify(l2));

const subClicked = await page.evaluate(() => {
  const el = [...document.querySelectorAll("li")].find(
    (n) => n.offsetParent !== null && (n.innerText || "").trim() === "单机游戏",
  );
  if (!el) return false;
  el.click();
  return true;
});
await page.waitForTimeout(900);
const catNow = await page.evaluate(() => {
  const el = document.querySelector(".select-controller");
  return el ? el.innerText.trim().replace(/\s+/g, " ") : "";
});
console.log("sub clicked:", subClicked, "category now:", JSON.stringify(catNow));

await page.screenshot({ path: "D:/Software/AI Video/out/bili-state3.png" });
console.log("screenshot saved");
