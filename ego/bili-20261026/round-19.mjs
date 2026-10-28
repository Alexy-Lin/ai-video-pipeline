// Round 19: publish.
const task = await takeOverTaskSpace(3);
let page = null;
try {
  page = task.userPage();
} catch {
  /* ignore */
}
if (!page) page = task.page("p1");

console.log("clicking 立即投稿 ...");
await page.click('text="立即投稿"');
await page.waitForTimeout(3000);

// some flows ask for confirmation first
for (const label of ["确认投稿", "确定", "确认"]) {
  const found = await page.evaluate(
    (t) =>
      [...document.querySelectorAll("button, .bcc-button, div[role='button']")].some(
        (el) => el.offsetParent !== null && (el.innerText || "").trim() === t,
      ),
    label,
  );
  if (found) {
    console.log("confirmation button found:", label);
    await page.click(`text="${label}"`).catch((e) => console.log("confirm click failed:", e.message));
    await page.waitForTimeout(3000);
    break;
  }
}

await page.waitForTimeout(2500);
const result = await page.evaluate(() => ({
  url: location.href,
  text: document.body.innerText.slice(0, 400).replace(/\n+/g, " | "),
}));
console.log("url :", result.url);
console.log("text:", result.text);

await page.screenshot({ path: "D:/Software/AI Video/out/bili-published.png" });
console.log("screenshot saved");
