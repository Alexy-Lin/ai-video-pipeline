// Round 18: scroll to the cover area and verify the thumbnail is set.
const task = await takeOverTaskSpace(3);
let page = null;
try {
  page = task.userPage();
} catch {
  /* ignore */
}
if (!page) page = task.page("p1");

await page.evaluate(() => {
  window.scrollTo(0, 0);
});
await page.waitForTimeout(600);
// scroll a bit so the 封面 row is in view
await page.evaluate(() => window.scrollTo(0, 380));
await page.waitForTimeout(600);

const cover = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll("img")]
    .filter((el) => el.offsetParent !== null)
    .map((el) => ({ src: el.src, w: el.clientWidth, h: el.clientHeight }))
    .filter((i) => i.w > 60 && i.h > 40);
  return {
    coverText: (document.body.innerText.match(/封面[\s\S]{0,20}/) || [""])[0].replace(/\n/g, " "),
    bigImgs: imgs.slice(0, 6),
  };
});
console.log(JSON.stringify(cover, null, 2));
await page.screenshot({ path: "D:/Software/AI Video/out/bili-cover-final.png" });
console.log("screenshot saved");
