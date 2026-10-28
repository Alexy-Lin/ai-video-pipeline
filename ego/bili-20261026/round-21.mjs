// Round 21: click 查看进度 and read the resulting page (single page, no tab juggling).
const task = await takeOverTaskSpace(3);
let page = null;
try {
  page = task.userPage();
} catch {
  /* ignore */
}
if (!page) page = task.page("p1");

const opened = await page.evaluate(() =>
  [...document.querySelectorAll("button, a, div")]
    .filter((el) => el.offsetParent !== null && (el.innerText || "").trim() === "查看进度")
    .map((el) => el.tagName),
);
console.log("查看进度 elements:", JSON.stringify(opened));

await page.click('text="查看进度"').catch((e) => console.log("click failed:", e.message));
await page.waitForTimeout(4000);

const info = await page.evaluate(() => {
  const text = document.body.innerText;
  const bv = (text.match(/BV[0-9A-Za-z]{10}/) || [""])[0];
  return {
    url: location.href,
    bv,
    head: text.slice(0, 400).replace(/\n+/g, " | "),
  };
});
console.log(JSON.stringify(info, null, 2));

await page.screenshot({ path: "D:/Software/AI Video/out/bili-progress.png" });
console.log("screenshot saved");
