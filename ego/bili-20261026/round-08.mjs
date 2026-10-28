// Round 8: sub-category, content declaration, cover upload.
const task = await takeOverTaskSpace(3);
let page = null;
try {
  page = task.userPage();
} catch {
  /* ignore */
}
if (!page) page = task.page("p1");

// 1) sub-category
try {
  await page.click(".select-controller");
  await page.waitForTimeout(700);
  await page.click('text="单机游戏"');
  await page.waitForTimeout(700);
  const now = await page.evaluate(() => {
    const el = document.querySelector(".select-controller");
    return el ? el.innerText.trim().replace(/\s+/g, " ") : "";
  });
  console.log("category:", JSON.stringify(now));
} catch (error) {
  console.log("sub-category failed:", error.message);
}

// 2) content declaration via keyboard (the dropdown is rendered in a portal)
try {
  await page.click('input[placeholder*="创作声明"]');
  await page.waitForTimeout(700);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(600);
  let value = await page.evaluate(() => {
    const el = document.querySelector('input[placeholder*="创作声明"]');
    return el ? el.value : "";
  });
  if (!value) {
    // fall back: click the first visible option-ish element containing 自制
    const clicked = await page.evaluate(() => {
      const el = [...document.querySelectorAll("div, li, span")].find(
        (n) => n.offsetParent !== null && /内容为自制/.test((n.innerText || "").trim()) && (n.innerText || "").length < 30,
      );
      if (el) {
        el.click();
        return true;
      }
      return false;
    });
    await page.waitForTimeout(600);
    value = await page.evaluate(() => {
      const el = document.querySelector('input[placeholder*="创作声明"]');
      return el ? el.value : "";
    });
    console.log("fallback click:", clicked);
  }
  console.log("declaration:", JSON.stringify(value));
} catch (error) {
  console.log("declaration failed:", error.message);
}

// 3) cover: open the cover picker and attach the 16:9 image
try {
  await page.click('text="添加封面"');
  await page.waitForTimeout(1500);
  const before = await page.evaluate(() => document.querySelectorAll('input[type="file"]').length);
  console.log("file inputs after opening cover dialog:", before);

  const coverPath = "D:/Software/AI Video/out/cover-16x9.png";
  // the cover dialog's input is the last file input on the page
  await page.setInputFiles(`input[type="file"] >> nth=${before - 1}`, [coverPath]);
  console.log("cover attached");
  await page.waitForTimeout(3000);

  const dialogText = await page.evaluate(() => {
    const dlg = [...document.querySelectorAll('[class*="dialog"], [class*="modal"], [class*="cover"]')].find(
      (el) => el.offsetParent !== null && /封面|裁剪|确认/.test(el.innerText || ""),
    );
    return dlg ? dlg.innerText.trim().slice(0, 300) : "";
  });
  console.log("dialog:", dialogText);
} catch (error) {
  console.log("cover failed:", error.message);
}

const shot = await page.screenshot({ path: "D:/Software/AI Video/out/bili-state.png" });
console.log("screenshot:", shot);
