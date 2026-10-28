// Round 9: close the cover dialog, fix the category, then report.
const task = await takeOverTaskSpace(3);
let page = null;
try {
  page = task.userPage();
} catch {
  /* ignore */
}
if (!page) page = task.page("p1");

// close the cover dialog
try {
  await page.click('text="取消"');
  await page.waitForTimeout(900);
  const stillOpen = await page.evaluate(() => /封面制作/.test(document.body.innerText));
  console.log("cover dialog still open:", stillOpen);
} catch (error) {
  console.log("close dialog failed:", error.message);
}

await page.keyboard.press("Escape");
await page.waitForTimeout(400);

// category: open the cascader and hover the parent so children render
try {
  await page.click(".select-controller");
  await page.waitForTimeout(700);

  const l1 = await page.evaluate(() =>
    [...document.querySelectorAll("li, [class*='option'], [class*='item']")]
      .filter((el) => el.offsetParent !== null)
      .map((el) => (el.innerText || "").trim())
      .filter((t) => t && t.length < 16)
      .slice(0, 25),
  );
  console.log("L1 items:", JSON.stringify(l1));

  await page.hover('text="游戏"');
  await page.waitForTimeout(900);

  const l2 = await page.evaluate(() =>
    [...document.querySelectorAll("li, [class*='option'], [class*='item']")]
      .filter((el) => el.offsetParent !== null)
      .map((el) => (el.innerText || "").trim())
      .filter((t) => t && t.length < 16)
      .slice(0, 40),
  );
  console.log("after hover:", JSON.stringify(l2));

  if (l2.includes("单机游戏")) {
    await page.click('text="单机游戏"');
    await page.waitForTimeout(800);
    console.log("clicked 单机游戏");
  }

  const now = await page.evaluate(() => {
    const el = document.querySelector(".select-controller");
    return el ? el.innerText.trim().replace(/\s+/g, " ") : "";
  });
  console.log("category now:", JSON.stringify(now));
} catch (error) {
  console.log("category failed:", error.message);
}

const shot = await page.screenshot({ path: "D:/Software/AI Video/out/bili-state2.png" });
console.log("screenshot:", shot);
