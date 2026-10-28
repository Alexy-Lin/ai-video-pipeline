// Round 15: real clicks (Vue needs mousedown, not el.click()).
const task = await takeOverTaskSpace(3);
let page = null;
try {
  page = task.userPage();
} catch {
  /* ignore */
}
if (!page) page = task.page("p1");

// ---------- declaration ----------
try {
  await page.click('input[placeholder*="创作声明"]');
  await page.waitForTimeout(900);
  await page.click('text="含AI生成内容"');
  await page.waitForTimeout(900);
  const value = await page.evaluate(() => {
    const el = document.querySelector('input[placeholder*="创作声明"]');
    return el ? el.value : "";
  });
  console.log("declaration value:", JSON.stringify(value));
} catch (error) {
  console.log("declaration error:", error.message);
}

// ---------- cover dialog ----------
try {
  await page.click('text="添加封面"');
  await page.waitForTimeout(2500);
  const state = await page.evaluate(() => ({
    dialogOpen: /封面制作/.test(document.body.innerText),
    fileInputs: [...document.querySelectorAll('input[type="file"]')].length,
  }));
  console.log("cover dialog:", JSON.stringify(state));

  if (state.dialogOpen) {
    // first slot is 首页推荐封面（4:3） -> upload the 4:3 artwork
    const idx = state.fileInputs - 1;
    await page.setInputFiles(`input[type="file"] >> nth=${idx}`, ["D:/Software/AI Video/out/cover-4x3.png"]);
    console.log("4:3 uploaded to input index", idx);
    await page.waitForTimeout(3500);
  }
} catch (error) {
  console.log("cover error:", error.message);
}

await page.screenshot({ path: "D:/Software/AI Video/out/bili-cover2.png" });
console.log("screenshot saved");
