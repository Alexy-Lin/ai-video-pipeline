// Round 12: JS-driven clicks (avoids pointer interception) + snapshot refs.
const task = await takeOverTaskSpace(3);
let page = null;
try {
  page = task.userPage();
} catch {
  /* ignore */
}
if (!page) page = task.page("p1");

const slice = (snap, needle, len = 1200) => {
  const at = snap.indexOf(needle);
  return at >= 0 ? snap.slice(at, at + len) : `(no "${needle}" in snapshot)`;
};

// close whatever is open
await page.evaluate(() => {
  document.body.click();
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
});
await page.waitForTimeout(600);

// --- category ---
const openedCat = await page.evaluate(() => {
  const el = document.querySelector(".select-controller");
  if (!el) return false;
  el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  el.click();
  return true;
});
await page.waitForTimeout(1000);
console.log("category opened:", openedCat);
let snap = await page.snapshot();
console.log("=== CATEGORY ===");
console.log(slice(snap, "分区", 1100));

// hover the 游戏 option through its ref if present
const refMatch = snap.slice(snap.indexOf("分区")).match(/text "游戏"\s*\[ref=(\d+)/);
if (!refMatch) {
  const alt = snap.match(/\[ref=(\d+)[^\]]*\]\s*\n\s*text "游戏"/);
  console.log("ref fallback:", alt ? alt[1] : "none");
}
console.log("game ref:", refMatch ? refMatch[1] : "none");

// --- declaration ---
await page.evaluate(() => {
  document.body.click();
});
await page.waitForTimeout(500);
await page.evaluate(() => {
  const el = document.querySelector('input[placeholder*="创作声明"]');
  if (el) {
    el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    el.click();
  }
});
await page.waitForTimeout(1000);
snap = await page.snapshot();
console.log("=== DECLARATION ===");
console.log(slice(snap, "创作声明", 1100));
