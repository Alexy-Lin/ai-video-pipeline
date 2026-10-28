// Round 11: raw snapshot slices with refs for both dropdowns.
const task = await takeOverTaskSpace(3);
let page = null;
try {
  page = task.userPage();
} catch {
  /* ignore */
}
if (!page) page = task.page("p1");

await page.keyboard.press("Escape");
await page.waitForTimeout(400);

// category dropdown: open, hover the parent, capture refs
await page.click(".select-controller");
await page.waitForTimeout(900);
let snap = await page.snapshot();
let at = snap.indexOf("分区");
console.log("=== CATEGORY (raw) ===");
console.log(snap.slice(at, at + 900));

// try hovering the parent to expand children
try {
  await page.hover('text="游戏"');
  await page.waitForTimeout(1000);
  snap = await page.snapshot();
  at = snap.indexOf("分区");
  console.log("=== CATEGORY after hover ===");
  console.log(snap.slice(at, at + 1400));
} catch (error) {
  console.log("hover failed:", error.message);
}

await page.keyboard.press("Escape");
await page.waitForTimeout(400);

// declaration dropdown: full option list
await page.click('input[placeholder*="创作声明"]');
await page.waitForTimeout(900);
snap = await page.snapshot();
at = snap.indexOf("创作声明");
console.log("=== DECLARATION (raw) ===");
console.log(snap.slice(at, at + 1200));
