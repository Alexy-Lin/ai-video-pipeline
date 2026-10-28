// Round 17: final pre-publish verification.
const task = await takeOverTaskSpace(3);
let page = null;
try {
  page = task.userPage();
} catch {
  /* ignore */
}
if (!page) page = task.page("p1");

const state = await page.evaluate(() => {
  const val = (sel) => {
    const el = document.querySelector(sel);
    return el ? el.value : null;
  };
  const editor = [...document.querySelectorAll(".ql-editor")].find((e) => (e.innerText || "").trim().length > 5);
  // the cover thumbnail sits next to 添加封面; once set, the placeholder text changes
  const coverBlock = [...document.querySelectorAll("div")].find((el) => {
    const t = (el.innerText || "").trim();
    return /^封面/.test(t) && t.length < 20;
  });
  const imgs = [...document.querySelectorAll("img")].filter((el) => el.offsetParent !== null).map((el) => ({
    src: el.src.slice(0, 80),
    w: el.naturalWidth,
    h: el.naturalHeight,
  }));
  return {
    dialogOpen: /封面制作/.test(document.body.innerText),
    title: val('input[placeholder*="稿件标题"]'),
    declaration: val('input[placeholder*="创作声明"]'),
    category: (document.querySelector(".select-controller") || {}).innerText || "",
    descLength: editor ? editor.innerText.trim().length : 0,
    coverText: coverBlock ? coverBlock.innerText.trim().slice(0, 40) : "",
    coverImgs: imgs.filter((i) => /cover|bfs|archive/i.test(i.src)).slice(0, 5),
    buttons: [...document.querySelectorAll("button")]
      .map((b) => (b.innerText || "").trim())
      .filter(Boolean)
      .slice(0, 20),
  };
});
console.log(JSON.stringify(state, null, 2));

await page.screenshot({ path: "D:/Software/AI Video/out/bili-final.png" });
console.log("screenshot saved");
