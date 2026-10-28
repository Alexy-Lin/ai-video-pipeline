// Round 20: open the submission progress page and capture the BV id / link.
const task = await takeOverTaskSpace(3);
let page = null;
try {
  page = task.userPage();
} catch {
  /* ignore */
}
if (!page) page = task.page("p1");

await page.click('text="查看进度"');
await page.waitForTimeout(3000);

// the progress view may open a new tab
const tabs = await task.listPages().catch(() => []);
for (const t of tabs) {
  const u = await t.url().catch(() => "");
  console.log("tab:", u);
}

let active = page;
try {
  const all = await task.listPages();
  const best = all.find(async (t) => /archive|upload-manager|content/i.test(await t.url().catch(() => "")));
  if (best) active = best;
} catch {
  /* ignore */
}

await active.waitForTimeout(2000);
const info = await active.evaluate(() => {
  const text = document.body.innerText;
  const bv = (text.match(/BV[0-9A-Za-z]{10}/) || [""])[0];
  return {
    url: location.href,
    bv,
    head: text.slice(0, 500).replace(/\n+/g, " | "),
  };
});
console.log(JSON.stringify(info, null, 2));

await active.screenshot({ path: "D:/Software/AI Video/out/bili-progress.png" });
console.log("screenshot saved");
