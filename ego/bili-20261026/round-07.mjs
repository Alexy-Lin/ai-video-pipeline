// Round 7: content declaration + category (two-level selector).
const task = await takeOverTaskSpace(3);
let page = null;
try {
  page = task.userPage();
} catch {
  /* ignore */
}
if (!page) page = task.page("p1");

// 1) content declaration: open the dropdown and list what is actually offered
try {
  await page.click('input[placeholder="请选择符合您视频内容的创作声明"]');
  await page.waitForTimeout(800);
  const options = await page.evaluate(() =>
    [...document.querySelectorAll("li, [class*='option'], [class*='dropdown'] div, [role='option']")]
      .filter((el) => el.offsetParent !== null)
      .map((el) => (el.innerText || "").trim())
      .filter((t) => t && t.length < 40 && /自制|转载|AI|含/.test(t))
      .slice(0, 12),
  );
  console.log("declaration options:", JSON.stringify(options));

  for (const wanted of ["内容为自制：未经作者允许，禁止转载", "内容为自制"]) {
    const hit = await page.evaluate(
      (label) =>
        [...document.querySelectorAll("li, [class*='option'], [role='option']")].some(
          (el) => el.offsetParent !== null && (el.innerText || "").trim().startsWith(label),
        ),
      wanted,
    );
    if (hit) {
      await page.click(`text="${wanted}"`).catch(async () => {
        await page.click(`text=${wanted}`);
      });
      await page.waitForTimeout(600);
      break;
    }
  }
  const value = await page.evaluate(() => {
    const el = document.querySelector('input[placeholder*="创作声明"]');
    return el ? el.value : "";
  });
  console.log("declaration value:", JSON.stringify(value));
} catch (error) {
  console.log("declaration failed:", error.message);
}

// 2) category: technology -> game -> single player
try {
  await page.click(".select-controller");
  await page.waitForTimeout(800);
  const level1 = await page.evaluate(() =>
    [...document.querySelectorAll("li, [class*='option']")]
      .filter((el) => el.offsetParent !== null)
      .map((el) => (el.innerText || "").trim())
      .filter((t) => t && t.length < 20)
      .slice(0, 20),
  );
  console.log("category L1:", JSON.stringify(level1));

  await page.click('text="游戏"');
  await page.waitForTimeout(700);
  const level2 = await page.evaluate(() =>
    [...document.querySelectorAll("li, [class*='option']")]
      .filter((el) => el.offsetParent !== null)
      .map((el) => (el.innerText || "").trim())
      .filter((t) => t && t.length < 20)
      .slice(0, 30),
  );
  console.log("category L2:", JSON.stringify(level2));

  await page.click('text="单机游戏"');
  await page.waitForTimeout(700);
  const now = await page.evaluate(() => {
    const el = document.querySelector(".select-controller");
    return el ? el.innerText.trim() : "";
  });
  console.log("category now:", JSON.stringify(now));
} catch (error) {
  console.log("category failed:", error.message);
}

// 3) report current tag chips
const tags = await page.evaluate(() => {
  const box = [...document.querySelectorAll('[class*="tag"]')].find((el) =>
    /tag/.test(String(el.className)),
  );
  const container = document.querySelector(".tag-input, .tag-list, [class*='tag-container']");
  return {
    count: document.querySelectorAll('[class*="tag-item"], .tag-list-item').length,
    texts: [...document.querySelectorAll('[class*="tag-item"], .tag-list-item')]
      .map((el) => (el.innerText || "").trim())
      .slice(0, 15),
    hasBox: Boolean(box || container),
  };
});
console.log("tags:", JSON.stringify(tags));
