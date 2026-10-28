// Round 10: use snapshots to get exact refs for the category and declaration dropdowns.
const task = await takeOverTaskSpace(3);
let page = null;
try {
  page = task.userPage();
} catch {
  /* ignore */
}
if (!page) page = task.page("p1");

// --- category dropdown ---
await page.click(".select-controller");
await page.waitForTimeout(900);
const catSnap = await page.snapshot();
const catLines = catSnap
  .split("\n")
  .filter((l) => /游戏|分区|资讯|知识|人工智能|单机/.test(l))
  .slice(0, 25);
console.log("=== CATEGORY SNAPSHOT ===");
console.log(catLines.join("\n"));

// --- declaration dropdown ---
await page.keyboard.press("Escape");
await page.waitForTimeout(400);
await page.click('input[placeholder*="创作声明"]');
await page.waitForTimeout(900);
const decSnap = await page.snapshot();
const decLines = decSnap
  .split("\n")
  .filter((l) => /自制|转载|声明|AI|含/.test(l))
  .slice(0, 20);
console.log("=== DECLARATION SNAPSHOT ===");
console.log(decLines.join("\n"));
