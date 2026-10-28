// Round 16: probe form state without disturbing the open cover dialog.
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
  const tags = [...document.querySelectorAll('[class*="tag-item"], .tag-list-item')].map((el) => (el.innerText || "").trim());
  return {
    dialogOpen: /封面制作/.test(document.body.innerText),
    title: val('input[placeholder*="稿件标题"]'),
    declaration: val('input[placeholder*="创作声明"]'),
    category: (document.querySelector(".select-controller") || {}).innerText || "",
    descLength: editor ? editor.innerText.trim().length : 0,
    descHead: editor ? editor.innerText.trim().slice(0, 80) : "",
    tags,
  };
});
console.log(JSON.stringify(state, null, 2));

// zoom reset inside the cover dialog: the icon next to the slider
const zoom = await page.evaluate(() => {
  const icons = [...document.querySelectorAll("i, svg, span")].filter((el) => {
    const cls = String(el.className || "");
    return /zoom|reset|scale/i.test(cls) && el.offsetParent !== null;
  });
  return icons.map((el) => ({ tag: el.tagName, cls: String(el.className).slice(0, 50) })).slice(0, 8);
});
console.log("zoom controls:", JSON.stringify(zoom));
